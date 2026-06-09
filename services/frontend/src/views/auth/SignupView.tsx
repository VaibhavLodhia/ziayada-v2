import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brand } from '@/components/primitives/Brand';
import { Field } from '@/components/primitives/Field';
import { ThemeCorner } from '@/components/primitives/ThemeCorner';
import { ApiError, signup } from '@/lib/api';
import { useAppStore } from '@/state/store';

export function SignupView() {
  const navigate = useNavigate();
  const setUser = useAppStore((s) => s.setUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const user = await signup({ name: name.trim(), email: email.trim(), password });
      setUser(user);
      navigate('/chat', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message || 'Please review the form.');
      else setError('Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ground px-6 text-ink">
      <ThemeCorner />
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col items-center justify-center py-12">
        <div className="w-full text-center">
          <Brand size="lg" className="justify-center" />
          <h1 className="mt-6 font-display text-3xl italic">Begin.</h1>
        </div>

        {error ? (
          <p className="mt-6 w-full text-center font-display italic text-seal">{error}</p>
        ) : null}

        <form onSubmit={(e) => void submit(e)} className="mt-8 w-full space-y-5">
          <Field
            value={name}
            onChange={setName}
            onSubmit={() => void submit()}
            placeholder="Your name"
            multiline={false}
            voiceEnabled={false}
            autoFocus
          />
          <Field
            value={email}
            onChange={setEmail}
            onSubmit={() => void submit()}
            placeholder="Your email"
            type="email"
            multiline={false}
            voiceEnabled={false}
          />
          <Field
            value={password}
            onChange={setPassword}
            onSubmit={() => void submit()}
            placeholder="Your password"
            type="password"
            multiline={false}
            voiceEnabled={false}
          />
          <button
            type="submit"
            disabled={submitting || !name.trim() || !email.trim() || !password}
            className="mt-2 w-full rounded-pill bg-ink py-3 font-sans text-sm text-ground transition-colors hover:bg-seal disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-10 font-mono text-[10px] uppercase tracking-wide-3 text-ink3">
          Already have access?{' '}
          <Link to="/login" className="text-seal hover:opacity-80">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
