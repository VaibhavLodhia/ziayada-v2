export const VOICE_SAMPLE_RATE = 24000;
export const VOICE_WS_URL = 'wss://api.x.ai/v1/realtime?model=grok-voice-latest';
export const VOICE_MAX_BUFFER_SAMPLES = VOICE_SAMPLE_RATE * 10;
export const VOICE_CONNECT_MS = 10_000;
export const VOICE_STOP_WAIT_MS = 700;

export const voiceSessionUpdate = {
  type: 'session.update',
  session: {
    turn_detection: { type: 'server_vad', create_response: false },
    input_audio_transcription: { model: 'grok-2-audio' },
    audio: {
      input: { format: { type: 'audio/pcm', rate: VOICE_SAMPLE_RATE } },
    },
  },
};
