import { Link, useParams } from 'react-router-dom';
import { ClassifyRow } from '@/components/primitives/ClassifyRow';
import { HashSeal } from '@/components/primitives/HashSeal';
import { Pill } from '@/components/primitives/Pill';
import { Stamp } from '@/components/primitives/Stamp';
import { useAppStore } from '@/state/store';

function assumptionLines(initial: string): string[] {
  return [
    `Scope: ${initial.slice(0, 64)}${initial.length > 64 ? '...' : ''}`,
    'Constraint: timeline and confidence can shift this state.',
    'Review: re-open if a material fact changes.',
  ];
}

export function DecisionDetailView(): JSX.Element {
  const { hash = '' } = useParams();
  const ledger = useAppStore((s) => s.ledger);
  const record = ledger.find((entry) => entry.hash === hash);

  if (!record) {
    return (
      <section className="max-w-[760px] mx-auto px-6 py-12">
        <h1 className="text-3xl italic text-ink">Decision not found.</h1>
        <Link to="/decisions" className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--seal)]">
          Back to decisions
        </Link>
      </section>
    );
  }

  const assumptions = assumptionLines(record.full.initial);

  return (
    <section className="max-w-[760px] mx-auto px-6 py-12">
      <div className="rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <HashSeal hash={record.hash} />
          <Pill accent="seal">Reading</Pill>
        </div>

        <h1 className="mt-4 text-3xl italic text-ink">{record.title}</h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">{record.when}</p>

        <div className="mt-6 border-y border-[var(--rule-soft)] py-4">
          <ClassifyRow chosen={record.full.state} />
        </div>

        <div className="mt-6 space-y-4">
          <article className="rounded-xl border border-[var(--rule-soft)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">Initial statement</p>
            <p className="mt-2 text-ink2">{record.full.initial}</p>
          </article>
          {record.full.questions.map((question, index) => (
            <article key={`${record.hash}-${index}`} className="rounded-xl border border-[var(--rule-soft)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">Q{index + 1}</p>
              <p className="mt-1 italic text-ink">{question}</p>
              <p className="mt-2 text-ink2">{record.full.answers[index] ?? 'No answer captured.'}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-[var(--rule-soft)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">Audit chain</p>
          <ul className="mt-2 space-y-1 text-sm text-ink2">
            <li>hash {record.hash.slice(0, 6)} sealed</li>
            <li>decision state {record.full.state}</li>
            <li>ledger score {record.dqs}</li>
          </ul>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--rule-soft)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">Assumptions</p>
          <ul className="mt-2 space-y-1 text-sm text-ink2">
            {assumptions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex justify-end">
          <Stamp state={record.full.state} hash={record.hash} />
        </div>
      </div>
    </section>
  );
}
