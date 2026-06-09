import { Link } from 'react-router-dom';
import { HashSeal } from '@/components/primitives/HashSeal';
import { StatePill } from '@/components/primitives/StatePill';
import { useAppStore } from '@/state/store';

export function HomeView() {
  const user = useAppStore((s) => s.user);
  const ledger = useAppStore((s) => s.ledger);
  const openReading = useAppStore((s) => s.openReading);
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const recent = ledger.slice(0, 3);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[920px] flex-col px-6 py-12">
      <div className="text-center">
        <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] italic leading-tight text-ink">
          Welcome back, {firstName}
        </h1>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wide-3 text-ink3">
          Same design language from private chat to public agents
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <Link
          to="/chat"
          className="group rounded-lg border border-rule bg-ground2/40 p-6 transition-colors hover:border-seal hover:bg-sealGlow"
        >
          <p className="font-mono text-[10px] uppercase tracking-wide-2 text-seal">Private</p>
          <h2 className="mt-2 font-display text-xl italic text-ink">Chat</h2>
          <p className="mt-2 text-sm text-ink2">
            Open conversation with voice. Your default workspace.
          </p>
        </Link>
        <Link
          to="/decide"
          className="group rounded-lg border border-rule bg-ground2/40 p-6 transition-colors hover:border-seal hover:bg-sealGlow"
        >
          <p className="font-mono text-[10px] uppercase tracking-wide-2 text-seal">Focus</p>
          <h2 className="mt-2 font-display text-xl italic text-ink">Record a decision</h2>
          <p className="mt-2 text-sm text-ink2">
            Calm, notebook-style interview when you are ready to seal something.
          </p>
        </Link>
        <Link
          to="/dashboard"
          className="group rounded-lg border border-rule bg-ground2/40 p-6 transition-colors hover:border-seal hover:bg-sealGlow"
        >
          <p className="font-mono text-[10px] uppercase tracking-wide-2 text-seal">Overview</p>
          <h2 className="mt-2 font-display text-xl italic text-ink">Dashboard</h2>
          <p className="mt-2 text-sm text-ink2">
            Agents, captures, and signals in one place as you move toward shared and public.
          </p>
        </Link>
      </div>

      {recent.length > 0 ? (
        <div className="mt-16 border-t border-ruleSoft pt-6">
          <p className="font-mono text-[10px] uppercase tracking-wide-3 text-inkFaint">Recent decisions</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {recent.map((entry) => (
              <button
                key={entry.hash}
                type="button"
                className="inline-flex items-center gap-2 rounded-pill border border-rule px-2.5 py-1 hover:border-seal hover:bg-ground2"
                onClick={() => openReading(entry.hash)}
              >
                <HashSeal hash={entry.hash} />
                <StatePill state={entry.full.state} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
