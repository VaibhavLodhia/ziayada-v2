export const tokens = {
  parchment: {
    ground: '#F2F6F4',
    ground2: '#ECF1EE',
    rule: '#DDE4E0',
    ruleSoft: '#E8EDEA',
    ink: '#14211D',
    ink2: '#5C6A65',
    ink3: '#8FA09A',
    inkFaint: '#B8C4BF',
    seal: '#0F4C46',
    sealGlow: '#E0EDEB',
  },
  obsidian: {
    ground: '#0E1513',
    ground2: '#131C19',
    rule: '#243029',
    ruleSoft: '#1E2925',
    ink: '#ECF1EE',
    ink2: '#8FA09A',
    ink3: '#6F8079',
    inkFaint: '#4A5854',
    seal: '#6BCFB8',
    sealGlow: '#143A35',
  },
} as const;

export type StateName = 'RESPOND' | 'NARROW' | 'FLAG' | 'DEFER' | 'EXPLORE';
export type TrustTier = 'PRIVATE' | 'SHARED' | 'PUBLIC';

export const STATE_ORDER: StateName[] = ['RESPOND', 'NARROW', 'FLAG', 'DEFER', 'EXPLORE'];
export const STATE_CAPTION: Record<StateName, string> = {
  RESPOND: 'act now',
  NARROW: 'focus in',
  FLAG: 'raise concern',
  DEFER: 'park for later',
  EXPLORE: 'open up',
};
