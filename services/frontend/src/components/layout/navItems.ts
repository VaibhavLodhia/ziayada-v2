import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BookOpen,
  Bot,
  Compass,
  Database,
  Globe,
  LayoutDashboard,
  Link2,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge: string;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { to: '/chat', label: 'Chat', icon: MessageSquare, badge: 'PRIVATE' },
  { to: '/decide', label: 'Record decision', icon: BookOpen, badge: 'FOCUS' },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'OVERVIEW' },
  { to: '/decisions', label: 'Decisions', icon: BookOpen, badge: 'LEDGER' },
  { to: '/sessions', label: 'Sessions', icon: Database, badge: 'SESSIONS' },
  { to: '/captures', label: 'Captures', icon: Activity, badge: 'FLOW' },
  { to: '/outcomes', label: 'Outcomes', icon: Compass, badge: 'NEXT' },
  { to: '/agents', label: 'My agents', icon: Bot, badge: 'AI' },
  { to: '/agents/public', label: 'Public agents', icon: Globe, badge: 'PUBLIC' },
  { to: '/capture-flow', label: 'Capture flow', icon: Activity, badge: 'PIPE' },
  { to: '/shared-links', label: 'Shared links', icon: Link2, badge: 'LINKS' },
  { to: '/graph', label: 'Graph', icon: Activity, badge: 'MAP' },
  { to: '/shared', label: 'Shared view', icon: Globe, badge: 'SHARE' },
  { to: '/public', label: 'Public view', icon: Globe, badge: 'LIVE' },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, badge: 'ADMIN', adminOnly: true },
];
