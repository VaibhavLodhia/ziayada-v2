import { Outlet } from 'react-router-dom';
import { InsightPanel } from '@/components/layout/InsightPanel';
import { NavSidebar } from '@/components/layout/NavSidebar';
import { TopBar } from '@/components/primitives/TopBar';
import { ThemeCorner } from '@/components/primitives/ThemeCorner';
import { useAppStore } from '@/state/store';

const LEFT_WIDTH = 260;
const RIGHT_WIDTH = 300;

export function Shell() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const rightPanelOpen = useAppStore((s) => s.rightPanelOpen);

  return (
    <div className="min-h-screen bg-ground text-ink">
      <NavSidebar open={sidebarOpen} />
      <InsightPanel open={rightPanelOpen} />
      <div
        className="flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out"
        style={{
          marginLeft: sidebarOpen ? LEFT_WIDTH : 0,
          marginRight: rightPanelOpen ? RIGHT_WIDTH : 0,
        }}
      >
        <TopBar />
        <main className="min-h-[calc(100vh-3.5rem)] flex-1">
          <Outlet />
        </main>
      </div>
      <ThemeCorner />
    </div>
  );
}
