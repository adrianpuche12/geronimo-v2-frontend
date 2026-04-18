import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export function SessionPanel({ projectId, activeSessionId, onSelectSession, onNewSession, onDeleteSession, collapsed }) {
  const [sessions, setSessions] = useState([]);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadSessions = () => {
    if (!projectId) return;
    axios.get(API_URL + '/sessions?projectId=' + projectId)
      .then(r => setSessions(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadSessions();
  }, [projectId, activeSessionId]);

  const handleRename = async (sessionId) => {
    const title = renameValue.trim();
    if (!title) { setRenamingId(null); return; }
    await axios.patch(API_URL + '/sessions/' + sessionId + '/rename', { title });
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
    setRenamingId(null);
  };

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    try {
      await axios.delete(API_URL + '/sessions/' + sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (sessionId === activeSessionId) onDeleteSession?.();
    } catch (_) {}
    setDeletingId(null);
  };

  if (collapsed) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Historial</span>
        <button
          onClick={onNewSession}
          title="Nueva conversación"
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 4px', borderRadius: 4 }}
        >+</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {sessions.length === 0 && (
          <div style={{ padding: '16px', color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>
            Sin historial aún
          </div>
        )}
        {sessions.map(s => (
          <div
            key={s.id}
            onClick={() => onSelectSession(s)}
            onMouseEnter={() => setHoveredId(s.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              padding: '10px 12px 10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: s.id === activeSessionId ? 'var(--bg-accent-subtle)' : hoveredId === s.id ? 'var(--bg-hover)' : 'transparent',
              borderLeft: s.id === activeSessionId ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'background 0.15s',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: s.id === activeSessionId ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {renamingId === s.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(s.id)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(s.id); if (e.key === 'Escape') setRenamingId(null); }}
                    onClick={e => e.stopPropagation()}
                    style={{width:'100%',background:'var(--bg-surface-2)',border:'1px solid var(--border-focus)',borderRadius:4,padding:'2px 6px',color:'var(--text-primary)',fontSize:13,fontFamily:'var(--font-body)'}}
                  />
                ) : (s.title || 'Conversación')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{timeAgo(s.updated_at)}</div>
            </div>
            {(hoveredId === s.id || s.id === activeSessionId) && (
              <>
              <button
                title="Renombrar"
                onClick={(e) => { e.stopPropagation(); setRenameValue(s.title || 'Conversación'); setRenamingId(s.id); }}
                style={{ background:'none',border:'none',cursor:'pointer',flexShrink:0,color:'var(--text-tertiary)',padding:'3px 5px',borderRadius:4,display:'flex',alignItems:'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button
                title="Eliminar conversación"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                  color: 'var(--text-tertiary)', padding: '3px 5px', borderRadius: 4,
                  opacity: deletingId === s.id ? 0.4 : 1,
                  display: 'flex', alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
