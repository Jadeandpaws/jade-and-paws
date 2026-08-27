import { useState } from 'react';
import { Star } from 'lucide-react';

export function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={size} className={n <= rounded ? 'fill-olive text-olive' : 'fill-transparent text-beige'} />
        ))}
      </div>
      <span className="sr-only">{rating} out of 5 stars</span>
    </div>
  );
}

/**
 * Interactive star picker shared by the client review form and the admin
 * "edit review" panel. Built as real, focusable, labeled buttons (not a
 * native radio group) so Enter/Space and screen readers work out of the
 * box while still using the same star icon as everywhere else on the site.
 */
export function StarRatingInput({ value, onChange, size = 28 }: { value: number; onChange: (n: number) => void; size?: number }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onFocus={() => setHovered(n)}
          onBlur={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="rounded-md p-0.5 outline-none transition focus-visible:ring-2 focus-visible:ring-sage/50"
        >
          <Star size={size} className={n <= shown ? 'fill-olive text-olive' : 'fill-transparent text-beige'} />
        </button>
      ))}
    </div>
  );
}
