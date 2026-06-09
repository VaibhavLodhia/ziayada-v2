import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchVoiceToken } from '@/lib/api';
import { audioToBase64, micErrorMessage, openVoiceSocket, rmsLevel } from '@/lib/voiceAudioUtils';
import {
  VOICE_CONNECT_MS,
  VOICE_MAX_BUFFER_SAMPLES,
  VOICE_SAMPLE_RATE,
  VOICE_STOP_WAIT_MS,
  voiceSessionUpdate,
} from '@/lib/voiceSessionConfig';

type WsEvent = {
  type: string;
  transcript?: string;
  message?: string;
  error?: { message?: string };
};

type VoiceAgentOptions = {
  onStop?: (text: string) => void;
};

function ignorableError(event: WsEvent): boolean {
  const msg = (event.error?.message ?? event.message ?? '').toLowerCase();
  return msg.includes('no active response') || msg.includes('response_cancel');
}

function joinParts(parts: string[]): string {
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function useVoiceAgent({ onStop }: VoiceAgentOptions = {}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [draft, setDraft] = useState('');

  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;

  const s = useRef({
    active: false,
    stopping: false,
    ws: null as WebSocket | null,
    stream: null as MediaStream | null,
    audioCtx: null as AudioContext | null,
    worklet: null as AudioWorkletNode | null,
    ready: false,
    parts: [] as string[],
    pendingPcm: [] as Int16Array[],
    pendingSamples: 0,
    levelRaf: null as number | null,
    stopTimer: null as number | null,
  });

  const flushPendingPcm = (ws: WebSocket) => {
    const { pendingPcm } = s.current;
    for (const chunk of pendingPcm) {
      ws.send(
        JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: audioToBase64(chunk),
        }),
      );
    }
    s.current.pendingPcm = [];
    s.current.pendingSamples = 0;
  };

  const sendPcm = (chunk: Int16Array) => {
    const { ws, ready, pendingPcm, pendingSamples } = s.current;
    if (ready && ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: audioToBase64(chunk),
        }),
      );
      return;
    }
    pendingPcm.push(chunk);
    s.current.pendingSamples = pendingSamples + chunk.length;
    while (s.current.pendingSamples > VOICE_MAX_BUFFER_SAMPLES) {
      const drop = s.current.pendingPcm.shift();
      if (drop) s.current.pendingSamples -= drop.length;
    }
  };

  const teardown = useCallback(() => {
    const session = s.current;
    session.active = false;
    session.stopping = false;
    session.ready = false;
    session.parts = [];

    if (session.stopTimer !== null) {
      window.clearTimeout(session.stopTimer);
      session.stopTimer = null;
    }
    if (session.levelRaf !== null) {
      window.cancelAnimationFrame(session.levelRaf);
      session.levelRaf = null;
    }

    session.worklet?.disconnect();
    session.worklet = null;
    session.stream?.getTracks().forEach((t) => t.stop());
    session.stream = null;

    const ws = session.ws;
    if (ws) {
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      if (ws.readyState === WebSocket.OPEN) ws.close();
      session.ws = null;
    }

    if (session.audioCtx) {
      void session.audioCtx.close();
      session.audioCtx = null;
    }

    setMicLevel(0);
  }, []);

  const finishStop = useCallback(() => {
    if (!s.current.stopping) return;
    const text = joinParts(s.current.parts);
    s.current.parts = [];
    setDraft('');
    teardown();
    setListening(false);
    setError(null);
    if (text) onStopRef.current?.(text);
  }, [teardown]);

  const onWsMessage = useCallback((ws: WebSocket, raw: string) => {
    let event: WsEvent;
    try {
      event = JSON.parse(raw) as WsEvent;
    } catch {
      return;
    }

    switch (event.type) {
      case 'session.updated':
        if (!s.current.ready) {
          s.current.ready = true;
          flushPendingPcm(ws);
        }
        break;
      case 'conversation.item.input_audio_transcription.completed': {
        const line = event.transcript?.trim();
        if (line) {
          s.current.parts.push(line);
          setDraft(joinParts(s.current.parts));
        }
        break;
      }
      case 'error':
        if (s.current.stopping || ignorableError(event)) break;
        setError(event.error?.message ?? event.message ?? 'Voice error');
        break;
      default:
        break;
    }
  }, []);

  const stop = useCallback(() => {
    if (!s.current.active && !s.current.stopping) return;

    s.current.stopping = true;
    s.current.active = false;
    setListening(false);

    if (s.current.ws?.readyState === WebSocket.OPEN) {
      s.current.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    }

    s.current.worklet?.disconnect();
    s.current.worklet = null;
    s.current.stream?.getTracks().forEach((t) => t.stop());
    s.current.stream = null;
    setMicLevel(0);

    if (s.current.stopTimer !== null) window.clearTimeout(s.current.stopTimer);
    s.current.stopTimer = window.setTimeout(() => {
      s.current.stopTimer = null;
      finishStop();
    }, VOICE_STOP_WAIT_MS);
  }, [finishStop]);

  const start = useCallback(async () => {
    if (s.current.active) return;

    s.current.active = true;
    s.current.stopping = false;
    s.current.parts = [];
    setDraft('');
    setListening(true);
    setError(null);
    setMicLevel(0);

    let audioCtx: AudioContext;
    try {
      audioCtx = new AudioContext({ sampleRate: VOICE_SAMPLE_RATE });
      if (audioCtx.state === 'suspended') await audioCtx.resume();
    } catch (err) {
      s.current.active = false;
      setListening(false);
      setError(micErrorMessage(err));
      return;
    }
    s.current.audioCtx = audioCtx;

    try {
      const [stream, { value: token }] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: VOICE_SAMPLE_RATE,
          },
        }),
        fetchVoiceToken(),
      ]);

      if (!s.current.active) {
        stream.getTracks().forEach((t) => t.stop());
        teardown();
        return;
      }

      const ws = await openVoiceSocket(token, VOICE_CONNECT_MS);
      if (!s.current.active) {
        stream.getTracks().forEach((t) => t.stop());
        ws.close();
        teardown();
        return;
      }

      s.current.stream = stream;
      s.current.ws = ws;

      ws.onmessage = ({ data }) => onWsMessage(ws, String(data));
      ws.onclose = () => {
        if (s.current.active && !s.current.stopping) {
          teardown();
          setListening(false);
          setError('Voice connection closed');
        }
      };
      ws.onerror = () => {
        if (s.current.active && !s.current.stopping) {
          teardown();
          setListening(false);
          setError('Voice connection failed');
        }
      };

      await audioCtx.audioWorklet.addModule('/pcm-processor-worklet.js');
      const source = audioCtx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioCtx, 'pcm-processor');
      worklet.port.onmessage = (e: MessageEvent<Int16Array>) => {
        if (!s.current.active) return;
        const level = rmsLevel(e.data);
        if (s.current.levelRaf === null) {
          s.current.levelRaf = requestAnimationFrame(() => {
            s.current.levelRaf = null;
            if (s.current.active) setMicLevel(level);
          });
        }
        sendPcm(e.data);
      };
      source.connect(worklet);
      s.current.worklet = worklet;

      ws.send(JSON.stringify(voiceSessionUpdate));
    } catch (err) {
      if (!s.current.stopping) setError(micErrorMessage(err));
      teardown();
      setListening(false);
    }
  }, [onWsMessage, teardown]);

  const toggle = useCallback(() => {
    if (s.current.active || s.current.stopping) stop();
    else void start();
  }, [start, stop]);

  useEffect(() => () => {
    s.current.stopping = true;
    teardown();
  }, [teardown]);

  return {
    isListening: listening,
    error,
    micLevel,
    draftTranscript: draft,
    toggle,
    stop,
  };
}
