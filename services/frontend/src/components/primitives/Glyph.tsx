import { cn } from '@/lib/classNames';
import { type StateName } from '@/lib/tokens';

type GlyphProps = {
  state: StateName;
  className?: string;
  size?: number;
};

export function Glyph({ state, className, size = 32 }: GlyphProps) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      {...common}
      aria-hidden
    >
      {state === 'RESPOND' ? (
        <>
          <circle cx="11" cy="16" r="4.5" fill="currentColor" stroke="none" />
          <path d="M16 16 H26 M22 12 L26 16 L22 20" />
        </>
      ) : null}
      {state === 'NARROW' ? (
        <>
          <path d="M5 6 L15 16 L5 26" />
          <path d="M27 6 L17 16 L27 26" />
        </>
      ) : null}
      {state === 'FLAG' ? (
        <>
          <path d="M16 5 L24 14 L8 14 Z" fill="currentColor" stroke="none" />
          <line x1="16" y1="14" x2="16" y2="28" />
        </>
      ) : null}
      {state === 'DEFER' ? <path d="M22 6 a10 10 0 1 0 0 20 a7 7 0 1 1 0 -20" fill="currentColor" stroke="none" /> : null}
      {state === 'EXPLORE' ? (
        <>
          <circle cx="16" cy="16" r="2.5" fill="currentColor" stroke="none" />
          <line x1="16" y1="4" x2="16" y2="10" />
          <line x1="16" y1="22" x2="16" y2="28" />
          <line x1="4" y1="16" x2="10" y2="16" />
          <line x1="22" y1="16" x2="28" y2="16" />
          <line x1="7.5" y1="7.5" x2="11.7" y2="11.7" />
          <line x1="20.3" y1="20.3" x2="24.5" y2="24.5" />
          <line x1="7.5" y1="24.5" x2="11.7" y2="20.3" />
          <line x1="20.3" y1="11.7" x2="24.5" y2="7.5" />
        </>
      ) : null}
    </svg>
  );
}
