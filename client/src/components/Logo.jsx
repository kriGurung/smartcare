// Inline SVG mark so it scales crisply and inherits sizing. Mirrors
// /assets/logo-mark.svg (shield = verification, heart = care, check = trust).
export function LogoMark({ size = 32, className = '' }) {
  const gid = 'lg' + size;
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${gid}s`} x1="256" y1="56" x2="256" y2="456" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`${gid}c`} x1="228" y1="188" x2="288" y2="232" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <path
        d="M120 92 L392 92 C405 92 416 103 416 116 L416 244 C416 342 354 416 256 452 C158 416 96 342 96 244 L96 116 C96 103 107 92 120 92 Z"
        fill={`url(#${gid}s)`}
      />
      <path
        d="M256 286 C256 286 190 246 190 198 C190 174 208 158 230 158 C244 158 253 167 256 176 C259 167 268 158 282 158 C304 158 322 174 322 198 C322 246 256 286 256 286 Z"
        fill="#FFFFFF"
      />
      <path
        d="M228 208 L249 230 L289 184"
        stroke={`url(#${gid}c)`}
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function Logo({ size = 32, showText = true, className = '', textClass = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className={`font-display font-bold leading-none tracking-tight text-ink ${textClass}`}>
          Smart<span className="text-brand-600">Care</span>
        </span>
      )}
    </span>
  );
}
