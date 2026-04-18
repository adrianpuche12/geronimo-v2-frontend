import React from 'react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExportMenu } from './utilities';
import { EnrichedResponse } from './prompt-engine';
import '../styles/markdown.css';

// Componentes markdown personalizados con tema Geronimo 2.0
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
  if (sourceMode === 'rag_pure')        return { icon: '🟢', label: 'Basado en tus documentos',   cls: 'badge-rag-pure' };
  if (sourceMode === 'rag_hybrid')      return { icon: '🟡', label: 'Contexto parcial',            cls: 'badge-rag-hybrid' };
  if (sourceMode === 'knowledge_base')  return { icon: '📚', label: 'Base de conocimiento',        cls: 'badge-knowledge-base' };
  if (sourceMode === 'general')         return { icon: '⬜', label: 'Conocimiento general',         cls: 'badge-general' };
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
        {sent === 'positive' ? '👍 Gracias por tu valoración' : '👎 Gracias, lo tendremos en cuenta'}
      </div>
    );
  }

  return (
    <div className="feedback-buttons">
      <span className="feedback-label">¿Fue útil esta respuesta?</span>
      <button className="feedback-btn feedback-btn--positive" onClick={() => handleClick('positive')} title="Respuesta útil">
        👍
      </button>
      <button className="feedback-btn feedback-btn--negative" onClick={() => handleClick('negative')} title="Respuesta mejorable">
        👎
      </button>
    </div>
  );
};

export const Chat = ({
  messages,
  messagesEndRef,
  isLoading,
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
  onProjectSelect,}) => {
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
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="chat-empty-avatar">
              <span>G</span>
            </div>
            <h2 className="chat-empty-title">{greeting}</h2>
            <p className="chat-empty-subtitle">
              {selectedProject
                ? 'Hacé una pregunta sobre tus documentos o sobre cualquier tema.'
                : 'Seleccioná un proyecto en el panel lateral para comenzar.'}
            </p>
            {selectedProject && (
              <div className="chat-empty-suggestions">
                {[
                  ...lastSessions.map(s => `Continuemos con "${s.title || 'la sesión anterior'}"`),
                  '¿Cuáles son los puntos clave de este documento?',
                  'Resumí los archivos más importantes',
                  'Analizá el contenido de este proyecto',
                  '¿Qué información relevante encontrás aquí?',
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
                  <p className="scope-hint-title">Enfocá tu búsqueda</p>
                  <p className="scope-hint-text">Usá el selector <strong>{(projects && projects.find(p=>p.id===selectedProject))?.name || 'proyecto'}</strong> en la barra superior para consultar solo una carpeta específica. Así Lexiius busca solo en esos documentos.</p>
                </div>
                <button className="scope-hint-close" onClick={dismissHint} title="No mostrar más">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role}`}
              >
                <div className="message-header">
                  {message.role === 'user' ? (
                    <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:22,height:22,borderRadius:'50%',background:'var(--accent)',color:'var(--bg-base)',fontSize:10,fontWeight:700,flexShrink:0}}>
                      {getUserInitials()}
                    </span>
                  ) : message.role === 'assistant' ? (
                    <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:22,height:22,borderRadius:'50%',background:'var(--bg-glass-strong)',border:'1px solid var(--border-strong)',color:'var(--text-accent)',fontSize:10,fontWeight:700,flexShrink:0}}>G</span>
                  ) : 'Sistema'}
                  {message.role === 'assistant' && message.sourceMode && (() => {
                    const badge = getSourceBadge(message.sourceMode);
                    return badge ? (
                      <span className={`source-badge ${badge.cls}`}>
                        {badge.icon} {badge.label}
                      </span>
                    ) : null;
                  })()}
                  {message.role === 'assistant' && message.validatedResponse && (
                    <span className="source-badge badge-validated">
                      ✓ Respuesta validada &middot; Confianza: {Math.round(message.validatedResponse.confidence * 100)}%
                    </span>
                  )}
                </div>
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
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )
                  )}
                </div>
                {message.role === 'assistant' && (
                  <div className="message-actions">
                    {/* Botón copiar */}
                    <button
                      className="btn-copy"
                      onClick={() => handleCopyMessage(message.content)}
                      title="Copiar respuesta al portapapeles"
                    >
                      📋 Copiar
                    </button>

                    {/* Botón regenerar (solo en último mensaje) */}
                    {index === messages.length - 1 && !isLoading && (
                      <button
                        className="btn-regenerate"
                        onClick={() => handleRegenerateMessage(index)}
                        title="Regenerar respuesta"
                      >
                        🔄 Regenerar
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

                    {/* Botón exportar existente */}
                    <button
                      className="btn-export-response"
                      onClick={() => setShowExportMenu(showExportMenu === message.timestamp ? null : message.timestamp)}
                      title="Exportar respuesta"
                    >
                      💾 Exportar
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
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content loading-container">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
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
