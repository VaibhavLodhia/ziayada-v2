import { Check, Copy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/classNames';

type HashSealProps = {
  hash: string;
  className?: string;
};

export function HashSeal({ hash, className }: HashSealProps) {
  const [copied, setCopied] = useState(false);
  const shortHash = useMemo(() => hash.slice(0, 6).toLowerCase(), [hash]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortHash);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={cn(
        'group relative inline-flex items-center gap-1 rounded-full bg-sealGlow px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-seal transition-colors',
        className,
      )}
      aria-label={`Copy hash ${shortHash}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      <span>{shortHash}</span>
      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-ink px-1.5 py-0.5 text-[9px] tracking-[0.08em] text-ground opacity-0 transition-opacity group-hover:opacity-100">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}
