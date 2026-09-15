import React from 'react';

/**
 * Nishchit Official Brand Logo
 * 
 * Uses the official Nishchit brand asset (/nishchit-logo.png)
 * ensuring exact aspect ratio, no clipping, and consistent typography.
 * 
 * Variants:
 * - 'primary': Full official logo with "Certainty for every parent." tagline
 * - 'compact': Official signature 'N' monogram mark with amber transit stripe & pin
 * - 'header': Official logo calibrated for application headers
 * - 'card': Official logo formatted for authentication & portal cards
 * - 'splash': Large format for startup brand transition
 */
export default function NishchitLogo({
  variant = 'primary',
  workspace = '',
  size = 40,
  className = '',
  onClick,
  style = {}
}) {
  // 1. Compact / Monogram Mark (Scalable SVG for badges, small icons, favicons)
  if (variant === 'compact') {
    return (
      <div
        className={`nishchit-logo-compact ${className}`}
        onClick={onClick}
        style={{
          cursor: onClick ? 'pointer' : 'default',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
      >
        <svg
          width={size}
          height={Math.round(size * 1.07)}
          viewBox="0 0 54 58"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="nishchit-monogram-icon"
          aria-hidden="true"
        >
          {/* Location Pin Waypoint over the N apex */}
          <g id="amber-pin">
            <path
              d="M38 3C34.134 3 31 6.134 31 10C31 14.5 38 21.5 38 21.5C38 21.5 45 14.5 45 10C45 6.134 41.866 3 38 3Z"
              fill="#F59E0B"
            />
            <circle cx="38" cy="10" r="3" fill="#FFFFFF" />
          </g>

          {/* Main 'N' Body Pillars in Dark Navy Slate */}
          <path
            d="M8 18C8 15.7909 9.79086 14 12 14H18C20.2091 14 22 15.7909 22 18V49C22 51.2091 20.2091 53 18 53H12C9.79086 53 8 51.2091 8 49V18Z"
            fill="#111827"
          />
          <path
            d="M34 23C34 20.7909 35.7909 19 38 19H44C46.2091 19 48 20.7909 48 23V49C48 51.2091 46.2091 53 44 53H38C35.7909 53 34 51.2091 34 49V23Z"
            fill="#111827"
          />

          {/* Amber Diagonal Rising Stripe */}
          <path
            d="M10 47.5L36 19.5H46L20 53.5H10V47.5Z"
            fill="#F59E0B"
          />
        </svg>
      </div>
    );
  }

  // Sizing mappings based on variant
  // Natural logo aspect ratio: 1024 / 341 = ~3.0
  let logoHeight = size;
  if (variant === 'header') logoHeight = Math.min(size, 38);
  if (variant === 'card') logoHeight = Math.max(size, 52);
  if (variant === 'splash') logoHeight = Math.max(size, 64);

  return (
    <div
      className={`nishchit-brand-container logo-${variant} ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default',
        maxWidth: '100%',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        ...style
      }}
    >
      <img
        src="/nishchit-logo.png"
        alt="Nishchit — Certainty for every parent"
        className="nishchit-brand-img"
        style={{
          height: `${logoHeight}px`,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />

      {workspace && (
        <span
          className="nishchit-workspace-badge"
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#2563EB',
            background: '#EFF6FF',
            border: '1px solid #DBEAFE',
            padding: '3px 9px',
            borderRadius: '6px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            alignSelf: 'center'
          }}
        >
          {workspace}
        </span>
      )}
    </div>
  );
}
