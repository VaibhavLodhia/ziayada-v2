import clsx from 'clsx';

interface PulseDotProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function PulseDot({ size = 'md', className, label }: PulseDotProps) {
  const dim = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';
  return (
    <span
      role="status"
      aria-label={label ?? 'Processing'}
      className={clsx('inline-flex items-center gap-2', className)}
    >
      <span className={clsx('pulse-dot', dim)} />
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-wide-2 text-ink3">{label}</span>
      )}
    </span>
  );
}
