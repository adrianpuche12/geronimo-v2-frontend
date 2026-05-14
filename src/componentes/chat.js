import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExportMenu } from './utilities';
import { EnrichedResponse } from './prompt-engine';
import '../styles/markdown.css';

// ─── CLP Stepper ──────────────────────────────────────────────────────────────

const CLP_STEPS = [
  { key: 'Q', num: 1, label: 'Calificación' },
  { key: 'K', num: 2, label: 'Competencia'  },
  { key: 'T', num: 3, label: 'Plazos'       },
  { key: 'N', num: 4, label: 'Normas'       },
  { key: 'S', num: 5, label: 'Subsunción'   },
  { key: 'E', num: 6, label: 'Estrategia'   },
];

const STEP_ORDER = ['Q', 'K', 'T', 'N', 'S', 'E'];

function CLPStepper({ clpState }) {
  if (!clpState?.active) return null;

  const currentIdx = STEP_ORDER.indexOf(clpState.step);

  return (
    <div className="clp-stepper">
      {CLP_STEPS.map((step, idx) => {
        const state = idx < currentIdx ? 'done'
                    : idx === currentIdx ? 'active'
                    : 'pending';
        const isLast = idx === CLP_STEPS.length - 1;
        return (
          <div key={step.key} className="clp-step">
            <div className={`clp-step-label clp-step--${state}`}>
              <span className="clp-step-num">{step.num}</span>
              {step.label}
            </div>
            {!isLast && (
              <div className={`clp-step-connector clp-step--${state}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Componentes markdown personalizados
const markdownComponents = {
  // Tablas con estilos profesionales
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

  // Títulos con jerarquía visual
  h1: ({children}) => <h1 className="markdown-h1">{children}</h1>,
  h2: ({children}) => <h2 className="markdown-h2">{children}</h2>,
  h3: ({children}) => <h3 className="markdown-h3">{children}</h3>,
  h4: ({children}) => <h4 className="markdown-h4">{children}</h4>,
  h5: ({children}) => <h5 className="markdown-h5">{children}</h5>,
  h6: ({children}) => <h6 className="markdown-h6">{children}</h6>,

  // Listas con bullets personalizados
  ul: ({children}) => <ul className="markdown-ul">{children}</ul>,
  ol: ({children}) => <ol className="markdown-ol">{children}</ol>,
  li: ({children}) => <li>{children}</li>,

  // Code blocks con syntax highlighting
  code: ({inline, children}) =>
    inline ? <code className="markdown-code-inline">{children}</code>
           : <pre className="markdown-code-block"><code>{children}</code></pre>,

  // Enlaces con color naranja
  a: ({href, children}) => (
    <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),

  // Énfasis y negritas
  strong: ({children}) => <strong className="markdown-strong">{children}</strong>,
  em: ({children}) => <em className="markdown-em">{children}</em>,

  // Blockquotes
  blockquote: ({children}) => <blockquote className="markdown-blockquote">{children}</blockquote>,

  // Separador horizontal
  hr: () => <hr className="markdown-hr" />,

  // Párrafos
  p: ({children}) => <p className="markdown-p">{children}</p>,

  // Imágenes
  img: ({src, alt}) => <img src={src} alt={alt} className="markdown-img" />
};


// V4 Sprint 1 — Badge de origen de respuesta
const getSourceBadge = (sourceMode) => {
  if (sourceMode === 'rag_pure')        return { label: 'Documentos propios',   cls: 'badge-docs' };
  if (sourceMode === 'rag_hybrid')      return { label: 'Contexto parcial',     cls: 'badge-partial' };
  if (sourceMode === 'knowledge_base')  return { label: 'Jurisprudencia',       cls: 'badge-kb' };
  if (sourceMode === 'general')         return { label: 'Conocimiento general', cls: 'badge-general' };
  return null;
};

// V4 Sprint 4 — Feedback 👍👎
const FeedbackButtons = ({ messageId, sessionId, onFeedback }) => {
  const [sent, setSent] = React.useState(null);

  const handleClick = (rating) => {
    if (sent) return;
    setSent(rating);
    if (onFeedback) onFeedback(sessionId, messageId, rating);
  };

  if (sent) {
    return (
      <div className="feedback-sent">
        {sent === 'positive' ? 'Gracias. Esta respuesta se guardó para mejorar Iurivia.' : 'Gracias. Lo usaremos para mejorar las respuestas de tu estudio.'}
      </div>
    );
  }

  return (
    <div className="feedback-buttons">
      <span className="feedback-label">¿Fue útil esta respuesta?{'  '}<span className="feedback-label-hint">Las aprobadas mejoran tu Iurivia.</span></span>
      <button className="feedback-btn feedback-btn--positive" onClick={() => handleClick('positive')} title="Respuesta útil">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
        Útil
      </button>
      <button className="feedback-btn feedback-btn--negative" onClick={() => handleClick('negative')} title="Respuesta mejorable">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
        Mejorar
      </button>
    </div>
  );
};

const STAGES_NORMAL = [
  'Recuperando documentos relevantes...',
  'Analizando contexto...',
  'Redactando respuesta...',
];

const STAGES_DEEP = [
  'Analisis profundo activado...',
  'Procesando multiples fuentes...',
  'Contrastando informacion...',
  'Sintetizando respuesta...',
];

const AnalysisStages = ({ isDeep }) => {
  const stages = isDeep ? STAGES_DEEP : STAGES_NORMAL;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    const interval = setInterval(() => {
      setIdx(prev => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [isDeep, stages.length]);

  return (
    <div style={{padding:'8px 0'}}>
      {isDeep && (
        <div style={{fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--accent)',marginBottom:8,fontWeight:600}}>Analisis profundo</div>
      )}
      <div key={idx} style={{color:'var(--text-muted)',fontSize:14,fontFamily:'var(--font-body)',animation:'fadeStage 0.4s ease'}}>
        {stages[idx]}
      </div>
      <style>{'.message-content @keyframes fadeStage{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}'}</style>
    </div>
  );
};


const JurisSources = ({ sources }) => {
  const juris = (sources || []).filter(s => s.type === 'jurisprudencia_publica');
  if (!juris.length) return null;
  return (
    <div className="juris-sources">
      <span className="juris-sources-label">Fuentes normativas verificadas</span>
      {juris.map((s, i) => (
        <span key={i} className="source-badge badge-juris">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0}}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          {s.titulo
            ? (s.tipo === 'decreto' ? 'Decreto' : 'Ley') + (s.numero_id ? ' N° ' + s.numero_id : '') + ' — ' + s.titulo.slice(0, 40) + (s.titulo.length > 40 ? '...' : '')
            : s.source}
          {s.infoleg_url && (
            <a href={s.infoleg_url} target="_blank" rel="noopener noreferrer" className="juris-source-link"
              onClick={e => e.stopPropagation()} title="Ver en Infoleg">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          )}
        </span>
      ))}
    </div>
  );
};

export const Chat = ({
  messages,
  messagesEndRef,
  isLoading,
  isDeepAnalysis = false,
  selectedProject,
  inputMessage,
  setInputMessage,
  handleKeyPress,
  handleSendMessage,
  showExportMenu,
  setShowExportMenu,
  exportAIResponse,
  handleCopyMessage,
  handleRegenerateMessage,
  onFeedback,
  activeFolderId,
  activeFolderName,
  onScopeChange,
  projects,
  onCreateProject,
  onProjectSelect,
  uploadedFiles = [],
  onUploadClick,
  clpState = null,
  onClpAction,
  lastUserMsgRef,}) => {
  const { user } = useAuth();
  const getUserInitials = () => {
    if (!user) return 'Tu';
    const name = user.fullName || user.email || '';
    const parts = name.split(/[\s@]/);
    if (parts.length >= 2 && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getUserFirstName = () => {
    if (!user) return null;
    const name = user.fullName || '';
    if (!name || name === user.email || name.includes('@')) return null;
    return name.split(/\s+/)[0] || null;
  };

  const [scopeOpen, setScopeOpen] = React.useState(false);
  const [expandedProject, setExpandedProject] = React.useState(null);
  const [folderCache, setFolderCache] = React.useState({});
  const scopeRef = React.useRef(null);
  const _API = process.env.REACT_APP_API_URL || '/api';

  const fetchFolders = (pid) => {
    if (folderCache[pid] !== undefined) return;
    import('axios').then(({ default: ax }) => {
      ax.get(_API + '/folders?projectId=' + pid)
        .then(({ data }) => setFolderCache(c => ({ ...c, [pid]: data || [] })))
        .catch(() => setFolderCache(c => ({ ...c, [pid]: [] })));
    });
  };

  React.useEffect(() => {
    if (scopeOpen && selectedProject) {
      setExpandedProject(selectedProject);
      fetchFolders(selectedProject);
    }
  }, [scopeOpen]);

  React.useEffect(() => {
    if (!scopeOpen) return;
    const handler = (e) => { if (scopeRef.current && !scopeRef.current.contains(e.target)) setScopeOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [scopeOpen]);

  const renderFolderTree = (nodes, depth) => {
    if (!nodes || !nodes.length) return null;
    return nodes.map(f => (
      <React.Fragment key={f.id}>
        <button
          className={"scope-folder-item" + (activeFolderId === f.id ? " scope-folder-item--active" : "")}
          style={{ paddingLeft: 28 + depth * 14 }}
          onClick={() => { onScopeChange(f.id, f.name); setScopeOpen(false); }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,opacity:0.7}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span>{f.name}</span>
        </button>
        {f.children && renderFolderTree(f.children, depth + 1)}
      </React.Fragment>
    ));
  };

  const [lastSessions, setLastSessions] = React.useState([]);
  const [hintDismissed, setHintDismissed] = React.useState(
    () => localStorage.getItem('lexiius-scope-hint-dismissed') === '1'
  );
  const dismissHint = () => { localStorage.setItem('lexiius-scope-hint-dismissed','1'); setHintDismissed(true); };
  React.useEffect(() => {
    if (messages.length === 0) {
      const API_URL = process.env.REACT_APP_API_URL || '/api';
      import('axios').then(({ default: ax }) => {
        ax.get(API_URL + '/sessions').then(({ data }) => {
          setLastSessions((data || []).slice(0, 2));
        }).catch(() => {});
      });
    }
  }, [messages.length]);

  const GREETINGS = [
    (name) => name ? 'Hola ' + name + ', ¿en qué trabajamos hoy?' : '¿En qué puedo ayudarte hoy?',
    (name) => name ? 'Bienvenido, ' + name + '. ¿Qué necesitás resolver?' : '¿Qué necesitás resolver hoy?',
    (name) => name ? '¿Listo para trabajar, ' + name + '?' : '¿Listo para trabajar?',
    (name) => name ? name + ', ¿cómo puedo ayudarte hoy?' : '¿Cómo puedo ayudarte hoy?',
  ];
  const greeting = React.useMemo(() => {
    const idx = new Date().getDay() % GREETINGS.length;
    return GREETINGS[idx](getUserFirstName());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  return (
    <section className="chat-section">
      <CLPStepper clpState={clpState} />
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            {(!projects || projects.length === 0) ? (
              <>
                <div className="chat-empty-avatar" style={{background:'none',border:'none'}}>
              <svg width="56" height="56" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="ceia" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7C3AED"/><stop offset="100%" stopColor="#A78BFA"/></linearGradient>
                  <linearGradient id="ceib" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6D28D9"/><stop offset="100%" stopColor="#9D6EF5"/></linearGradient>
                </defs>
                <rect width="32" height="32" rx="7" fill="#16112a"/>
                <rect x="15" y="6" width="2.2" height="18" rx="1.1" fill="url(#ceia)"/>
                <rect x="8" y="22.5" width="16" height="2" rx="1" fill="url(#ceib)"/>
                <rect x="5.5" y="12" width="21" height="2" rx="1" fill="url(#ceib)"/>
                <circle cx="7.5" cy="13" r="3" fill="#9D6EF5" stroke="#16112a" strokeWidth="1.4"/>
                <circle cx="7.5" cy="13" r="1" fill="#ffffff" opacity="0.9"/>
                <circle cx="24.5" cy="13" r="3" fill="#9D6EF5" stroke="#16112a" strokeWidth="1.4"/>
                <circle cx="24.5" cy="13" r="1" fill="#ffffff" opacity="0.9"/>
                <circle cx="16.1" cy="6" r="2" fill="url(#ceia)" stroke="#16112a" strokeWidth="1"/>
              </svg>
            </div>
                <h2 className="chat-empty-title">Bienvenido a Iurivia</h2>
                <p className="chat-empty-subtitle">Para empezar, creá tu primer proyecto y subí los documentos de tu estudio.</p>
                {onCreateProject && (
                  <button className="chat-empty-cta-btn" onClick={onCreateProject}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Crear primer proyecto
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="chat-empty-avatar" style={{background:'none',border:'none'}}>
              <svg width="56" height="56" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="ceia" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7C3AED"/><stop offset="100%" stopColor="#A78BFA"/></linearGradient>
                  <linearGradient id="ceib" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6D28D9"/><stop offset="100%" stopColor="#9D6EF5"/></linearGradient>
                </defs>
                <rect width="32" height="32" rx="7" fill="#16112a"/>
                <rect x="15" y="6" width="2.2" height="18" rx="1.1" fill="url(#ceia)"/>
                <rect x="8" y="22.5" width="16" height="2" rx="1" fill="url(#ceib)"/>
                <rect x="5.5" y="12" width="21" height="2" rx="1" fill="url(#ceib)"/>
                <circle cx="7.5" cy="13" r="3" fill="#9D6EF5" stroke="#16112a" strokeWidth="1.4"/>
                <circle cx="7.5" cy="13" r="1" fill="#ffffff" opacity="0.9"/>
                <circle cx="24.5" cy="13" r="3" fill="#9D6EF5" stroke="#16112a" strokeWidth="1.4"/>
                <circle cx="24.5" cy="13" r="1" fill="#ffffff" opacity="0.9"/>
                <circle cx="16.1" cy="6" r="2" fill="url(#ceia)" stroke="#16112a" strokeWidth="1"/>
              </svg>
            </div>
                <h2 className="chat-empty-title">{greeting}</h2>
                <p className="chat-empty-subtitle">
                  {selectedProject && uploadedFiles.length === 0
                    ? 'Este proyecto todavía no tiene documentos. Subí expedientes, contratos o escritos para que Iurivia pueda consultarlos.'
                    : selectedProject
                    ? 'Hacé una pregunta sobre tus documentos o sobre cualquier tema.'
                    : 'Seleccioná un proyecto en el panel lateral para comenzar.'}
                </p>
            {selectedProject && uploadedFiles.length === 0 && onUploadClick && (
              <button className="chat-empty-cta-btn chat-empty-cta-btn--secondary" onClick={onUploadClick} style={{marginBottom:'var(--space-3)'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Subir documentos
              </button>
            )}
            {selectedProject && (
              <div className="chat-empty-suggestions">
                {[
                  ...lastSessions.map(s => `Continuemos con "${s.title || 'la sesión anterior'}"`),
                  '¿Cuál es el plazo de prescripción para esta acción?',
                  '¿Qué artículos del CCyC aplican a este caso?',
                  'Analizá los puntos débiles de la demanda',
                  '¿Qué dice la jurisprudencia de la CSJN sobre este tema?',
                  'Resumí los hechos principales del expediente',
                  'Identificá las cláusulas problemáticas del contrato',
                ].slice(0, 4).map((s) => (
                  <button
                    key={s}
                    className="chat-empty-chip"
                    onClick={() => setInputMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {selectedProject && !hintDismissed && (
              <div className="scope-discovery-hint">
                <div className="scope-hint-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div className="scope-hint-body">
                  <p className="scope-hint-title">Respuestas más precisas con el filtro de carpeta</p>
                  <p className="scope-hint-text">Si tenés muchos expedientes, filtrá por el caso activo usando el selector <strong>{(projects && projects.find(p=>p.id===selectedProject))?.name || 'proyecto'}</strong>. Así Iurivia no mezcla información de otros proyectos.</p>
                </div>
                <button className="scope-hint-close" onClick={dismissHint} title="No mostrar más">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
              </>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
            // El último mensaje de usuario recibe el ref para el scroll
            const isLastUserMsg = message.role === 'user' &&
              messages.slice(index + 1).every(m => m.role !== 'user');
            return (
              <div
                key={index}
                ref={isLastUserMsg ? lastUserMsgRef : null}
                className={`message ${message.role}`}
              >
                <div className="message-header">
                  {message.role === 'user' ? (
                    <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:22,height:22,borderRadius:'50%',background:'var(--accent)',color:'var(--bg-base)',fontSize:10,fontWeight:700,flexShrink:0}}>
                      {getUserInitials()}
                    </span>
                  ) : message.role === 'assistant' ? (
                    <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:22,height:22,borderRadius:'50%',background:'var(--bg-glass-strong)',border:'1px solid var(--border-strong)',color:'var(--text-accent)',fontSize:10,fontWeight:700,flexShrink:0}}>L</span>
                  ) : 'Sistema'}
                  {message.role === 'assistant' && message.sourceMode && (() => {
                    const badge = getSourceBadge(message.sourceMode);
                    return badge ? (
                      <span className={`source-badge ${badge.cls}`}>
                        <svg width="5" height="5" viewBox="0 0 5 5" fill="currentColor" style={{flexShrink:0}}><circle cx="2.5" cy="2.5" r="2.5"/></svg>
                        {badge.label}
                      </span>
                    ) : null;
                  })()}
                  {message.role === 'assistant' && message.dualPipeline && (
                    <span className="source-badge badge-dual">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Análisis comparado
                    </span>
                  )}
                  {message.role === 'assistant' && message.validatedResponse && (
                    <span className="source-badge badge-validated">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>
                      Verificado &middot; {Math.round(message.validatedResponse.confidence * 100)}%
                    </span>
                  )}
                </div>
                {message.role === 'assistant' &&
                 (!message.sources || message.sources.length === 0) &&
                 message.sourceMode && message.sourceMode !== 'rag_pure' && (
                  <div className="no-sources-warning">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Respuesta sin fuentes verificables — no citar en escritos sin verificación manual
                  </div>
                )}
                <div className="message-content">
                  {/* CAPA 4: Usar EnrichedResponse solo si hay datos estructurados no vacíos */}
                  {message.role === 'assistant' && (
                    (message.charts?.length > 0 || message.tables?.length > 0 || message.metrics?.length > 0 || message.recommendations?.length > 0)
                  ) ? (
                    <EnrichedResponse response={message} />
                  ) : (
                    message.role === 'assistant' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {message.content
                          .replace(/\[CLP-T:[^\]]*\]\s*[-—]?\s*[^\n]*/gi, '')
                          .trim()}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )
                  )}
                </div>
                <JurisSources sources={message.sources} />
                {message.role === 'assistant' && (
                  <div className="message-actions">
                    {/* Botón copiar */}
                    <button
                      className="btn-copy"
                      onClick={() => handleCopyMessage(message.content)}
                      title="Copiar respuesta al portapapeles"
                    >
                      Copiar
                    </button>

                    {/* Botón regenerar (solo en último mensaje) */}
                    {index === messages.length - 1 && !isLoading && (
                      <button
                        className="btn-regenerate"
                        onClick={() => handleRegenerateMessage(index)}
                        title="Regenerar respuesta"
                      >
                        Regenerar
                      </button>
                    )}
                {/* V4 Sprint 4 — Feedback */}
                {message.role === 'assistant' && message.messageId && (
                  <FeedbackButtons
                    messageId={message.messageId}
                    sessionId={message.sessionId}
                    onFeedback={onFeedback}
                  />
                )}

                {/* CLP — botón Continuar */}
                {message.role === 'assistant' &&
                  (message.clp?.active || clpState?.active) &&
                  index === messages.length - 1 &&
                  !isLoading && (
                  <div className="clp-actions">
                    <button
                      className="clp-btn-continuar"
                      onClick={() => onClpAction && onClpAction('continuar')}
                    >
                      Continuar al siguiente paso
                    </button>
                    <span className="clp-step-hint">
                      Podés hacer más preguntas antes de avanzar
                    </span>
                  </div>
                )}

                    {/* Botón exportar existente */}
                    <button
                      className="btn-export-response"
                      onClick={() => setShowExportMenu(showExportMenu === message.timestamp ? null : message.timestamp)}
                      title="Exportar respuesta"
                    >
                      Exportar
                    </button>

                    {showExportMenu === message.timestamp && (
                      <ExportMenu
                        message={message}
                        onClose={() => setShowExportMenu(null)}
                        exportAIResponse={exportAIResponse}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content" style={{background:'transparent',padding:'12px 0'}}>
                  <AnalysisStages isDeep={isDeepAnalysis} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input-area">

        <div className="chat-input-wrapper">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedProject ?
              activeFolderName
                ? 'Buscando en "' + activeFolderName + '" — hacé tu pregunta...'
                : "Preguntá sobre los documentos de " + ((projects && projects.find(p=>p.id===selectedProject))?.name || 'este proyecto') + "..."
              : "Seleccioná un proyecto para empezar"
            }
            disabled={!selectedProject || isLoading}
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !selectedProject || isLoading}
            title="Enviar"
          >
            {isLoading ? (
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeDasharray="56" strokeDashoffset="20" style={{animation:'spin 1s linear infinite', transformOrigin:'center'}} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></svg>
            ) : (
              <svg viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Chat;
