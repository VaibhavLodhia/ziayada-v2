import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/classNames';
import { type StateName, type TrustTier } from '@/lib/tokens';
import { HashSeal } from './HashSeal';
import { StatePill } from './StatePill';
import { TrustPill } from './TrustPill';

type DecisionRowProps = {
  title: string;
  state: StateName;
  hash: string;
  when?: string;
  trust?: TrustTier;
  onClick?: () => void;
  className?: string;
};

export function DecisionRow({ title, state, hash, when, trust, onClick, className }: DecisionRowProps) {
  const Element = onClick ? 'button' : 'div';
  return (
    <Element
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-3 border-b border-ruleSoft py-3 text-left transition-colors',
        onClick ? 'hover:bg-ground2/60' : '',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="truncate text-[15px] text-ink">{title}</div>
        <div className="flex flex-wrap items-center gap-2">
          <StatePill state={state} />
          <HashSeal hash={hash} />
          {trust ? <TrustPill tier={trust} /> : null}
          {when ? <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink3">{when}</span> : null}
        </div>
      </div>
      {onClick ? <ChevronRight className="h-4 w-4 shrink-0 text-ink3" /> : null}
    </Element>
  );
}
