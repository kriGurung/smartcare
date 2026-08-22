const TONES = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/15',
  care: 'bg-care-50 text-care-700 ring-care-600/15',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/15',
  muted: 'bg-slate-100 text-slate-600 ring-slate-500/10',
};

export default function Badge({ tone = 'muted', icon: Icon, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset
        ${TONES[tone] || TONES.muted} ${className}`}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
