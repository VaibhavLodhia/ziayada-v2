import { Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/classNames';
import { HashSeal } from '@/components/primitives/HashSeal';

type PublicAgentCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  principal: string;
  hash: string;
  className?: string;
};

export function PublicAgentCard({
  icon: Icon,
  title,
  description,
  principal,
  hash,
  className,
}: PublicAgentCardProps) {
  return (
    <article
      className={cn(
        'flex flex-col rounded-xl border border-rule bg-ground2/30 p-5 transition-colors hover:border-seal/40 hover:bg-ground2/60',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E4EDE4] text-[#3D6B4F]">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink3">
          <Globe className="h-3 w-3" aria-hidden />
          Public · Coming
        </span>
      </div>

      <h2 className="mt-4 font-sans text-[15px] font-medium leading-snug text-ink">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink2">{description}</p>

      <footer className="mt-5 flex items-end justify-between gap-3 border-t border-ruleSoft pt-4">
        <p className="text-xs text-ink3">
          By <span className="text-ink2">{principal}</span>
        </p>
        <HashSeal hash={hash} />
      </footer>
    </article>
  );
}
