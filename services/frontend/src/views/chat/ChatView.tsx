import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Field } from '@/components/primitives/Field';
import { chatStream } from '@/lib/api';
import { generateAssistantResponse } from '@/lib/mockAssistant';
import { useAppStore } from '@/state/store';
import { ChatMessages } from './ChatMessages';

function countUserMessages(messages: { role: string }[]): number {
  return messages.filter((m) => m.role === 'user').length;
}

export function ChatView() {
  const messages = useAppStore((s) => s.messages);
  const chatPending = useAppStore((s) => s.chatPending);
  const chatError = useAppStore((s) => s.chatError);
  const chatSessionId = useAppStore((s) => s.chatSessionId);
  const appendUserMessage = useAppStore((s) => s.appendUserMessage);
  const startAssistantStream = useAppStore((s) => s.startAssistantStream);
  const appendAssistantDelta = useAppStore((s) => s.appendAssistantDelta);
  const finalizeAssistantMessage = useAppStore((s) => s.finalizeAssistantMessage);
  const appendToolCallToCurrent = useAppStore((s) => s.appendToolCallToCurrent);
  const setToolResultOnCurrent = useAppStore((s) => s.setToolResultOnCurrent);
  const setChatSessionId = useAppStore((s) => s.setChatSessionId);
  const setChatPending = useAppStore((s) => s.setChatPending);
  const setChatError = useAppStore((s) => s.setChatError);
  const resetChat = useAppStore((s) => s.resetChat);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const applyMockAssistant = useCallback(
    async (userText: string, userMessageCount: number) => {
      const mock = await generateAssistantResponse(userText, userMessageCount);
      finalizeAssistantMessage(mock.body, {
        state: mock.state,
        confidence: mock.confidence,
        auditHash: mock.auditHash,
        trustTier: mock.trustTier,
      });
    },
    [finalizeAssistantMessage],
  );

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      abortRef.current?.abort();

      const stateBefore = useAppStore.getState();
      const priorMessages = stateBefore.messages
        .filter(
          (m) =>
            m.role === 'user' ||
            (m.role === 'assistant' && m.content.trim().length > 0),
        )
        .map(({ role, content }) => ({ role, content }));

      const userMessageCount = countUserMessages(stateBefore.messages) + 1;

      appendUserMessage(trimmed);
      setChatError(null);
      setChatPending(true);
      startAssistantStream();

      const controller = new AbortController();
      abortRef.current = controller;
      let gotTokens = false;

      try {
        const turn = [...priorMessages, { role: 'user' as const, content: trimmed }];
        await chatStream(
          turn,
          stateBefore.chatSessionId,
          (e) => {
            if (controller.signal.aborted) return;
            switch (e.type) {
              case 'session':
                setChatSessionId(e.session_id);
                break;
              case 'token':
                if (e.delta) gotTokens = true;
                appendAssistantDelta(e.delta);
                break;
              case 'tool':
                appendToolCallToCurrent({ id: e.id, name: e.name, args: e.args, result: null });
                break;
              case 'tool_result':
                setToolResultOnCurrent(e.id, e.result);
                break;
              case 'error':
                setChatError(e.message);
                break;
              case 'done':
                break;
            }
          },
          controller.signal,
        );

        const last = useAppStore.getState().messages.at(-1);
        if (!gotTokens || (last?.role === 'assistant' && !last.content.trim())) {
          await applyMockAssistant(trimmed, userMessageCount);
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        setChatError(e instanceof Error ? e.message : String(e));
        await applyMockAssistant(trimmed, userMessageCount);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setChatPending(false);
      }
    },
    [
      appendAssistantDelta,
      appendToolCallToCurrent,
      appendUserMessage,
      applyMockAssistant,
      setChatError,
      setChatPending,
      setChatSessionId,
      setToolResultOnCurrent,
      startAssistantStream,
    ],
  );

  const [input, setInput] = useState('');

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-[760px] flex-col">
      <div className="flex items-center justify-between border-b border-ruleSoft px-6 py-3">
        <div>
          <h1 className="font-display text-lg italic text-ink">Chat</h1>
          <p className="font-mono text-[10px] uppercase tracking-wide-3 text-ink3">
            Private layer
            {chatSessionId ? (
              <span className="text-seal"> · session {chatSessionId.slice(0, 8)}</span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/decide"
            className="rounded-pill border border-seal px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide-2 text-seal hover:bg-sealGlow"
          >
            Record a decision
          </Link>
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                abortRef.current?.abort();
                resetChat();
              }}
              className="rounded-pill border border-rule px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide-2 text-ink3 hover:bg-ground2"
            >
              New chat
            </button>
          ) : null}
        </div>
      </div>

      <ChatMessages messages={messages} pending={chatPending} />

      {chatError ? (
        <p className="px-6 pb-2 text-center font-display italic text-seal">{chatError}</p>
      ) : null}

      <div className="border-t border-ruleSoft px-6 py-4">
        <Field
          value={input}
          onChange={setInput}
          onSubmit={() => {
            void handleSend(input);
            setInput('');
          }}
          onVoiceSubmit={(text) => {
            setInput('');
            void handleSend(text);
          }}
          onListeningChange={(listening) => {
            if (!listening) return;
            setChatPending(false);
            abortRef.current?.abort();
            abortRef.current = null;
          }}
          placeholder="Describe what you are working through..."
          voiceEnabled
          disabled={chatPending}
        />
      </div>
    </div>
  );
}
