import { MoonStar, Sun } from 'lucide-react';
import { cn } from '@/lib/classNames';
import { useAppStore } from '@/state/store';

type ThemeCornerProps = {
  className?: string;
};

export function ThemeCorner({ className }: ThemeCornerProps) {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const toggle = () => {
    setTheme(theme === 'parchment' ? 'obsidian' : 'parchment');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Light or dark"
      className={cn(
        'fixed bottom-5 right-5 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-rule bg-ground/90 text-ink3 transition-transform hover:rotate-180 hover:text-seal',
        className,
      )}
      aria-label="Toggle theme"
    >
      {theme === 'parchment' ? <MoonStar className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
