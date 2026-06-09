import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '@/state/store';

export function AuthGuard() {
  const user = useAppStore((s) => s.user);
  const hydrating = useAppStore((s) => s.hydrating);

  if (hydrating) {
    return (
      <div className="min-h-screen grid place-items-center bg-ground text-ink2 font-body italic">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
