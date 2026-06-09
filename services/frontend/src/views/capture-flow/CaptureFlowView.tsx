import { useState } from 'react';
import { Field } from '@/components/primitives/Field';
import { Pill } from '@/components/primitives/Pill';

const STEPS = ['Source', 'Input', 'Intent', 'Extract', 'Structure'] as const;

export function CaptureFlowView(): JSX.Element {
  const [step, setStep] = useState(0);
  const [value, setValue] = useState('');

  return (
    <section className="mx-auto w-full max-w-[860px] px-6 py-12">
      <h1 className="text-4xl italic text-ink">Capture flow.</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <Pill key={label} accent={index === step ? 'seal' : 'default'}>
            {index + 1}. {label}
          </Pill>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)] p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink3">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="mt-2 text-2xl italic text-ink">{STEPS[step]}</h2>
        <div className="mt-4">
          <Field
            value={value}
            onChange={setValue}
            onSubmit={() => setStep((prev) => Math.min(prev + 1, STEPS.length - 1))}
            placeholder="Capture or refine this step."
            voiceEnabled={false}
          />
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            disabled={step === 0}
            className="rounded-full border border-[var(--rule)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep((prev) => Math.min(prev + 1, STEPS.length - 1))}
            className="rounded-full bg-ink-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
