import React, { useId, useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area,
  ResponsiveContainer
} from 'recharts';
import '../styles/prompt-engine.css';
import '../styles/markdown.css';

// ─── Color Palette NILO ───
const NILO_COLORS = [
  '#FF6600', // naranja
  '#3fb950', // verde
  '#d29922', // dorado
  '#f85149', // rojo
  '#a371f7', // purpura
  '#58a6ff', // azul
  '#f778ba', // rosa
  '#ff6b35', // naranja secundario
];

// ─── Custom Tooltip (glassmorphic dark) ───
const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="recharts-custom-tooltip">
      {label && <p className="tooltip-label">{label}</p>}
      {payload.map((entry, idx) => (
        <p key={idx} className="tooltip-value" style={{ color: entry.color || '#FF6600' }}>
          {entry.name || entry.dataKey}: {entry.value}{unit ? ` ${unit}` : ''}
        </p>
      ))}
    </div>
  );
};

// ─── Custom Pie Label ───
const renderPieLabel = ({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#e0e0e0"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={500}
    >
      {name} ({(percent * 100).toFixed(1)}%)
    </text>
  );
};

/**
 * Selector de Modo de Analisis
 * Permite al usuario elegir entre: General, Estadisticas o Negocio
 */
export const ModeSelector = ({ selectedMode, onModeChange, disabled }) => {
  const modes = [
    { id: 'general', label: 'General', description: 'Respuestas narrativas y explicativas' },
    { id: 'stats', label: 'Estadisticas', description: 'Analisis cuantitativo con metricas' },
    { id: 'business', label: 'Negocio', description: 'Analisis estrategico con ROI' }
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
 * ChartComponent - Real SVG charts via Recharts
 * Supports: bar, pie, line (rendered as area chart)
 */
export const ChartComponent = ({ chart }) => {
  const gradientId = useId();

  if (!chart || !chart.data) return null;

  const { type, data, unit, title } = chart;
  const entries = Object.entries(data);

  // Transform data for Recharts format
  const chartData = entries.map(([name, value]) => ({ name, value }));

  if (type === 'bar') {
    return (
      <div className="chart-container chart-animate">
        <h4 className="chart-title">{title || 'Grafico'}</h4>
        <ResponsiveContainer width="100%" height={Math.max(entries.length * 50, 200)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id={`barGrad-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF6600" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ff6b35" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#999', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#ccc', fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
            <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ fill: 'rgba(255,102,0,0.08)' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={800} animationEasing="ease-out">
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={NILO_COLORS[idx % NILO_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div className="chart-container chart-animate">
        <h4 className="chart-title">{title || 'Grafico'}</h4>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              label={renderPieLabel}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={NILO_COLORS[idx % NILO_COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={10}
              formatter={(value) => <span style={{ color: '#ccc', fontSize: 12 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className="chart-container chart-animate">
        <h4 className="chart-title">{title || 'Grafico'}</h4>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`areaGrad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6600" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 12 }} axisLine={{ stroke: '#333' }} tickLine={false} />
            <YAxis tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#FF6600"
              strokeWidth={2}
              fill={`url(#areaGrad-${gradientId})`}
              activeDot={{ r: 6, stroke: '#FF6600', strokeWidth: 2, fill: '#1a1a1a' }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
};

/**
 * TableComponent - Premium data table
 */
export const TableComponent = ({ table }) => {
  if (!table || !table.headers || !table.rows) return null;

  const isNumeric = (val) => !isNaN(parseFloat(val)) && isFinite(val);

  return (
    <div className="table-container table-animate">
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
                  <td key={cellIdx} className={isNumeric(cell) ? 'numeric-cell' : ''}>
                    {cell}
                  </td>
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
 * MetricsPanel - Premium metric cards with status gradients and staggered animation
 */
export const MetricsPanel = ({ metrics }) => {
  if (!metrics || metrics.length === 0) return null;

  const getStatusClass = (status) => {
    switch (status) {
      case 'good': return 'metric-good';
      case 'warning': return 'metric-warning';
      case 'critical': return 'metric-critical';
      default: return '';
    }
  };

  const getTrendIcon = (metric) => {
    if (!metric.benchmark) return null;
    const val = parseFloat(String(metric.value).replace(/[^0-9.-]/g, ''));
    const bench = parseFloat(String(metric.benchmark).replace(/[^0-9.-]/g, ''));
    if (isNaN(val) || isNaN(bench)) return null;
    if (val >= bench) return <span className="trend-icon trend-up">&#9650;</span>;
    return <span className="trend-icon trend-down">&#9660;</span>;
  };

  return (
    <div className="metrics-panel">
      <h4 className="metrics-title">Metricas Clave</h4>
      <div className="metrics-grid">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`metric-card ${getStatusClass(metric.status)}`}
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <div className="metric-header">
              <span className="metric-name">{metric.name}</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-value">{metric.value}</span>
              {getTrendIcon(metric)}
            </div>
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
 * RecommendationsPanel - Premium cards with priority borders and slide-in animation
 */
export const RecommendationsPanel = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) return null;

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'ALTA';
      case 'medium': return 'MEDIA';
      case 'low': return 'BAJA';
      default: return priority;
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

  const getTimeframeIcon = (timeframe) => {
    switch (timeframe) {
      case 'short': return '\u23F1'; // stopwatch
      case 'medium': return '\u23F0'; // alarm clock
      case 'long': return '\uD83D\uDCC5'; // calendar
      default: return '\u23F3'; // hourglass
    }
  };

  // Group by timeframe
  const grouped = recommendations.reduce((acc, rec) => {
    const tf = rec.timeframe || 'other';
    if (!acc[tf]) acc[tf] = [];
    acc[tf].push(rec);
    return acc;
  }, {});

  return (
    <div className="recommendations-panel">
      <h4 className="recommendations-title">Recomendaciones Estrategicas</h4>
      {Object.entries(grouped).map(([timeframe, recs]) => (
        <div key={timeframe} className="timeframe-group">
          <h5 className="timeframe-label">
            <span className="timeframe-chip">
              <span className="timeframe-icon">{getTimeframeIcon(timeframe)}</span>
              {getTimeframeLabel(timeframe)}
            </span>
          </h5>
          <div className="recommendations-list">
            {recs.map((rec, idx) => (
              <div
                key={idx}
                className={`recommendation-card ${getPriorityClass(rec.priority)}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="recommendation-header">
                  <span className={`priority-badge ${getPriorityClass(rec.priority)}`}>
                    {getPriorityLabel(rec.priority)}
                  </span>
                </div>
                <div className="recommendation-description">{rec.description}</div>
                {(rec.cost || rec.benefit || rec.effort) && (
                  <div className="recommendation-meta">
                    {rec.cost && (
                      <span className="meta-item">
                        <span className="meta-icon meta-cost">$</span>
                        <span className="meta-text">{rec.cost}</span>
                      </span>
                    )}
                    {rec.benefit && (
                      <span className="meta-item">
                        <span className="meta-icon meta-benefit">&#8593;</span>
                        <span className="meta-text">{rec.benefit}</span>
                      </span>
                    )}
                    {rec.effort && (
                      <span className="meta-item">
                        <span className="meta-icon meta-effort">&#9889;</span>
                        <span className="meta-text">{rec.effort}</span>
                      </span>
                    )}
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
 * CollapsibleSection - Smooth height animation with chevron rotation
 */
export const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(defaultOpen ? 'none' : '0px');

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setContentHeight(`${contentRef.current.scrollHeight}px`);
        // After transition, set to 'none' so dynamic content can grow
        const timer = setTimeout(() => setContentHeight('none'), 350);
        return () => clearTimeout(timer);
      } else {
        // First set explicit height for transition start
        setContentHeight(`${contentRef.current.scrollHeight}px`);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setContentHeight('0px');
          });
        });
      }
    }
  }, [isOpen]);

  return (
    <div className={`collapsible-section ${isOpen ? 'is-open' : ''}`}>
      <button
        className="collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`collapsible-chevron ${isOpen ? 'chevron-open' : ''}`}>&#9654;</span>
        <span className="collapsible-title">{title}</span>
      </button>
      <div
        ref={contentRef}
        className="collapsible-content"
        style={{ maxHeight: contentHeight }}
      >
        <div className="collapsible-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── Markdown components (shared) ───
const markdownComponents = {
  table: ({children}) => (
    <div className="markdown-table-wrapper">
      <table className="markdown-table">{children}</table>
    </div>
  ),
  thead: ({children}) => <thead>{children}</thead>,
  tbody: ({children}) => <tbody>{children}</tbody>,
  tr: ({children}) => <tr>{children}</tr>,
  th: ({children}) => <th>{children}</th>,
  td: ({children}) => <td>{children}</td>,
  h1: ({children}) => <h1 className="markdown-h1">{children}</h1>,
  h2: ({children}) => <h2 className="markdown-h2">{children}</h2>,
  h3: ({children}) => <h3 className="markdown-h3">{children}</h3>,
  h4: ({children}) => <h4 className="markdown-h4">{children}</h4>,
  h5: ({children}) => <h5 className="markdown-h5">{children}</h5>,
  h6: ({children}) => <h6 className="markdown-h6">{children}</h6>,
  ul: ({children}) => <ul className="markdown-ul">{children}</ul>,
  ol: ({children}) => <ol className="markdown-ol">{children}</ol>,
  li: ({children}) => <li>{children}</li>,
  code: ({inline, children}) =>
    inline ? <code className="markdown-code-inline">{children}</code>
           : <pre className="markdown-code-block"><code>{children}</code></pre>,
  a: ({href, children}) => (
    <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  strong: ({children}) => <strong className="markdown-strong">{children}</strong>,
  em: ({children}) => <em className="markdown-em">{children}</em>,
  blockquote: ({children}) => <blockquote className="markdown-blockquote">{children}</blockquote>,
  hr: () => <hr className="markdown-hr" />,
  p: ({children}) => <p className="markdown-p">{children}</p>,
  img: ({src, alt}) => <img src={src} alt={alt} className="markdown-img" />
};

/**
 * EnrichedResponse - Renders structured response with layout per mode
 */
export const EnrichedResponse = ({ response }) => {
  if (!response) return null;

  const { content, mode = 'general', charts, tables, metrics, recommendations } = response;

  // ─── MODO GENERAL ───
  if (mode === 'general') {
    return (
      <div className="enriched-response mode-general">
        <div className="mode-badge badge-general">Analisis General</div>

        <div className="general-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </ReactMarkdown>
        </div>

        {tables && tables.length > 0 && tables.map((table, idx) => (
          <TableComponent key={idx} table={table} />
        ))}
        {charts && charts.length > 0 && charts.map((chart, idx) => (
          <ChartComponent key={idx} chart={chart} />
        ))}
      </div>
    );
  }

  // ─── MODO ESTADISTICAS ───
  if (mode === 'stats') {
    return (
      <div className="enriched-response mode-stats">
        <div className="mode-badge badge-stats">Analisis Estadistico</div>

        {metrics && metrics.length > 0 && (
          <MetricsPanel metrics={metrics} />
        )}

        {charts && charts.length > 0 && (
          <div className="section-divider" />
        )}

        {charts && charts.length > 0 && (
          <div className="charts-grid">
            {charts.map((chart, idx) => (
              <ChartComponent key={idx} chart={chart} />
            ))}
          </div>
        )}

        {content && (
          <div className="section-divider" />
        )}

        {content && (
          <div className="stats-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        )}

        {tables && tables.length > 0 && tables.map((table, idx) => (
          <TableComponent key={idx} table={table} />
        ))}
      </div>
    );
  }

  // ─── MODO NEGOCIO ───
  if (mode === 'business') {
    return (
      <div className="enriched-response mode-business">
        <div className="mode-badge badge-business">Analisis de Negocio</div>

        {content && (
          <div className="executive-summary">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        )}

        {recommendations && recommendations.length > 0 && (
          <CollapsibleSection title="Recomendaciones Estrategicas" defaultOpen={true}>
            <RecommendationsPanel recommendations={recommendations} />
          </CollapsibleSection>
        )}

        {charts && charts.length > 0 && (
          <CollapsibleSection title="Datos de Soporte">
            <div className="charts-grid">
              {charts.map((chart, idx) => (
                <ChartComponent key={idx} chart={chart} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {tables && tables.length > 0 && (
          <CollapsibleSection title="Tablas de Analisis">
            {tables.map((table, idx) => (
              <TableComponent key={idx} table={table} />
            ))}
          </CollapsibleSection>
        )}

        {metrics && metrics.length > 0 && (
          <CollapsibleSection title="Metricas Clave">
            <MetricsPanel metrics={metrics} />
          </CollapsibleSection>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="enriched-response">
      <div className="response-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
      {charts && charts.length > 0 && charts.map((chart, idx) => <ChartComponent key={idx} chart={chart} />)}
      {tables && tables.length > 0 && tables.map((table, idx) => <TableComponent key={idx} table={table} />)}
      {metrics && metrics.length > 0 && <MetricsPanel metrics={metrics} />}
      {recommendations && recommendations.length > 0 && <RecommendationsPanel recommendations={recommendations} />}
    </div>
  );
};
