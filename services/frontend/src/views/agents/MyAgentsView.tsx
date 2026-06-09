import { HashSeal } from '@/components/primitives/HashSeal';
import { Pill } from '@/components/primitives/Pill';

const AGENTS = [
  { hash: 'ag-11a', name: 'Deal intake', status: 'LIVE', updated: 'today 09:10' },
  { hash: 'ag-22b', name: 'Risk framing', status: 'LIVE', updated: 'today 08:20' },
  { hash: 'ag-33c', name: 'Board prep', status: 'DRAFT', updated: 'yesterday 17:44' },
];

export function MyAgentsView(): JSX.Element {
  return (
    <section className="max-w-[760px] mx-auto px-6 py-12">
      <h1 className="text-4xl italic text-ink">My agents.</h1>
      <div className="mt-6 rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)]">
        {AGENTS.map((row) => (
          <article
            key={row.hash}
            className="grid grid-cols-[70px_1fr_auto] items-center gap-3 border-b border-[var(--rule-soft)] px-4 py-3 last:border-b-0"
          >
            <HashSeal hash={row.hash} />
            <div>
              <p className="italic text-ink">{row.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">{row.updated}</p>
            </div>
            <Pill accent={row.status === 'LIVE' ? 'seal' : 'default'}>{row.status}</Pill>
          </article>
        ))}
      </div>
    </section>
  );
}
