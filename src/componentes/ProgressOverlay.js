import React from 'react';
import './progress-overlay.css';

export function ProgressOverlay({ show, message, subMessage, progress }) {
  if (!show) return null;

  const isIndeterminate = progress === null || progress === undefined;

  return (
    <div className="pov-backdrop">
      <div className="pov-card">
        <div className="pov-icon-wrap">
          <svg className="pov-spinner" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="var(--border-default)" strokeWidth="3"/>
            <circle cx="16" cy="16" r="13" stroke="var(--accent)" strokeWidth="3"
              strokeLinecap="round" strokeDasharray="40 82" strokeDashoffset="0"/>
          </svg>
        </div>
        <div className="pov-message">{message || 'Procesando...'}</div>
        {subMessage && <div className="pov-sub-message">{subMessage}</div>}
        <div className="pov-track">
          <div
            className={`pov-fill ${isIndeterminate ? 'pov-fill--indeterminate' : ''}`}
            style={!isIndeterminate ? { width: `${Math.min(100, Math.max(0, progress))}%` } : {}}
          />
        </div>
        {!isIndeterminate && (
          <div className="pov-percent">{Math.round(progress)}%</div>
        )}
      </div>
    </div>
  );
}
