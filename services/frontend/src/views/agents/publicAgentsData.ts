import type { LucideIcon } from 'lucide-react';
import { BarChart2, DollarSign } from 'lucide-react';

export type PublicAgentItem = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  principal: string;
  hash: string;
};

export const PUBLIC_AGENTS: PublicAgentItem[] = [
  {
    id: 'sec-filings',
    icon: DollarSign,
    title: 'SEC filings analyst',
    description:
      'Reads 10-K and 10-Q filings, surfaces governance and disclosure anomalies.',
    principal: 'Madison Capital Partners',
    hash: 'm2a3b1',
  },
  {
    id: 'mena-comps',
    icon: BarChart2,
    title: 'MENA comparable transactions',
    description:
      'Tracks regional M&A activity, generates comparable valuation bands.',
    principal: 'Gulf Markets Research',
    hash: 'gm9c4f',
  },
];
