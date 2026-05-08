import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/sessions.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now - date) / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return date.toLocaleDateString('es-AR', { day:'numeric', month:'short' });
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export function SessionPanel({ projectId, activeSessionId, onSelectSession, onNewSession, onDeleteSession, collapsed, projects, showAll }) {
  const [sessions, setSessions] = useState([]);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadSessions = () => {
    const url = showAll
      ? API_URL + '/sessions'
      : projectId ? API_URL + '/sessions?projectId=' + projectId : null;
    if (!url) return;
    axios.get(url).then(r => setSessions(r.data)).catch(() => {});
  };

  useEffect(() => { loadSessions(); }, [projectId, activeSessionId]);

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
    <div className="sessions-panel">
      <div className="sessions-header">
        <span className="sessions-header-title">Historial</span>
        <button className="sessions-new-btn" onClick={onNewSession} title="Nueva conversación">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      <div className="sessions-list">
        {sessions.length === 0 && (
          <div className="sessions-empty">
            <p>Sin conversaciones aún</p>
            <p className="sessions-empty-hint">Las conversaciones del chat se guardan aquí automáticamente.</p>
          </div>
        )}
        {sessions.map(s => (
          <div
            key={s.id}
            className={`session-item${s.id === activeSessionId ? ' session-item--active' : ''}`}
            onClick={() => onSelectSession(s)}
            onMouseEnter={() => setHoveredId(s.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="session-item-content">
              <div className="session-item-title">
                {renamingId === s.id ? (
                  <input
                    autoFocus
                    className="session-rename-input"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(s.id)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(s.id); if (e.key === 'Escape') setRenamingId(null); }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (s.title || 'Conversación')}
              </div>
              <div className="session-item-meta">
                <span>{formatDate(s.updated_at)}</span>
                {showAll && s.project_id && projects && (() => {
                  const proj = projects.find(p => p.id === s.project_id);
                  return proj ? <span className="session-item-proj">· {proj.name}</span> : null;
                })()}
              </div>
            </div>
            {(hoveredId === s.id || s.id === activeSessionId) && (
              <div className="session-item-actions">
                <button
                  className="session-action-btn"
                  title="Renombrar"
                  onClick={e => { e.stopPropagation(); setRenameValue(s.title || 'Conversación'); setRenamingId(s.id); }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button
                  className={`session-action-btn session-action-btn--danger${deletingId === s.id ? ' session-action-btn--deleting' : ''}`}
                  title="Eliminar conversación"
                  onClick={e => handleDelete(e, s.id)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
