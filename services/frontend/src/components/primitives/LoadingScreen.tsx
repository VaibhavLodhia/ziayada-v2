import { cn } from '@/lib/classNames';

type LoadingScreenProps = {
  className?: string;
};

export function LoadingScreen({ className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0908]',
        className,
      )}
    >
      <div className="inline-flex items-center gap-2 font-display text-3xl italic tracking-tight text-[#FAF7ED]">
        <span>Ziyada</span>
        <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden />
      </div>
    </div>
  );
}
