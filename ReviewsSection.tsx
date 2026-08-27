'use client';

import { MessageCircleHeart, PawPrint, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ReviewCard } from './ReviewCard';
import { SectionTitle } from './SectionTitle';
import type { PublicReview, ReviewStats } from '../lib/reviews';

function SkeletonCard() {
  return (
    <div className="h-64 animate-pulse rounded-3xl bg-white p-7 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="size-14 shrink-0 rounded-2xl bg-beige" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-20 rounded bg-beige" />
          <div className="h-4 w-32 rounded bg-beige" />
          <div className="h-3 w-24 rounded bg-beige" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 w-full rounded bg-beige" />
        <div className="h-3 w-5/6 rounded bg-beige" />
        <div className="h-3 w-2/3 rounded bg-beige" />
      </div>
    </div>
  );
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/reviews')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load reviews.');
        return response.json() as Promise<{ reviews: PublicReview[]; stats: ReviewStats }>;
      })
      .then((data) => {
        if (cancelled) return;
        setReviews(data.reviews);
        setStats(data.stats);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = reviews === null && !failed;
  const hasReviews = (reviews?.length ?? 0) > 0;

  return (
    <>
      <SectionTitle eyebrow="Reviews" title="What Pet Parents Are Saying 🤍" />

      {!failed && (
        <div className="mb-10 grid gap-4 rounded-3xl bg-beige p-6 text-center sm:grid-cols-3">
          <div>
            <p className="flex items-center justify-center gap-1.5 font-display text-3xl text-brown">
              <Star className="size-6 fill-olive text-olive" />
              {stats ? stats.average.toFixed(1) : '—'}
            </p>
            <p className="mt-1 text-sm text-brown/70">Average Rating</p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-1.5 font-display text-3xl text-brown">
              <PawPrint className="size-6 text-olive" />
              {stats ? stats.pets : '—'}
            </p>
            <p className="mt-1 text-sm text-brown/70">Pets Cared For</p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-1.5 font-display text-3xl text-brown">
              <MessageCircleHeart className="size-6 text-olive" />
              {stats ? stats.total : '—'}
            </p>
            <p className="mt-1 text-sm text-brown/70">Verified Client Reviews</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      )}

      {!loading && failed && (
        <p className="mx-auto max-w-md text-center text-sm leading-6 text-brown/70">
          Reviews couldn&apos;t be loaded right now. Please refresh the page or check back shortly.
        </p>
      )}

      {!loading && !failed && !hasReviews && (
        <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-soft">
          <PawPrint className="mx-auto size-10 text-olive" strokeWidth={1.25} />
          <p className="mt-4 font-display text-2xl text-brown">No reviews yet.</p>
          <p className="mt-2 text-sm leading-6 text-brown/70">Be the first to share your experience!</p>
        </div>
      )}

      {!loading && !failed && hasReviews && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews!.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </div>
      )}
    </>
  );
}
