import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Users.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const ROLE_LABELS = { ROOT: 'Root', SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin' };

export const Users = () => {
  const { isRoot, user: currentUser } = useAuth();
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showInvite, setShowInvite]     = useState(false);
  const [inviteEmail, setInviteEmail]   = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole]     = useState('ADMIN');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError]   = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [deleteLoading, setDeleteLoading]   = useState(false);
  const [deleteError, setDeleteError]       = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/users`);
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);
    try {
      await axios.post(`${API_URL}/users/invite`, {
        email: inviteEmail.trim(),
        fullName: inviteFullName.trim() || undefined,
        role: inviteRole,
      });
      setInviteSuccess('Invitacion enviada a ' + inviteEmail);
      setInviteEmail(''); setInviteFullName(''); setInviteRole('ADMIN');
      await loadUsers();
      setTimeout(() => { setShowInvite(false); setInviteSuccess(''); }, 2000);
    } catch (err) {
      setInviteError((err.response && err.response.data && err.response.data.message) || 'Error al enviar la invitacion');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResendAccess = async (userId, email) => {
    setActionLoading(userId + '-resend');
    try {
      await axios.post(`${API_URL}/users/${userId}/resend-access`);
      alert('Nuevo acceso enviado a ' + email);
    } catch (err) {
      alert((err.response && err.response.data && err.response.data.message) || 'Error al reenviar acceso');
    } finally { setActionLoading(null); }
  };

  const handleDeactivate = async (userId, name) => {
    if (!window.confirm('Desactivar al usuario "' + name + '"?')) return;
    setActionLoading(userId + '-deactivate');
    try {
      await axios.delete(`${API_URL}/users/${userId}`);
      await loadUsers();
    } catch (err) {
      alert((err.response && err.response.data && err.response.data.message) || 'Error al desactivar usuario');
    } finally { setActionLoading(null); }
  };

  const handleDeletePermanent = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await axios.delete(`${API_URL}/users/${deleteConfirm.userId}/permanent`);
      setDeleteConfirm(null);
      await loadUsers();
    } catch (err) {
      setDeleteError((err.response && err.response.data && err.response.data.message) || 'Error al eliminar usuario');
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeInvite = () => {
    setShowInvite(false); setInviteEmail(''); setInviteFullName('');
    setInviteRole('ADMIN'); setInviteError(''); setInviteSuccess('');
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <h2 className="users-title">Usuarios</h2>
        <p style={{margin:"2px 0 0",fontSize:"var(--text-xs)",color:"var(--text-tertiary)"}}>Gestioná los miembros de tu organización y sus niveles de acceso</p>
        <button className="users-invite-btn" onClick={() => setShowInvite(true)}>
          + Invitar usuario
        </button>
      </div>

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="users-empty">Cargando usuarios...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="users-empty">No hay usuarios registrados.</td></tr>
            ) : users.filter(u => u.email !== currentUser?.email).map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="users-name">{u.full_name || u.email}</div>
                  <div className="users-email">{u.email}</div>
                </td>
                <td>
                  <span className={'users-role-badge users-role-badge--' + (u.role || '').toLowerCase()}>
                    {ROLE_LABELS[u.role] || u.role || 'Sin rol'}
                  </span>
                </td>
                <td>
                  {u.first_login ? (
                    <span className="users-status-badge users-status-badge--pending">Pendiente primer acceso</span>
                  ) : (
                    <span className="users-status-badge users-status-badge--active">Activo</span>
                  )}
                </td>
                <td>
                  <div className="users-actions">
                    {u.first_login && (
                      <button
                        className="users-action-btn users-action-btn--resend"
                        onClick={() => handleResendAccess(u.id, u.email)}
                        disabled={actionLoading === u.id + '-resend'}>
                        {actionLoading === u.id + '-resend' ? '...' : 'Reenviar acceso'}
                      </button>
                    )}
                    {isRoot && (
                      <button
                        className="users-action-btn users-action-btn--deactivate"
                        onClick={() => handleDeactivate(u.id, u.full_name || u.email)}
                        disabled={actionLoading === u.id + '-deactivate'}>
                        {actionLoading === u.id + '-deactivate' ? '...' : 'Desactivar'}
                      </button>
                    )}
                    {isRoot && (
                      <button
                        className="users-action-btn users-action-btn--delete"
                        onClick={() => { setDeleteError(''); setDeleteConfirm({ userId: u.id, name: u.full_name || u.email }); }}
                        disabled={!!actionLoading}>
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <div className="users-modal-overlay" onClick={closeInvite}>
          <div className="users-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Invitar usuario</h3>
            {inviteSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: 'var(--text-success)', margin: 0, fontSize: '1.1rem' }}>{inviteSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleInvite}>
                {inviteError && <div className="users-modal-error">{inviteError}</div>}
                <div className="users-modal-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    required
                    autoFocus
                    disabled={inviteLoading}
                  />
                </div>
                <div className="users-modal-field">
                  <label>Nombre completo</label>
                  <input
                    type="text"
                    value={inviteFullName}
                    onChange={(e) => setInviteFullName(e.target.value)}
                    placeholder="Nombre Apellido"
                    disabled={inviteLoading}
                  />
                </div>
                {isRoot && (
                  <div className="users-modal-field">
                    <label>Rol</label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} disabled={inviteLoading}>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                )}
                <div className="users-modal-actions">
                  <button type="button" className="users-modal-cancel" onClick={closeInvite}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="users-modal-submit"
                    disabled={inviteLoading || !inviteEmail.trim()}>
                    {inviteLoading ? 'Enviando...' : 'Enviar invitacion'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="users-modal-overlay" onClick={() => { if (!deleteLoading) setDeleteConfirm(null); }}>
          <div className="users-modal users-modal--danger" onClick={(e) => e.stopPropagation()}>
            <div className="users-delete-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <h3>Eliminar usuario</h3>
            <p className="users-delete-warning">
              Estás por eliminar permanentemente a <strong>{deleteConfirm.name}</strong>. Esta acción no se puede deshacer — el usuario perderá acceso inmediatamente.
            </p>
            {deleteError && <div className="users-modal-error">{deleteError}</div>}
            <div className="users-modal-actions">
              <button
                type="button"
                className="users-modal-cancel"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteLoading}>
                Cancelar
              </button>
              <button
                type="button"
                className="users-modal-submit users-modal-submit--danger"
                onClick={handleDeletePermanent}
                disabled={deleteLoading}>
                {deleteLoading ? 'Eliminando...' : 'Sí, eliminar usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
