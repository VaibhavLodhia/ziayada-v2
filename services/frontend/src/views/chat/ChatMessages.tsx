import { HashSeal } from '@/components/primitives/HashSeal';
import { StatePill } from '@/components/primitives/StatePill';
import { TrustPill } from '@/components/primitives/TrustPill';
import type { ChatMessageWithTools } from '@/state/slices/chatSlice';

type ChatMessagesProps = {
  messages: ChatMessageWithTools[];
  pending: boolean;
};

export function ChatMessages({ messages, pending }: ChatMessagesProps) {
  if (messages.length === 0 && !pending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-display text-xl italic text-ink2">
          Private by design. Your conversation stays in your ledger.
        </p>
        <p className="mt-3 max-w-md font-mono text-[10px] uppercase tracking-wide-2 text-ink3">
          Ask anything. Use Record a decision when you want the structured interview.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-8">
      {messages.map((msg, i) => {
        if (msg.role === 'user') {
          return (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] border-b border-ruleSoft pb-2 text-right font-display text-lg italic text-ink">
                {msg.content}
              </div>
            </div>
          );
        }

        const meta = msg.assistantMeta;
        return (
          <div key={i} className="max-w-[90%] border-l-2 border-seal pl-4">
            {meta ? (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatePill state={meta.state} />
                <TrustPill tier={meta.trustTier} />
                <HashSeal hash={meta.auditHash} />
                <span className="font-mono text-[10px] text-ink3">{meta.confidence}%</span>
              </div>
            ) : null}
            <div className="whitespace-pre-wrap font-body text-[15px] leading-relaxed text-ink2">
              {msg.content || (pending && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        );
      })}
      {pending && messages.at(-1)?.role !== 'assistant' ? (
        <div className="font-mono text-[10px] uppercase tracking-wide-2 text-ink3">Thinking...</div>
      ) : null}
    </div>
  );
}
