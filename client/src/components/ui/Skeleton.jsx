export default function Skeleton({ className = '', count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <>
      {items.map((i) => (
        <div key={i} className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-slate-200 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
          <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-8 flex-1 rounded-lg bg-slate-200 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}
