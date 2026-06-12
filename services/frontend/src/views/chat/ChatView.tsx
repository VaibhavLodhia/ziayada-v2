import { useCallback, useLayoutEffect, useRef, useState } from 'react';
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
  const streaming = useAppStore((s) => s.streaming);
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
  const setStreaming = useAppStore((s) => s.setStreaming);
  const setAbortController = useAppStore((s) => s.setAbortController);
  const stopStreaming = useAppStore((s) => s.stopStreaming);
  const resetChat = useAppStore((s) => s.resetChat);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const started = messages.length > 0;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messages.at(-1)?.role === 'user' || streaming) {
      stickToBottomRef.current = true;
    }
    if (!stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

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
      if (!trimmed || streaming) return;

      const stateBefore = useAppStore.getState();
      const priorMessages = stateBefore.messages
        .filter(
          (m) =>
            m.role === 'user' ||
            (m.role === 'assistant' && m.content.trim().length > 0),
        )
        .map(({ role, content }) => ({ role, content }));

      const userMessageCount = countUserMessages(stateBefore.messages) + 1;

      const controller = new AbortController();
      setAbortController(controller);
      setStreaming(true);
      appendUserMessage(trimmed);
      setChatError(null);
      setChatPending(true);
      startAssistantStream();

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
        if (!controller.signal.aborted && (!gotTokens || (last?.role === 'assistant' && !last.content.trim()))) {
          await applyMockAssistant(trimmed, userMessageCount);
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        setChatError(e instanceof Error ? e.message : String(e));
        await applyMockAssistant(trimmed, userMessageCount);
      } finally {
        if (useAppStore.getState().abortController === controller) {
          setAbortController(null);
        }
        setStreaming(false);
        setChatPending(false);
      }
    },
    [
      appendAssistantDelta,
      appendToolCallToCurrent,
      appendUserMessage,
      applyMockAssistant,
      setAbortController,
      setChatError,
      setChatPending,
      setChatSessionId,
      setStreaming,
      setToolResultOnCurrent,
      startAssistantStream,
      streaming,
    ],
  );

  const handleStop = useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

  const [input, setInput] = useState('');

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 96;
  };

  const chatField = (
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
        stopStreaming();
      }}
      placeholder="Describe what you are working through..."
      streaming={streaming}
      onStop={handleStop}
      voiceEnabled
      multiline
      cardMode={!started}
    />
  );

  const pageHeader = (
    <div className="flex w-full max-w-[760px] items-baseline justify-between">
      <div>
        <h1 className="font-display text-2xl italic text-ink">Chat</h1>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wide-3 text-ink">
          Private layer
          {chatSessionId ? (
            <span className="text-seal"> · session {chatSessionId.slice(0, 8)}</span>
          ) : null}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/decide"
          className="rounded-pill border border-seal px-4 py-2 font-mono text-[10px] uppercase tracking-wide-2 text-seal transition-colors hover:bg-seal hover:text-ground"
        >
          Record a decision
        </Link>
        {started ? (
          <button
            type="button"
            onClick={() => resetChat()}
            className="rounded-pill border border-rule px-3 py-2 font-mono text-[10px] uppercase tracking-wide-2 text-ink2 transition-colors hover:bg-ground2 hover:text-ink"
          >
            New chat
          </button>
        ) : null}
      </div>
    </div>
  );

  if (!started) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] flex-1 flex-col items-center bg-ground px-6 py-8">
        <div className="mb-6 w-full max-w-[760px]">{pageHeader}</div>

        <div className="flex w-full max-w-[760px] flex-1 flex-col justify-center pb-8">
          <div className="chat-card relative flex w-full flex-col">
            {chatError ? (
              <p className="px-6 pt-6 text-center font-display italic text-seal">{chatError}</p>
            ) : null}

            <div className="px-5 py-3">{chatField}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-1 flex-col bg-ground">
      <div className="shrink-0 px-6 pb-4 pt-8">{pageHeader}</div>

      <div className="mx-auto flex min-h-0 w-full max-w-[760px] flex-1 flex-col px-6">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto py-4"
        >
          <ChatMessages messages={messages} streaming={streaming} inCard={false} />
        </div>

        {chatError ? (
          <p className="shrink-0 pb-2 text-center font-display italic text-seal">{chatError}</p>
        ) : null}

        <div className="shrink-0 border-t border-rule py-4">{chatField}</div>
      </div>
    </div>
  );
}
