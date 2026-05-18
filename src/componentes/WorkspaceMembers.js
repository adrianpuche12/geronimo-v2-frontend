import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ROL_CONFIG = {
  RESPONSABLE: { label: 'Responsable', color: 'var(--text-accent)',   bg: 'var(--bg-accent-muted)',  border: 'var(--border-accent)' },
  COLABORADOR: { label: 'Colaborador', color: 'var(--text-success)',  bg: 'var(--bg-success)',       border: 'var(--border-success)' },
  LECTOR:      { label: 'Lector',      color: 'var(--text-muted)',    bg: 'var(--bg-surface-2)',     border: 'var(--border-default)' },
};

const IcoUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IcoPlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export function WorkspaceMembers({ workspaceId, miRol }) {
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [newUserId, setNewUserId]   = useState('');
  const [newRol, setNewRol]         = useState('COLABORADOR');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);

  const canManage = miRol === 'RESPONSABLE';

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/workspaces/${workspaceId}/members`);
      setMembers(r.data || []);
    } catch { setError('No se pudieron cargar los miembros.'); }
    finally { setLoading(false); }
  }, [workspaceId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newUserId.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${API_URL}/workspaces/${workspaceId}/members`, { user_id: newUserId.trim(), rol: newRol });
      setNewUserId(''); setShowAdd(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al agregar miembro.');
    } finally { setSaving(false); }
  };

  const handleChangeRol = async (userId, rol) => {
    try {
      await axios.patch(`${API_URL}/workspaces/${workspaceId}/members/${userId}`, { rol });
      await load();
    } catch { setError('Error al cambiar el rol.'); }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('¿Quitar este miembro del workspace?')) return;
    try {
      await axios.delete(`${API_URL}/workspaces/${workspaceId}/members/${userId}`);
      await load();
    } catch (e) { setError(e.response?.data?.message || 'Error al quitar el miembro.'); }
  };

  if (loading) return <div style={{ padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Cargando miembros...</div>;

  return (
    <div style={{ padding: 'var(--space-4) var(--space-5)' }}>

      {error && (
        <div style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-error)', border: '1px solid var(--border-error)', borderRadius: 'var(--radius-md)', color: 'var(--text-error)', fontSize: 'var(--text-xs)' }}>
          {error}
        </div>
      )}

      {/* Lista de miembros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {members.map(m => {
          const cfg = ROL_CONFIG[m.rol] || ROL_CONFIG.LECTOR;
          return (
            <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                <IcoUser />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.user_id}
                </div>
              </div>
              {canManage && m.rol !== 'RESPONSABLE' ? (
                <select
                  value={m.rol}
                  onChange={e => handleChangeRol(m.user_id, e.target.value)}
                  style={{ fontSize: 'var(--text-xs)', padding: '2px 6px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 'var(--radius-full)', color: cfg.color, cursor: 'pointer' }}
                >
                  <option value="COLABORADOR">Colaborador</option>
                  <option value="LECTOR">Lector</option>
                </select>
              ) : (
                <span style={{ fontSize: 'var(--text-2xs)', padding: '2px 8px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 'var(--radius-full)', color: cfg.color, fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {cfg.label}
                </span>
              )}
              {canManage && m.rol !== 'RESPONSABLE' && (
                <button onClick={() => handleRemove(m.user_id)} title="Quitar miembro"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-error)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Agregar miembro */}
      {canManage && (
        showAdd ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--bg-surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
            <input
              placeholder="ID de usuario (UUID de Supabase)"
              value={newUserId}
              onChange={e => setNewUserId(e.target.value)}
              style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            />
            <select value={newRol} onChange={e => setNewRol(e.target.value)}
              style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
              <option value="COLABORADOR">Colaborador</option>
              <option value="LECTOR">Lector</option>
            </select>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button onClick={handleAdd} disabled={saving || !newUserId.trim()}
                style={{ flex: 1, padding: 'var(--space-2)', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Agregando...' : 'Agregar'}
              </button>
              <button onClick={() => { setShowAdd(false); setNewUserId(''); setError(null); }}
                style={{ padding: 'var(--space-2) var(--space-3)', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'transparent', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
            <IcoPlus /> Agregar miembro
          </button>
        )
      )}
    </div>
  );
}

export default WorkspaceMembers;
