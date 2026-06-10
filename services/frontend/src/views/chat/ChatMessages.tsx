import { HashSeal } from '@/components/primitives/HashSeal';
import { PulseDot } from '@/components/primitives/PulseDot';
import { StatePill } from '@/components/primitives/StatePill';
import { TrustPill } from '@/components/primitives/TrustPill';
import type { ChatMessageWithTools } from '@/state/slices/chatSlice';

type ChatMessagesProps = {
  messages: ChatMessageWithTools[];
  streaming: boolean;
  inCard?: boolean;
};

export function ChatMessages({ messages, streaming, inCard = false }: ChatMessagesProps) {
  return (
    <div className={inCard ? 'flex flex-col gap-6 text-[var(--color-cardInk)]' : 'flex flex-col gap-6 text-ink'}>
      {messages.map((msg, i) => {
        if (msg.role === 'user') {
          return (
            <div key={i} className="flex justify-end">
              <div
                className={
                  inCard
                    ? 'max-w-[85%] border-b border-[var(--color-cardEdge)] pb-2 text-right font-display text-lg italic text-[var(--color-cardInk)]'
                    : 'max-w-[85%] border-b border-ruleSoft pb-2 text-right font-display text-lg italic text-ink'
                }
              >
                {msg.content}
              </div>
            </div>
          );
        }

        const meta = msg.assistantMeta;
        const isLastAssistant = i === messages.length - 1;
        const showPulse =
          streaming && isLastAssistant && msg.content === '' && !meta;

        if (showPulse) {
          return (
            <div key={i} className="flex items-center gap-3 px-1 py-3">
              <PulseDot
                size="md"
                label="Ziyada is thinking"
                className={inCard ? '[&_span:last-child]:text-[var(--color-cardInk2)]' : undefined}
              />
            </div>
          );
        }

        return (
          <div key={i} className="max-w-[90%] border-l-2 border-seal pl-4">
            {meta ? (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatePill state={meta.state} />
                <TrustPill tier={meta.trustTier} />
                <HashSeal hash={meta.auditHash} />
                <span className={`font-mono text-[10px] ${inCard ? 'text-[var(--color-cardInk3)]' : 'text-ink3'}`}>
                  {meta.confidence}%
                </span>
              </div>
            ) : null}
            <div
              className={`whitespace-pre-wrap font-body text-[15px] leading-relaxed ${inCard ? 'text-[var(--color-cardInk2)]' : 'text-ink2'}`}
            >
              {msg.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
