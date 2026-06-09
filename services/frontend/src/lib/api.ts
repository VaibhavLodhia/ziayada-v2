import type { StreamEvent } from './stream-events.gen';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function readError(r: Response, fallback: string): Promise<string> {
  const text = await r.text().catch(() => '');
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown> | string;
    if (typeof parsed === 'string') return parsed;
    if (typeof parsed?.detail === 'string') return parsed.detail;
    if (typeof parsed?.message === 'string') return parsed.message;
  } catch {
    // ignore non-JSON responses
  }
  return text.slice(0, 200);
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${input}`, {
    credentials: 'include',
    ...init,
  });
  if (!response.ok) {
    throw new ApiError(response.status, await readError(response, `${input} ${response.status}`));
  }
  return response.json() as Promise<T>;
}

export type HealthResponse = { status: string; env: string };

export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatMessage = { role: ChatRole; content: string };
export type ToolInvocation = {
  id?: string;
  name: string;
  args: Record<string, unknown>;
  result: string | null;
};
export type ChatResponse = {
  sessionId: string;
  message: ChatMessage;
  toolCalls: ToolInvocation[];
  model: string;
};

export type GraphNode = {
  id: string;
  name: string;
  kind: 'Person' | 'Decision' | 'System' | 'Organization' | 'Topic';
  description: string | null;
};

export type GraphEdge = { source: string; target: string; relation: string };
export type GraphResponse = { nodes: GraphNode[]; edges: GraphEdge[] };

export type SessionSummary = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  turns: number;
};

export type UserRole = 'user' | 'admin';
export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login_at?: string | null;
};

export type AdminUser = User & {
  session_count: number;
  entity_count: number;
};

export type AdminStats = {
  users_total: number;
  users_active: number;
  admins: number;
  sessions_total: number;
  entities_total: number;
};

export type SeedResult = { sessions_seeded: number; entities_written: number };
export type VoiceTokenResponse = { value: string; expires_at: number };

export async function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>('/health');
}

export async function chat(messages: ChatMessage[], sessionId?: string): Promise<ChatResponse> {
  const raw = await requestJson<{
    session_id: string;
    message: ChatMessage;
    tool_calls: ToolInvocation[];
    model: string;
  }>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, session_id: sessionId ?? null }),
  });

  return {
    sessionId: raw.session_id,
    message: raw.message,
    toolCalls: raw.tool_calls,
    model: raw.model,
  };
}

export async function chatStream(
  messages: ChatMessage[],
  sessionId: string | null,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ messages, session_id: sessionId }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new ApiError(
      response.status,
      await readError(response, `chat stream ${response.status}`),
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    let frameBreak = buffer.indexOf('\n\n');
    while (frameBreak !== -1) {
      const frame = buffer.slice(0, frameBreak);
      buffer = buffer.slice(frameBreak + 2);
      frameBreak = buffer.indexOf('\n\n');

      const dataLine = frame
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith('data: '));
      if (!dataLine) continue;

      try {
        onEvent(JSON.parse(dataLine.slice(6)) as StreamEvent);
      } catch {
        // ignore malformed event payloads
      }
    }
  }
}

export async function getMyGraph(sessionId?: string): Promise<GraphResponse> {
  const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
  return requestJson<GraphResponse>(`/api/graph/me${qs}`);
}

export async function getMySessions(): Promise<SessionSummary[]> {
  const raw = await requestJson<
    Array<{
      id: string;
      created_at: string;
      updated_at: string;
      title?: string | null;
      turns?: number | null;
      preview?: string | null;
      message_count?: number | null;
    }>
  >('/api/graph/me/sessions');

  return raw.map((session) => ({
    id: session.id,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    title: session.title ?? session.preview ?? 'Untitled decision',
    turns: session.turns ?? session.message_count ?? 0,
  }));
}

export async function clearMyGraph(): Promise<void> {
  const response = await fetch(`${BASE}/api/me/graph`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new ApiError(
      response.status,
      await readError(response, `clear graph ${response.status}`),
    );
  }
}

export async function seedDemo(): Promise<SeedResult> {
  return requestJson<SeedResult>('/api/me/seed-demo', { method: 'POST' });
}

export async function signup(body: {
  email: string;
  password: string;
  name: string;
}): Promise<User> {
  return requestJson<User>('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function login(body: { email: string; password: string }): Promise<User> {
  return requestJson<User>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function logout(): Promise<void> {
  const response = await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok && response.status !== 204) {
    throw new ApiError(response.status, await readError(response, `logout ${response.status}`));
  }
}

export async function getMe(): Promise<User | null> {
  const response = await fetch(`${BASE}/api/auth/me`, { credentials: 'include' });
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new ApiError(response.status, await readError(response, `me ${response.status}`));
  }
  return response.json() as Promise<User>;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return requestJson<AdminUser[]>('/api/admin/users');
}

export async function updateAdminUser(
  id: string,
  patch: { role?: UserRole; is_active?: boolean },
): Promise<User> {
  return requestJson<User>(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export async function getAdminStats(): Promise<AdminStats> {
  return requestJson<AdminStats>('/api/admin/stats');
}

export async function fetchVoiceToken(): Promise<VoiceTokenResponse> {
  return requestJson<VoiceTokenResponse>('/api/voice/token', { method: 'POST' });
}

export type { StreamEvent };
