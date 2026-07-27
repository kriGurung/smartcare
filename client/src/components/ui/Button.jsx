import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm focus:ring-brand-600/30',
  care: 'bg-care-500 text-white hover:bg-care-600 shadow-sm focus:ring-care-500/30',
  outline: 'bg-white text-ink border border-slate-200 hover:bg-surface-sunken focus:ring-brand-600/20',
  ghost: 'bg-transparent text-ink-soft hover:bg-surface-sunken focus:ring-brand-600/20',
  danger: 'bg-danger text-white hover:bg-red-600 shadow-sm focus:ring-danger/30',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100 focus:ring-brand-600/20',
};

const SIZES = {
  sm: 'px-3 py-2 text-sm gap-1.5',
  md: 'px-5 py-3 text-[15px] gap-2',
  lg: 'px-6 py-3.5 text-base gap-2.5',
};

export default function Button({
  as: Comp = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  children,
  ...props
}) {
  return (
    <Comp
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition
        focus:outline-none focus:ring-4 disabled:opacity-50 disabled:pointer-events-none
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={18} className="animate-spin-slow" /> : Icon ? <Icon size={18} /> : null}
      {children}
    </Comp>
  );
}
