import { Pill } from '@/components/primitives/Pill';

export function PublicView(): JSX.Element {
  return (
    <section className="max-w-[760px] mx-auto px-6 py-12">
      <h1 className="text-4xl italic text-ink">Public.</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill accent="seal">Phase 3</Pill>
        <Pill>Discovery stub</Pill>
      </div>
      <p className="mt-6 text-sm text-ink2">
        Public phase composes trust signals, discovery surfaces, and publishing controls for open agent ecosystems.
      </p>
    </section>
  );
}
