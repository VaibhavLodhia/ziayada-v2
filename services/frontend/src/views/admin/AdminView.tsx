import { useCallback, useEffect, useState } from 'react';
import { getAdminStats, getAdminUsers, updateAdminUser, type AdminStats, type AdminUser } from '@/lib/api';
import { useAppStore } from '@/state/store';

export function AdminView(): JSX.Element {
  const currentUser = useAppStore((s) => s.user);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData] = await Promise.all([getAdminStats(), getAdminUsers()]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flipRole = async (user: AdminUser) => {
    if (busyId) return;
    setBusyId(user.id);
    try {
      const nextRole = user.role === 'admin' ? 'user' : 'admin';
      const updated = await updateAdminUser(user.id, { role: nextRole });
      setUsers((prev) => prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
      const refreshed = await getAdminStats();
      setStats(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setBusyId(null);
    }
  };

  const flipActive = async (user: AdminUser) => {
    if (busyId) return;
    setBusyId(user.id);
    try {
      const updated = await updateAdminUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
      const refreshed = await getAdminStats();
      setStats(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[980px] px-6 py-12">
      <h1 className="text-4xl italic text-ink">Admin.</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Total users" value={stats?.users_total} />
        <StatTile label="Active users" value={stats?.users_active} />
        <StatTile label="Admins" value={stats?.admins} />
        <StatTile label="Sessions" value={stats?.sessions_total} />
        <StatTile label="Entities" value={stats?.entities_total} />
      </div>

      {error ? <p className="mt-4 text-sm text-ink3">{error}</p> : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)]">
        {loading ? (
          <p className="px-4 py-6 text-sm text-ink3">Loading users...</p>
        ) : (
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-[var(--rule-soft)]">
              <tr className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2">Sessions</th>
                <th className="px-3 py-2">Entities</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = currentUser?.id === user.id;
                const isBusy = busyId === user.id;
                return (
                  <tr key={user.id} className="border-b border-[var(--rule-soft)] last:border-b-0">
                    <td className="px-3 py-2">{user.name}</td>
                    <td className="px-3 py-2 text-ink2">{user.email}</td>
                    <td className="px-3 py-2">{user.role}</td>
                    <td className="px-3 py-2">{user.is_active ? 'yes' : 'no'}</td>
                    <td className="px-3 py-2">{user.session_count}</td>
                    <td className="px-3 py-2">{user.entity_count}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void flipRole(user)}
                          disabled={isSelf || isBusy}
                          className="rounded-md border border-[var(--rule)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] disabled:opacity-50"
                        >
                          {user.role === 'admin' ? 'Make user' : 'Make admin'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void flipActive(user)}
                          disabled={isSelf || isBusy}
                          className="rounded-md border border-[var(--rule)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] disabled:opacity-50"
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: number | undefined }): JSX.Element {
  return (
    <div className="rounded-xl border border-[var(--rule-soft)] bg-[var(--ground)] px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">{label}</p>
      <p className="mt-1 text-2xl italic text-ink">{value ?? 0}</p>
    </div>
  );
}
