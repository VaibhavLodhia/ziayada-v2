import { Link } from 'react-router-dom';
import { cn } from '@/lib/classNames';

type BrandSize = 'sm' | 'md' | 'lg';

type BrandProps = {
  size?: BrandSize;
  className?: string;
};

const SIZE_CLASS: Record<BrandSize, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function Brand({ size = 'md', className }: BrandProps) {
  return (
    <Link
      to="/chat"
      className={cn(
        'inline-flex items-center gap-2 font-display italic tracking-tight text-ink transition-colors hover:text-seal',
        SIZE_CLASS[size],
        className,
      )}
      aria-label="Go to home"
    >
      <span>Ziyada</span>
      <span className="h-1.5 w-1.5 rounded-full bg-seal" aria-hidden />
    </Link>
  );
}
