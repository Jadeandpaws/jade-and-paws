import { motion } from 'framer-motion';
import { BadgeCheck, PawPrint } from 'lucide-react';
import { StarRating } from './StarRating';
import type { PublicReview } from '../lib/reviews';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function ReviewCard({ review, index }: { review: PublicReview; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3) }}
      className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-soft"
    >
      <div className="flex items-start gap-4">
        {/* Fixed-size avatar slot keeps every card the same shape whether or not a photo was uploaded. */}
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-sage/25">
          {review.photoUrl ? (
            <img
              src={review.photoUrl}
              alt={review.petName ? `Photo of ${review.petName}` : 'Pet photo'}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          ) : (
            <PawPrint className="size-6 text-brown" strokeWidth={1.5} />
          )}
        </span>
        <div className="min-w-0">
          <StarRating rating={review.rating} />
          <p className="mt-1.5 truncate font-display text-lg text-brown">
            {review.firstName}
            {review.petName ? <span className="text-brown/60"> &amp; {review.petName}</span> : null}
          </p>
          <p className="text-xs uppercase tracking-wide text-brown/55">{review.service}</p>
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm leading-6 text-brown/75">&ldquo;{review.body}&rdquo;</p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-brown/55">
        <span className="inline-flex items-center gap-1 rounded-full bg-sage/20 px-3 py-1 font-semibold text-brown">
          <BadgeCheck size={13} /> Verified Client
        </span>
        <span>{formatDate(review.createdAt)}</span>
      </div>
    </motion.article>
  );
}
