import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/classNames';
import { logout } from '@/lib/api';
import { useAppStore } from '@/state/store';

type AccountMenuProps = {
  open: boolean;
  close: () => void;
  className?: string;
};

export function AccountMenu({ open, close, className }: AccountMenuProps) {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const clearUser = useAppStore((s) => s.clearUser);
  const resetInterview = useAppStore((s) => s.reset);
  const resetChat = useAppStore((s) => s.resetChat);

  if (!open) return null;

  const handleSignOut = async () => {
    await logout();
    clearUser();
    resetInterview();
    resetChat();
    close();
    navigate('/login');
  };

  return (
    <div
      className={cn(
        'absolute right-0 top-11 z-50 min-w-[220px] border border-rule bg-ground/95 py-2 shadow-xl backdrop-blur',
        className,
      )}
      role="menu"
      aria-label="Account menu"
    >
      <div className="border-b border-ruleSoft px-4 pb-2 pt-1">
        <div className="text-sm text-ink">{user?.name ?? 'Account'}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink3">
          {user?.email ?? ''}
        </div>
      </div>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink2 transition-colors hover:bg-ground2 hover:text-ink"
        onClick={() => void handleSignOut()}
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  );
}
