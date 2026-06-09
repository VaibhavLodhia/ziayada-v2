import { useState, type FormEvent } from 'react';
import { Pill } from '@/components/primitives/Pill';

type OutcomeDraft = {
  decisionHash: string;
  result: string;
  confidence: string;
  notes: string;
};

export function OutcomesView(): JSX.Element {
  const [form, setForm] = useState<OutcomeDraft>({
    decisionHash: '',
    result: '',
    confidence: 'medium',
    notes: '',
  });

  const registerOutcome = (event: FormEvent) => {
    event.preventDefault();
    console.log('registerOutcome', form);
  };

  return (
    <section className="mx-auto w-full max-w-[980px] px-6 py-12">
      <h1 className="text-4xl italic text-ink">Outcomes.</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill accent="seal">Register outcome</Pill>
        <Pill>Form stub</Pill>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">Pending checks</p>
          <ul className="mt-3 space-y-2 text-sm text-ink2">
            <li>Review FLAG outcomes every 7 days.</li>
            <li>Track whether DEFER records became active.</li>
            <li>Confirm NARROW records stayed focused.</li>
          </ul>
        </div>

        <form onSubmit={registerOutcome} className="rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">Register outcome</p>
          <div className="mt-3 space-y-3">
            <input
              value={form.decisionHash}
              onChange={(event) => setForm((prev) => ({ ...prev, decisionHash: event.target.value }))}
              placeholder="Decision hash"
              className="w-full rounded-lg border border-[var(--rule-soft)] px-3 py-2 text-sm"
            />
            <input
              value={form.result}
              onChange={(event) => setForm((prev) => ({ ...prev, result: event.target.value }))}
              placeholder="Outcome result"
              className="w-full rounded-lg border border-[var(--rule-soft)] px-3 py-2 text-sm"
            />
            <select
              value={form.confidence}
              onChange={(event) => setForm((prev) => ({ ...prev, confidence: event.target.value }))}
              className="w-full rounded-lg border border-[var(--rule-soft)] px-3 py-2 text-sm"
            >
              <option value="low">Low confidence</option>
              <option value="medium">Medium confidence</option>
              <option value="high">High confidence</option>
            </select>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Notes"
              rows={4}
              className="w-full rounded-lg border border-[var(--rule-soft)] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-full bg-ink-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white"
            >
              Register outcome
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
