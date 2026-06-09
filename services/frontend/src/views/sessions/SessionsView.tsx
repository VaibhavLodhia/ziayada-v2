import { useEffect, useState } from 'react';
import { HashSeal } from '@/components/primitives/HashSeal';
import { Pill } from '@/components/primitives/Pill';
import { getMySessions, type SessionSummary } from '@/lib/api';

const DEMO_SESSIONS: SessionSummary[] = [
  {
    id: 'demo-session-1',
    title: 'Lateral term sheet clarification',
    turns: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-session-2',
    title: 'CTO candidate diligence',
    turns: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function SessionsView(): JSX.Element {
  const [rows, setRows] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const sessions = await getMySessions();
        setRows(sessions.length > 0 ? sessions : DEMO_SESSIONS);
      } catch {
        setRows(DEMO_SESSIONS);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <section className="max-w-[760px] mx-auto px-6 py-12">
      <h1 className="text-4xl italic text-ink">Sessions.</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill accent="seal">{rows.length} sessions</Pill>
      </div>
      <div className="mt-6 rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)]">
        {loading ? (
          <p className="px-5 py-6 text-sm text-ink3">Loading sessions...</p>
        ) : (
          rows.map((row) => (
            <article
              key={row.id}
              className="grid grid-cols-[70px_1fr_auto] items-center gap-3 border-b border-[var(--rule-soft)] px-4 py-3 last:border-b-0"
            >
              <HashSeal hash={row.id} />
              <div>
                <p className="italic text-ink">{row.title}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
                  updated {new Date(row.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <Pill>{row.turns} turns</Pill>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
