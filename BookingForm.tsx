'use client';

import { LoaderCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';

const fields = [
  ['ownerName', 'Your name', 'text', true], ['email', 'Email address', 'email', true], ['phone', 'Phone number', 'tel', true],
  ['petNames', 'Pet name(s)', 'text', true], ['service', 'Service requested', 'text', true], ['dates', 'Requested dates', 'text', true],
] as const;

export function BookingForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending'); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch('/api/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to send your request.');
      setStatus('sent');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to send your request.');
      setStatus('error');
    }
  }
  if (status === 'sent') return <div className="rounded-[2rem] bg-white p-10 text-center shadow-soft" role="status"><h3 className="font-display text-3xl text-brown">Thank you!</h3><p className="mx-auto mt-3 max-w-md leading-7 text-brown/75">Your booking request has been received. I&apos;ll get back to you as soon as possible.</p></div>;
  return <form onSubmit={submit} className="rounded-[2rem] bg-white p-6 shadow-soft sm:p-10" noValidate><div className="grid gap-5 sm:grid-cols-2">{fields.map(([name, label, type, required]) => <label key={name}><span className="mb-1.5 block text-sm font-medium text-brown">{label} <span aria-hidden="true">*</span></span><input name={name} required={required} type={type} autoComplete={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'on'} className="w-full rounded-xl border border-beige bg-cream/50 px-4 py-3 outline-none transition focus:border-olive focus:ring-2 focus:ring-sage/30" /></label>)}<label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium text-brown">Additional notes</span><textarea name="notes" rows={4} className="w-full resize-y rounded-xl border border-beige bg-cream/50 px-4 py-3 outline-none transition focus:border-olive focus:ring-2 focus:ring-sage/30" /></label><div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div></div><label className="mt-6 flex gap-3 text-sm leading-6 text-brown"><input required name="depositAcknowledged" type="checkbox" className="mt-1 size-4 accent-brown"/>I understand bookings require a deposit.</label>{status === 'error' && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}<button disabled={status === 'sending'} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brown px-6 py-4 font-semibold text-cream transition hover:bg-olive disabled:cursor-not-allowed disabled:opacity-70">{status === 'sending' && <LoaderCircle className="size-5 animate-spin"/>}{status === 'sending' ? 'Sending your request…' : 'Send booking request'}</button></form>;
}
