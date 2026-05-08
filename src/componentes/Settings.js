import React, { useState, useEffect, useRef } from 'react';
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
  free:       { users: 1,            storage: '300 MB',       queries: 50 },
  pro:        { users: 5,            storage: '10 GB',        queries: 'Ilimitadas' },
  business:   { users: 15,           storage: '50 GB',        queries: 'Ilimitadas' },
  enterprise: { users: 'Ilimitados', storage: 'Personalizado',queries: 'Ilimitadas' },
};

const NAV_ITEMS = [
  { id: 'org',        label: 'Organización' },
  { id: 'apariencia', label: 'Apariencia' },
  { id: 'plan',       label: 'Plan y uso' },
  { id: 'cuenta',     label: 'Cuenta' },
];

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
  const [activeNav, setActiveNav] = useState('org');
  const contentRef = useRef(null);

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

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const sections = NAV_ITEMS.map(n => document.getElementById('section-' + n.id)).filter(Boolean);
      let current = NAV_ITEMS[0].id;
      for (const s of sections) {
        if (s.getBoundingClientRect().top - el.getBoundingClientRect().top <= 40) current = s.id.replace('section-', '');
      }
      setActiveNav(current);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [loading]);

  const scrollTo = (id) => {
    const el = document.getElementById('section-' + id);
    const container = contentRef.current;
    if (el && container) {
      const top = el.offsetTop - container.offsetTop - 16;
      container.scrollTo({ top, behavior: 'smooth' });
    }
    setActiveNav(id);
  };

  const toggleTheme = (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('lexiius-theme', newTheme);
    setTheme(newTheme);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) { setSaveError('El nombre no puede estar vacío'); return; }
    setSaving(true); setSaveError(''); setSaveMsg('');
    try {
      const { data } = await axios.patch(`${API_URL}/settings`, { orgName: orgName.trim() });
      setSettings(data);
      setSaveMsg('Configuración guardada');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="settings-loading">Cargando...</div>;

  const plan       = settings?.plan || 'free';
  const planInfo   = PLAN_LABELS[plan] || PLAN_LABELS.free;
  const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const createdAt  = settings?.created_at
    ? new Date(settings.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const storageLimitMB = plan === 'free' ? 300 : plan === 'pro' ? 10240 : plan === 'business' ? 51200 : null;
  const storagePct     = usage && storageLimitMB ? Math.min(100, Math.round((usage.storage_used_mb / storageLimitMB) * 100)) : 0;
  const usersLimit     = PLAN_LIMITS[plan]?.users;
  const usersPct       = usage && typeof usersLimit === 'number' ? Math.min(100, Math.round((usage.user_count / usersLimit) * 100)) : 0;
  const queriesLimit   = typeof planLimits.queries === 'number' ? planLimits.queries : null;
  const queriesPct     = usage && queriesLimit ? Math.min(100, Math.round(((usage.queries_this_month ?? 0) / queriesLimit) * 100)) : 0;

  return (
    <div className="settings-page">

      {/* Sidebar nav */}
      <aside className="settings-sidebar">
        <p className="settings-sidebar-title">Configuración</p>
        <nav className="settings-nav">
          {NAV_ITEMS.map(n => (
            <button
              key={n.id}
              className={`settings-nav-item${activeNav === n.id ? ' settings-nav-item--active' : ''}`}
              onClick={() => scrollTo(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="settings-content" ref={contentRef}>

        <div className="settings-page-header">
          <h1 className="settings-page-title">Configuración</h1>
          <p className="settings-page-subtitle">Administrá tu cuenta, plan y preferencias</p>
        </div>

        {/* ORGANIZACIÓN */}
        <section id="section-org" className="settings-section">
          <div className="settings-section-header">
            <h2 className="settings-section-title">Organización</h2>
            <p className="settings-section-desc">Nombre visible en la aplicación para todos los usuarios del estudio.</p>
          </div>
          <div className="settings-section-body">
            <form onSubmit={handleSave} className="settings-form">
              {saveError && <div className="settings-msg settings-msg--error">{saveError}</div>}
              {saveMsg   && <div className="settings-msg settings-msg--success">{saveMsg}</div>}
              <div className="settings-field">
                <label>Nombre de la organización</label>
                <div className="settings-field-row">
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Nombre de tu empresa"
                    disabled={saving || !isRoot}
                    className={!isRoot ? 'settings-input--readonly' : ''}
                  />
                  {isRoot && (
                    <button type="submit" className="settings-btn-save" disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  )}
                </div>
                {!isRoot && <span className="settings-field-hint">Solo el ROOT puede modificar este campo</span>}
              </div>
            </form>
          </div>
        </section>

        {/* APARIENCIA */}
        <section id="section-apariencia" className="settings-section">
          <div className="settings-section-header">
            <h2 className="settings-section-title">Apariencia</h2>
            <p className="settings-section-desc">Seleccioná el tema visual de la interfaz.</p>
          </div>
          <div className="settings-section-body">
            <div className="settings-theme-grid">
              <button
                className={`settings-theme-card${theme === 'dark' ? ' settings-theme-card--active' : ''}`}
                onClick={() => toggleTheme('dark')}
              >
                <div className="settings-theme-preview settings-theme-preview--dark">
                  <div className="stp-bar"/><div className="stp-bar stp-bar--short"/>
                </div>
                <div className="settings-theme-card-footer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  <span>Oscuro</span>
                  {theme === 'dark' && <span className="settings-theme-check">✓</span>}
                </div>
              </button>
              <button
                className={`settings-theme-card${theme === 'light' ? ' settings-theme-card--active' : ''}`}
                onClick={() => toggleTheme('light')}
              >
                <div className="settings-theme-preview settings-theme-preview--light">
                  <div className="stp-bar"/><div className="stp-bar stp-bar--short"/>
                </div>
                <div className="settings-theme-card-footer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  <span>Claro</span>
                  {theme === 'light' && <span className="settings-theme-check">✓</span>}
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* PLAN Y USO */}
        <section id="section-plan" className="settings-section">
          <div className="settings-section-header">
            <h2 className="settings-section-title">Plan y uso</h2>
            <p className="settings-section-desc">Tu suscripción activa y el consumo actual de recursos.</p>
          </div>
          <div className="settings-section-body">
            <div className="settings-plan-uso-grid">

              <div className="settings-inner-card">
                <div className="settings-inner-card-head">
                  <span className="settings-inner-card-label">Plan actual</span>
                  <span className="settings-plan-badge" style={{ color: planInfo.color }}>{planInfo.label}</span>
                </div>
                <div className="settings-plan-rows">
                  <div className="settings-plan-row">
                    <span>Usuarios</span>
                    <span className="settings-plan-row-val">{planLimits.users}</span>
                  </div>
                  <div className="settings-plan-row">
                    <span>Almacenamiento</span>
                    <span className="settings-plan-row-val">{planLimits.storage}</span>
                  </div>
                  <div className="settings-plan-row">
                    <span>Consultas / mes</span>
                    <span className="settings-plan-row-val">{planLimits.queries}</span>
                  </div>
                </div>
                <p className="settings-plan-hint">Para cambiar de plan contactá a soporte.</p>
              </div>

              <div className="settings-inner-card">
                <div className="settings-inner-card-head">
                  <span className="settings-inner-card-label">Uso este mes</span>
                </div>
                {usage ? (
                  <div className="settings-usage-stack">
                    <div className="settings-usage-item">
                      <div className="settings-usage-row">
                        <span>Almacenamiento</span>
                        <span className="settings-usage-val">
                          {usage.storage_used_mb} MB
                          {storageLimitMB && <span className="settings-usage-limit"> / {storageLimitMB >= 1024 ? (storageLimitMB/1024)+'GB' : storageLimitMB+'MB'}</span>}
                        </span>
                      </div>
                      <div className="settings-usage-bar"><div className="settings-usage-fill" style={{width: storagePct+'%', background: storagePct > 85 ? 'var(--text-error,#f87171)' : 'var(--accent)'}}/></div>
                      <span className="settings-usage-sub">{usage.doc_count} documento{usage.doc_count !== 1 ? 's' : ''} indexado{usage.doc_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="settings-usage-item">
                      <div className="settings-usage-row">
                        <span>Consultas este mes</span>
                        <span className="settings-usage-val">
                          {usage.queries_this_month ?? 0}
                          {queriesLimit && <span className="settings-usage-limit"> / {queriesLimit}</span>}
                        </span>
                      </div>
                      {queriesLimit && (
                        <div className="settings-usage-bar"><div className="settings-usage-fill" style={{width: queriesPct+'%', background: queriesPct > 85 ? 'var(--text-error,#f87171)' : 'var(--accent)'}}/></div>
                      )}
                      <span className="settings-usage-sub">{usage.session_count} sesión{usage.session_count !== 1 ? 'es' : ''} en total</span>
                    </div>
                    <div className="settings-usage-item">
                      <div className="settings-usage-row">
                        <span>Usuarios activos</span>
                        <span className="settings-usage-val">
                          {usage.user_count}
                          {typeof usersLimit === 'number' && <span className="settings-usage-limit"> / {usersLimit}</span>}
                        </span>
                      </div>
                      {typeof usersLimit === 'number' && (
                        <div className="settings-usage-bar"><div className="settings-usage-fill" style={{width: usersPct+'%', background: usersPct > 85 ? 'var(--text-error,#f87171)' : 'var(--accent)'}}/></div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="settings-loading-inline">Cargando métricas...</p>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* CUENTA */}
        <section id="section-cuenta" className="settings-section settings-section--last">
          <div className="settings-section-header">
            <h2 className="settings-section-title">Cuenta</h2>
            <p className="settings-section-desc">Datos del administrador principal y metadatos del sistema.</p>
          </div>
          <div className="settings-section-body">
            <div className="settings-info-grid">
              <div className="settings-info-item">
                <span className="settings-info-label">Email ROOT</span>
                <span className="settings-info-value">{user?.email || '—'}</span>
              </div>
              <div className="settings-info-item">
                <span className="settings-info-label">Cuenta creada</span>
                <span className="settings-info-value">{createdAt}</span>
              </div>
              <div className="settings-info-item">
                <span className="settings-info-label">ID de cuenta</span>
                <span className="settings-info-value settings-info-mono">{settings?.id?.slice(0, 8)}...</span>
              </div>
              <div className="settings-info-item">
                <span className="settings-info-label">Versión</span>
                <span className="settings-info-value settings-info-mono">v{process.env.REACT_APP_VERSION || '2.4.0'}</span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};
