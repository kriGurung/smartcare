import { Clock, Check, Play, CheckCircle2, X } from 'lucide-react';

const STEPS = [
  { key: 'pending', label: 'Requested', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'in_progress', label: 'In progress', icon: Play },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

// Terminal states break the linear path: cancelled can leave pending or
// confirmed; declined always leaves pending. `endIdx` is the furthest step
// the booking actually reached before it stopped.
const TERMINAL = { cancelled: 1, declined: 0 };

/** Horizontal progress stepper for a booking's lifecycle. */
export default function BookingTimeline({ status }) {
  const terminalIdx = TERMINAL[status];
  const currentIdx = STEPS.findIndex((s) => s.key === status);

  const nodes = STEPS.map((s, i) => ({
    key: s.key,
    label: s.label,
    icon: s.icon,
    reached: terminalIdx !== undefined ? i <= terminalIdx : i <= currentIdx,
    current: terminalIdx === undefined && i === currentIdx,
  }));

  if (terminalIdx !== undefined) {
    nodes.push({
      key: status,
      label: status === 'cancelled' ? 'Cancelled' : 'Declined',
      icon: X,
      failed: true,
    });
  }

  return (
    <ol className="flex">
      {nodes.map((n, i) => (
        <li key={n.key} className="relative flex flex-1 flex-col items-center gap-2">
          {i > 0 && (
            <span
              aria-hidden
              className={`absolute left-[-50%] top-[11px] h-0.5 w-full ${
                n.failed ? 'bg-red-300' : n.reached ? 'bg-emerald-400' : 'bg-slate-200'
              }`}
            />
          )}
          <span
            className={`relative z-10 grid h-6 w-6 place-items-center rounded-full ${
              n.failed
                ? 'bg-red-500 text-white'
                : n.current
                  ? 'bg-brand-600 text-white ring-4 ring-brand-600/15'
                  : n.reached
                    ? 'bg-emerald-400 text-white'
                    : 'bg-slate-200 text-slate-400'
            }`}
          >
            <n.icon size={13} />
          </span>
          <span
            className={`text-[11px] font-medium ${
              n.failed ? 'text-red-600' : n.current ? 'text-ink' : n.reached ? 'text-ink-soft' : 'text-ink-faint'
            }`}
          >
            {n.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
