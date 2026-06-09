import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '@/state/store';

export function AdminGuard() {
  const user = useAppStore((s) => s.user);
  if (user?.role !== 'admin') return <Navigate to="/chat" replace />;
  return <Outlet />;
}
