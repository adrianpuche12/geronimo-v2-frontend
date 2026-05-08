import React from 'react';

// Icon standalone — transparent background, para usar sobre superficies oscuras
export function IuriviaIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Iurivia">
      <rect width="32" height="32" rx="7" fill="#1e1635" stroke="#6D28D9" strokeWidth="0.8" />
      <rect x="15" y="6" width="2.2" height="18" rx="1.1" fill="#A78BFA" />
      <rect x="8" y="22.5" width="16" height="2" rx="1" fill="#7C3AED" />
      <rect x="5.5" y="12" width="21" height="2" rx="1" fill="#7C3AED" />
      <circle cx="7.5" cy="13" r="3" fill="#9D6EF5" stroke="#1e1635" strokeWidth="1.4" />
      <circle cx="7.5" cy="13" r="1" fill="#ffffff" opacity="0.9" />
      <circle cx="24.5" cy="13" r="3" fill="#9D6EF5" stroke="#1e1635" strokeWidth="1.4" />
      <circle cx="24.5" cy="13" r="1" fill="#ffffff" opacity="0.9" />
      <circle cx="16.1" cy="6" r="2" fill="#A78BFA" stroke="#1e1635" strokeWidth="1" />
    </svg>
  );
}

export function IuriviaLogo({ iconSize = 32, fontSize = 18 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <IuriviaIcon size={iconSize} />
      <span style={{
        fontFamily: "var(--font-sans, 'Inter', sans-serif)",
        fontSize: fontSize,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        <span style={{ color: '#9D6EF5' }}>I</span>
        <span style={{ color: 'rgba(255,255,255,0.93)' }}>urivia</span>
      </span>
    </div>
  );
}

// Aliases para compatibilidad con imports existentes
export const LexiiusIcon = IuriviaIcon;
export const LexiiusLogo = IuriviaLogo;
export default IuriviaLogo;
