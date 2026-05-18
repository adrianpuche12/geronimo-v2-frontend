import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const TIPO_CONFIG = {
  nota:         { label: 'Nota',         color: 'var(--text-secondary)', dot: 'var(--border-strong)' },
  alerta:       { label: 'Alerta',       color: 'var(--text-warning)',   dot: 'var(--warning)' },
  recordatorio: { label: 'Recordatorio', color: 'var(--text-accent)',    dot: 'var(--accent)' },
};

const IcoPlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

function NotaCard({ nota, canEdit, onUpdate, onDelete }) {
  const [editing, setEditing]     = useState(false);
  const [titulo, setTitulo]       = useState(nota.titulo || '');
  const [contenido, setContenido] = useState(nota.contenido || '');
  const [saving, setSaving]       = useState(false);
  const cfg = TIPO_CONFIG[nota.tipo] || TIPO_CONFIG.nota;

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(nota.id, { titulo, contenido });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', borderBottom: editing ? '1px solid var(--border-subtle)' : 'none' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--text-2xs)', color: cfg.color, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{cfg.label}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-disabled)' }}>
          {new Date(nota.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
        </span>
        {canEdit && !editing && (
          <>
            <button onClick={() => setEditing(true)} title="Editar"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={() => onDelete(nota.id)} title="Archivar"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-error)', cursor: 'pointer', padding: 2 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </>
        )}
      </div>

      {editing ? (
        <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título (opcional)"
            style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2)', background: 'var(--bg-surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
          <textarea value={contenido} onChange={e => setContenido(e.target.value)} rows={3} placeholder="Contenido..."
            style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2)', background: 'var(--bg-surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'var(--font-body)' }} />
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 1, padding: 'var(--space-1) var(--space-3)', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => { setEditing(false); setTitulo(nota.titulo || ''); setContenido(nota.contenido || ''); }}
              style={{ padding: 'var(--space-1) var(--space-3)', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: 'var(--space-3)' }}>
          {nota.titulo && <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{nota.titulo}</div>}
          {nota.contenido && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 'var(--leading-relaxed)' }}>{nota.contenido}</div>}
          {!nota.titulo && !nota.contenido && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-disabled)', fontStyle: 'italic' }}>Nota vacía</div>}
        </div>
      )}
    </div>
  );
}

export function WorkspaceNotas({ workspaceId, miRol }) {
  const [notas, setNotas]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showNew, setShowNew]     = useState(false);
  const [newTitulo, setNewTitulo] = useState('');
  const [newContenido, setNewContenido] = useState('');
  const [newTipo, setNewTipo]     = useState('nota');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);

  const canEdit = miRol === 'RESPONSABLE' || miRol === 'COLABORADOR';

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/workspaces/${workspaceId}/notas`);
      setNotas(r.data || []);
    } catch { setError('No se pudieron cargar las notas.'); }
    finally { setLoading(false); }
  }, [workspaceId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/workspaces/${workspaceId}/notas`, { titulo: newTitulo || undefined, contenido: newContenido || undefined, tipo: newTipo });
      setNewTitulo(''); setNewContenido(''); setNewTipo('nota'); setShowNew(false);
      await load();
    } catch { setError('Error al crear la nota.'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (notaId, data) => {
    try {
      await axios.patch(`${API_URL}/workspaces/${workspaceId}/notas/${notaId}`, data);
      await load();
    } catch { setError('Error al actualizar la nota.'); }
  };

  const handleDelete = async (notaId) => {
    if (!window.confirm('¿Archivar esta nota?')) return;
    try {
      await axios.delete(`${API_URL}/workspaces/${workspaceId}/notas/${notaId}`);
      await load();
    } catch { setError('Error al archivar la nota.'); }
  };

  if (loading) return <div style={{ padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Cargando notas...</div>;

  return (
    <div style={{ padding: 'var(--space-4) var(--space-5)' }}>

      {error && (
        <div style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-error)', border: '1px solid var(--border-error)', borderRadius: 'var(--radius-md)', color: 'var(--text-error)', fontSize: 'var(--text-xs)' }}>
          {error}
        </div>
      )}

      {/* Nueva nota */}
      {canEdit && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          {showNew ? (
            <div style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input value={newTitulo} onChange={e => setNewTitulo(e.target.value)} placeholder="Título (opcional)"
                  style={{ flex: 1, fontSize: 'var(--text-xs)', padding: 'var(--space-2)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                <select value={newTipo} onChange={e => setNewTipo(e.target.value)}
                  style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                  <option value="nota">Nota</option>
                  <option value="alerta">Alerta</option>
                  <option value="recordatorio">Recordatorio</option>
                </select>
              </div>
              <textarea value={newContenido} onChange={e => setNewContenido(e.target.value)} rows={3} placeholder="Escribí tu nota..."
                style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'var(--font-body)' }} />
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button onClick={handleCreate} disabled={saving || (!newTitulo && !newContenido)}
                  style={{ flex: 1, padding: 'var(--space-2)', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Guardando...' : 'Guardar nota'}
                </button>
                <button onClick={() => { setShowNew(false); setNewTitulo(''); setNewContenido(''); setError(null); }}
                  style={{ padding: 'var(--space-2) var(--space-3)', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNew(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'transparent', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
              <IcoPlus /> Nueva nota
            </button>
          )}
        </div>
      )}

      {/* Lista de notas */}
      {notas.length === 0 && !showNew ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-disabled)', fontSize: 'var(--text-sm)' }}>
          Sin notas todavía
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {notas.map(n => (
            <NotaCard key={n.id} nota={n} canEdit={canEdit} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkspaceNotas;
