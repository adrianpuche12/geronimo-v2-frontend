import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Settings.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const PLAN_LABELS = {
  free:       { label: 'Free',       color: 'var(--text-muted)' },
  pro:        { label: 'Pro',        color: 'var(--text-accent)' },
  business:   { label: 'Business',   color: 'var(--text-success)' },
  enterprise: { label: 'Enterprise', color: 'var(--text-warning)' },
};

const PLAN_LIMITS = {
  free:       { users: 1,        storage: '300 MB' },
  pro:        { users: 5,        storage: '10 GB' },
  business:   { users: 15,       storage: '50 GB' },
  enterprise: { users: 'Ilimitados', storage: 'Personalizado' },
};

export const Settings = () => {
  const { user, isRoot } = useAuth();

  const [settings, setSettings]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [orgName, setOrgName]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');
  const [saveError, setSaveError] = useState('');
  const [theme, setTheme]         = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
  const [usage, setUsage]         = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('lexiius-theme');
    if (saved) { document.documentElement.setAttribute('data-theme', saved); setTheme(saved); }
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/settings/usage`).then(({ data }) => setUsage(data)).catch(() => {});
    axios.get(`${API_URL}/settings`).then(({ data }) => {
      setSettings(data);
      setOrgName(data.org_name || '');
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggleTheme = (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('lexiius-theme', newTheme);
    setTheme(newTheme);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) { setSaveError('El nombre no puede estar vacio'); return; }
    setSaving(true); setSaveError(''); setSaveMsg('');
    try {
      const { data } = await axios.patch(`${API_URL}/settings`, { orgName: orgName.trim() });
      setSettings(data);
      setSaveMsg('Configuracion guardada');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="settings-loading">Cargando...</div>;

  const plan = settings?.plan || 'free';
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.free;
  const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const createdAt = settings?.created_at
    ? new Date(settings.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2 className="settings-title">Configuracion</h2>
      </div>

      <div className="settings-cards">

        {/* Organizacion */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">Organizacion</h3>
            <p className="settings-card-subtitle">Nombre visible en la aplicacion</p>
          </div>
          <form onSubmit={handleSave} className="settings-form">
            {saveError && <div className="settings-msg settings-msg--error">{saveError}</div>}
            {saveMsg   && <div className="settings-msg settings-msg--success">{saveMsg}</div>}
            <div className="settings-field">
              <label>Nombre de la organizacion</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Nombre de tu empresa"
                disabled={saving || !isRoot}
                className={!isRoot ? 'settings-input--readonly' : ''}
              />
              {!isRoot && <span className="settings-field-hint">Solo el ROOT puede modificar este campo</span>}
            </div>
            {isRoot && (
              <div className="settings-form-actions">
                <button type="submit" className="settings-btn-save" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Apariencia */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">Apariencia</h3>
            <p className="settings-card-subtitle">Tema de la interfaz</p>
          </div>
          <div className="settings-theme">
            <button
              className={`settings-theme-btn${theme === 'dark' ? ' settings-theme-btn--active' : ''}`}
              onClick={() => toggleTheme('dark')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              Oscuro
            </button>
            <button
              className={`settings-theme-btn${theme === 'light' ? ' settings-theme-btn--active' : ''}`}
              onClick={() => toggleTheme('light')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              Claro
            </button>
          </div>
        </div>

        {/* Plan */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">Plan actual</h3>
            <p className="settings-card-subtitle">Tu suscripcion y limites</p>
          </div>
          <div className="settings-plan">
            <div className="settings-plan-badge" style={{ color: planInfo.color }}>
              {planInfo.label}
            </div>
            <div className="settings-plan-limits">
              <div className="settings-plan-row">
                <span className="settings-plan-label">Usuarios</span>
                <span className="settings-plan-value">{planLimits.users}</span>
              </div>
              <div className="settings-plan-row">
                <span className="settings-plan-label">Almacenamiento</span>
                <span className="settings-plan-value">{planLimits.storage}</span>
              </div>
            </div>
            <p className="settings-plan-hint">Para cambiar de plan contacta a soporte.</p>
          </div>
        </div>

        {/* Uso actual */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">Uso actual</h3>
            <p className="settings-card-subtitle">Consumo de tu plan {planInfo.label}</p>
          </div>
          <div className="settings-usage">
            {usage ? (() => {
              const storageLimitMB = plan === 'free' ? 300 : plan === 'pro' ? 10240 : plan === 'business' ? 51200 : null;
              const storagePct = storageLimitMB ? Math.min(100, Math.round((usage.storage_used_mb / storageLimitMB) * 100)) : 0;
              const usersLimit = PLAN_LIMITS[plan]?.users;
              const usersPct   = typeof usersLimit === 'number' ? Math.min(100, Math.round((usage.user_count / usersLimit) * 100)) : 0;
              return (
                <>
                  <div className="settings-usage-item">
                    <div className="settings-usage-label">
                      <span>Almacenamiento</span>
                      <span className="settings-usage-value">
                        {usage.storage_used_mb} MB
                        {storageLimitMB && <span className="settings-usage-limit"> / {storageLimitMB >= 1024 ? (storageLimitMB/1024)+'GB' : storageLimitMB+'MB'}</span>}
                      </span>
                    </div>
                    <div className="settings-usage-bar">
                      <div className="settings-usage-fill" style={{width: storagePct+'%', background: storagePct > 85 ? 'var(--text-error,#f87171)' : 'var(--accent)'}}/>
                    </div>
                    <span className="settings-usage-sub">{usage.doc_count} documento{usage.doc_count !== 1 ? 's' : ''} indexado{usage.doc_count !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="settings-usage-item">
                    <div className="settings-usage-label">
                      <span>Consultas realizadas</span>
                      <span className="settings-usage-value">{usage.query_count}</span>
                    </div>
                    <span className="settings-usage-sub">{usage.session_count} sesión{usage.session_count !== 1 ? 'es' : ''} en total</span>
                  </div>

                  <div className="settings-usage-item">
                    <div className="settings-usage-label">
                      <span>Usuarios</span>
                      <span className="settings-usage-value">
                        {usage.user_count}
                        {typeof usersLimit === 'number' && <span className="settings-usage-limit"> / {usersLimit}</span>}
                      </span>
                    </div>
                    {typeof usersLimit === 'number' && (
                      <div className="settings-usage-bar">
                        <div className="settings-usage-fill" style={{width: usersPct+'%', background: usersPct > 85 ? 'var(--text-error,#f87171)' : 'var(--accent)'}}/>
                      </div>
                    )}
                  </div>
                </>
              );
            })() : (
              <p style={{color:'var(--text-disabled)',fontSize:'var(--text-sm)'}}>Cargando métricas...</p>
            )}
          </div>
        </div>

        {/* Cuenta */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">Informacion de la cuenta</h3>
            <p className="settings-card-subtitle">Datos del administrador principal</p>
          </div>
          <div className="settings-info">
            <div className="settings-info-row">
              <span className="settings-info-label">Email ROOT</span>
              <span className="settings-info-value">{user?.email || '—'}</span>
            </div>
            <div className="settings-info-row">
              <span className="settings-info-label">Cuenta creada</span>
              <span className="settings-info-value">{createdAt}</span>
            </div>
            <div className="settings-info-row">
              <span className="settings-info-label">ID de cuenta</span>
              <span className="settings-info-value settings-info-mono">{settings?.id?.slice(0, 8)}...</span>
            </div>
            <div className="settings-info-row">
              <span className="settings-info-label">Version</span>
              <span className="settings-info-value settings-info-mono">v{process.env.REACT_APP_VERSION || '2.4.0'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
