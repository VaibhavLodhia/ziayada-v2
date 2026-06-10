import { HashSeal } from '@/components/primitives/HashSeal';
import { PulseDot } from '@/components/primitives/PulseDot';
import { StatePill } from '@/components/primitives/StatePill';
import { TrustPill } from '@/components/primitives/TrustPill';
import type { ChatMessageWithTools } from '@/state/slices/chatSlice';

type ChatMessagesProps = {
  messages: ChatMessageWithTools[];
  streaming: boolean;
};

export function ChatMessages({ messages, streaming }: ChatMessagesProps) {
  return (
    <div className="flex flex-col gap-6 text-[var(--color-cardInk)]">
      {messages.map((msg, i) => {
        if (msg.role === 'user') {
          return (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] border-b border-[var(--color-cardEdge)] pb-2 text-right font-display text-lg italic text-[var(--color-cardInk)]">
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
              <PulseDot size="md" label="Ziyada is thinking" className="[&_span:last-child]:text-[var(--color-cardInk3)]" />
            </div>
          );
        }

        return (
          <div key={i} className="max-w-[90%] border-l-2 border-[var(--color-cardInk)] pl-4">
            {meta ? (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatePill state={meta.state} />
                <TrustPill tier={meta.trustTier} />
                <HashSeal hash={meta.auditHash} />
                <span className="font-mono text-[10px] text-[var(--color-cardInk3)]">{meta.confidence}%</span>
              </div>
            ) : null}
            <div className="whitespace-pre-wrap font-body text-[15px] leading-relaxed text-[var(--color-cardInk)]">
              {msg.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
