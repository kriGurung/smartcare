import { Star } from 'lucide-react';

// Read-only display or interactive picker (pass onChange to enable input).
export default function StarRating({ value = 0, onChange, size = 18, showValue = false, count }) {
  const interactive = typeof onChange === 'function';
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = interactive ? n <= value : n <= rounded;
          return interactive ? (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="p-0.5 transition hover:scale-110"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              <Star size={size} className={filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
            </button>
          ) : (
            <Star key={n} size={size} className={filled ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
          );
        })}
      </span>
      {showValue && <span className="ml-1 text-sm font-semibold text-ink">{Number(value).toFixed(1)}</span>}
      {typeof count === 'number' && <span className="text-sm text-ink-muted">({count})</span>}
    </span>
  );
}
