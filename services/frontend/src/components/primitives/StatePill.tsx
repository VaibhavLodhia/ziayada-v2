import { cn } from '@/lib/classNames';
import { type StateName, STATE_CAPTION } from '@/lib/tokens';
import { Pill } from './Pill';

type StatePillProps = {
  state: StateName;
  withCaption?: boolean;
  className?: string;
};

export function StatePill({ state, withCaption = false, className }: StatePillProps) {
  return (
    <Pill tone="mono" accent={state} className={cn('gap-1.5', className)}>
      <span>{state}</span>
      {withCaption ? (
        <span className="normal-case text-[11px] tracking-normal font-display italic text-ink3">
          {STATE_CAPTION[state]}
        </span>
      ) : null}
    </Pill>
  );
}
