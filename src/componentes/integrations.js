import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/integrations.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

export function Integrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [view, setView] = useState('cards'); // 'cards', 'logs', 'items'
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/integrations`);
      setIntegrations(response.data);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIntegrationDetails = async (integration) => {
    try {
      setLoadingDetails(true);
      setSelectedIntegration(integration);

      // Load stats
      const statsRes = await axios.get(`${API_URL}/integrations/${integration.id}/stats`);
      setStats(statsRes.data);

      // Load logs
      const logsRes = await axios.get(`${API_URL}/integrations/${integration.id}/logs?limit=10`);
      setLogs(logsRes.data.logs);

      // Load items
      const itemsRes = await axios.get(`${API_URL}/integrations/${integration.id}/items?limit=20`);
      setItems(itemsRes.data.items);

      setView('logs'); // Switch to logs view
    } catch (error) {
      console.error('Error loading integration details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const triggerSync = async (integrationId) => {
    try {
      await axios.post(`${API_URL}/integrations/${integrationId}/sync`);
      alert('Sincronización iniciada correctamente');
      // Reload integrations after a few seconds
      setTimeout(loadIntegrations, 3000);
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Error al iniciar sincronización');
    }
  };

  const getStatusIcon = (syncStatus) => {
    switch (syncStatus) {
      case 'success':
      case 'synced':
        return '✓';
      case 'error':
      case 'failed':
        return '✗';
      case 'pending':
      case 'in_progress':
        return '⟳';
      default:
        return '○';
    }
  };

  const getStatusColor = (syncStatus) => {
    switch (syncStatus) {
      case 'success':
      case 'synced':
        return 'var(--accent-success)';
      case 'error':
      case 'failed':
        return 'var(--accent-danger)';
      case 'pending':
        return 'var(--text-muted)';
      case 'in_progress':
        return 'var(--accent-warning)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'development':
        return '💻';
      case 'email':
        return '📧';
      case 'storage':
        return '☁️';
      case 'communication':
        return '💬';
      default:
        return '🔗';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="integrations-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="integrations-container">
      <div className="integrations-header">
        <div className="header-content">
          <h2 className="integrations-title">
            <span className="title-icon">🔗</span>
            Integrations
          </h2>
          <p className="integrations-subtitle">
            Manage your connected services and data sources
          </p>
        </div>
        <div className="header-actions">
          <button
            className={`view-btn ${view === 'cards' ? 'active' : ''}`}
            onClick={() => setView('cards')}
          >
            <span>📊</span> Overview
          </button>
          {selectedIntegration && (
            <>
              <button
                className={`view-btn ${view === 'logs' ? 'active' : ''}`}
                onClick={() => setView('logs')}
              >
                <span>📜</span> Logs
              </button>
              <button
                className={`view-btn ${view === 'items' ? 'active' : ''}`}
                onClick={() => setView('items')}
              >
                <span>📁</span> Items
              </button>
            </>
          )}
        </div>
      </div>

      {view === 'cards' && (
        <div className="integrations-grid">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className={`integration-card ${!integration.isActive ? 'disabled' : ''} ${
                integration.isConnected ? 'connected' : ''
              }`}
              onClick={() => integration.isConnected && loadIntegrationDetails(integration)}
            >
              <div className="card-header">
                <div className="integration-icon">
                  {getCategoryIcon(integration.category)}
                </div>
                <div className="integration-info">
                  <h3 className="integration-name">{integration.name}</h3>
                  <p className="integration-category">{integration.category}</p>
                </div>
                <div
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(integration.syncStatus) }}
                >
                  {getStatusIcon(integration.syncStatus)}
                </div>
              </div>

              <p className="integration-description">{integration.description}</p>

              {integration.isConnected && (
                <div className="integration-stats">
                  <div className="stat-item">
                    <span className="stat-label">Last Sync</span>
                    <span className="stat-value">{formatDate(integration.lastSync)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Status</span>
                    <span className="stat-value">{integration.syncStatus || 'pending'}</span>
                  </div>
                </div>
              )}

              <div className="card-actions">
                {integration.isConnected ? (
                  <button
                    className="btn-sync"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerSync(integration.id);
                    }}
                  >
                    <span>⟳</span> Sync Now
                  </button>
                ) : (
                  <button className="btn-connect" disabled>
                    <span>🔒</span> Not Connected
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'logs' && selectedIntegration && (
        <div className="integration-details">
          <div className="details-header">
            <button className="btn-back" onClick={() => setView('cards')}>
              ← Back to Integrations
            </button>
            <h3>
              {getCategoryIcon(selectedIntegration.category)} {selectedIntegration.name} - Sync Logs
            </h3>
          </div>

          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalItems}</div>
                  <div className="stat-label">Total Items</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✓</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.stats.successfulSyncs}</div>
                  <div className="stat-label">Successful Syncs</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✗</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.stats.failedSyncs}</div>
                  <div className="stat-label">Failed Syncs</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🕒</div>
                <div className="stat-content">
                  <div className="stat-value">{formatDate(stats.lastSync)}</div>
                  <div className="stat-label">Last Sync</div>
                </div>
              </div>
            </div>
          )}

          {loadingDetails ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading sync logs...</p>
            </div>
          ) : (
            <div className="logs-list">
              {logs.length === 0 ? (
                <div className="empty-state">
                  <p>No sync logs found</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={`log-entry ${log.status}`}>
                    <div className="log-header">
                      <span
                        className="log-status"
                        style={{ color: getStatusColor(log.status) }}
                      >
                        {getStatusIcon(log.status)} {log.status}
                      </span>
                      <span className="log-date">{formatDate(log.createdAt)}</span>
                    </div>
                    <div className="log-details">
                      <p className="log-message">{log.message}</p>
                      <div className="log-stats">
                        <span>Fetched: {log.itemsFetched}</span>
                        <span>Created: {log.itemsCreated}</span>
                        <span>Updated: {log.itemsUpdated}</span>
                        {log.durationSeconds !== null && (
                          <span>Duration: {log.durationSeconds}s</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {view === 'items' && selectedIntegration && (
        <div className="integration-details">
          <div className="details-header">
            <button className="btn-back" onClick={() => setView('cards')}>
              ← Back to Integrations
            </button>
            <h3>
              {getCategoryIcon(selectedIntegration.category)} {selectedIntegration.name} - Synced Items
            </h3>
          </div>

          {loadingDetails ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading items...</p>
            </div>
          ) : (
            <div className="items-list">
              {items.length === 0 ? (
                <div className="empty-state">
                  <p>No items synced yet</p>
                  <button
                    className="btn-sync"
                    onClick={() => triggerSync(selectedIntegration.id)}
                  >
                    <span>⟳</span> Start First Sync
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="item-entry">
                    <div className="item-icon">
                      {item.type === 'email' ? '📧' : item.type === 'document' ? '📄' : '📁'}
                    </div>
                    <div className="item-content">
                      <h4 className="item-title">{item.title}</h4>
                      {item.description && (
                        <p className="item-description">{item.description}</p>
                      )}
                      <div className="item-meta">
                        <span>{item.type}</span>
                        <span>Synced: {formatDate(item.syncedAt)}</span>
                        {item.status && <span className="item-status">{item.status}</span>}
                      </div>
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="item-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open →
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
