export const tokens = {
  parchment: {
    ground: '#F4F0E6',
    ground2: '#ECE6D6',
    rule: '#DDD3BD',
    ruleSoft: '#E8E1CC',
    ink: '#0A0908',
    ink2: '#1F1C18',
    ink3: '#4A453C',
    inkFaint: '#7A7264',
    seal: '#143753',
    sealGlow: '#E8E4D8',
    dimScrim: '#C9BFA3',
    cardBg: '#FFFFFF',
    cardEdge: '#E8E1CC',
    cardInk: '#0A0908',
    cardInk2: '#2D2B27',
    cardInk3: '#524C42',
  },
  obsidian: {
    ground: '#0E1513',
    ground2: '#131C19',
    rule: '#243029',
    ruleSoft: '#1E2925',
    ink: '#F5F8F6',
    ink2: '#C8D4CF',
    ink3: '#9FB3AB',
    inkFaint: '#6F8079',
    seal: '#6BCFB8',
    sealGlow: '#143A35',
    dimScrim: '#1A1815',
    cardBg: '#FFFFFF',
    cardEdge: '#D4CFC0',
    cardInk: '#0A0908',
    cardInk2: '#1F1C18',
    cardInk3: '#4A453C',
  },
  emerald: {
    light: '#10B981',
    dark: '#34D399',
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
