'use client';

import { LoaderCircle, PawPrint } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError('');

    const password = new FormData(event.currentTarget).get('password');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error || 'Unable to sign in.');
      }
      router.push(searchParams.get('from') || '/admin/reviews');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to sign in.');
      setStatus('error');
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-soft sm:p-10">
        <div className="mx-auto mb-6 grid size-12 place-items-center rounded-full bg-sage text-cream">
          <PawPrint size={22} />
        </div>
        <h1 className="text-center font-display text-3xl text-brown">Admin sign in</h1>
        <p className="mt-2 text-center text-sm text-brown/65">Jade &amp; Paws review dashboard</p>
        <form onSubmit={submit} className="mt-8" noValidate>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-brown">Password</span>
            <input
              name="password"
              type="password"
              required
              autoFocus
              className="w-full rounded-xl border border-beige bg-cream/50 px-4 py-3 outline-none transition focus:border-olive focus:ring-2 focus:ring-sage/30"
            />
          </label>
          {status === 'error' && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}
          <button
            disabled={status === 'sending'}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brown px-6 py-4 font-semibold text-cream transition hover:bg-olive disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'sending' && <LoaderCircle className="size-5 animate-spin" />}
            {status === 'sending' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
