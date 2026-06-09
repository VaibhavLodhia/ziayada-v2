import { shortHash } from '@/lib/hash';
import type { StateName, TrustTier } from '@/lib/tokens';

export type MockAssistantResponse = {
  state: StateName;
  confidence: number;
  auditHash: string;
  trustTier: TrustTier;
  body: string;
};

const STATE_CYCLE: StateName[] = ['NARROW', 'FLAG', 'EXPLORE'];

export function generateAssistantResponse(
  userText: string,
  userMessageCount: number,
): Promise<MockAssistantResponse> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const state = STATE_CYCLE[(userMessageCount - 1) % STATE_CYCLE.length];
      resolve({
        state,
        confidence: 60 + Math.floor(Math.random() * 31),
        auditHash: shortHash(),
        trustTier: 'PRIVATE',
        body: `I hear you on "${userText.trim()}". Tell me more about what outcome you want, or use **Record a decision** when you are ready to seal something in your ledger.`,
      });
    }, 600);
  });
}
