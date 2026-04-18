import React from 'react';
import ReactMarkdown from 'react-markdown';

// Componente para el modal de duplicados
export const DuplicateAlertModal = ({ alert, onClose }) => {
  if (!alert) return null;

  return (
    <div className="duplicate-modal-overlay" onClick={onClose}>
      <div className="duplicate-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="duplicate-modal-header">
          <div className="duplicate-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          <h3 className="duplicate-modal-title">Archivo duplicado</h3>
        </div>

        <div className="duplicate-modal-body">
          <p className="duplicate-main-message">
            El archivo <strong>"{alert.fileName}"</strong> ya existe en el proyecto.
          </p>
        </div>

        <div className="duplicate-modal-footer">
          <button className="btn-modal-close" onClick={onClose}>
            Cerrar
          </button>
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

  return (
    <div className="confirm-modal-overlay" onClick={isProcessing ? null : onCancel}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        {isProcessing ? (
          <div className="confirm-modal-processing">
            <div className="confirm-modal-spinner">
              <div className="spinner-ring"></div>
            </div>
            <h3 className="confirm-modal-processing-title">Eliminando...</h3>
            <p className="confirm-modal-processing-name">"{modal.name}"</p>
            <div className="confirm-modal-progress-bar">
              <div className="confirm-modal-progress-fill"></div>
            </div>
            <p className="confirm-modal-processing-hint">Por favor espera, esto puede tomar unos segundos.</p>
          </div>
        ) : (
          <>
            <div className="confirm-modal-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></div>
            <h3 className="confirm-modal-title">
              ¿Eliminar {modal.type}?
            </h3>
            <p className="confirm-modal-message">
              Estás por eliminar <strong>"{modal.name}"</strong>.
            </p>
            {isProject && (
              <div className="confirm-modal-danger-box">
                <span className="confirm-modal-danger-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
                <div className="confirm-modal-danger-text">
                  <strong>Se eliminarán todos los documentos y archivos del proyecto.</strong>
                  <br />Esta acción es permanente e irreversible.
                </div>
              </div>
            )}
            {!isProject && (
              <p className="confirm-modal-irreversible">Esta acción no se puede deshacer.</p>
            )}
            <div className="confirm-modal-actions">
              <button className="btn-confirm-cancel" onClick={onCancel}>
                Cancelar
              </button>
              <button className="btn-confirm-delete" onClick={onConfirm}>
                {isProject ? 'Eliminar proyecto y contenido' : 'Sí, eliminar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Toast de notificación (éxito o error)
export const Toast = ({ toast }) => {
  if (!toast || !toast.show) return null;

  return (
    <div className={`toast-notification toast-${toast.type}`}>
      <span className="toast-icon">
        {toast.type === 'success'
          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        }
      </span>
      <span className="toast-message">{toast.message}</span>
    </div>
  );
};

const modals = { DuplicateAlertModal, DocumentPreviewModal, ConfirmDeleteModal, Toast };
export default modals;
