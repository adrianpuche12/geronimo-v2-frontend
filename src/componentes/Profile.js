import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/Profile.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ROLE_LABELS = { ROOT: 'Root', SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin' };

export const Profile = ({ onBack, onProfileUpdated }) => {
  const { user, role, updateProfile } = useAuth();

  // -- Datos personales --
  const [fullName, setFullName]       = useState(user?.fullName || '');
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');
  const [saveError, setSaveError]     = useState('');

  // -- Cambiar contraseña --
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving]             = useState(false);
  const [pwdMsg, setPwdMsg]                   = useState('');
  const [pwdError, setPwdError]               = useState('');

  const getInitials = () => {
    if (!user) return 'U';
    const name = user.fullName || user.email || '';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) { setSaveError('El nombre no puede estar vacío'); return; }
    setSaving(true); setSaveError(''); setSaveMsg('');
    try {
      await axios.patch(`${API_URL}/users/me`, { fullName: fullName.trim() });
      if (updateProfile) await updateProfile(fullName.trim());
      setSaveMsg('Perfil actualizado correctamente');
      if (onProfileUpdated) onProfileUpdated(fullName.trim());
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8)           return 'Minimo 8 caracteres';
    if (!/[A-Z]/.test(pwd))       return 'Debe incluir una mayuscula';
    if (!/[0-9]/.test(pwd))       return 'Debe incluir un numero';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return 'Debe incluir un simbolo';
    return null;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError(''); setPwdMsg('');

    const validationError = validatePassword(newPassword);
    if (validationError) { setPwdError(validationError); return; }
    if (newPassword !== confirmPassword) { setPwdError('Las contrasenas no coinciden'); return; }

    setPwdSaving(true);
    try {
      // Re-authenticate first to verify current password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInErr) { setPwdError('La contrasena actual es incorrecta'); setPwdSaving(false); return; }

      // Update password via Supabase
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw new Error(updateErr.message);

      setPwdMsg('Contrasena actualizada correctamente');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPwdMsg(''), 3000);
    } catch (err) {
      setPwdError(err.message || 'Error al cambiar la contrasena');
    } finally {
      setPwdSaving(false);
    }
  };

  const pwdReqs = [
    { label: 'Minimo 8 caracteres',   ok: newPassword.length >= 8 },
    { label: 'Una letra mayuscula',    ok: /[A-Z]/.test(newPassword) },
    { label: 'Un numero',              ok: /[0-9]/.test(newPassword) },
    { label: 'Un simbolo (!@#$...)',   ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
  ];

  return (
    <div className="profile-container">
      <div className="profile-header" style={{display:'flex',alignItems:'center',gap:'var(--space-3)'}}>
        {onBack && <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4,fontSize:'var(--text-sm)',padding:'4px 8px',borderRadius:'var(--radius-sm)'}} onMouseEnter={e=>e.currentTarget.style.color='var(--text-primary)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Volver</button>}
        <h2 className="profile-title">Mi Perfil</h2>
      </div>

      <div className="profile-body">

        {/* Avatar + info */}
        <div className="profile-avatar-card">
          <div className="profile-avatar-large">{getInitials()}</div>
          <div className="profile-avatar-info">
            <div className="profile-avatar-name">{user?.fullName || user?.email}</div>
            <div className="profile-avatar-email">{user?.email}</div>
            <span className="profile-avatar-role">{ROLE_LABELS[role] || role}</span>
          </div>
        </div>

        <div className="profile-cards">

          {/* Card: Datos personales */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 className="profile-card-title">Datos personales</h3>
              <p className="profile-card-subtitle">Tu nombre visible en la aplicacion</p>
            </div>
            <form onSubmit={handleSaveProfile} className="profile-form">
              {saveError && <div className="profile-msg profile-msg--error">{saveError}</div>}
              {saveMsg   && <div className="profile-msg profile-msg--success">{saveMsg}</div>}

              <div className="profile-field">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  disabled={saving}
                />
              </div>

              <div className="profile-field">
                <label>Email</label>
                <input type="email" value={user?.email || ''} disabled readOnly
                  className="profile-input--readonly" />
                <span className="profile-field-hint">El email no se puede modificar</span>
              </div>

              <div className="profile-form-actions">
                <button type="submit" className="profile-btn-save" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>

          {/* Card: Seguridad */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h3 className="profile-card-title">Seguridad</h3>
              <p className="profile-card-subtitle">Cambia tu contrasena de acceso</p>
            </div>
            <form onSubmit={handleChangePassword} className="profile-form">
              {pwdError && <div className="profile-msg profile-msg--error">{pwdError}</div>}
              {pwdMsg   && <div className="profile-msg profile-msg--success">{pwdMsg}</div>}

              <div className="profile-field">
                <label>Contrasena actual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={pwdSaving}
                  autoComplete="current-password"
                />
              </div>

              <div className="profile-field">
                <label>Nueva contrasena</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={pwdSaving}
                  autoComplete="new-password"
                />
                {newPassword.length > 0 && (
                  <ul className="profile-pwd-reqs">
                    {pwdReqs.map((r) => (
                      <li key={r.label} className={r.ok ? 'req-ok' : 'req-pending'}>
                        {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="profile-field">
                <label>Confirmar nueva contrasena</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={pwdSaving}
                  autoComplete="new-password"
                />
              </div>

              <div className="profile-form-actions">
                <button type="submit" className="profile-btn-save" disabled={pwdSaving || !currentPassword || !newPassword || !confirmPassword}>
                  {pwdSaving ? 'Actualizando...' : 'Cambiar contrasena'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
