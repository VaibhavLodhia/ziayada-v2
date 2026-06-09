import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/classNames';
import { type StateName } from '@/lib/tokens';

type PillTone = 'mono' | 'serif';
type PillAccent = 'default' | 'seal' | StateName;

type PillProps = PropsWithChildren<{
  tone?: PillTone;
  accent?: PillAccent;
  className?: string;
}>;

const ACCENT_CLASS: Record<PillAccent, string> = {
  default: 'bg-ground2 text-ink2',
  seal: 'bg-sealGlow text-seal',
  RESPOND: 'bg-[var(--color-st-respond-bg)] text-st-respond',
  NARROW: 'bg-[var(--color-st-narrow-bg)] text-st-narrow',
  FLAG: 'bg-[var(--color-st-flag-bg)] text-st-flag',
  DEFER: 'bg-[var(--color-st-defer-bg)] text-st-defer',
  EXPLORE: 'bg-[var(--color-st-explore-bg)] text-st-explore',
};

export function Pill({ tone = 'mono', accent = 'default', className, children }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]',
        tone === 'mono' ? 'font-mono' : 'font-display italic',
        ACCENT_CLASS[accent],
        className,
      )}
    >
      {children}
    </span>
  );
}
