import { initials } from '../lib/format.js';

const SIZES = { sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-lg', xl: 'h-24 w-24 text-2xl' };

// Falls back to coloured initials when no photo is set.
export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const dim = SIZES[size] || SIZES.md;
  if (src) {
    return <img src={src} alt={name} className={`${dim} rounded-full object-cover ring-2 ring-white shadow-sm ${className}`} />;
  }
  return (
    <span
      className={`${dim} grid place-items-center rounded-full bg-brand-100 font-semibold text-brand-700 ring-2 ring-white shadow-sm ${className}`}
    >
      {initials(name) || '?'}
    </span>
  );
}
