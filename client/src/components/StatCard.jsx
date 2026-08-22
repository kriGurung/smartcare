const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  care: 'bg-care-50 text-care-600',
  amber: 'bg-amber-50 text-amber-500',
  slate: 'bg-surface-sunken text-ink-soft',
  danger: 'bg-red-50 text-danger',
};

export default function StatCard({ label, value, icon: Icon, tone = 'brand', hint }) {
  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-muted">{label}</span>
        {Icon && (
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${TONES[tone] || TONES.brand}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
