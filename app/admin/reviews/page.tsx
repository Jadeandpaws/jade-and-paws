'use client';

import { Check, Copy, LoaderCircle, Pencil, PawPrint, Search, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { StarRating, StarRatingInput } from '../../../components/StarRating';
import type { AdminReview, AdminToken } from '../../../lib/reviews';

type ReviewFilter = 'all' | 'pending' | 'approved' | 'featured';
type LinkFilter = 'all' | 'unused' | 'used' | 'expired';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const tokenStatusStyles: Record<AdminToken['status'], string> = {
  unused: 'bg-sage/20 text-brown',
  used: 'bg-beige text-brown/70',
  expired: 'bg-red-50 text-red-700',
};

const tokenStatusLabel: Record<AdminToken['status'], string> = {
  unused: 'Unused',
  used: 'Used',
  expired: 'Expired',
};

function EditReviewForm({
  review,
  onCancel,
  onSave,
}: {
  review: AdminReview;
  onCancel: () => void;
  onSave: (fields: { firstName: string; petName: string | null; service: string; rating: number; body: string }) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(review.firstName);
  const [petName, setPetName] = useState(review.petName ?? '');
  const [service, setService] = useState(review.service);
  const [rating, setRating] = useState(review.rating);
  const [body, setBody] = useState(review.body);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    await onSave({ firstName, petName: petName || null, service, rating, body });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-brown">First name</span>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full rounded-lg border border-beige px-3 py-2 outline-none focus:border-olive focus:ring-2 focus:ring-sage/30" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-brown">Pet name</span>
          <input value={petName} onChange={(e) => setPetName(e.target.value)} className="w-full rounded-lg border border-beige px-3 py-2 outline-none focus:border-olive focus:ring-2 focus:ring-sage/30" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-brown">Service</span>
        <input value={service} onChange={(e) => setService(e.target.value)} required className="w-full rounded-lg border border-beige px-3 py-2 outline-none focus:border-olive focus:ring-2 focus:ring-sage/30" />
      </label>
      <div>
        <span className="mb-1 block text-sm font-medium text-brown">Rating</span>
        <StarRatingInput value={rating} onChange={setRating} size={20} />
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-brown">Review</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} className="w-full resize-y rounded-lg border border-beige px-3 py-2 outline-none focus:border-olive focus:ring-2 focus:ring-sage/30" />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-full bg-brown px-4 py-2 text-sm font-semibold text-cream transition hover:bg-olive disabled:opacity-70">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-brown/20 px-4 py-2 text-sm font-semibold text-brown transition hover:bg-beige">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ReviewRow({
  review,
  highlighted,
  onApprove,
  onToggleFeatured,
  onDelete,
  onSaveEdit,
}: {
  review: AdminReview;
  highlighted: boolean;
  onApprove: (id: number) => void;
  onToggleFeatured: (id: number, next: boolean) => void;
  onDelete: (id: number) => void;
  onSaveEdit: (id: number, fields: { firstName: string; petName: string | null; service: string; rating: number; body: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div
      id={`review-${review.id}`}
      className={`rounded-3xl border p-6 transition ${highlighted ? 'border-olive ring-2 ring-sage/40' : 'border-beige'} bg-white`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage/25">
            <PawPrint className="size-5 text-brown" strokeWidth={1.5} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StarRating rating={review.rating} size={14} />
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${review.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-sage/20 text-brown'}`}>
                {review.status === 'pending' ? 'Pending' : 'Approved'}
              </span>
              {review.featured && <span className="rounded-full bg-brown px-2.5 py-0.5 text-xs font-semibold text-cream">Featured</span>}
            </div>
            <p className="mt-1 font-display text-lg text-brown">
              {review.firstName}
              {review.petName ? ` & ${review.petName}` : ''}
            </p>
            <p className="text-xs uppercase tracking-wide text-brown/55">{review.service}</p>
          </div>
        </div>
        <div className="text-right text-xs text-brown/55">
          <p>Submitted {formatDate(review.createdAt)}</p>
          <p>Approved {formatDate(review.approvedAt)}</p>
        </div>
      </div>

      {editing ? (
        <div className="mt-4">
          <EditReviewForm
            review={review}
            onCancel={() => setEditing(false)}
            onSave={async (fields) => {
              await onSaveEdit(review.id, fields);
              setEditing(false);
            }}
          />
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm leading-6 text-brown/75">&ldquo;{review.body}&rdquo;</p>
          {review.photoUrl && (
            <img src={review.photoUrl} alt="" loading="lazy" className="mt-3 size-20 rounded-2xl object-cover" />
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {review.status === 'pending' && (
              <button onClick={() => onApprove(review.id)} className="rounded-full bg-brown px-4 py-2 text-sm font-semibold text-cream transition hover:bg-olive">
                Approve
              </button>
            )}
            {review.status === 'approved' && (
              <button
                onClick={() => onToggleFeatured(review.id, !review.featured)}
                className="rounded-full border border-brown/20 px-4 py-2 text-sm font-semibold text-brown transition hover:bg-beige"
              >
                {review.featured ? 'Unfeature' : 'Feature'}
              </button>
            )}
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-full border border-brown/20 px-4 py-2 text-sm font-semibold text-brown transition hover:bg-beige">
              <Pencil size={14} /> Edit
            </button>
            <button onClick={() => onDelete(review.id)} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AdminReviewsDashboard() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [tokens, setTokens] = useState<AdminToken[] | null>(null);
  const [loadError, setLoadError] = useState('');

  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all');
  const [search, setSearch] = useState('');

  const [linkLabel, setLinkLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  async function refresh() {
    try {
      const response = await fetch('/api/admin/reviews');
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { reviews: AdminReview[]; tokens: AdminToken[] };
      setReviews(data.reviews);
      setTokens(data.tokens);
    } catch {
      setLoadError('Unable to load the dashboard right now. Try refreshing the page.');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!highlightId || !reviews) return;
    document.getElementById(`review-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId, reviews]);

  async function generateLink(event: FormEvent) {
    event.preventDefault();
    setGenerating(true);
    setGeneratedUrl('');
    try {
      const response = await fetch('/api/admin/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: linkLabel }),
      });
      const data = (await response.json()) as { url: string };
      setGeneratedUrl(data.url);
      setLinkLabel('');
      await refresh();
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard(url: string, key: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      // Clipboard API can fail on non-HTTPS/local contexts; fail silently.
    }
  }

  async function approve(id: number) {
    setReviews((prev) => prev?.map((r) => (r.id === id ? { ...r, status: 'approved', approvedAt: new Date().toISOString() } : r)) ?? prev);
    await fetch(`/api/admin/reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'approve' }) });
    refresh();
  }

  async function toggleFeatured(id: number, next: boolean) {
    setReviews((prev) => prev?.map((r) => (r.id === id ? { ...r, featured: next } : r)) ?? prev);
    await fetch(`/api/admin/reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'feature', featured: next }) });
    refresh();
  }

  async function saveEdit(id: number, fields: { firstName: string; petName: string | null; service: string; rating: number; body: string }) {
    await fetch(`/api/admin/reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'edit', ...fields }) });
    refresh();
  }

  async function performDelete(id: number) {
    setConfirmDeleteId(null);
    setReviews((prev) => prev?.filter((r) => r.id !== id) ?? prev);
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    refresh();
  }

  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    const query = search.trim().toLowerCase();
    return reviews.filter((review) => {
      if (reviewFilter === 'pending' && review.status !== 'pending') return false;
      if (reviewFilter === 'approved' && review.status !== 'approved') return false;
      if (reviewFilter === 'featured' && !review.featured) return false;
      if (!query) return true;
      return (
        review.firstName.toLowerCase().includes(query) ||
        (review.petName ?? '').toLowerCase().includes(query) ||
        review.service.toLowerCase().includes(query)
      );
    });
  }, [reviews, reviewFilter, search]);

  const filteredTokens = useMemo(() => {
    if (!tokens) return [];
    if (linkFilter === 'all') return tokens;
    return tokens.filter((t) => t.status === linkFilter);
  }, [tokens, linkFilter]);

  const reviewFilters: { key: ReviewFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'featured', label: 'Featured' },
  ];
  const linkFilters: { key: LinkFilter; label: string }[] = [
    { key: 'all', label: 'All Links' },
    { key: 'unused', label: 'Unused' },
    { key: 'used', label: 'Used' },
    { key: 'expired', label: 'Expired Links' },
  ];

  return (
    <main className="min-h-screen bg-cream px-5 py-14">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-brown">Review Dashboard</h1>
            <p className="mt-2 text-brown/70">Manage client review links and moderate submissions.</p>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' });
              window.location.href = '/admin/login';
            }}
            className="rounded-full border border-brown/20 px-5 py-2.5 text-sm font-semibold text-brown transition hover:bg-beige"
          >
            Log out
          </button>
        </div>

        {loadError && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{loadError}</p>}

        {/* Generate link panel */}
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-soft sm:p-8">
          <h2 className="font-display text-2xl text-brown">Create Client Review Link</h2>
          <p className="mt-1 text-sm text-brown/65">Generates a one-time link, valid for 60 days, that only works once.</p>
          <form onSubmit={generateLink} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Label (e.g. Nicole — Marley)"
              className="flex-1 rounded-xl border border-beige bg-cream/50 px-4 py-3 outline-none transition focus:border-olive focus:ring-2 focus:ring-sage/30"
            />
            <button disabled={generating} className="flex items-center justify-center gap-2 rounded-full bg-brown px-6 py-3 font-semibold text-cream transition hover:bg-olive disabled:opacity-70">
              {generating && <LoaderCircle className="size-4 animate-spin" />}
              Create Client Review Link
            </button>
          </form>

          {generatedUrl && (
            <div className="mt-4 flex flex-col gap-2 rounded-xl bg-sage/15 p-4 sm:flex-row sm:items-center">
              <input readOnly value={generatedUrl} className="flex-1 truncate rounded-lg border border-beige bg-white px-3 py-2 text-sm text-brown" />
              <button
                onClick={() => copyToClipboard(generatedUrl, 'new')}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-brown px-4 py-2 text-sm font-semibold text-cream transition hover:bg-olive"
              >
                {copiedKey === 'new' ? <Check size={14} /> : <Copy size={14} />}
                {copiedKey === 'new' ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}

          {/* Link filter chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {linkFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setLinkFilter(f.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${linkFilter === f.key ? 'bg-brown text-cream' : 'bg-beige text-brown/70 hover:bg-beige/70'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {tokens === null && <p className="text-sm text-brown/60">Loading links…</p>}
            {tokens !== null && filteredTokens.length === 0 && <p className="text-sm text-brown/60">No links in this category yet.</p>}
            {filteredTokens.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-beige px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-brown">{t.label || 'Unlabeled link'}</p>
                  <p className="text-xs text-brown/55">
                    Created {formatDate(t.createdAt)} · Expires {formatDate(t.expiresAt)}
                    {t.usedAt ? ` · Used ${formatDate(t.usedAt)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tokenStatusStyles[t.status]}`}>{tokenStatusLabel[t.status]}</span>
                  {t.status === 'unused' && (
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/review/${t.token}`, `t-${t.id}`)}
                      className="inline-flex items-center gap-1 rounded-full border border-brown/20 px-3 py-1.5 text-xs font-semibold text-brown transition hover:bg-beige"
                    >
                      {copiedKey === `t-${t.id}` ? <Check size={12} /> : <Copy size={12} />}
                      {copiedKey === `t-${t.id}` ? 'Copied' : 'Copy Link'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews panel */}
        <section className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-2xl text-brown">Reviews</h2>
            <label className="relative w-full sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brown/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, pet, or service"
                className="w-full rounded-full border border-beige bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-sage/30"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {reviewFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setReviewFilter(f.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${reviewFilter === f.key ? 'bg-brown text-cream' : 'bg-beige text-brown/70 hover:bg-beige/70'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {reviews === null && !loadError && (
              <div className="flex items-center gap-2 text-sm text-brown/60">
                <LoaderCircle className="size-4 animate-spin" /> Loading reviews…
              </div>
            )}
            {reviews !== null && filteredReviews.length === 0 && <p className="text-sm text-brown/60">No reviews match this view.</p>}
            {filteredReviews.map((review) => (
              <ReviewRow
                key={review.id}
                review={review}
                highlighted={highlightId === String(review.id)}
                onApprove={approve}
                onToggleFeatured={toggleFeatured}
                onDelete={(id) => setConfirmDeleteId(id)}
                onSaveEdit={saveEdit}
              />
            ))}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this review?"
        description="This permanently removes the review and its photo, if any. This can't be undone."
        confirmLabel="Delete review"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId !== null && performDelete(confirmDeleteId)}
      />
    </main>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense>
      <AdminReviewsDashboard />
    </Suspense>
  );
}
