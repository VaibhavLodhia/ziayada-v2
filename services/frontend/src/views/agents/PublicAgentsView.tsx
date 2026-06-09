import { PublicAgentCard } from './PublicAgentCard';
import { PUBLIC_AGENTS } from './publicAgentsData';

export function PublicAgentsView() {
  return (
    <section className="mx-auto max-w-[920px] px-6 py-12">
      <header className="max-w-[640px]">
        <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] italic leading-tight text-ink">
          Public agents
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink2">
          Curated, governed agents from trusted principals and institutions. Available later.
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {PUBLIC_AGENTS.map((agent) => (
          <PublicAgentCard key={agent.id} {...agent} />
        ))}
      </div>
    </section>
  );
}
