import { Link } from 'react-router-dom';
import { cn } from '@/lib/classNames';
import type { StateName } from '@/lib/tokens';
import { PulseDot } from '@/components/primitives/PulseDot';
import { StatePill } from '@/components/primitives/StatePill';
import { useAppStore } from '@/state/store';
import { SIGNAL_READINGS } from './insightData';

const PANEL_WIDTH = 300;

type InsightPanelProps = {
  open: boolean;
};

function toStateName(state: string): StateName {
  return state.toUpperCase() as StateName;
}

export function insightPanelWidth(open: boolean): number {
  return open ? PANEL_WIDTH : 0;
}

function SignalRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1 font-sans text-[11px] text-ink2">{label}</span>
      <span className="h-[3px] w-12 overflow-hidden rounded-full bg-ground2">
        <span
          className="block h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </span>
      <span className="w-6 text-right font-mono text-[10px] text-ink3">{value}</span>
    </div>
  );
}

export function InsightPanel({ open }: InsightPanelProps) {
  const ledger = useAppStore((s) => s.ledger);
  const streaming = useAppStore((s) => s.streaming);
  const openReading = useAppStore((s) => s.openReading);
  const setRightPanelOpen = useAppStore((s) => s.setRightPanelOpen);
  const recent = ledger.slice(0, 3);

  const close = () => setRightPanelOpen(false);

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        'fixed right-0 top-0 z-30 flex h-full w-[300px] flex-col border-l border-rule bg-ground/98 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.12)] backdrop-blur transition-[transform] duration-300 ease-in-out',
        open ? 'translate-x-0' : 'translate-x-full pointer-events-none',
      )}
    >
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-[3.75rem]">
        <div className="space-y-4">
          <section className="rounded-xl border border-rule bg-elevated p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wide-2 text-ink3">
                Recent decisions
              </span>
              <Link
                to="/decisions"
                onClick={close}
                className="font-mono text-[9px] uppercase tracking-wide-1 text-seal hover:underline"
              >
                All →
              </Link>
            </div>
            <div className="space-y-3">
              {recent.map((entry) => (
                <button
                  key={entry.hash}
                  type="button"
                  onClick={() => {
                    openReading(entry.hash);
                    close();
                  }}
                  className="flex w-full items-start gap-2.5 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-ground2"
                >
                  <StatePill state={toStateName(entry.state)} className="mt-0.5 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-xs font-medium leading-snug text-ink">{entry.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-ink3">{entry.when}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-rule bg-elevated p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wide-2 text-ink3">
                Signal readings
              </span>
              <span className="inline-flex items-center gap-1.5 font-sans text-[10px] font-medium text-seal">
                <span className="h-1.5 w-1.5 animate-[ziayada-pulse_1.4s_ease-in-out_infinite] rounded-full bg-seal" />
                Live
              </span>
            </div>
            <div className="space-y-0.5">
              {SIGNAL_READINGS.map((signal) => (
                <SignalRow key={signal.id} {...signal} />
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-rule bg-sealGlow/40 p-4">
            <span className="font-mono text-[10px] uppercase tracking-wide-2 text-ink3">Mediation</span>
            <div className="mt-3 flex gap-2.5">
              {streaming ? (
                <PulseDot size="sm" label="Mediating" />
              ) : (
                <>
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-seal shadow-[0_0_8px_var(--color-seal)]" />
                  <div>
                    <p className="font-mono text-[10px] font-medium uppercase tracking-wide-1 text-seal">
                      Narrow · Active
                    </p>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-ink2">
                      High-stakes context. Narrowing to structured due-diligence before commitment.
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}
