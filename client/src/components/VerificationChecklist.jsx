import { CheckCircle2, Clock, XCircle, Circle } from 'lucide-react';

const ICONS = {
  approved: { Icon: CheckCircle2, cls: 'text-care-600', label: 'Approved' },
  verified: { Icon: CheckCircle2, cls: 'text-care-600', label: 'Approved' },
  pending: { Icon: Clock, cls: 'text-amber-500', label: 'Under review' },
  rejected: { Icon: XCircle, cls: 'text-danger', label: 'Rejected' },
  missing: { Icon: Circle, cls: 'text-slate-300', label: 'Not submitted' },
};

// Transparent trust panel (§11): shows which checks a caregiver has passed.
export default function VerificationChecklist({ items = [], compact = false }) {
  return (
    <ul className={compact ? 'space-y-2' : 'space-y-3'}>
      {items.map((it) => {
        const meta = ICONS[it.status] || ICONS.missing;
        const { Icon } = meta;
        return (
          <li key={it.docType} className="flex items-center gap-3">
            <Icon size={compact ? 18 : 20} className={meta.cls} />
            <span className="flex-1 text-sm font-medium text-ink-soft">{it.label}</span>
            <span className={`text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
