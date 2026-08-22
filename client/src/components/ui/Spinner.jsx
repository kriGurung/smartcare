import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-ink-muted ${className}`}>
      <Loader2 size={28} className="animate-spin-slow text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
