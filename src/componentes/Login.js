import { LexiiusIcon } from './LexiiusLogo';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import logo from '../assets/images/logo.png';
import '../styles/Login.css';

const EyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const EyeOn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const PwToggle = ({ show, onToggle }) => (
  <button type="button" className="login-pw-toggle" onClick={onToggle} tabIndex={-1}>
    {show ? <EyeOff /> : <EyeOn />}
  </button>
);
const ErrMsg = ({ msg }) => (
  <div className="login-error">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    {msg}
  </div>
);
const Footer = () => (
  <div className="login-footer">
    <p>Lexiius v{process.env.REACT_APP_VERSION || '2.5.0'}</p>
  </div>
);

export const Login = () => {
  const { signIn } = useAuth();
  const [view, setView]           = useState('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('register') === 'true') setView('register');
  }, []);

  const goTo = (v) => { setError(''); setView(v); };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Completá email y contraseña'); return; }
    setLoading(true); setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      const msg = err.message || 'Error al iniciar sesión';
      if (msg.includes('Invalid login credentials')) setError('Email o contraseña incorrectos');
      else if (msg.includes('Email not confirmed')) setError('Confirmá tu email antes de ingresar');
      else setError(msg);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Completá todos los campos'); return; }
    if (password !== confirmPw) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) throw err;
      setView('verify');
    } catch (err) {
      const msg = err.message || 'Error al crear la cuenta';
      if (msg.includes('already registered')) setError('Este email ya tiene una cuenta. Iniciá sesión.');
      else setError(msg);
    } finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true); setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: process.env.REACT_APP_BASE_URL || window.location.origin,
    });
    setForgotLoading(false);
    if (err) setError(err.message);
    else setView('sent');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-wrap">
            <LexiiusIcon size={56} />
          </div>
          <h1>Lexiius</h1>
          <p>Gestion de conocimiento empresarial con IA</p>
        </div>
        <div className="login-divider" />

        {view === 'login' && (
          <form className="login-content" onSubmit={handleLogin}>
            <h2>Iniciar sesion</h2>
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@empresa.com" autoComplete="email" disabled={loading} />
            </div>
            <div className="login-field">
              <label htmlFor="password">Contrasena</label>
              <div className="login-input-wrap">
                <input id="password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="password"
                  autoComplete="current-password" disabled={loading} />
                <PwToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
              </div>
            </div>
            {error && <ErrMsg msg={error} />}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? <span className="login-spinner" /> : 'Ingresar'}
            </button>
            <button type="button" className="login-link" onClick={() => { setError(''); setForgotEmail(email); setView('forgot'); }}>
              Olvidaste tu contrasena?
            </button>
            <div className="login-divider" style={{margin:'8px 0'}} />
            <button type="button" className="login-button login-button--secondary" onClick={() => goTo('register')}>
              Comenzar gratis
            </button>
            <Footer />
          </form>
        )}

        {view === 'register' && (
          <form className="login-content" onSubmit={handleRegister}>
            <h2>Crear cuenta</h2>
            <div className="login-field">
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@empresa.com" autoComplete="email" disabled={loading} autoFocus />
            </div>
            <div className="login-field">
              <label htmlFor="reg-pw">Contrasena</label>
              <div className="login-input-wrap">
                <input id="reg-pw" type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Minimo 6 caracteres"
                  autoComplete="new-password" disabled={loading} />
                <PwToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
              </div>
            </div>
            <div className="login-field">
              <label htmlFor="reg-confirm">Confirmar contrasena</label>
              <div className="login-input-wrap">
                <input id="reg-confirm" type={showConfirmPw ? 'text' : 'password'} value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)} placeholder="Repeti tu contrasena"
                  autoComplete="new-password" disabled={loading} />
                <PwToggle show={showConfirmPw} onToggle={() => setShowConfirmPw(v => !v)} />
              </div>
            </div>
            {error && <ErrMsg msg={error} />}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? <span className="login-spinner" /> : 'Crear cuenta'}
            </button>
            <button type="button" className="login-link" onClick={() => goTo('login')}>
              Ya tengo cuenta
            </button>
            <Footer />
          </form>
        )}

        {view === 'verify' && (
          <div className="login-content">
            <div className="login-sent-icon">OK</div>
            <h2>Cuenta creada</h2>
            <p className="login-description">
              Te enviamos un email de confirmacion a{' '}
              <strong className="login-description-email">{email}</strong>
            </p>
            <p className="login-description login-description--hint">
              Hace clic en el enlace para activar tu cuenta. Si no lo ves, revisa spam.
            </p>
            <button type="button" className="login-button" onClick={() => goTo('login')}>
              Volver al inicio de sesion
            </button>
            <Footer />
          </div>
        )}

        {view === 'forgot' && (
          <form className="login-content" onSubmit={handleForgot}>
            <h2>Restablecer contrasena</h2>
            <p className="login-description">Ingresa tu email y te enviamos un enlace para crear una nueva contrasena.</p>
            <div className="login-field">
              <label htmlFor="forgot-email">Email</label>
              <input id="forgot-email" type="email" value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)} placeholder="tu@empresa.com"
                autoComplete="email" disabled={forgotLoading} autoFocus />
            </div>
            {error && <ErrMsg msg={error} />}
            <button type="submit" className="login-button" disabled={forgotLoading || !forgotEmail}>
              {forgotLoading ? <span className="login-spinner" /> : 'Enviar enlace'}
            </button>
            <button type="button" className="login-link" onClick={() => goTo('login')}>
              Volver al inicio de sesion
            </button>
            <Footer />
          </form>
        )}

        {view === 'sent' && (
          <div className="login-content">
            <div className="login-sent-icon">OK</div>
            <h2>Email enviado</h2>
            <p className="login-description">
              Revisa tu bandeja. Enviamos un enlace de recuperacion a{' '}
              <strong className="login-description-email">{forgotEmail}</strong>
            </p>
            <p className="login-description login-description--hint">
              Si no lo ves en unos minutos, revisa spam.
            </p>
            <button type="button" className="login-button" onClick={() => goTo('login')}>
              Volver al inicio de sesion
            </button>
            <Footer />
          </div>
        )}

      </div>
    </div>
  );
};
