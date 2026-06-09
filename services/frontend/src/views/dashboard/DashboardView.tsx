import { DecisionRow } from '@/components/primitives/DecisionRow';
import { Pill } from '@/components/primitives/Pill';
import { useAppStore } from '@/state/store';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function DashboardView(): JSX.Element {
  const ledger = useAppStore((s) => s.ledger);
  const priority = ledger.slice(0, 3);

  return (
    <section className="max-w-[760px] mx-auto px-6 py-12">
      <h1 className="text-4xl italic text-ink">Today.</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill accent="seal">{priority.length} priority records</Pill>
        <Pill>{Math.max(ledger.length, 1)} decisions in memory</Pill>
        <Pill>1 outcome check due</Pill>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)] px-4">
        {priority.map((entry) => (
          <DecisionRow
            key={entry.hash}
            title={entry.title}
            hash={entry.hash}
            state={entry.full.state}
            when={entry.when}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">Week strip</p>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {WEEK_DAYS.map((day, index) => (
              <div key={day} className="rounded-lg border border-[var(--rule-soft)] p-2 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">{day}</p>
                <p className="mt-1 text-xl italic text-ink">{index + 9}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">Intelligence notes</p>
          <p className="mt-3 text-sm italic text-ink2">
            Two records sealed as NARROW this week. Push one into outcomes before Friday review.
          </p>
          <p className="mt-3 text-sm italic text-ink2">
            FLAG decisions continue to cluster around people decisions. Consider a targeted diligence template.
          </p>
        </div>
      </div>
    </section>
  );
}
