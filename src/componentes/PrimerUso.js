import React from 'react';

export function PrimerUso({ onCreateWorkspace }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', padding: 'var(--space-8)',
      textAlign: 'center',
    }}>

      {/* Ícono */}
      <div style={{
        width: 64, height: 64, borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-accent-muted)', border: '1px solid var(--border-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 'var(--space-6)',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
          <line x1="12" y1="11" x2="12" y2="17"/>
          <line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
      </div>

      {/* Título */}
      <h2 style={{
        margin: '0 0 var(--space-3)',
        fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)',
        color: 'var(--text-primary)',
      }}>
        Creá tu primer workspace
      </h2>

      {/* Descripción */}
      <p style={{
        margin: '0 0 var(--space-2)',
        fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
        maxWidth: 380, lineHeight: 'var(--leading-relaxed)',
      }}>
        Un workspace es el espacio de trabajo de un caso o expediente. Contiene los documentos, el historial de consultas y los plazos críticos.
      </p>
      <p style={{
        margin: '0 0 var(--space-8)',
        fontSize: 'var(--text-sm)', color: 'var(--text-muted)',
        maxWidth: 360,
      }}>
        Ejemplo: <em>"García c/ Municipalidad — Daños 2024"</em>
      </p>

      {/* Pasos */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
        marginBottom: 'var(--space-8)', width: '100%', maxWidth: 340,
      }}>
        {[
          { n: '1', texto: 'Dale un nombre al caso' },
          { n: '2', texto: 'Elegí el área del derecho' },
          { n: '3', texto: 'Subí los documentos del expediente' },
          { n: '4', texto: 'Consultá con el CLP' },
        ].map(({ n, texto }) => (
          <div key={n} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', textAlign: 'left',
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: 'var(--bg-accent-muted)', border: '1px solid var(--border-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)',
              color: 'var(--text-accent)',
            }}>{n}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{texto}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onCreateWorkspace}
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-6)',
          background: 'var(--accent)', border: 'none',
          borderRadius: 'var(--radius-md)', cursor: 'pointer',
          color: '#fff', fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-semibold)',
          transition: 'var(--transition-fast)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Crear primer workspace
      </button>

    </div>
  );
}

export default PrimerUso;
