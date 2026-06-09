import { Pill } from '@/components/primitives/Pill';

export function SharedView(): JSX.Element {
  return (
    <section className="max-w-[760px] mx-auto px-6 py-12">
      <h1 className="text-4xl italic text-ink">Shared.</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill accent="seal">Phase 2</Pill>
        <Pill>Collaboration stub</Pill>
      </div>
      <p className="mt-6 text-sm text-ink2">
        Shared phase introduces multi-identity presence, contribution attribution, and permission-aware decision review.
      </p>
    </section>
  );
}
