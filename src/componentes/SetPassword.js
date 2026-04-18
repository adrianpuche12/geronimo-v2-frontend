import { LexiiusIcon } from './LexiiusLogo';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.png';
import '../styles/Login.css';
import '../styles/SetPassword.css';

export const SetPassword = () => {
  const { changePassword, signOut, user } = useAuth();

  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(pwd)) return 'Al menos 1 letra mayúscula';
    if (!/[0-9]/.test(pwd)) return 'Al menos 1 número';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return 'Al menos 1 símbolo (!@#$%^&*)';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwdError = validatePassword(newPassword);
    if (pwdError) { setError(pwdError); return; }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPassword);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al cambiar contraseña';
      if (msg.includes('vencido') || msg.includes('expired')) {
        setError('Tu acceso temporal venció. Contactá al administrador para recibir un nuevo acceso.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-header">
          <div className="login-logo-wrap">
            <LexiiusIcon size={56} />
          </div>
          <h1>Lexiius</h1>
          <p>Gestión de conocimiento empresarial con IA</p>
        </div>
        <div className="login-divider" />

        <form className="login-content" onSubmit={handleSubmit}>
          <h2>Crear contraseña</h2>
          <p className="set-password-subtitle">
            Bienvenido{user?.fullName ? `, ${user.fullName}` : ''}. Antes de continuar, creá una contraseña segura para tu cuenta.
          </p>

          <div className="password-requirements">
            <p>Tu nueva contraseña debe tener:</p>
            <ul>
              <li className={newPassword.length >= 8 ? 'req-ok' : ''}>Mínimo 8 caracteres</li>
              <li className={/[A-Z]/.test(newPassword) ? 'req-ok' : ''}>Al menos 1 mayúscula</li>
              <li className={/[0-9]/.test(newPassword) ? 'req-ok' : ''}>Al menos 1 número</li>
              <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'req-ok' : ''}>Al menos 1 símbolo</li>
            </ul>
          </div>

          <div className="login-field">
            <label htmlFor="new-password">Nueva contraseña</label>
            <div className="login-input-wrap">
              <input
                id="new-password" type={showNew ? 'text' : 'password'} value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password" disabled={loading}
              />
              <button type="button" className="login-pw-toggle" onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                {showNew ? (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
              </button>
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="confirm-password">Confirmar contraseña</label>
            <div className="login-input-wrap">
              <input
                id="confirm-password" type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repetí la contraseña"
                autoComplete="new-password" disabled={loading}
              />
              <button type="button" className="login-pw-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                {showConfirm ? (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> {error}</div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <span className="login-spinner" /> : 'Crear contraseña'}
          </button>

          <div className="login-footer">
            <button type="button" className="set-password-logout" onClick={signOut}>
              Cerrar sesión
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
