import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/integrations.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// ============================================
// INTEGRATION FACTORY - Registro Dinamico de Proveedores
// ============================================

const IntegrationProviders = {
  github: {
    id: 'github',
    name: 'GitHub',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="provider-icon-svg">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    category: 'development',
    description: 'Sincroniza repositorios, issues, PRs y documentacion de GitHub',
    color: '#6e7681',
    features: ['Repositorios', 'Issues', 'Pull Requests', 'Documentacion', 'Wikis'],
    configFields: [
      { key: 'syncRepositories', label: 'Sincronizar Repositorios', type: 'toggle', default: true },
      { key: 'syncIssues', label: 'Sincronizar Issues', type: 'toggle', default: true },
      { key: 'syncPullRequests', label: 'Sincronizar Pull Requests', type: 'toggle', default: true },
      { key: 'syncWikis', label: 'Sincronizar Wikis', type: 'toggle', default: false },
      { key: 'syncReadmes', label: 'Sincronizar READMEs', type: 'toggle', default: true },
      { key: 'repoFilter', label: 'Filtrar por nombre de repositorio', type: 'text', placeholder: 'ej: backend*, *-api' },
      { key: 'syncInterval', label: 'Intervalo de sincronizacion', type: 'select', options: [
        { value: '15m', label: 'Cada 15 minutos' },
        { value: '1h', label: 'Cada hora' },
        { value: '6h', label: 'Cada 6 horas' },
        { value: '24h', label: 'Diario' },
        { value: 'manual', label: 'Solo manual' }
      ], default: '1h' }
    ]
  },
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="provider-icon-svg">
        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
      </svg>
    ),
    category: 'email',
    description: 'Indexa y busca en tus correos electronicos de Gmail',
    color: '#EA4335',
    features: ['Bandeja de entrada', 'Correos enviados', 'Etiquetas', 'Adjuntos'],
    configFields: [
      { key: 'syncInbox', label: 'Sincronizar Bandeja de entrada', type: 'toggle', default: true },
      { key: 'syncSent', label: 'Sincronizar Enviados', type: 'toggle', default: false },
      { key: 'syncDrafts', label: 'Sincronizar Borradores', type: 'toggle', default: false },
      { key: 'syncAttachments', label: 'Indexar Adjuntos', type: 'toggle', default: true },
      { key: 'labelFilter', label: 'Filtrar por etiquetas', type: 'text', placeholder: 'ej: trabajo, importante' },
      { key: 'maxEmails', label: 'Maximo de correos a sincronizar', type: 'select', options: [
        { value: '100', label: '100 correos' },
        { value: '500', label: '500 correos' },
        { value: '1000', label: '1,000 correos' },
        { value: '5000', label: '5,000 correos' },
        { value: 'all', label: 'Todos' }
      ], default: '500' },
      { key: 'syncInterval', label: 'Intervalo de sincronizacion', type: 'select', options: [
        { value: '5m', label: 'Cada 5 minutos' },
        { value: '15m', label: 'Cada 15 minutos' },
        { value: '1h', label: 'Cada hora' },
        { value: 'manual', label: 'Solo manual' }
      ], default: '15m' }
    ]
  },
  'google-drive': {
    id: 'google-drive',
    name: 'Google Drive',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="provider-icon-svg">
        <path d="M4.433 22.396l4-6.929H24l-4 6.929H4.433zm3.566-6.929L0 3.396h8l8 12.071H7.999zM12 3.396l4 6.929h8l-4-6.929h-8z"/>
      </svg>
    ),
    category: 'storage',
    description: 'Accede y sincroniza documentos de Google Drive',
    color: '#4285F4',
    features: ['Documentos', 'Hojas de calculo', 'Presentaciones', 'PDFs', 'Carpetas'],
    configFields: [
      { key: 'syncDocs', label: 'Sincronizar Google Docs', type: 'toggle', default: true },
      { key: 'syncSheets', label: 'Sincronizar Google Sheets', type: 'toggle', default: true },
      { key: 'syncSlides', label: 'Sincronizar Google Slides', type: 'toggle', default: false },
      { key: 'syncPdfs', label: 'Sincronizar PDFs', type: 'toggle', default: true },
      { key: 'syncFolders', label: 'Carpetas a sincronizar', type: 'text', placeholder: 'ej: /Trabajo, /Proyectos' },
      { key: 'excludeFolders', label: 'Carpetas a excluir', type: 'text', placeholder: 'ej: /Trash, /Compartido' },
      { key: 'syncInterval', label: 'Intervalo de sincronizacion', type: 'select', options: [
        { value: '15m', label: 'Cada 15 minutos' },
        { value: '1h', label: 'Cada hora' },
        { value: '6h', label: 'Cada 6 horas' },
        { value: '24h', label: 'Diario' },
        { value: 'manual', label: 'Solo manual' }
      ], default: '1h' }
    ]
  }
};

