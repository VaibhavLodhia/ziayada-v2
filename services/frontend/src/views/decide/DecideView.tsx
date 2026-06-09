import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassifyRow } from '@/components/primitives/ClassifyRow';
import { Field } from '@/components/primitives/Field';
import { Stamp } from '@/components/primitives/Stamp';
import type { StateName } from '@/lib/tokens';
import { chatStream, type ChatMessage } from '@/lib/api';
import { useAppStore } from '@/state/store';

const VERDICT: Record<StateName, string> = {
  RESPOND: 'Decided.',
  NARROW: 'Decided.',
  FLAG: 'Flagged.',
  DEFER: 'Parked.',
  EXPLORE: 'Opened.',
};

const WHY: Record<StateName, string> = {
  NARROW:
    'This is NARROW, not RESPOND, because three assumptions remain unverified. Returns when Astra confirms.',
  FLAG:
    'This is FLAG, not NARROW, because the signal you raised demands attention before any commitment. Routed to your diligence partner.',
  DEFER:
    'This is DEFER, not NARROW, because the conditions to decide have not arrived yet. Returns automatically when Q3 lands.',
  RESPOND:
    'This is RESPOND, because the assumptions held against prior cycle and nothing is open. Move now.',
  EXPLORE:
    'This is EXPLORE, because the question itself is still unsettled. Worth opening up the option space before narrowing.',
};

export function DecideView() {
  const navigate = useNavigate();
  const phase = useAppStore((s) => s.phase);
  const initial = useAppStore((s) => s.initial);
  const turn = useAppStore((s) => s.turn);
  const questions = useAppStore((s) => s.questions);
  const answers = useAppStore((s) => s.answers);
  const state = useAppStore((s) => s.state);
  const sealHash = useAppStore((s) => s.sealHash);
  const readingHash = useAppStore((s) => s.readingHash);
  const chatSessionId = useAppStore((s) => s.chatSessionId);
  const beginInterview = useAppStore((s) => s.beginInterview);
  const submitAnswer = useAppStore((s) => s.submitAnswer);
  const reset = useAppStore((s) => s.reset);
  const openReading = useAppStore((s) => s.openReading);

  const [decideInput, setDecideInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [streaming, setStreaming] = useState(false);

  const activeQuestion = questions[turn] ?? '';

  useEffect(() => {
    if (phase === 'reading' && readingHash) {
      navigate(`/decisions/${readingHash}`);
    }
  }, [navigate, phase, readingHash]);

  const startInterview = () => {
    const text = decideInput.trim();
    if (!text) return;
    beginInterview(text);
    setDecideInput('');
  };

  const submitTurn = async () => {
    const text = answerInput.trim();
    if (!text || streaming) return;
    setAnswerInput('');
    setStreaming(true);

    const messages: ChatMessage[] = [
      { role: 'user', content: initial },
      ...answers.flatMap((a, i) => [
        { role: 'assistant' as const, content: questions[i] ?? '' },
        { role: 'user' as const, content: a },
      ]),
      { role: 'user', content: text },
    ];

    try {
      await chatStream(messages, chatSessionId, () => undefined);
    } catch {
      // fall back to local interview flow
    } finally {
      submitAnswer(text);
      setStreaming(false);
    }
  };

  if (phase === 'home') {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[640px] flex-col justify-center px-6 py-12">
        <p className="text-center font-mono text-[10px] uppercase tracking-wide-3 text-ink3">
          Structured capture
        </p>
        <h1 className="mt-3 text-center font-display text-[clamp(1.75rem,4vw,2.75rem)] italic leading-tight tracking-tight text-ink">
          What decision are you weighing?
        </h1>
        <p className="mt-4 text-center text-sm text-ink2">
          Three focused questions, then a sealed state for your ledger. For casual back-and-forth, use{' '}
          <button
            type="button"
            className="text-seal underline-offset-2 hover:underline"
            onClick={() => navigate('/chat')}
          >
            Chat
          </button>
          .
        </p>
        <div className="mt-10 w-full">
          <Field
            value={decideInput}
            onChange={setDecideInput}
            onSubmit={startInterview}
            placeholder="A sentence about what you are weighing."
            voiceEnabled
            autoFocus
          />
        </div>
      </section>
    );
  }

  if (phase === 'question') {
    const prev = turn > 0 ? answers[turn - 1] : null;
    return (
      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[820px] flex-col justify-between px-6 py-8">
        <p className="pt-6 text-center font-mono text-[10px] uppercase tracking-wide-2 text-ink3">
          YOU SAID <span className="text-ink2">&quot;{initial}&quot;</span>
        </p>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {prev ? (
            <p className="mb-6 font-mono text-[10px] uppercase tracking-wide-2 text-ink3">
              YOU SAID{' '}
              <span className="font-body italic normal-case text-ink2">&quot;{prev}&quot;</span>
            </p>
          ) : null}
          <h2 className="max-w-[780px] font-display text-[clamp(1.75rem,4.5vw,3.1rem)] italic leading-snug tracking-tight text-ink">
            {activeQuestion}
          </h2>
          <div className="mt-9 w-full max-w-[640px]">
            <Field
              value={answerInput}
              onChange={setAnswerInput}
              onSubmit={() => void submitTurn()}
              placeholder="Your answer..."
              voiceEnabled
              disabled={streaming}
              autoFocus
            />
          </div>
        </div>
      </section>
    );
  }

  if (phase === 'sealed' && state && sealHash) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[780px] flex-col items-center justify-center px-6 py-12 text-center">
        <h2 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] italic text-ink">
          {VERDICT[state]}
        </h2>
        <Stamp state={state} hash={sealHash} className="mt-7" />
        <ClassifyRow chosen={state} className="mt-8 w-full max-w-[640px]" />
        <p className="mt-8 max-w-[560px] border-l-2 border-seal pl-4 text-left text-sm italic leading-relaxed text-ink2">
          {WHY[state]}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => openReading(sealHash)}
            className="rounded-pill border border-rule px-6 py-2.5 font-mono text-[10px] uppercase tracking-wide-2 text-ink2 hover:bg-ground2"
          >
            Read the record
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              navigate('/chat');
            }}
            className="rounded-pill bg-ink px-6 py-2.5 font-sans text-sm text-ground hover:bg-seal"
          >
            Back to chat
          </button>
        </div>
      </section>
    );
  }

  return null;
}
