import React from 'react';

const TYPE_COLORS = {
  PERSONA:   { bg: 'var(--bg-warning)',        text: 'var(--text-warning)',  border: 'var(--border-warning)' },
  EMPRESA:   { bg: 'var(--bg-info)',           text: 'var(--text-info)',     border: 'var(--border-accent)' },
  DOMICILIO: { bg: 'var(--bg-success)',        text: 'var(--text-success)',  border: 'var(--border-success)' },
  DNI:       { bg: 'var(--bg-error)',          text: 'var(--text-error)',    border: 'var(--border-error)' },
  CUIL:      { bg: 'var(--bg-error)',          text: 'var(--text-error)',    border: 'var(--border-error)' },
  EMAIL:     { bg: 'var(--bg-accent-subtle)',  text: 'var(--text-accent)',   border: 'var(--border-accent)' },
  TELEFONO:  { bg: 'var(--bg-success)',        text: 'var(--text-success)',  border: 'var(--border-success)' },
  CBU:       { bg: 'var(--bg-warning)',        text: 'var(--text-warning)',  border: 'var(--border-warning)' },
  OTRO:      { bg: 'var(--bg-surface-2)',      text: 'var(--text-muted)',    border: 'var(--border-default)' },
};

export function AnonymizationModal({ fileName, anonymizedPreview, entityMap, totalEntities, onConfirm, onCancel }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'var(--bg-overlay)',
      backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'var(--space-5)', zIndex:'var(--z-modal)'
    }}>
      <div style={{
        width:780, maxWidth:'calc(100vw - 40px)', maxHeight:'calc(100vh - 80px)',
        background:'var(--bg-surface-1)', border:'1px solid var(--border-default)',
        borderRadius:'var(--modal-radius)', boxShadow:'var(--shadow-xl)',
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding:'var(--space-5) var(--space-6)',
          borderBottom:'1px solid var(--border-subtle)',
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          flexShrink:0,
        }}>
          <div>
            <div style={{fontSize:'var(--text-base)', fontWeight:'var(--font-semibold)', color:'var(--text-primary)'}}>
              Revision de anonimizacion
            </div>
            <div style={{fontSize:'var(--text-xs)', color:'var(--text-muted)', marginTop:'var(--space-1)'}}>
              {fileName} — {totalEntities} dato{totalEntities !== 1 ? 's' : ''} detectado{totalEntities !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onCancel} style={{
            width:28, height:28, background:'var(--bg-surface-2)',
            border:'1px solid var(--border-default)', borderRadius:'var(--radius-sm)',
            cursor:'pointer', color:'var(--text-muted)', fontSize:'var(--text-sm)',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }}>x</button>
        </div>

        {/* Body: preview + sidebar */}
        <div style={{display:'flex', flex:1, overflow:'hidden'}}>
          {/* Vista previa anonimizada */}
          <div style={{
            flex:1, padding:'var(--space-5)', overflowY:'auto',
            background:'var(--bg-base)', borderRight:'1px solid var(--border-subtle)',
          }}>
            <div style={{fontSize:'var(--text-xs)', fontWeight:'var(--font-medium)', color:'var(--text-muted)', marginBottom:'var(--space-3)', textTransform:'uppercase', letterSpacing:'0.05em'}}>
              Vista previa anonimizada
            </div>
            <pre style={{
              fontSize:'var(--text-xs)', color:'var(--text-secondary)',
              lineHeight:'var(--leading-relaxed)', whiteSpace:'pre-wrap',
              wordBreak:'break-word', margin:0, fontFamily:'var(--font-mono)',
            }}>
              {anonymizedPreview}
              {anonymizedPreview.length >= 2000 && '\n\n[... texto continúa ...]'}
            </pre>
          </div>

          {/* Sidebar: datos detectados */}
          <div style={{
            width:220, flexShrink:0, padding:'var(--space-5)',
            overflowY:'auto', display:'flex', flexDirection:'column', gap:'var(--space-3)',
          }}>
            <div style={{fontSize:'var(--text-xs)', fontWeight:'var(--font-medium)', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em'}}>
              Datos detectados
            </div>
            {entityMap.map((entity) => {
              const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.OTRO;
              return (
                <div key={entity.token} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'var(--space-2) var(--space-3)',
                  background: colors.bg, border:`1px solid ${colors.border}`,
                  borderRadius:'var(--radius-sm)',
                }}>
                  <span style={{fontSize:'var(--text-xs)', fontWeight:'var(--font-semibold)', color: colors.text, fontFamily:'var(--font-mono)'}}>
                    {entity.token}
                  </span>
                  {entity.occurrences > 1 && (
                    <span style={{fontSize:10, color: colors.text, opacity:0.7}}>
                      x{entity.occurrences}
                    </span>
                  )}
                </div>
              );
            })}
            <div style={{marginTop:'var(--space-3)', padding:'var(--space-3)', background:'var(--bg-surface-2)', borderRadius:'var(--radius-md)', fontSize:'var(--text-xs)', color:'var(--text-muted)', lineHeight:'var(--leading-relaxed)'}}>
              El archivo original no se modifica. Iurivia nunca almacena los datos reales.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding:'var(--space-4) var(--space-6)',
          borderTop:'1px solid var(--border-subtle)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          flexShrink:0,
        }}>
          <button onClick={onCancel} className="exp-btn exp-btn--ghost" style={{
            height:'var(--btn-height-md)', padding:'0 var(--btn-padding-x-md)',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="exp-btn exp-btn--primary" style={{
            height:'var(--btn-height-md)', padding:'0 var(--btn-padding-x-md)',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
          }}>
            Subir anonimizado
          </button>
        </div>
      </div>
    </div>
  );
}
