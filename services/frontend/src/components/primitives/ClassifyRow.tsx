import { cn } from '@/lib/classNames';
import { type StateName, STATE_CAPTION, STATE_ORDER } from '@/lib/tokens';
import { Glyph } from './Glyph';

type ClassifyRowProps = {
  chosen?: StateName;
  className?: string;
};

export function ClassifyRow({ chosen, className }: ClassifyRowProps) {
  return (
    <div className={cn('flex w-full max-w-[640px] items-start justify-between gap-3 py-4', className)}>
      {STATE_ORDER.map((state) => {
        const lit = state === chosen;
        return (
          <div
            key={state}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-2 text-center transition-opacity',
              lit ? 'opacity-100' : 'opacity-35 hover:opacity-80',
            )}
            title={`${state} · ${STATE_CAPTION[state]}`}
          >
            <Glyph
              state={state}
              className={cn(lit ? 'text-seal' : 'text-ink2')}
              size={32}
            />
            <span className={cn('font-mono text-[10px] uppercase tracking-[0.2em]', lit ? 'text-seal' : 'text-ink2')}>
              {state}
            </span>
            <span className="text-[11px] italic text-ink3">{STATE_CAPTION[state]}</span>
          </div>
        );
      })}
    </div>
  );
}
