import React from 'react';
import ReactMarkdown from 'react-markdown';

// Componente para el modal de duplicados
export const DuplicateAlertModal = ({ alert, onClose }) => {
  if (!alert) return null;

  return (
    <div className="duplicate-modal-overlay" onClick={onClose}>
      <div className="duplicate-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="duplicate-modal-header">
          <div className="duplicate-icon">⚠️</div>
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
          <h3>📄 {document.path}</h3>
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
              💾 Descargar Archivo Original
            </button>
          </div>

          {/* Vista previa según tipo */}
          <div className="doc-content-preview">
            {/* Texto extraído de PDF/Word */}
            {isExtractableText && document.content_text && (
              <div className="extracted-text-container">
                <div className="extracted-text-indicator">
                  📄 Texto Extraído
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
                <div className="no-preview-icon">📎</div>
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

const modals = { DuplicateAlertModal, DocumentPreviewModal };
export default modals;
