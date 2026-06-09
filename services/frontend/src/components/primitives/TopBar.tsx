import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, PanelLeft, PanelLeftClose, PanelRight, PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/classNames';
import { useAppStore } from '@/state/store';
import { AccountMenu } from './AccountMenu';
import { Brand } from './Brand';

type TopBarProps = {
  dateLabel?: string;
  className?: string;
};

function formatDateLabel(date: Date): string {
  return date
    .toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    .toUpperCase()
    .replace(',', ' ·');
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ID';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashForming(questionIndex: number): string {
  if (questionIndex <= 1) return 'a7..';
  if (questionIndex === 2) return 'a7f3.';
  return 'a7f3d2';
}

export function TopBar({ dateLabel, className }: TopBarProps) {
  const location = useLocation();
  const user = useAppStore((s) => s.user);
  const phase = useAppStore((s) => s.phase);
  const turn = useAppStore((s) => s.turn);
  const questions = useAppStore((s) => s.questions);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const rightPanelOpen = useAppStore((s) => s.rightPanelOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const toggleRightPanel = useAppStore((s) => s.toggleRightPanel);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const computedDateLabel = useMemo(() => dateLabel ?? formatDateLabel(new Date()), [dateLabel]);
  const identityName = user?.name ?? 'Identity';
  const identityInitials = initials(identityName);
  const center =
    location.pathname === '/decide' && phase === 'question' && questions.length > 0
      ? {
          questionIndex: turn + 1,
          totalQuestions: questions.length,
          hash: hashForming(turn + 1),
        }
      : null;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between border-b border-rule bg-ground/95 px-4 backdrop-blur',
        className,
      )}
      ref={rootRef}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border border-rule text-ink3 transition-colors hover:border-seal hover:bg-ground2 hover:text-seal',
            sidebarOpen && 'border-seal bg-sealGlow text-seal',
          )}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </button>
        <Brand />
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink3 sm:inline">
          {computedDateLabel}
        </span>
      </div>

      <div
        className={cn(
          'font-mono text-[10px] uppercase tracking-[0.2em] text-ink3 transition-opacity',
          center ? 'opacity-100' : 'opacity-0',
        )}
      >
        {center ? (
          <span className="inline-flex items-center gap-3">
            <span className="text-seal">
              Q{center.questionIndex}/{center.totalQuestions}
            </span>
            <span className="text-seal">{center.hash}</span>
          </span>
        ) : null}
      </div>

      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={toggleRightPanel}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border border-rule text-ink3 transition-colors hover:border-seal hover:bg-ground2 hover:text-seal',
            rightPanelOpen && 'border-seal bg-sealGlow text-seal',
          )}
          aria-label={rightPanelOpen ? 'Close insights panel' : 'Open insights panel'}
          aria-expanded={rightPanelOpen}
          title={rightPanelOpen ? 'Close insights' : 'Open insights'}
        >
          {rightPanelOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRight className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-ground2"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="Account menu"
        >
          <span className="hidden text-[13px] text-ink2 sm:inline">{identityName}</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink font-display text-[10px] italic text-ground">
            {identityInitials}
          </span>
          <ChevronDown
            className={cn('h-3.5 w-3.5 text-ink3 transition-transform', menuOpen ? 'rotate-180' : 'rotate-0')}
          />
        </button>
        <AccountMenu open={menuOpen} close={() => setMenuOpen(false)} />
      </div>
    </header>
  );
}
