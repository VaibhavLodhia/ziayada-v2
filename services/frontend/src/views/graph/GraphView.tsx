import { useEffect, useMemo, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Pill } from '@/components/primitives/Pill';
import { getMyGraph, type GraphResponse } from '@/lib/api';
import { useAppStore } from '@/state/store';

const KIND_COLOR: Record<string, string> = {
  Person: '#1D9E75',
  Decision: '#143753',
  System: '#4A90B8',
  Organization: '#E89B3C',
  Topic: '#6B7B8C',
};

export function GraphView(): JSX.Element {
  const chatSessionId = useAppStore((s) => s.chatSessionId);
  const [data, setData] = useState<GraphResponse>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await getMyGraph(chatSessionId ?? undefined);
        setData(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load graph.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [chatSessionId]);

  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.edges.map((e) => ({ ...e })),
    }),
    [data],
  );

  return (
    <section className="mx-auto w-full max-w-[980px] px-6 py-12">
      <h1 className="text-4xl italic text-ink">Graph.</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill>{data.nodes.length} nodes</Pill>
        <Pill>{data.edges.length} edges</Pill>
      </div>
      {error ? <p className="mt-3 text-sm text-ink3">{error}</p> : null}
      <div className="mt-6 h-[560px] overflow-hidden rounded-2xl border border-[var(--rule-soft)] bg-[var(--ground)]">
        {loading ? (
          <div className="grid h-full place-items-center text-sm text-ink3">Loading graph...</div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel={(node) => `${(node as { kind: string }).kind}: ${(node as { name: string }).name}`}
            nodeColor={(node) => KIND_COLOR[(node as { kind: string }).kind] ?? '#8F887D'}
            linkColor={() => '#D5CCBE'}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
          />
        )}
      </div>
    </section>
  );
}
