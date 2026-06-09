import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from '@/shell/Shell';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { AdminGuard } from '@/components/guards/AdminGuard';
import { LoadingScreen } from '@/components/primitives/LoadingScreen';
import { ChatView } from '@/views/chat/ChatView';
import { DecideView } from '@/views/decide/DecideView';
import { HomeView } from '@/views/home/HomeView';
import { LoginView } from '@/views/auth/LoginView';
import { SignupView } from '@/views/auth/SignupView';
import { DashboardView } from '@/views/dashboard/DashboardView';
import { DecisionsView } from '@/views/decisions/DecisionsView';
import { DecisionDetailView } from '@/views/decisions/DecisionDetailView';
import { SessionsView } from '@/views/sessions/SessionsView';
import { CapturesView } from '@/views/captures/CapturesView';
import { OutcomesView } from '@/views/outcomes/OutcomesView';
import { MyAgentsView } from '@/views/agents/MyAgentsView';
import { PublicAgentsView } from '@/views/agents/PublicAgentsView';
import { CaptureFlowView } from '@/views/capture-flow/CaptureFlowView';
import { SharedLinksView } from '@/views/shared-links/SharedLinksView';
import { GraphView } from '@/views/graph/GraphView';
import { AdminView } from '@/views/admin/AdminView';
import { SharedView } from '@/views/shared/SharedView';
import { PublicView } from '@/views/public/PublicView';
import { useAppStore } from '@/state/store';

export function App() {
  const hydrate = useAppStore((s) => s.hydrate);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ziyada-theme') || 'parchment';
    document.documentElement.setAttribute('data-theme', saved);
    void hydrate();
    const t = setTimeout(() => setBooting(false), 1000);
    return () => clearTimeout(t);
  }, [hydrate]);

  if (booting) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route path="/signup" element={<SignupView />} />
      <Route element={<AuthGuard />}>
        <Route path="/" element={<Shell />}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<ChatView />} />
          <Route path="decide" element={<DecideView />} />
          <Route path="home" element={<HomeView />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="decisions" element={<DecisionsView />} />
          <Route path="decisions/:hash" element={<DecisionDetailView />} />
          <Route path="sessions" element={<SessionsView />} />
          <Route path="captures" element={<CapturesView />} />
          <Route path="outcomes" element={<OutcomesView />} />
          <Route path="agents" element={<MyAgentsView />} />
          <Route path="agents/public" element={<PublicAgentsView />} />
          <Route path="capture-flow" element={<CaptureFlowView />} />
          <Route path="shared-links" element={<SharedLinksView />} />
          <Route path="graph" element={<GraphView />} />
          <Route path="shared" element={<SharedView />} />
          <Route path="public" element={<PublicView />} />
          <Route element={<AdminGuard />}>
            <Route path="admin" element={<AdminView />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
