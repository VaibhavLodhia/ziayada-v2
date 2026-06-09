import { Link } from 'react-router-dom';
import { cn } from '@/lib/classNames';

type EmptyStateProps = {
  title: string;
  ctaLabel?: string;
  ctaTo?: string;
  className?: string;
};

export function EmptyState({ title, ctaLabel, ctaTo, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}>
      <h2 className="font-display text-2xl italic text-ink">
        {title}
      </h2>
      {ctaLabel && ctaTo ? (
        <Link
          to={ctaTo}
          className="rounded-full border border-rule px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors hover:bg-ground2"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