// Funcion para obtener todos los proveedores registrados
const getRegisteredProviders = () => Object.values(IntegrationProviders);

// ============================================
// COMPONENTES DE CONFIGURACION
// ============================================

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <label className={`toggle-switch ${disabled ? 'disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="toggle-slider"></span>
    </label>
  );
}

function ConfigField({ field, value, onChange, disabled }) {
  switch (field.type) {
    case 'toggle':
      return (
        <div className="config-field config-field-toggle">
          <div className="config-field-info">
            <span className="config-field-label">{field.label}</span>
          </div>
          <ToggleSwitch
            checked={value ?? field.default}
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      );
    case 'text':
      return (
        <div className="config-field config-field-text">
          <label className="config-field-label">{field.label}</label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className="config-input"
          />
        </div>
      );
    case 'select':
      return (
        <div className="config-field config-field-select">
          <label className="config-field-label">{field.label}</label>
          <select
            value={value ?? field.default}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="config-select"
          >
            {field.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    default:
      return null;
  }
}

// ============================================
// PANEL DE CONFIGURACION DE INTEGRACION
// ============================================

function IntegrationConfigPanel({
  provider,
  integration,
  onConnect,
  onDisconnect,
  onSuspend,    // NEW: handler for suspend
  onResume,     // NEW: handler for resume
  onSave,
  onSync,
  loading
}) {
  const [config, setConfig] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [suspendingOrResuming, setSuspendingOrResuming] = useState(false);

  // Estados de la integracion
  const isConnected = integration?.isConnected;
  const isSuspended = integration?.isSuspended;
  const hasOAuthConnection = isConnected || isSuspended; // Tiene tokens OAuth

  useEffect(() => {
    if (integration?.config) {
      setConfig(integration.config);
    } else {
      // Inicializar con valores por defecto
      const defaults = {};
      provider.configFields.forEach(field => {
        if (field.default !== undefined) {
          defaults[field.key] = field.default;
        }
      });
      setConfig(defaults);
    }
    setHasChanges(false);
  }, [integration, provider]);

  const handleFieldChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  // NEW: Handle suspend/resume
  const handleSuspendResume = async () => {
    setSuspendingOrResuming(true);
    try {
      if (isSuspended) {
        await onResume();
      } else {
        await onSuspend();
      }
    } finally {
      setSuspendingOrResuming(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    // NEW: Show suspended badge if suspended
    if (isSuspended) {
      return (
        <span className="status-badge status-suspended">
          Suspendido
        </span>
      );
    }

    if (!isConnected) return null;

    const status = integration?.syncStatus;
    const statusMap = {
      'success': { label: 'Sincronizado', class: 'status-success' },
      'synced': { label: 'Sincronizado', class: 'status-success' },
      'error': { label: 'Error', class: 'status-error' },
      'failed': { label: 'Fallido', class: 'status-error' },
      'in_progress': { label: 'En progreso', class: 'status-progress' },
      'pending': { label: 'Pendiente', class: 'status-pending' }
    };

    const statusInfo = statusMap[status] || { label: status || 'Desconocido', class: 'status-unknown' };

    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className={`config-panel ${isSuspended ? 'is-suspended' : ''}`}>
      {/* Header del Panel */}
      <div className="config-panel-header">
        <div className="config-panel-title">
          <div className="provider-icon-wrapper" style={{ '--provider-color': provider.color }}>
            {provider.icon}
          </div>
          <div className="provider-title-info">
            <h2>{provider.name}</h2>
            <p className="provider-category">{provider.category}</p>
          </div>
          {getStatusBadge()}
        </div>
        <p className="provider-description">{provider.description}</p>
      </div>

      {/* NEW: Suspended Warning Banner */}
      {isSuspended && (
        <div className="suspended-banner">
          <div className="suspended-banner-icon">&#9888;</div>
          <div className="suspended-banner-content">
            <strong>Integracion suspendida</strong>
            <p>La sincronizacion de datos esta pausada. Los datos existentes se mantienen pero no se actualizan.</p>
          </div>
          <button
            className="btn-resume-banner"
            onClick={handleSuspendResume}
            disabled={suspendingOrResuming || loading}
          >
            {suspendingOrResuming ? 'Reanudando...' : 'Reanudar'}
          </button>
        </div>
      )}

      {/* Estado de Conexion */}
      <div className="config-section">
        <div className="section-header">
          <h3>Estado de Conexion</h3>
        </div>
        <div className="connection-status-card">
          {hasOAuthConnection ? (
            <>
              <div className="connection-info">
                <div className={`connection-badge ${isSuspended ? 'suspended' : 'connected'}`}>
                  <span className="connection-icon">{isSuspended ? '⏸' : '✓'}</span>
                  {isSuspended ? 'Suspendido' : 'Conectado'}
                </div>
                {integration?.accountInfo && (
                  <div className="account-info">
                    <span className="account-label">Cuenta:</span>
                    <span className="account-value">
                      {integration.accountInfo.name || integration.accountInfo.email || integration.accountInfo.username}
                    </span>
                  </div>
                )}
                <div className="sync-info">
                  <span className="sync-label">Ultima sincronizacion:</span>
                  <span className="sync-value">{formatDate(integration?.lastSync)}</span>
                </div>
              </div>
              <div className="connection-actions">
                {/* Sync button - only show if not suspended */}
                {!isSuspended && (
                  <button
                    className="btn-sync-now"
                    onClick={handleSync}
                    disabled={syncing || loading}
                  >
                    {syncing ? (
                      <>
                        <span className="spinner-small"></span>
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <span className="sync-icon">&#8634;</span>
                        Sincronizar ahora
                      </>
                    )}
                  </button>
                )}

                {/* NEW: Suspend/Resume button */}
                <button
                  className={`btn-suspend-resume ${isSuspended ? 'resume' : 'suspend'}`}
                  onClick={handleSuspendResume}
                  disabled={suspendingOrResuming || loading}
                  title={isSuspended ? 'Reanudar sincronizacion' : 'Suspender sincronizacion temporalmente'}
                >
                  {suspendingOrResuming ? (
                    <>
                      <span className="spinner-small"></span>
                      {isSuspended ? 'Reanudando...' : 'Suspendiendo...'}
                    </>
                  ) : (
                    <>
                      <span className="suspend-icon">{isSuspended ? '▶' : '⏸'}</span>
                      {isSuspended ? 'Reanudar' : 'Suspender'}
                    </>
                  )}
                </button>

                {/* Disconnect button */}
                <button
                  className="btn-disconnect"
                  onClick={onDisconnect}
                  disabled={loading}
                  title="Desconectar completamente (elimina tokens OAuth)"
                >
                  Desconectar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="connection-info">
                <div className="connection-badge disconnected">
                  <span className="connection-icon">&#9679;</span>
                  No conectado
                </div>
                <p className="connection-hint">
                  Conecta tu cuenta de {provider.name} para comenzar a sincronizar tus datos
                </p>
              </div>
              <div className="connection-actions">
                <button
                  className="btn-connect"
                  onClick={onConnect}
                  disabled={loading}
                  style={{ '--provider-color': provider.color }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Conectando...
                    </>
                  ) : (
                    <>
                      {provider.icon}
                      Conectar con {provider.name}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Configuracion de Sincronizacion - show if has OAuth (even if suspended) */}
      {hasOAuthConnection && (
        <div className={`config-section ${isSuspended ? 'section-disabled' : ''}`}>
          <div className="section-header">
            <h3>Configuracion de Sincronizacion</h3>
            {hasChanges && (
              <span className="unsaved-badge">Cambios sin guardar</span>
            )}
          </div>

          {isSuspended && (
            <div className="section-disabled-overlay">
              <p>Reanuda la integracion para modificar la configuracion</p>
            </div>
          )}

          <div className="config-fields-grid">
            {provider.configFields.map(field => (
              <ConfigField
                key={field.key}
                field={field}
                value={config[field.key]}
                onChange={(value) => handleFieldChange(field.key, value)}
                disabled={loading || saving || isSuspended}
              />
            ))}
          </div>

          {hasChanges && !isSuspended && (
            <div className="config-actions">
              <button
                className="btn-save-config"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar configuracion'}
              </button>
              <button
                className="btn-cancel-changes"
                onClick={() => {
                  if (integration?.config) {
                    setConfig(integration.config);
                  }
                  setHasChanges(false);
                }}
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Caracteristicas */}
      <div className="config-section">
        <div className="section-header">
          <h3>Caracteristicas disponibles</h3>
        </div>
        <div className="features-grid">
          {provider.features.map((feature, idx) => (
            <div key={idx} className="feature-item">
              <span className="feature-check">&#10003;</span>
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Estadisticas (si tiene conexion OAuth) */}
      {hasOAuthConnection && integration?.stats && (
        <div className="config-section">
          <div className="section-header">
            <h3>Estadisticas</h3>
          </div>
          <div className="stats-mini-grid">
            <div className="stat-mini-card">
              <span className="stat-mini-value">{integration.stats.totalItems || 0}</span>
              <span className="stat-mini-label">Items sincronizados</span>
            </div>
            <div className="stat-mini-card">
              <span className="stat-mini-value">{integration.stats.successfulSyncs || 0}</span>
              <span className="stat-mini-label">Syncs exitosos</span>
            </div>
            <div className="stat-mini-card">
              <span className="stat-mini-value">{integration.stats.failedSyncs || 0}</span>
              <span className="stat-mini-label">Syncs fallidos</span>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Danger Zone - Disconnect */}
      {hasOAuthConnection && (
        <div className="config-section danger-zone">
          <div className="section-header">
            <h3>Zona de peligro</h3>
          </div>
          <div className="danger-zone-content">
            <div className="danger-zone-item">
              <div className="danger-zone-info">
                <strong>Desconectar integracion</strong>
                <p>Elimina la conexion OAuth y los tokens de acceso. Los datos sincronizados se mantendran en el sistema.</p>
              </div>
              <button
                className="btn-danger"
                onClick={onDisconnect}
                disabled={loading}
              >
                Desconectar {provider.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL DE INTEGRACIONES
// ============================================

export function Integrations() {
  const [providers] = useState(getRegisteredProviders());
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar integraciones del backend
  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/integrations`);

      // Mapear integraciones por providerId para facil acceso
      const integrationsMap = {};
      response.data.forEach(integration => {
        // Mapear el catalogId o type al providerId
        const providerId = integration.catalogId || integration.type || integration.id;
        integrationsMap[providerId] = integration;
      });

      setIntegrations(integrationsMap);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Seleccionar primer proveedor por defecto
  useEffect(() => {
    if (!selectedProvider && providers.length > 0) {
      setSelectedProvider(providers[0].id);
    }
  }, [providers, selectedProvider]);

  const handleConnect = async (providerId) => {
    try {
      setActionLoading(true);

      // Iniciar flujo OAuth
      const response = await axios.post(`${API_URL}/integrations/${providerId}/connect`);

      if (response.data.authUrl) {
        // Abrir ventana de autorizacion OAuth
        const authWindow = window.open(
          response.data.authUrl,
          'oauth',
          'width=600,height=700,scrollbars=yes'
        );

        // Esperar a que se complete la autorizacion
        const checkAuth = setInterval(async () => {
          if (authWindow?.closed) {
            clearInterval(checkAuth);
            // Recargar integraciones
            await loadIntegrations();
            setActionLoading(false);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error connecting integration:', error);
      alert('Error al conectar: ' + (error.response?.data?.message || error.message));
      setActionLoading(false);
    }
  };

  // NEW: Handle suspend
  const handleSuspend = async (integrationId) => {
    if (!window.confirm('¿Suspender esta integracion? La sincronizacion de datos se pausara pero los tokens OAuth se mantendran.')) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(`${API_URL}/integrations/${integrationId}/suspend`);
      await loadIntegrations();
    } catch (error) {
      console.error('Error suspending integration:', error);
      alert('Error al suspender: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  // NEW: Handle resume
  const handleResume = async (integrationId) => {
    try {
      setActionLoading(true);
      await axios.post(`${API_URL}/integrations/${integrationId}/resume`);
      await loadIntegrations();
    } catch (error) {
      console.error('Error resuming integration:', error);
      alert('Error al reanudar: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle disconnect (complete removal of OAuth)
  const handleDisconnect = async (integrationId) => {
    if (!window.confirm('¿Desconectar completamente esta integracion?\n\nEsto eliminara los tokens OAuth y deberas volver a autorizar la conexion. Los datos ya sincronizados se mantendran en el sistema.')) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.delete(`${API_URL}/integrations/${integrationId}/disconnect`);
      await loadIntegrations();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      alert('Error al desconectar: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveConfig = async (providerId, config) => {
    try {
      await axios.put(`${API_URL}/integrations/${providerId}/config`, { config });
      await loadIntegrations();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar configuracion: ' + (error.response?.data?.message || error.message));
      throw error;
    }
  };

  const handleSync = async (providerId) => {
    try {
      await axios.post(`${API_URL}/integrations/${providerId}/sync`);
      // Recargar despues de un momento para ver el estado actualizado
      setTimeout(() => loadIntegrations(), 2000);
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Error al sincronizar: ' + (error.response?.data?.message || error.message));
      throw error;
    }
  };

  const getIntegrationForProvider = (providerId) => {
    // Buscar por diferentes posibles keys
    return integrations[providerId] ||
           integrations[`int-${providerId}`] ||
           Object.values(integrations).find(i =>
             i.catalogId?.includes(providerId) ||
             i.type === providerId ||
             i.name?.toLowerCase() === providerId
           );
  };

  const currentProvider = providers.find(p => p.id === selectedProvider);

  if (loading) {
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{background:"var(--bg-warning,rgba(245,158,11,0.08))",border:"1px solid var(--border-warning,rgba(245,158,11,0.3))",borderRadius:"var(--radius-md)",padding:"10px 16px",margin:"12px 16px",display:"flex",alignItems:"center",gap:"10px",fontSize:"var(--text-sm)",color:"var(--text-secondary)",flexShrink:0}}>
        <span style={{fontSize:16}}>🚧</span>
        <div><strong style={{color:"var(--text-primary)"}}>En desarrollo</strong> — Las integraciones estarán disponibles próximamente. Podés explorar las opciones disponibles.</div>
      </div>
      <div className="integrations-page" style={{flex:1,overflow:"hidden"}}>
        <div className="integrations-loading">
          <div className="loading-spinner-large"></div>
          <p>Cargando integraciones...</p>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{background:"var(--bg-warning,rgba(245,158,11,0.08))",border:"1px solid var(--border-warning,rgba(245,158,11,0.3))",borderRadius:"var(--radius-md)",padding:"10px 16px",margin:"12px 16px",display:"flex",alignItems:"center",gap:"10px",fontSize:"var(--text-sm)",color:"var(--text-secondary)",flexShrink:0}}>
        <span style={{fontSize:16}}>🚧</span>
        <div><strong style={{color:"var(--text-primary)"}}>En desarrollo</strong> — Las integraciones estarán disponibles próximamente. Podés explorar las opciones disponibles.</div>
      </div>
      <div className="integrations-page" style={{flex:1,overflow:"hidden"}}>
      {/* Sidebar con lista de proveedores */}
      <aside className="integrations-sidebar">
        <div className="sidebar-header">
          <h2>Integraciones</h2>
          <p className="sidebar-subtitle">Conecta tus servicios externos</p>
        </div>

        <nav className="providers-nav">
          {providers.map(provider => {
            const integration = getIntegrationForProvider(provider.id);
            const isConnected = integration?.isConnected;
            const isSuspended = integration?.isSuspended;

            return (
              <button
                key={provider.id}
                className={`provider-nav-item ${selectedProvider === provider.id ? 'active' : ''} ${isConnected ? 'connected' : ''} ${isSuspended ? 'suspended' : ''}`}
                onClick={() => setSelectedProvider(provider.id)}
              >
                <div className="provider-nav-icon" style={{ '--provider-color': provider.color }}>
                  {provider.icon}
                </div>
                <span className="provider-nav-name">{provider.name}</span>
                {/* NEW: Show different status indicators */}
                {isConnected && (
                  <span className="provider-nav-status connected" title="Conectado">
                    &#10003;
                  </span>
                )}
                {isSuspended && (
                  <span className="provider-nav-status suspended" title="Suspendido">
                    ⏸
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">
            Las integraciones te permiten sincronizar datos externos con tu workspace de Lexiius.
          </p>
        </div>
      </aside>

      {/* Area de contenido principal */}
      <main className="integrations-content">
        {currentProvider ? (
          <IntegrationConfigPanel
            provider={currentProvider}
            integration={getIntegrationForProvider(currentProvider.id)}
            onConnect={() => handleConnect(currentProvider.id)}
            onDisconnect={() => {
              const integration = getIntegrationForProvider(currentProvider.id);
              handleDisconnect(integration?.activeIntegrationId || currentProvider.id);
            }}
            onSuspend={() => {
              const integration = getIntegrationForProvider(currentProvider.id);
              handleSuspend(integration?.activeIntegrationId || currentProvider.id);
            }}
            onResume={() => {
              const integration = getIntegrationForProvider(currentProvider.id);
              handleResume(integration?.activeIntegrationId || currentProvider.id);
            }}
            onSave={(config) => {
              const integration = getIntegrationForProvider(currentProvider.id);
              return handleSaveConfig(integration?.activeIntegrationId || currentProvider.id, config);
            }}
            onSync={() => {
              const integration = getIntegrationForProvider(currentProvider.id);
              return handleSync(integration?.activeIntegrationId || currentProvider.id);
            }}
            loading={actionLoading}
          />
        ) : (
          <div className="no-provider-selected">
            <p>Selecciona una integracion del menu lateral</p>
          </div>
        )}
      </main>
    </div>
    </div>
  );
}
