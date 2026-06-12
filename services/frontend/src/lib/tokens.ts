export const tokens = {
  parchment: {
    ground: '#F4F0E6',
    ground2: '#ECE6D6',
    rule: '#DDD3BD',
    ruleSoft: '#E8E1CC',
    ink: '#0A0908',
    ink2: '#141210',
    ink3: '#3D3830',
    inkFaint: '#6B6457',
    seal: '#143753',
    sealGlow: '#E8E4D8',
    cardBg: '#FFFFFF',
    cardEdge: '#E8E1CC',
    cardInk: '#0A0908',
    cardInk2: '#1F1C18',
    cardInk3: '#4A453C',
    cardSendBg: '#0A0908',
    cardSendFg: '#FFFFFF',
  },
  obsidian: {
    ground: '#0E1513',
    ground2: '#131C19',
    rule: '#243029',
    ruleSoft: '#1E2925',
    ink: '#FAFCF9',
    ink2: '#DCE8E4',
    ink3: '#B4C8C0',
    inkFaint: '#8FA09A',
    seal: '#6BCFB8',
    sealGlow: '#143A35',
    cardBg: '#1A2521',
    cardEdge: '#2F3F38',
    cardInk: '#F5F8F6',
    cardInk2: '#DCE8E4',
    cardInk3: '#A8BDB5',
    cardSendBg: '#6BCFB8',
    cardSendFg: '#0E1513',
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
