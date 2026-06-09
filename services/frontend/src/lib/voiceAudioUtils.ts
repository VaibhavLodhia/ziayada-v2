import { VOICE_WS_URL } from '@/lib/voiceSessionConfig';

export function audioToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const chunk = 0x2000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function rmsLevel(pcm: Int16Array): number {
  if (!pcm.length) return 0;
  let sum = 0;
  for (let i = 0; i < pcm.length; i++) {
    const n = pcm[i] / 32768;
    sum += n * n;
  }
  return Math.min(1, Math.sqrt(sum / pcm.length) * 4);
}

export function openVoiceSocket(token: string, timeoutMs: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(VOICE_WS_URL, [`xai-client-secret.${token}`]);
    const timer = window.setTimeout(() => {
      ws.close();
      reject(new Error('Voice connection timed out'));
    }, timeoutMs);

    ws.onopen = () => {
      window.clearTimeout(timer);
      resolve(ws);
    };
    ws.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('Voice connection failed'));
    };
  });
}

export function micErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError') return 'Microphone permission denied';
    if (err.name === 'NotFoundError') return 'No microphone found';
  }
  if (err instanceof Error) return err.message;
  return 'Could not start voice input';
}
