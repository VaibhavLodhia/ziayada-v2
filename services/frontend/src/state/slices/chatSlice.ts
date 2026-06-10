import type { StateCreator } from 'zustand';
import type { ChatMessage, ToolInvocation } from '@/lib/api';
import type { StateName, TrustTier } from '@/lib/tokens';

export type AssistantMessageMeta = {
  state: StateName;
  confidence: number;
  auditHash: string;
  trustTier: TrustTier;
};

export type ChatMessageWithTools = ChatMessage & {
  tool_calls?: ToolInvocation[];
  assistantMeta?: AssistantMessageMeta;
  interrupted?: boolean;
};

export type ChatSlice = {
  chatSessionId: string | null;
  messages: ChatMessageWithTools[];
  chatPending: boolean;
  chatError: string | null;
  streaming: boolean;
  abortController: AbortController | null;
  appendUserMessage: (content: string) => void;
  startAssistantStream: () => void;
  appendAssistantDelta: (delta: string) => void;
  finalizeAssistantMessage: (content: string, meta?: AssistantMessageMeta) => void;
  appendToolCallToCurrent: (call: ToolInvocation) => void;
  setToolResultOnCurrent: (id: string, result: string) => void;
  setChatSessionId: (id: string) => void;
  setChatPending: (pending: boolean) => void;
  setChatError: (error: string | null) => void;
  setStreaming: (v: boolean) => void;
  setAbortController: (c: AbortController | null) => void;
  stopStreaming: () => void;
  resetChat: () => void;
};

export const createChatSlice: StateCreator<ChatSlice> = (set, get) => ({
  chatSessionId: null,
  messages: [],
  chatPending: false,
  chatError: null,
  streaming: false,
  abortController: null,
  appendUserMessage: (content) =>
    set((s) => ({ messages: [...s.messages, { role: 'user', content }] })),
  startAssistantStream: () =>
    set((s) => ({
      messages: [...s.messages, { role: 'assistant', content: '', tool_calls: [] }],
    })),
  appendAssistantDelta: (delta) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const next = s.messages.slice();
      const last = next[next.length - 1];
      if (last.role !== 'assistant') return s;
      next[next.length - 1] = { ...last, content: last.content + delta };
      return { messages: next };
    }),
  finalizeAssistantMessage: (content, meta) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const next = s.messages.slice();
      const last = next[next.length - 1];
      if (last.role !== 'assistant') return s;
      next[next.length - 1] = { ...last, content, assistantMeta: meta };
      return { messages: next };
    }),
  appendToolCallToCurrent: (call) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const next = s.messages.slice();
      const last = next[next.length - 1];
      if (last.role !== 'assistant') return s;
      next[next.length - 1] = {
        ...last,
        tool_calls: [...(last.tool_calls ?? []), call],
      };
      return { messages: next };
    }),
  setToolResultOnCurrent: (id, result) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const next = s.messages.slice();
      const last = next[next.length - 1];
      if (last.role !== 'assistant' || !last.tool_calls) return s;
      const calls = last.tool_calls.map((c) => (c.id === id ? { ...c, result } : c));
      next[next.length - 1] = { ...last, tool_calls: calls };
      return { messages: next };
    }),
  setChatSessionId: (id) => set({ chatSessionId: id }),
  setChatPending: (pending) => set({ chatPending: pending }),
  setChatError: (error) => set({ chatError: error }),
  setStreaming: (v) => set({ streaming: v }),
  setAbortController: (c) => set({ abortController: c }),
  stopStreaming: () => {
    const ctrl = get().abortController;
    if (ctrl) ctrl.abort();
    set({ streaming: false, abortController: null, chatPending: false });
  },
  resetChat: () => {
    const ctrl = get().abortController;
    if (ctrl) ctrl.abort();
    set({
      chatSessionId: null,
      messages: [],
      chatPending: false,
      chatError: null,
      streaming: false,
      abortController: null,
    });
  },
});
