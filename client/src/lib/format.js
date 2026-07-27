// Money is integer paisa on the wire (1 NPR = 100 paisa); format for display.
export function formatNpr(paisa) {
  const n = Number(paisa || 0) / 100;
  return `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function nprToPaisa(npr) {
  return Math.round(Number(npr || 0) * 100);
}

const DATE_OPTS = { year: 'numeric', month: 'short', day: 'numeric' };
const TIME_OPTS = { hour: 'numeric', minute: '2-digit' };

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', DATE_OPTS);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return `${d.toLocaleDateString('en-GB', DATE_OPTS)}, ${d.toLocaleTimeString('en-US', TIME_OPTS)}`;
}

export function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-US', TIME_OPTS);
}

// "in 3 hours", "2 days ago" — light relative time for notifications/feeds.
export function timeAgo(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const abs = Math.abs(diff);
  const past = diff >= 0;
  const units = [
    ['year', 31536000000], ['month', 2592000000], ['day', 86400000],
    ['hour', 3600000], ['minute', 60000],
  ];
  for (const [name, ms] of units) {
    const v = Math.floor(abs / ms);
    if (v >= 1) return past ? `${v} ${name}${v > 1 ? 's' : ''} ago` : `in ${v} ${name}${v > 1 ? 's' : ''}`;
  }
  return past ? 'just now' : 'shortly';
}

// A duration in fractional hours -> "4h" or "2h 30m".
export function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}
