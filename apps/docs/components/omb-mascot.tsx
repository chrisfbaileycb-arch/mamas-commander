'use client';

import type { MascotShape } from '@/lib/omb-data';

interface OmbMascotProps {
  color: string;
  shape?: MascotShape;
  expression?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  xs: 20,
  sm: 26,
  md: 36,
  lg: 52,
  xl: 76,
};

export function OmbMascot({
  color = '#10b981',
  shape = 'mascot',
  expression = 0,
  size = 'md',
  className = '',
}: OmbMascotProps) {
  const px = SIZE_MAP[size];
  const expr = Math.abs(expression) % 10;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}-${shape}`} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.72" />
        </linearGradient>
      </defs>

      {shape === 'mascot' && (
        <path
          d="M12 13.5C12 8.8 17.1 5.9 21.1 8.3L53.4 27.6C57.3 29.9 57.3 35.6 53.4 37.9L21.1 57.2C17.1 59.6 12 56.7 12 52V13.5Z"
          fill={`url(#grad-${color.replace('#', '')}-${shape})`}
        />
      )}
      {shape === 'circle' && (
        <circle cx="32" cy="32" r="26" fill={`url(#grad-${color.replace('#', '')}-${shape})`} />
      )}
      {shape === 'rounded' && (
        <rect x="7" y="7" width="50" height="50" rx="16" fill={`url(#grad-${color.replace('#', '')}-${shape})`} />
      )}
      {shape === 'square' && (
        <rect x="8" y="8" width="48" height="48" rx="6" fill={`url(#grad-${color.replace('#', '')}-${shape})`} />
      )}

      {expr === 0 && (
        <g fill="#ffffff">
          <circle cx="25" cy="29" r="3.4" />
          <circle cx="36" cy="27" r="3.4" />
          <rect x="28" y="36" width="6" height="2.4" rx="1.2" opacity="0.9" />
        </g>
      )}
      {expr === 1 && (
        <g fill="#ffffff">
          <ellipse cx="25" cy="29" rx="3.2" ry="4.2" />
          <ellipse cx="36" cy="27" rx="3.2" ry="4.2" />
          <path d="M27 36.5Q31 39.5 35 36" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </g>
      )}
      {expr === 2 && (
        <g fill="#ffffff">
          <rect x="23" y="26" width="2.8" height="6.5" rx="1.4" transform="rotate(-12 23 26)" />
          <rect x="33" y="24.5" width="2.8" height="6.5" rx="1.4" transform="rotate(-12 33 24.5)" />
          <rect x="28" y="35.5" width="5.5" height="2.4" rx="1.2" opacity="0.85" />
        </g>
      )}
      {expr === 3 && (
        <g fill="#ffffff">
          <circle cx="25" cy="30" r="3.5" />
          <path d="M33 27.5L39 26.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="31" cy="37" r="2.2" />
        </g>
      )}
      {expr === 4 && (
        <g fill="#ffffff">
          <path d="M21 26L28 28.5" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M39 24.5L32 27.5" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="25" cy="31" r="2.8" />
          <circle cx="35.5" cy="29.5" r="2.8" />
        </g>
      )}
      {expr === 5 && (
        <g fill="#ffffff">
          <rect x="22" y="27.5" width="6.5" height="2.8" rx="1.4" />
          <circle cx="36" cy="28" r="3.4" />
          <rect x="27" y="36" width="7" height="2.4" rx="1.2" />
        </g>
      )}
      {expr > 5 && (
        <g fill="#ffffff">
          <circle cx="24.5" cy="28.5" r="3.3" />
          <circle cx="35.5" cy="27" r="3.3" />
          <path d="M26.5 36L34.5 34.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
