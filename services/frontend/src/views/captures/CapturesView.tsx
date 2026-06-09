import { HashSeal } from '@/components/primitives/HashSeal';
import { Pill } from '@/components/primitives/Pill';

const CAPTURE_ROWS = [
  { id: 'ca-101a', title: 'Meridian covenant clause revision', captured: 'today 10:21', label: 'memo' },
  { id: 'ca-202b', title: 'Voice note from diligence call', captured: 'yesterday 18:42', label: 'audio' },
  { id: 'ca-303c', title: 'Draft board remark on runway', captured: '2 days ago', label: 'text' },
];

export function CapturesView(): JSX.Element {
  return (
    <section className="max-w-[760px] mx-auto px-6 py-12">
      <h1 className="text-4xl italic text-ink">Captures.</h1>
      <div className="mt-6 rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)]">
        {CAPTURE_ROWS.map((row) => (
          <article
            key={row.id}
            className="grid grid-cols-[70px_1fr_auto] items-center gap-3 border-b border-[var(--rule-soft)] px-4 py-3 last:border-b-0"
          >
            <HashSeal hash={row.id} />
            <div>
              <p className="italic text-ink">{row.title}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">{row.captured}</p>
            </div>
            <Pill>{row.label}</Pill>
          </article>
        ))}
      </div>
    </section>
  );
}
