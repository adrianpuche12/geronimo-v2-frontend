import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import '../styles/document-reader.css';

/**
 * DocumentReader - Vista profesional estilo Medium/Notion para documentos
 * Características:
 * - Tabla de contenidos automática
 * - Barra de progreso de lectura
 * - Tiempo estimado de lectura
 * - Búsqueda dentro del documento
 * - Diseño optimizado para lectura
 */
export const DocumentReader = ({ document, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [tableOfContents, setTableOfContents] = useState([]);
  const [highlightedText, setHighlightedText] = useState('');
  const contentRef = useRef(null);

  // Calcular tiempo de lectura (promedio 200 palabras por minuto)
  const calculateReadingTime = (text) => {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes;
  };

  // Extraer tabla de contenidos (headings del markdown)
  const extractTableOfContents = (text) => {
    if (!text) return [];

    const headings = [];
    const lines = text.split('\n');

    lines.forEach((line, index) => {
      // Detectar markdown headings (# ## ###)
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2].trim();
        const id = `heading-${index}`;
        headings.push({ level, title, id, line: index });
      }
    });

    return headings;
  };

  // Manejar scroll para actualizar progreso
  const handleScroll = () => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    const windowHeight = element.clientHeight;
    const documentHeight = element.scrollHeight - windowHeight;
    const scrollTop = element.scrollTop;

    const progress = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };

  // Scroll a sección específica
  const scrollToSection = (lineNumber) => {
    if (!contentRef.current) return;

    // Aproximación: cada línea tiene ~30px de altura
    const targetScroll = lineNumber * 30;
    contentRef.current.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  // Resaltar texto de búsqueda
  const highlightSearchResults = (text) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  // Inicializar tabla de contenidos
  useEffect(() => {
    const content = document.content_text || document.content || '';
    const toc = extractTableOfContents(content);
    setTableOfContents(toc);
  }, [document]);

  // Preparar contenido para visualización
  const displayContent = document.content_text || document.content || 'Sin contenido disponible';
  const readingTime = calculateReadingTime(displayContent);
  const mimeType = document.mime_type || 'text/plain';
  const isPDF = mimeType === 'application/pdf';
  const isWord = mimeType.includes('word');
  const downloadUrl = `/api/docs/${document.id}/download`;

  // Imprimir documento
  const handlePrint = () => {
    window.print();
  };

  // Copiar contenido al portapapeles
  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    alert('Contenido copiado al portapapeles');
  };

  return (
    <div className="document-reader-overlay">
      {/* Barra de progreso superior */}
      <div className="reading-progress-bar">
        <div
          className="reading-progress-fill"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header con acciones */}
      <div className="reader-header">
        <div className="reader-header-left">
          <button className="btn-back" onClick={onClose}>
            ← Volver
          </button>
        </div>

        <div className="reader-header-center">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar en el documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="reader-header-right">
          <button className="btn-action" onClick={() => window.open(downloadUrl, '_blank')} title="Descargar">
            📥
          </button>
          <button className="btn-action" onClick={handleCopy} title="Copiar texto">
            📋
          </button>
          <button className="btn-action" onClick={handlePrint} title="Imprimir">
            🖨️
          </button>
          <button className="btn-close" onClick={onClose} title="Cerrar">
            ✕
          </button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="reader-container">
        {/* Sidebar con tabla de contenidos */}
        {tableOfContents.length > 0 && (
          <aside className="reader-sidebar">
            <div className="toc-header">
              <h3>📑 Tabla de Contenidos</h3>
            </div>
            <nav className="toc-nav">
              {tableOfContents.map((item, index) => (
                <a
                  key={index}
                  className={`toc-item toc-level-${item.level}`}
                  onClick={() => scrollToSection(item.line)}
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </aside>
        )}

        {/* Contenido principal */}
        <main className="reader-main">
          {/* Header del documento - COMPACTO HORIZONTAL */}
          <header className="document-header">
            <div className="document-header-content">
              {/* Fila 1: Título */}
              <div className="document-title-row">
                <span className="document-icon-inline">
                  {isPDF ? '📄' : isWord ? '📝' : '📃'}
                </span>
                <h1 className="document-title">{document.title || document.path}</h1>
              </div>

              {/* Fila 2: Todo en una línea horizontal */}
              <div className="document-header-actions">
                {/* Metadata */}
                <div className="document-meta-compact">
                  <span className="meta-badge">
                    {document.file_size
                      ? `${(document.file_size / 1024).toFixed(2)} KB`
                      : `${(new Blob([displayContent]).size / 1024).toFixed(2)} KB`}
                  </span>
                  <span className="meta-badge">
                    {isPDF ? 'PDF' : isWord ? 'Word' : 'Texto'}
                  </span>
                  <span className="meta-badge">
                    {document.storage_location === 'b2' ? 'B2 Cloud' : 'Local'}
                  </span>
                  <span className="meta-badge">
                    {new Date(document.created_at || document.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  {readingTime > 0 && (
                    <span className="meta-badge">{readingTime} min</span>
                  )}
                  {(isPDF || isWord) && (
                    <span className="meta-badge extracted">
                      Texto extraído
                    </span>
                  )}
                </div>

                {/* Acciones y progreso */}
                <button className="btn-header-action" onClick={() => window.open(downloadUrl, '_blank')}>
                  📥 Descargar
                </button>
                <button className="btn-header-action" onClick={handleCopy}>
                  📋 Copiar
                </button>
                <div className="header-progress">
                  {Math.round(scrollProgress)}%
                </div>
                <div className="document-storage-info">
                  Geronimo 2.0
                </div>
              </div>
            </div>
          </header>

          {/* Contenido del documento */}
          <article
            className="document-content"
            ref={contentRef}
            onScroll={handleScroll}
          >
            <div className="content-wrapper">
              <ReactMarkdown>{displayContent}</ReactMarkdown>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
};

export default DocumentReader;
