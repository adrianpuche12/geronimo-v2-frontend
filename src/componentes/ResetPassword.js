import { LexiiusIcon } from './LexiiusLogo';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.png';
import '../styles/Login.css';
import '../styles/SetPassword.css';

export const ResetPassword = () => {
  const { clearPasswordRecovery, signOut } = useAuth();

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [showConf, setShowConf]   = useState(false);

  const rules = [
    { label: 'Mínimo 8 caracteres',       ok: password.length >= 8 },
    { label: 'Al menos una mayúscula',     ok: /[A-Z]/.test(password) },
    { label: 'Al menos un número',         ok: /[0-9]/.test(password) },
    { label: 'Las contraseñas coinciden',  ok: password === confirm && confirm !== '' },
  ];
  const allOk = rules.every(r => r.ok);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allOk) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  };

  const handleContinue = async () => {
    await signOut();
    clearPasswordRecovery();
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

        {done ? (
          <div className="login-content">
            <div className="login-sent-icon">✓</div>
            <h2>Contraseña actualizada</h2>
            <p className="login-description">
              Tu contraseña fue cambiada correctamente. Iniciá sesión con tus nuevas credenciales.
            </p>
            <button className="login-button" onClick={handleContinue}>
              Ir al inicio de sesión
            </button>
            <div className="login-footer">
              <p>Lexiius v{process.env.REACT_APP_VERSION || '2.5.0'}</p>
            </div>
          </div>
        ) : (
          <form className="login-content" onSubmit={handleSubmit}>
            <h2>Nueva contraseña</h2>
            <p className="login-description">
              Elegí una contraseña segura para tu cuenta.
            </p>

            <div className="login-field">
              <label htmlFor="rp-password">Nueva contraseña</label>
              <div className="login-input-wrap">
                <input
                  id="rp-password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password" disabled={loading} autoFocus
                />
                <button type="button" className="login-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                  {showPw ? (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="rp-confirm">Confirmar contraseña</label>
              <div className="login-input-wrap">
                <input
                  id="rp-confirm" type={showConf ? 'text' : 'password'} value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password" disabled={loading}
                />
                <button type="button" className="login-pw-toggle" onClick={() => setShowConf(v => !v)} tabIndex={-1}>
                  {showConf ? (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
                </button>
              </div>
            </div>

            {/* Checklist */}
            {password.length > 0 && (
              <ul className="sp-checklist">
                {rules.map((r, i) => (
                  <li key={i} className={r.ok ? 'sp-check sp-check--ok' : 'sp-check'}>
                    <span className="sp-check-icon">{r.ok ? '✓' : '○'}</span>
                    {r.label}
                  </li>
                ))}
              </ul>
            )}

            {error && <div className="login-error"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> {error}</div>}

            <button type="submit" className="login-button" disabled={loading || !allOk}>
              {loading ? <span className="login-spinner" /> : 'Guardar contraseña'}
            </button>

            <div className="login-footer">
              <p>Lexiius v{process.env.REACT_APP_VERSION || '2.5.0'}</p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
