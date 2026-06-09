import { useEffect, useState } from 'react';
import { cn } from '@/lib/classNames';
import { type StateName } from '@/lib/tokens';

type StampProps = {
  state: StateName;
  hash: string;
  className?: string;
};

export function Stamp({ state, hash, className }: StampProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 24);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-4 border border-seal bg-sealGlow px-6 py-3 font-mono text-sm uppercase tracking-[0.12em] text-seal transition-all duration-700',
        ready ? 'scale-100 opacity-100' : 'scale-125 opacity-0',
        ready ? 'shadow-[0_0_8px_var(--color-sealGlow)]' : '',
        className,
      )}
    >
      <span>{state}</span>
      <span className="h-4 w-px bg-seal" />
      <span>{hash.slice(0, 6)}</span>
    </div>
  );
}
