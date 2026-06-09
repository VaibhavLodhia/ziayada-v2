import { useNavigate } from 'react-router-dom';
import { DecisionRow } from '@/components/primitives/DecisionRow';
import { EmptyState } from '@/components/primitives/EmptyState';
import { Pill } from '@/components/primitives/Pill';
import { useAppStore } from '@/state/store';

export function DecisionsView(): JSX.Element {
  const navigate = useNavigate();
  const ledger = useAppStore((s) => s.ledger);

  return (
    <section className="max-w-[760px] mx-auto px-6 py-12">
      <h1 className="text-4xl italic text-ink">Decisions.</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill>{ledger.length} records</Pill>
        <Pill accent="seal">Audit trail</Pill>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)] px-4">
        {ledger.length === 0 ? (
          <EmptyState title="No records yet." ctaLabel="Record a decision" ctaTo="/decide" />
        ) : (
          ledger.map((entry) => (
            <DecisionRow
              key={entry.hash}
              title={entry.title}
              state={entry.full.state}
              hash={entry.hash}
              when={entry.when}
              onClick={() => navigate(`/decisions/${entry.hash}`)}
            />
          ))
        )}
      </div>
    </section>
  );
}
