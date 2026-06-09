import { cn } from '@/lib/classNames';
import { type TrustTier } from '@/lib/tokens';

type TrustPillProps = {
  tier: TrustTier;
  className?: string;
};

const LABEL: Record<TrustTier, string> = {
  PRIVATE: 'Trust Private',
  SHARED: 'Trust Shared',
  PUBLIC: 'Trust Public',
};

const TIER_CLASS: Record<TrustTier, string> = {
  PRIVATE: 'bg-ground2 text-ink3',
  SHARED: 'bg-sealGlow text-seal',
  PUBLIC: 'bg-ground2 text-st-respond',
};

export function TrustPill({ tier, className }: TrustPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em]',
        TIER_CLASS[tier],
        className,
      )}
    >
      {LABEL[tier]}
    </span>
  );
}
