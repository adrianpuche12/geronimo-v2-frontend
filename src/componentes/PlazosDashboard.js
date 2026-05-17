import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const SEMAFORO_CONFIG = {
  rojo:     { label: 'URGENTE',   bg: 'var(--bg-error)',   border: 'var(--border-error)',   text: 'var(--text-error)',   dot: 'var(--error)' },
  amarillo: { label: 'ATENCIÓN',  bg: 'var(--bg-warning)', border: 'var(--border-warning)', text: 'var(--text-warning)', dot: 'var(--warning)' },
  verde:    { label: 'OK',        bg: 'var(--bg-success)', border: 'var(--border-success)', text: 'var(--text-success)', dot: 'var(--success)' },
};

const IcoRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);

const IcoAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

function SemaforoBadge({ semaforo }) {
  const cfg = SEMAFORO_CONFIG[semaforo] || SEMAFORO_CONFIG.verde;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      color: cfg.text,
      fontSize: 'var(--text-2xs)',
      fontWeight: 'var(--font-semibold)',
      letterSpacing: 'var(--tracking-wider)',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function DiasRestantes({ dias }) {
  if (dias === null || dias === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>;

  const color = dias <= 7
    ? 'var(--text-error)'
    : dias <= 30
    ? 'var(--text-warning)'
    : 'var(--text-secondary)';

  return (
    <span style={{ color, fontWeight: dias <= 30 ? 'var(--font-semibold)' : 'var(--font-regular)' }}>
      {dias < 0 ? `Vencido (${Math.abs(dias)}d)` : `${dias}d`}
    </span>
  );
}

export function PlazosDashboard({ onProjectSelect }) {
  const [plazos, setPlazos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await axios.get(`${API_URL}/plazos/dashboard`);
      setPlazos(r.data || []);
      setLastUpdate(new Date());
    } catch (e) {
      setError('No se pudieron cargar los plazos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rojos    = plazos.filter(p => p.semaforo === 'rojo');
  const amarillos = plazos.filter(p => p.semaforo === 'amarillo');
  const verdes   = plazos.filter(p => p.semaforo === 'verde');

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
            Plazos críticos
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {lastUpdate ? `Actualizado ${lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : 'Cargando...'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
            fontSize: 'var(--text-xs)', cursor: 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <IcoRefresh /> Actualizar
        </button>
      </div>

      {/* Resumen */}
      {!loading && plazos.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          {[
            { count: rojos.length,     label: 'Urgentes',  ...SEMAFORO_CONFIG.rojo },
            { count: amarillos.length, label: 'Atención',  ...SEMAFORO_CONFIG.amarillo },
            { count: verdes.length,    label: 'Al día',    ...SEMAFORO_CONFIG.verde },
          ].map(({ count, label, bg, border, text, dot }) => (
            <div key={label} style={{
              flex: 1, padding: 'var(--space-4)',
              background: bg, border: `1px solid ${border}`,
              borderRadius: 'var(--radius-lg)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: text }}>{count}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: text, opacity: 0.8, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-4)', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-error)', border: '1px solid var(--border-error)',
          color: 'var(--text-error)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)',
        }}>
          <IcoAlert /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          Cargando plazos...
        </div>
      )}

      {/* Sin datos */}
      {!loading && !error && plazos.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 'var(--space-12)',
          background: 'var(--bg-surface-1)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
            Sin plazos registrados
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-disabled)' }}>
            Los plazos se registran automáticamente cuando el CLP analiza el Paso 3 de un caso.
          </div>
        </div>
      )}

      {/* Tabla */}
      {!loading && plazos.length > 0 && (
        <div style={{
          background: 'var(--bg-surface-1)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Estado', 'Caso', 'Dominio', 'Norma', 'Vencimiento', 'Días'].map(h => (
                  <th key={h} style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                    fontSize: 'var(--table-header-size)',
                    fontWeight: 'var(--table-header-weight)',
                    letterSpacing: 'var(--table-header-tracking)',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-surface-2)',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plazos.map((p, i) => (
                <tr
                  key={p.id}
                  onClick={() => onProjectSelect?.(p.project_id)}
                  style={{
                    borderBottom: i < plazos.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    cursor: onProjectSelect ? 'pointer' : 'default',
                    transition: 'var(--transition-fast)',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <SemaforoBadge semaforo={p.semaforo} />
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: 280 }}>
                    <div style={{
                      fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.caso_nombre || '—'}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {p.dominio?.replace(/_/g, ' ') || '—'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {p.norma || '—'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {p.t_vencimiento
                        ? new Date(p.t_vencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>
                    <DiasRestantes dias={p.dias_restantes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PlazosDashboard;
