import { LogOut, MoonStar, Sun } from 'lucide-react';
import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/classNames';
import { logout } from '@/lib/api';
import { useAppStore } from '@/state/store';
import { NAV_ITEMS } from './navItems';

type NavSidebarProps = {
  open: boolean;
};

export function NavSidebar({ open }: NavSidebarProps) {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const ledgerCount = useAppStore((s) => s.ledger.length);
  const clearUser = useAppStore((s) => s.clearUser);
  const resetInterview = useAppStore((s) => s.reset);
  const resetChat = useAppStore((s) => s.resetChat);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  const items = useMemo(
    () => NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin'),
    [user?.role],
  );

  const badgeFor = (to: string, badge: string) => {
    if (to === '/sessions') return String(ledgerCount);
    return badge;
  };

  const close = () => setSidebarOpen(false);

  const handleSignOut = async () => {
    await logout();
    clearUser();
    resetInterview();
    resetChat();
    close();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'parchment' ? 'obsidian' : 'parchment');
  };

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        'fixed left-0 top-0 z-30 flex h-full flex-col border-r border-rule bg-ground/98 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.12)] backdrop-blur transition-[transform,width] duration-300 ease-in-out',
        open ? 'w-[260px] translate-x-0' : 'w-[260px] -translate-x-full pointer-events-none',
      )}
    >
      <div className="border-b border-ruleSoft px-4 pb-3 pt-[3.75rem]">
        <div className="font-display text-sm italic text-ink">Principle</div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink3">
          {user?.email ?? 'Signed in'}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2" aria-label="Primary navigation">
        {items.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/agents'}
            onClick={close}
            className={({ isActive }) =>
              cn(
                'mx-2 flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sealGlow text-ink'
                  : 'text-ink2 hover:bg-ground2 hover:text-ink',
              )
            }
          >
            <span className="flex items-center gap-2.5">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </span>
            <span className="font-mono text-[9px] tracking-[0.14em] text-ink3">
              {badgeFor(to, badge)}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ruleSoft p-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-ink2 transition-colors hover:bg-ground2 hover:text-ink"
        >
          <span className="flex items-center gap-2.5">
            {theme === 'parchment' ? (
              <MoonStar className="h-3.5 w-3.5" />
            ) : (
              <Sun className="h-3.5 w-3.5" />
            )}
            Light or dark
          </span>
          <span className="font-mono text-[9px] tracking-[0.14em] text-ink3">
            {theme === 'parchment' ? 'PARCHMENT' : 'OBSIDIAN'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink2 transition-colors hover:bg-ground2 hover:text-ink"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
