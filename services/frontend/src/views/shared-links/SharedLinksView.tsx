import { HashSeal } from '@/components/primitives/HashSeal';
import { Pill } from '@/components/primitives/Pill';

const LINKS = [
  { hash: 'sl-100a', recipient: 'm.chen@horizoncap.com', trust: 'PRIVATE', expiry: '2 days' },
  { hash: 'sl-200b', recipient: 'ops@meridian.io', trust: 'SHARED', expiry: '6 days' },
  { hash: 'sl-300c', recipient: 'd.okafor@horizoncap.com', trust: 'PRIVATE', expiry: '14 days' },
];

export function SharedLinksView(): JSX.Element {
  return (
    <section className="max-w-[760px] mx-auto px-6 py-12">
      <h1 className="text-4xl italic text-ink">Shared links.</h1>
      <div className="mt-6 rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)]">
        {LINKS.map((row) => (
          <article
            key={row.hash}
            className="grid grid-cols-[70px_1fr_auto_auto] items-center gap-3 border-b border-[var(--rule-soft)] px-4 py-3 last:border-b-0"
          >
            <HashSeal hash={row.hash} />
            <p className="text-sm text-ink2">{row.recipient}</p>
            <Pill>{row.trust}</Pill>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">{row.expiry}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
