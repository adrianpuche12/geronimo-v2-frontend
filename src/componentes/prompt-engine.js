import React from 'react';
import '../styles/prompt-engine.css';

/**
 * Selector de Modo de Análisis
 * Permite al usuario elegir entre: General, Estadísticas o Negocio
 */
export const ModeSelector = ({ selectedMode, onModeChange, disabled }) => {
  const modes = [
    {
      id: 'general',
      label: 'General',
      description: 'Respuestas narrativas y explicativas'
    },
    {
      id: 'stats',
      label: 'Estadísticas',
      description: 'Análisis cuantitativo con métricas'
    },
    {
      id: 'business',
      label: 'Negocio',
      description: 'Análisis estratégico con ROI'
    }
  ];

  return (
    <div className="mode-selector">
      <div className="mode-buttons">
        {modes.map(mode => (
          <button
            key={mode.id}
            className={`mode-btn ${selectedMode === mode.id ? 'active' : ''}`}
            onClick={() => onModeChange(mode.id)}
            disabled={disabled}
            title={mode.description}
          >
            <span className="mode-btn-label">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Componente para renderizar gráficos
 * Soporta: bar, pie, line
 */
export const ChartComponent = ({ chart }) => {
  if (!chart || !chart.data) return null;

  const { type, data, unit, title } = chart;
  const entries = Object.entries(data);
  const maxValue = Math.max(...entries.map(([_, v]) => v));

  if (type === 'bar') {
    return (
      <div className="chart-container">
        <h4 className="chart-title">{title || 'Gráfico'}</h4>
        <div className="bar-chart">
          {entries.map(([label, value]) => (
            <div key={label} className="bar-item">
              <div className="bar-label">{label}</div>
              <div className="bar-wrapper">
                <div
                  className="bar-fill"
                  style={{ width: `${(value / maxValue) * 100}%` }}
                >
                  <span className="bar-value">
                    {value}{unit ? ` ${unit}` : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    const total = entries.reduce((sum, [_, v]) => sum + v, 0);
    return (
      <div className="chart-container">
        <h4 className="chart-title">{title || 'Gráfico'}</h4>
        <div className="pie-chart">
          {entries.map(([label, value]) => {
            const percentage = ((value / total) * 100).toFixed(1);
            return (
              <div key={label} className="pie-item">
                <div className="pie-color" style={{ background: getChartColor(label) }}></div>
                <div className="pie-label">{label}</div>
                <div className="pie-value">
                  {value}{unit ? ` ${unit}` : ''} ({percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className="chart-container">
        <h4 className="chart-title">{title || 'Gráfico'}</h4>
        <div className="line-chart">
          {entries.map(([label, value]) => (
            <div key={label} className="line-item">
              <span className="line-label">{label}</span>
              <span className="line-value">
                {value}{unit ? ` ${unit}` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Componente para renderizar tablas markdown
 */
export const TableComponent = ({ table }) => {
  if (!table || !table.headers || !table.rows) return null;

  return (
    <div className="table-container">
      {table.title && <h4 className="table-title">{table.title}</h4>}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {table.headers.map((header, idx) => (
                <th key={idx}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Panel de métricas clave (para modo stats)
 */
export const MetricsPanel = ({ metrics }) => {
  if (!metrics || metrics.length === 0) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '○';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'good': return 'metric-good';
      case 'warning': return 'metric-warning';
      case 'critical': return 'metric-critical';
      default: return '';
    }
  };

  return (
    <div className="metrics-panel">
      <h4 className="metrics-title">📊 Métricas Clave</h4>
      <div className="metrics-grid">
        {metrics.map((metric, idx) => (
          <div key={idx} className={`metric-card ${getStatusClass(metric.status)}`}>
            <div className="metric-header">
              <span className="metric-icon">{getStatusIcon(metric.status)}</span>
              <span className="metric-name">{metric.name}</span>
            </div>
            <div className="metric-value">{metric.value}</div>
            {metric.benchmark && (
              <div className="metric-benchmark">
                Benchmark: {metric.benchmark}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Panel de recomendaciones estratégicas (para modo business)
 */
export const RecommendationsPanel = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) return null;

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getTimeframeLabel = (timeframe) => {
    switch (timeframe) {
      case 'short': return 'Corto Plazo';
      case 'medium': return 'Mediano Plazo';
      case 'long': return 'Largo Plazo';
      default: return timeframe;
    }
  };

  // Agrupar por timeframe
  const grouped = recommendations.reduce((acc, rec) => {
    if (!acc[rec.timeframe]) acc[rec.timeframe] = [];
    acc[rec.timeframe].push(rec);
    return acc;
  }, {});

  return (
    <div className="recommendations-panel">
      <h4 className="recommendations-title">🎯 Recomendaciones Estratégicas</h4>
      {Object.entries(grouped).map(([timeframe, recs]) => (
        <div key={timeframe} className="timeframe-group">
          <h5 className="timeframe-label">{getTimeframeLabel(timeframe)}</h5>
          <div className="recommendations-list">
            {recs.map((rec, idx) => (
              <div key={idx} className={`recommendation-card ${getPriorityClass(rec.priority)}`}>
                <div className="recommendation-header">
                  <span className="priority-icon">{getPriorityIcon(rec.priority)}</span>
                  <span className="priority-badge">{rec.priority.toUpperCase()}</span>
                </div>
                <div className="recommendation-description">{rec.description}</div>
                {(rec.cost || rec.benefit || rec.effort) && (
                  <div className="recommendation-meta">
                    {rec.cost && <span className="meta-item">💰 {rec.cost}</span>}
                    {rec.benefit && <span className="meta-item">📈 {rec.benefit}</span>}
                    {rec.effort && <span className="meta-item">⚡ {rec.effort}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Renderizador de respuesta enriquecida
 * Combina contenido markdown + datos estructurados (charts, tables, metrics, recommendations)
 */
export const EnrichedResponse = ({ response }) => {
  if (!response) return null;

  const { content, mode, charts, tables, metrics, recommendations } = response;

  return (
    <div className="enriched-response">
      {/* Contenido principal (markdown) */}
      <div className="response-content">
        {content}
      </div>

      {/* Gráficos (stats mode) */}
      {charts && charts.length > 0 && (
        <div className="charts-section">
          {charts.map((chart, idx) => (
            <ChartComponent key={idx} chart={chart} />
          ))}
        </div>
      )}

      {/* Tablas (stats y business modes) */}
      {tables && tables.length > 0 && (
        <div className="tables-section">
          {tables.map((table, idx) => (
            <TableComponent key={idx} table={table} />
          ))}
        </div>
      )}

      {/* Métricas clave (stats mode) */}
      {metrics && metrics.length > 0 && (
        <MetricsPanel metrics={metrics} />
      )}

      {/* Recomendaciones estratégicas (business mode) */}
      {recommendations && recommendations.length > 0 && (
        <RecommendationsPanel recommendations={recommendations} />
      )}

      {/* Badge del modo usado */}
      <div className="mode-badge">
        {mode === 'general' && '🔍 Modo General'}
        {mode === 'stats' && '📊 Modo Estadísticas'}
        {mode === 'business' && '💼 Modo Negocio'}
      </div>
    </div>
  );
};

// Helper para colores de gráficos
const getChartColor = (label) => {
  const colors = [
    '#FF6600', // Primary
    '#ff6b35', // Secondary
    '#3fb950', // Success
    '#d29922', // Warning
    '#f85149', // Danger
    '#a371f7', // Purple
    '#58a6ff', // Blue
    '#f778ba', // Pink
  ];

  const hash = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};
