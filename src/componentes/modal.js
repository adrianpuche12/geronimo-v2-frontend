import React from 'react';
import ReactMarkdown from 'react-markdown';

// Componente para el modal de duplicados
export const DuplicateAlertModal = ({ alert, onClose, onReplace, onSkipAll }) => {
  if (!alert) return null;
  return (
    <div className="duplicate-modal-overlay" onClick={onClose}>
      <div className="duplicate-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="duplicate-modal-header">
          <div className="duplicate-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <h3 className="duplicate-modal-title">Archivo ya existe</h3>
        </div>
        <div className="duplicate-modal-body">
          <p className="duplicate-main-message">
            <strong>"{alert.fileName}"</strong> ya existe en este proyecto.
          </p>
          {(alert.existingPath || alert.existingTitle) && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-2)',margin:'var(--space-3) 0'}}>
              <div style={{background:'var(--bg-surface-2)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',padding:'var(--space-3)',fontSize:'var(--text-xs)'}}>
                <div style={{fontSize:10,fontWeight:'var(--font-bold)',textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-disabled)',marginBottom:'var(--space-1)'}}>Existente</div>
                <div style={{fontSize:'var(--text-sm)',color:'var(--text-secondary)',fontWeight:'var(--font-medium)'}}>{alert.existingTitle || alert.existingPath}</div>
              </div>
              <div style={{background:'var(--bg-accent-subtle)',border:'1px solid var(--border-accent)',borderRadius:'var(--radius-md)',padding:'var(--space-3)',fontSize:'var(--text-xs)'}}>
                <div style={{fontSize:10,fontWeight:'var(--font-bold)',textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-accent)',marginBottom:'var(--space-1)'}}>Nuevo</div>
                <div style={{fontSize:'var(--text-sm)',color:'var(--text-secondary)',fontWeight:'var(--font-medium)'}}>{alert.fileName}</div>
              </div>
            </div>
          )}
        </div>
        <div className="duplicate-modal-footer" style={{display:'flex',flexDirection:'column',gap:'var(--space-2)'}}>
          {onReplace && (
            <button className="btn-modal-replace" onClick={() => { onReplace(alert); onClose(); }}>
              Reemplazar archivo existente
            </button>
          )}
          <button className="btn-modal-skip" onClick={onClose}>
            Omitir este archivo
          </button>
          {onSkipAll && (
            <button className="btn-modal-skip-all" onClick={() => { onSkipAll(); onClose(); }}>
              Omitir todos los duplicados
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal de vista previa de documentos MEJORADO
export const DocumentPreviewModal = ({ document, onClose, formatDate, formatFileSize }) => {
  if (!document) return null;

  // Detectar tipo de archivo
  const mimeType = document.mime_type || 'text/plain';
  const isExtractableText = document.content_text && (
    mimeType === 'application/pdf' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  );

  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');
  const isText = mimeType.startsWith('text/') || mimeType === 'application/json';

  // URL para descargar archivo original
  const downloadUrl = `/api/docs/${document.id}/download`;

  // Función para descargar archivo
  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'6px',verticalAlign:'middle',flexShrink:0}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>{document.path}</h3>
          <button
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="doc-metadata">
            <span><strong>Título:</strong> {document.title || 'Sin título'}</span>
            <span><strong>Creado:</strong> {formatDate(document.created_at || document.createdAt)}</span>
            <span><strong>Tamaño:</strong> {
              document.file_size
                ? `${(document.file_size / 1024).toFixed(2)} KB`
                : document.content_text
                  ? `${(new Blob([document.content_text]).size / 1024).toFixed(2)} KB`
                  : 'N/A'
            }</span>
            <span><strong>Tipo:</strong> {mimeType}</span>
            {document.storage_location && (
              <span><strong>Almacenamiento:</strong> {document.storage_location === 'b2' ? 'B2 Cloud' : 'PostgreSQL'}</span>
            )}
          </div>

          {/* Botón de descarga */}
          <div className="doc-actions">
            <button className="btn-download" onClick={handleDownload}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Descargar archivo
            </button>
          </div>

          {/* Vista previa según tipo */}
          <div className="doc-content-preview">
            {/* Texto extraído de PDF/Word */}
            {isExtractableText && document.content_text && (
              <div className="extracted-text-container">
                <div className="extracted-text-indicator">
                  Texto extraído
                  {isPDF && ' (del PDF)'}
                  {mimeType.includes('word') && ' (del documento Word)'}
                </div>
                <div className="markdown-content">
                  <ReactMarkdown>{document.content_text}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* PDF embebido */}
            {isPDF && !document.content_text && (
              <div className="pdf-viewer-container">
                <iframe
                  src={downloadUrl}
                  className="pdf-iframe"
                  title="PDF Viewer"
                />
              </div>
            )}

            {/* Imagen */}
            {isImage && (
              <div className="image-viewer-container">
                <img
                  src={downloadUrl}
                  alt={document.title || 'Imagen'}
                  className="preview-image"
                />
              </div>
            )}

            {/* Texto plano */}
            {isText && document.content_text && (
              <div className="text-content markdown-content">
                <ReactMarkdown>{document.content_text}</ReactMarkdown>
              </div>
            )}

            {/* Fallback: archivo no previsualizable */}
            {!isExtractableText && !isPDF && !isImage && !isText && (
              <div className="no-preview">
                <div className="no-preview-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></div>
                <p>Vista previa no disponible para este tipo de archivo</p>
                <p className="no-preview-hint">Usa el botón de descarga para abrir el archivo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de confirmación para eliminar proyecto o documento
export const ConfirmDeleteModal = ({ modal, onConfirm, onCancel, isProcessing }) => {
  if (!modal || !modal.show) return null;

  const isProject = modal.type === 'proyecto';

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
    background: 'var(--bg-overlay)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
    animation: 'fadeIn var(--duration-fast) var(--ease-default)',
  };

  const cardStyle = {
    width: '100%', maxWidth: 400,
    background: 'var(--bg-glass-strong)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-xl), var(--shadow-glow-sm)',
    padding: '32px 28px 24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
    fontFamily: 'var(--font-body)',
    textAlign: 'center',
  };

  return (
    <div style={overlayStyle} onClick={isProcessing ? null : onCancel}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {isProcessing ? (
          /* ── Estado procesando ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid var(--border-default)',
              borderTopColor: 'var(--accent)',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Eliminando...
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', background: 'var(--bg-surface-2)',
                padding: '3px 10px', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
                {modal.name}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Ícono ── */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>

            {/* ── Título ── */}
            <h3 style={{ margin: '0 0 10px', fontSize: 'var(--text-lg)',
              fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
              ¿Eliminar {modal.type}?
            </h3>

            {/* ── Nombre del archivo ── */}
            <p style={{ margin: '0 0 6px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Estás por eliminar:
            </p>
            <p style={{
              margin: '0 0 18px', fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-mono)', fontWeight: 500,
              color: 'var(--text-primary)',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 14px',
              maxWidth: '100%', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {modal.name}
            </p>

            {/* ── Advertencia proyecto ── */}
            {isProject && (
              <div style={{
                width: '100%', marginBottom: 18,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex', gap: 10, alignItems: 'flex-start',
                textAlign: 'left',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#ef4444" strokeWidth="2" strokeLinecap="round"
                  style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: '#ef4444', lineHeight: 1.5 }}>
                  <strong>Se eliminarán todos los documentos y archivos del proyecto.</strong>
                  {' '}Esta acción es permanente e irreversible.
                </p>
              </div>
            )}

            {/* ── Aviso simple (documento) ── */}
            {!isProject && (
              <p style={{ margin: '0 0 20px', fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Esta acción no se puede deshacer.
              </p>
            )}

            {/* ── Botones ── */}
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: isProject ? 0 : 2 }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, height: 40,
                  background: 'transparent',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--btn-radius)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                style={{
                  flex: 1, height: 40,
                  background: '#dc2626',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--btn-radius)',
                  color: '#fff',
                  fontSize: 'var(--text-sm)', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  transition: 'var(--transition-fast)',
                  letterSpacing: 'var(--tracking-tight)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#b91c1c'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#dc2626'; }}
              >
                {isProject ? 'Eliminar todo' : 'Sí, eliminar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Toast de notificación (éxito o error)
export const Toast = ({ toast, onClose }) => {
  if (!toast || !toast.show) return null;
  const icons = {
    success: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    error:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    warning: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    info:    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  return (
    <div className={`toast-notification toast-${toast.type || 'success'}`}
         style={toast.duration ? {'--toast-duration': toast.duration + 'ms'} : {}}>
      {toast.type === 'loading'
        ? <div className="toast-spinner" />
        : <span className="toast-icon">{icons[toast.type] || icons.success}</span>
      }
      <span className="toast-message">{toast.message}</span>
      {onClose && toast.type !== 'loading' && (
        <button className="toast-close-btn" onClick={onClose} title="Cerrar">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  );
};

const modals = { DuplicateAlertModal, DocumentPreviewModal, ConfirmDeleteModal, Toast };
export default modals;
