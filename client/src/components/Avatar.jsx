import { initials } from '../lib/format.js';

const SIZES = { sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-lg', xl: 'h-24 w-24 text-2xl' };
const PROFESSIONAL_PROFILES = [
  '/images/caregivers/caregiver-female-1.svg',
  '/images/caregivers/caregiver-female-2.svg',
  '/images/caregivers/caregiver-male-1.svg',
  '/images/caregivers/caregiver-male-2.svg',
  '/images/caregivers/caregiver-female-3.svg',
  '/images/caregivers/caregiver-male-3.svg',
];

function profileFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PROFESSIONAL_PROFILES[hash % PROFESSIONAL_PROFILES.length];
}

// Uses a professional Nepal-context caregiver portrait when a real profile photo is not available.
export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const dim = SIZES[size] || SIZES.md;
  const image = src || profileFor(name);
  return (
    <img
      src={image}
      alt={src ? `${name} profile` : `${name || 'Caregiver'} professional placeholder profile`}
      className={`${dim} rounded-full object-cover ring-2 ring-white shadow-sm ${className}`}
      onError={(e) => {
        if (e.currentTarget.dataset.fallback) return;
        e.currentTarget.dataset.fallback = 'true';
        e.currentTarget.src = '/images/caregivers/caregiver-female-1.svg';
      }}
    />
  );
}
