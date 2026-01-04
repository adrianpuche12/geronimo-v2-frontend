import React from 'react';
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
  handleRegenerateMessage
}) => {
  return (
    <section className="chat-section">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <p>Selecciona un proyecto y comienza a hacer preguntas</p>
            <p style={{fontSize: '0.85rem', marginTop: '0.5rem'}}>
              También puedes subir archivos desde el panel lateral
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role}`}
              >
                <div className="message-header">
                  {message.role === 'user' ? 'Tú' :
                   message.role === 'assistant' ? 'Nilo' : 'Sistema'}
                </div>
                <div className="message-content">
                  {/* CAPA 4: Usar EnrichedResponse si hay datos estructurados */}
                  {message.role === 'assistant' && (message.charts || message.tables || message.metrics || message.recommendations) ? (
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
                <div className="message-header">Nilo</div>
                <div className="message-content">
                  <div className="loading"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input-area">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={selectedProject ?
            "Escribe tu pregunta sobre el proyecto..." :
            "Selecciona un proyecto primero"
          }
          disabled={!selectedProject || isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || !selectedProject || isLoading}
        >
          {isLoading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </section>
  );
};

export default Chat;
