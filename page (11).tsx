'use client';

import { LoaderCircle, PawPrint } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { StarRatingInput } from '../../../components/StarRating';

type Check = 'checking' | 'valid' | 'invalid';
type SubmitStatus = 'idle' | 'sending' | 'sent' | 'error';

const invalidReasonText: Record<string, string> = {
  used: 'This review link has already been used. Thank you again for your feedback!',
  expired: 'This review link has expired. Please reach out to Jade for a new one.',
  not_found: "This review link isn't valid. Please check the link you were sent.",
  error: "We couldn't verify this link right now. Please try again shortly.",
};

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [check, setCheck] = useState<Check>('checking');
  const [invalidReason, setInvalidReason] = useState('error');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [photoName, setPhotoName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/review-tokens/${token}`)
      .then((response) => response.json() as Promise<{ valid: boolean; reason?: string }>)
      .then((data) => {
        if (cancelled) return;
        if (data.valid) {
          setCheck('valid');
        } else {
          setInvalidReason(data.reason || 'error');
          setCheck('invalid');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInvalidReason('error');
          setCheck('invalid');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    if (rating < 1) {
      setError('Please choose a star rating.');
      setStatus('error');
      return;
    }
    setStatus('sending');
    setError('');

    const formData = new FormData(event.currentTarget);
    formData.set('token', token);
    formData.set('rating', String(rating));
    formData.set('permission', formData.get('permission') === 'on' ? 'true' : 'false');

    try {
      const response = await fetch('/api/reviews/submit', { method: 'POST', body: formData });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to submit your review.');
      setStatus('sent');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to submit your review.');
      setStatus('error');
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 py-16">
      <div className="w-full max-w-xl">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-display text-2xl font-semibold text-brown">
          <span className="grid size-9 place-items-center rounded-full bg-sage text-cream">
            <PawPrint size={20} />
          </span>
          Jade &amp; Paws
        </Link>

        {check === 'checking' && (
          <div className="grid place-items-center rounded-[2rem] bg-white p-16 shadow-soft" role="status" aria-live="polite">
            <LoaderCircle className="size-8 animate-spin text-olive" />
            <p className="mt-4 text-sm text-brown/65">Checking your link…</p>
          </div>
        )}

        {check === 'invalid' && (
          <div className="rounded-[2rem] bg-white p-10 text-center shadow-soft" role="status">
            <h1 className="font-display text-3xl text-brown">Link no longer available</h1>
            <p className="mx-auto mt-3 max-w-md leading-7 text-brown/75">{invalidReasonText[invalidReason]}</p>
            <Link href="/" className="mt-6 inline-block rounded-full bg-brown px-6 py-3.5 font-semibold text-cream shadow-soft transition hover:bg-olive">
              Return to Home
            </Link>
          </div>
        )}

        {check === 'valid' && status === 'sent' && (
          <div className="rounded-[2rem] bg-white p-10 text-center shadow-soft" role="status">
            <p className="text-4xl">🤍</p>
            <h1 className="mt-4 font-display text-3xl text-brown">Thank you so much for your review!</h1>
            <p className="mx-auto mt-3 max-w-md leading-7 text-brown/75">
              Your feedback truly means the world to Jade &amp; Paws. Your review has been received and is currently awaiting approval.
            </p>
            <p className="mt-2 text-brown/75">Thank you for trusting me with your pet! 🐾</p>
            <Link href="/" className="mt-7 inline-block rounded-full bg-brown px-6 py-3.5 font-semibold text-cream shadow-soft transition hover:bg-olive">
              Return to Home
            </Link>
          </div>
        )}

        {check === 'valid' && status !== 'sent' && (
          <div className="rounded-[2rem] bg-white p-6 shadow-soft sm:p-10">
            <p className="mb-7 text-center leading-7 text-brown/75">
              Thank you for taking the time to share your experience! Your feedback helps other pet parents feel confident choosing Jade &amp; Paws. 🤍
            </p>

            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-brown">Your first name <span aria-hidden="true">*</span></span>
                  <input
                    name="firstName"
                    required
                    type="text"
                    autoComplete="given-name"
                    className="w-full rounded-xl border border-beige bg-cream/50 px-4 py-3 outline-none transition focus:border-olive focus:ring-2 focus:ring-sage/30"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-brown">Pet name</span>
                  <input
                    name="petName"
                    type="text"
                    className="w-full rounded-xl border border-beige bg-cream/50 px-4 py-3 outline-none transition focus:border-olive focus:ring-2 focus:ring-sage/30"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brown">Service used <span aria-hidden="true">*</span></span>
                <input
                  name="service"
                  required
                  type="text"
                  placeholder="e.g. 30 Minute Dog Walk"
                  className="w-full rounded-xl border border-beige bg-cream/50 px-4 py-3 outline-none transition focus:border-olive focus:ring-2 focus:ring-sage/30"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-brown">Rating <span aria-hidden="true">*</span></span>
                <StarRatingInput value={rating} onChange={setRating} size={30} />
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brown">Your review <span aria-hidden="true">*</span></span>
                <textarea
                  name="body"
                  required
                  rows={5}
                  className="w-full resize-y rounded-xl border border-beige bg-cream/50 px-4 py-3 outline-none transition focus:border-olive focus:ring-2 focus:ring-sage/30"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-brown">Pet photo (optional)</span>
                <input
                  ref={fileInputRef}
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setPhotoName(event.target.files?.[0]?.name || '')}
                  className="w-full cursor-pointer rounded-xl border border-dashed border-beige bg-cream/50 px-4 py-3 text-sm text-brown/70 outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-brown file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream focus:border-olive focus:ring-2 focus:ring-sage/30"
                />
                {photoName && <span className="mt-1.5 block text-xs text-brown/60">Selected: {photoName}</span>}
              </label>

              {/* Honeypot field — hidden from real visitors, real bots often fill every field they can find. */}
              <div className="hidden" aria-hidden="true">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <label className="flex gap-3 text-sm leading-6 text-brown">
                <input required name="permission" type="checkbox" className="mt-1 size-4 accent-brown" />
                I give Jade &amp; Paws permission to display my first name, my pet&apos;s name, and this review on the website.
              </label>

              {status === 'error' && (
                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
                  {error}
                </p>
              )}

              <button
                disabled={status === 'sending'}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brown px-6 py-4 font-semibold text-cream transition hover:bg-olive disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'sending' && <LoaderCircle className="size-5 animate-spin" />}
                {status === 'sending' ? 'Submitting your review…' : 'Submit review'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
