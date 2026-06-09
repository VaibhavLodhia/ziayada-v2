import type { StateCreator } from 'zustand';
import { shortHash } from '@/lib/hash';

export type DecisionState = 'RESPOND' | 'NARROW' | 'FLAG' | 'DEFER' | 'EXPLORE';
export type InterviewPhase = 'home' | 'question' | 'sealed' | 'reading';

export type LedgerEntry = {
  hash: string;
  title: string;
  state: Lowercase<DecisionState>;
  when: string;
  dqs: string;
  full: {
    initial: string;
    questions: string[];
    answers: string[];
    state: DecisionState;
  };
};

export function composeQuestions(initial: string): string[] {
  const lower = initial.toLowerCase();
  if (lower.includes('lateral') || lower.includes('term sheet') || lower.includes('capital')) {
    return [
      'Is the Lateral preference your real concern, or the Astra rotation?',
      'Should you wait for Astra to verify, or move now?',
      'Three assumptions sit under that. Are you ready to commit?',
    ];
  }
  if (lower.includes('cto') || lower.includes('hire') || lower.includes('candidate')) {
    return [
      'Is the signal you heard disqualifying, or a question you want answered?',
      'Does Monday diligence committee need this resolved first?',
      'Ready to commit a state for this candidate?',
    ];
  }
  if (lower.includes('lease') || lower.includes('office') || lower.includes('riyadh')) {
    return [
      'What changed today that was not true last week?',
      'Does the Q3 headcount plan land before this window closes?',
      'Should this stay parked, or are you ready to commit?',
    ];
  }
  return [
    'What is most at stake in this for you?',
    'What would change your answer in the next week?',
    'Are you ready to commit, or does this need more time?',
  ];
}

export function classify(input: string): DecisionState {
  const lower = input.toLowerCase();
  if (lower.includes('cto') || lower.includes('candidate') || lower.includes('conflict')) return 'FLAG';
  if (lower.includes('lease') || lower.includes('park') || lower.includes('later')) return 'DEFER';
  if (lower.includes('sponsor') || lower.includes('approve') || lower.includes('confirm')) {
    return 'RESPOND';
  }
  if (lower.includes('explore') || lower.includes('option')) return 'EXPLORE';
  return 'NARROW';
}

const DEMO_LEDGER: LedgerEntry[] = [
  {
    hash: 'a7f3d2',
    title: 'Lateral Capital term sheet, due Friday.',
    state: 'narrow',
    when: '2 days ago',
    dqs: '0.78',
    full: {
      initial: 'Lateral Capital sent the term sheet this morning, 14M at 62M post.',
      questions: [
        'Is the Lateral preference your real concern, or the Astra rotation?',
        'Should you wait for Astra to verify, or move now?',
        'Three assumptions sit under that. Are you ready to commit?',
      ],
      answers: [
        'The Astra rotation. If Astra goes higher I lose negotiating leverage with Lateral.',
        'Wait for Astra. The Lateral window has slack.',
        'Yes, narrow on Astra confirmation first.',
      ],
      state: 'NARROW',
    },
  },
  {
    hash: 'b9e1c4',
    title: 'Reference signal on the CTO candidate.',
    state: 'flag',
    when: '5 days ago',
    dqs: '0.62',
    full: {
      initial: 'Backchannel says conflict of interest on the CTO candidate.',
      questions: [
        'Is the signal disqualifying, or a question you want answered?',
        'Does Monday diligence committee need this resolved first?',
        'Ready to commit a state for this candidate?',
      ],
      answers: [
        'A question, not disqualifying. But I want it answered.',
        'Yes, this has to be resolved before Monday.',
        'Flag it. Route to my diligence partner.',
      ],
      state: 'FLAG',
    },
  },
  {
    hash: 'c1d8a0',
    title: 'Riyadh office lease, 36-month term.',
    state: 'defer',
    when: '1 week ago',
    dqs: '0.71',
    full: {
      initial: 'Riyadh lease. 36 months, two months free.',
      questions: [
        'What changed today that was not true last week?',
        'Does the Q3 headcount plan land before this window closes?',
        'Should this stay parked, or are you ready to commit?',
      ],
      answers: [
        'Nothing material. Operations still has not landed Q3.',
        'They target July 1, which is after the lease window.',
        'Park it until Q3 lands.',
      ],
      state: 'DEFER',
    },
  },
  {
    hash: 'd4e2f7',
    title: 'Dubai conference sponsorship.',
    state: 'respond',
    when: '2 weeks ago',
    dqs: '0.88',
    full: {
      initial: 'Dubai conference sponsorship, aligned with brand budget.',
      questions: ['Have last cycle ROI assumptions held?', 'Ready to approve?'],
      answers: [
        'Yes, the math is within ten percent of prior cycle.',
        'Approve.',
      ],
      state: 'RESPOND',
    },
  },
];

export type InterviewSlice = {
  phase: InterviewPhase;
  initial: string;
  turn: number;
  questions: string[];
  answers: string[];
  sealHash: string | null;
  state: DecisionState | null;
  readingHash: string | null;
  ledger: LedgerEntry[];
  beginInterview: (initialSentence: string) => void;
  submitAnswer: (answer: string) => void;
  advance: () => void;
  seal: () => void;
  reset: () => void;
  openReading: (hash: string) => void;
};

export const createInterviewSlice: StateCreator<InterviewSlice, [], [], InterviewSlice> = (
  set,
  get,
) => ({
  phase: 'home',
  initial: '',
  turn: 0,
  questions: [],
  answers: [],
  sealHash: null,
  state: null,
  readingHash: null,
  ledger: DEMO_LEDGER,
  beginInterview: (initialSentence) => {
    set({
      initial: initialSentence,
      turn: 0,
      questions: composeQuestions(initialSentence),
      answers: [],
      sealHash: null,
      state: null,
      readingHash: null,
      phase: 'question',
    });
  },
  submitAnswer: (answer) => {
    const trimmed = answer.trim();
    if (!trimmed) return;
    set((state) => ({ answers: [...state.answers, trimmed] }));
    get().advance();
  },
  advance: () => {
    const { turn, questions } = get();
    const nextTurn = turn + 1;
    if (nextTurn >= questions.length) {
      get().seal();
      return;
    }
    set({ turn: nextTurn, phase: 'question' });
  },
  seal: () => {
    const current = get();
    const flattened = [current.initial, ...current.answers].join(' ');
    const nextState = classify(flattened);
    const hash = shortHash();
    const entry: LedgerEntry = {
      hash,
      title: current.initial.slice(0, 84) + (current.initial.length > 84 ? '...' : ''),
      state: nextState.toLowerCase() as Lowercase<DecisionState>,
      when: 'just now',
      dqs: '0.78',
      full: {
        initial: current.initial,
        questions: current.questions,
        answers: current.answers,
        state: nextState,
      },
    };
    set((state) => ({
      phase: 'sealed',
      state: nextState,
      sealHash: hash,
      readingHash: null,
      ledger: [entry, ...state.ledger],
    }));
  },
  reset: () => {
    set({
      phase: 'home',
      initial: '',
      turn: 0,
      questions: [],
      answers: [],
      sealHash: null,
      state: null,
      readingHash: null,
    });
  },
  openReading: (hash) => set({ phase: 'reading', readingHash: hash }),
});
