import React from 'react';

// Icon only — normalized SVG
export function LexiiusIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lig" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6D28D9"/>
          <stop offset="100%" stopColor="#9D6EF5"/>
        </linearGradient>
        <linearGradient id="lng" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9D6EF5"/>
          <stop offset="100%" stopColor="#C4A3FA"/>
        </linearGradient>
      </defs>
      <rect width="88" height="88" rx="18" fill="#1a1428" stroke="#6D28D9" strokeWidth="0.75" strokeOpacity="0.5"/>
      <rect x="26" y="18" width="11" height="52" rx="3" fill="url(#lig)"/>
      <rect x="26" y="59" width="38" height="11" rx="3" fill="url(#lig)"/>
      <circle cx="31.5" cy="18" r="5" fill="url(#lng)" stroke="#0e0e11" strokeWidth="1.5"/>
      <circle cx="31.5" cy="64" r="4" fill="#9D6EF5" stroke="#0e0e11" strokeWidth="1.5"/>
      <circle cx="64" cy="64" r="5" fill="url(#lng)" stroke="#0e0e11" strokeWidth="1.5"/>
      <circle cx="64" cy="18" r="3" fill="#6D28D9" stroke="#0e0e11" strokeWidth="1.5"/>
      <line x1="31.5" y1="18" x2="64" y2="18" stroke="#6D28D9" strokeWidth="0.75" strokeOpacity="0.5" strokeDasharray="2,3"/>
      <line x1="64" y1="18" x2="64" y2="64" stroke="#6D28D9" strokeWidth="0.75" strokeOpacity="0.5" strokeDasharray="2,3"/>
    </svg>
  );
}

// Horizontal lockup — icon + wordmark
export function LexiiusLogo({ iconSize = 32, fontSize = 18 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <LexiiusIcon size={iconSize} />
      <span style={{
        fontFamily: "var(--font-sans, 'Inter', sans-serif)",
        fontSize: fontSize,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.92)' }}>Lexi</span>
        <span style={{ color: '#9D6EF5' }}>ii</span>
        <span style={{ color: 'rgba(255,255,255,0.92)' }}>us</span>
      </span>
    </div>
  );
}

export default LexiiusLogo;
