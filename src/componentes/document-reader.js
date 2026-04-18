import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../styles/document-reader.css';

/**
 * DocumentReader - Vista profesional estilo Medium/Notion para documentos
 * Características:
 * - Tabla de contenidos automática (markdown, texto plano, PDFs)
 * - Barra de progreso de lectura
 * - Tiempo estimado de lectura
 * - Búsqueda dentro del documento con highlight naranja
 * - Diseño optimizado para lectura
 */
export const DocumentReader = ({ document, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [infoCollapsed, setInfoCollapsed] = useState(false);
  const [tableOfContents, setTableOfContents] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [searchResultsCount, setSearchResultsCount] = useState(0);
  const contentRef = useRef(null);
  const sectionRefs = useRef({});

  // Calcular tiempo de lectura (promedio 200 palabras por minuto)
  const calculateReadingTime = (text) => {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes;
  };

  // Extraer tabla de contenidos mejorada (detecta múltiples patrones)
  const extractTableOfContents = (text) => {
    if (!text) return [];

    const headings = [];
    const lines = text.split('\n');

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Patrón 1: Markdown headings (# ## ###)
      const markdownMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (markdownMatch) {
        const level = markdownMatch[1].length;
        const title = markdownMatch[2].trim();
        const id = `section-${index}`;
        headings.push({ level, title, id, line: index });
        return;
      }

      // Patrón 2: Numeración (1. 2. 3. o 1) 2) 3))
      const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.{3,50})$/);
      if (numberedMatch && trimmedLine.length < 80) {
        const title = numberedMatch[2].trim();
        const id = `section-${index}`;
        headings.push({ level: 2, title: `${numberedMatch[1]}. ${title}`, id, line: index });
        return;
      }

      // Patrón 3: Palabras clave de sección
      const sectionKeywords = /^(CAPITULO|CAPÍTULO|SECCION|SECCIÓN|TITULO|TÍTULO|PARTE|ANEXO|APENDICE|APÉNDICE|INTRODUCCION|INTRODUCCIÓN|CONCLUSION|CONCLUSIÓN|RESUMEN|ABSTRACT)\s*[:\-.]?\s*(.*)$/i;
      const keywordMatch = trimmedLine.match(sectionKeywords);
      if (keywordMatch) {
        const keyword = keywordMatch[1].toUpperCase();
        const rest = keywordMatch[2] ? keywordMatch[2].trim() : '';
        const title = rest ? `${keyword}: ${rest}` : keyword;
        const id = `section-${index}`;
        headings.push({ level: 1, title, id, line: index });
        return;
      }

      // Patrón 4: Líneas en MAYÚSCULAS (posibles títulos) - mínimo 4 caracteres, máximo 60
      if (trimmedLine === trimmedLine.toUpperCase() &&
          trimmedLine.length >= 4 &&
          trimmedLine.length <= 60 &&
          /^[A-ZÁÉÍÓÚÑ\s\d]+$/.test(trimmedLine) &&
          !trimmedLine.match(/^[\d\s\-_.]+$/)) { // Excluir líneas solo con números/símbolos
        const id = `section-${index}`;
        headings.push({ level: 2, title: trimmedLine, id, line: index });
        return;
      }
    });

    return headings;
  };

  // Manejar scroll para actualizar progreso y sección activa
  const handleScroll = () => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    const windowHeight = element.clientHeight;
    const documentHeight = element.scrollHeight - windowHeight;
    const scrollTop = element.scrollTop;

    const progress = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;
    setScrollProgress(Math.min(100, Math.max(0, progress)));

    // Detectar sección activa
    const sections = Object.entries(sectionRefs.current);
    for (let i = sections.length - 1; i >= 0; i--) {
      const [id, ref] = sections[i];
      if (ref && ref.offsetTop <= scrollTop + 100) {
        setActiveSection(id);
        break;
      }
    }
  };

  // Scroll a sección específica usando ID
  const scrollToSection = (sectionId, lineNumber) => {
    if (!contentRef.current) return;

    const sectionElement = sectionRefs.current[sectionId];
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Fallback: aproximación por línea
      const targetScroll = lineNumber * 28;
      contentRef.current.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
    setActiveSection(sectionId);
  };

  // Resaltar texto de búsqueda y contar resultados
  const highlightSearchResults = useMemo(() => {
    const content = document.content_text || document.content || '';

    if (!searchQuery.trim()) {
      return { html: null, count: 0 };
    }

    try {
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      const matches = content.match(regex);
      const count = matches ? matches.length : 0;

      const highlighted = content.replace(regex, '<mark class="search-highlight">$1</mark>');

      return { html: highlighted, count };
    } catch (e) {
      return { html: null, count: 0 };
    }
  }, [searchQuery, document.content_text, document.content]);

  // Posiciones de coincidencias para el scroll map
  const matchPositions = useMemo(() => {
    if (!searchQuery.trim() || highlightSearchResults.count === 0) return [];
    const content = document.content_text || document.content || '';
    if (!content) return [];
    try {
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      const positions = [];
      let m;
      while ((m = regex.exec(content)) !== null) {
        positions.push((m.index / content.length) * 100);
      }
      return positions;
    } catch { return []; }
  }, [searchQuery, document.content_text, document.content, highlightSearchResults.count]);

  const scrollToMatchAt = (pct) => {
    if (!contentRef.current) return;
    const { scrollHeight, clientHeight } = contentRef.current;
    contentRef.current.scrollTo({ top: (pct / 100) * (scrollHeight - clientHeight), behavior: 'smooth' });
  };

  // Actualizar contador de resultados
  useEffect(() => {
    setSearchResultsCount(highlightSearchResults.count);
  }, [highlightSearchResults.count]);

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

  // Renderizar contenido con secciones marcadas para scroll
  const renderContent = () => {
    const content = document.content_text || document.content || '';
    const lines = content.split('\n');

    // Si hay búsqueda activa, usar HTML con highlights
    if (searchQuery.trim() && highlightSearchResults.html) {
      return (
        <div
          className="content-text"
          dangerouslySetInnerHTML={{ __html: highlightSearchResults.html.replace(/\n/g, '<br/>') }}
        />
      );
    }

    // Renderizar con referencias para scroll
    return (
      <div className="content-text">
        {lines.map((line, index) => {
          const sectionId = `section-${index}`;
          const isHeading = tableOfContents.some(h => h.line === index);

          // Detectar nivel de heading para estilo
          const heading = tableOfContents.find(h => h.line === index);
          const headingClass = heading ? `heading-level-${heading.level}` : '';

          return (
            <div
              key={index}
              ref={isHeading ? el => sectionRefs.current[sectionId] = el : null}
              id={isHeading ? sectionId : null}
              className={`content-line ${headingClass}`}
            >
              {renderLine(line)}
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar una línea con formato básico
  const renderLine = (line) => {
    if (!line.trim()) return <br />;

    // Detectar y formatear markdown básico
    let formattedLine = line;

    // Headers markdown
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      const Tag = `h${level}`;
      return <Tag>{text}</Tag>;
    }

    // Bold **text**
    formattedLine = formattedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    formattedLine = formattedLine.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Code `text`
    formattedLine = formattedLine.replace(/`(.+?)`/g, '<code>$1</code>');

    if (formattedLine !== line) {
      return <span dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    }

    return <span>{line}</span>;
  };

  // Descargar contenido del documento directamente (sin pasar por API)
  const handleDownload = () => {
    const content = document.content_text || document.content || '';
    const rawName = document.title || document.path || 'documento';
    const filename = rawName.split('/').pop() || rawName;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = filename;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Imprimir documento
  const handlePrint = () => {
    window.print();
  };

  // Copiar contenido al portapapeles
  const handleCopy = () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(displayContent).then(() => {
          alert('Contenido copiado al portapapeles');
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = displayContent;
        textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Contenido copiado al portapapeles');
      }
    } catch (err) {
      alert('No se pudo copiar el contenido');
    }
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery('');
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
            {searchQuery && (
              <>
                <span className="search-results-count">
                  {searchResultsCount} resultado{searchResultsCount !== 1 ? 's' : ''}
                </span>
                <button
                  className="btn-clear-search"
                  onClick={clearSearch}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#999',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0 4px'
                  }}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>

        <div className="reader-header-right">
          <button className="btn-action" onClick={handleDownload} title="Descargar">
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
        {/* Sidebar con tabla de contenidos - SIEMPRE visible si hay contenido */}
        {tableOfContents.length > 0 && (
          <aside className="reader-sidebar">
            <div className="toc-header">
              <h3>📑 Tabla de Contenidos</h3>
            </div>
            <nav className="toc-nav">
              {tableOfContents.map((item, index) => (
                <a
                  key={index}
                  className={`toc-item toc-level-${item.level} ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => scrollToSection(item.id, item.line)}
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

              {/* Toggle info — solo mobile */}
              <button
                className="reader-info-toggle"
                onClick={() => setInfoCollapsed(v => !v)}
                aria-label={infoCollapsed ? 'Mostrar info' : 'Ocultar info'}
              >
                {infoCollapsed
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                }
                <span>{infoCollapsed ? 'Ver info' : 'Ocultar info'}</span>
              </button>

              {/* Fila 2: Todo en una línea horizontal */}
              <div className={`document-header-actions${infoCollapsed ? ' reader-info-hidden' : ''}`}>
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
                  {tableOfContents.length > 0 && (
                    <span className="meta-badge">
                      {tableOfContents.length} secciones
                    </span>
                  )}
                </div>

                {/* Acciones y progreso */}
                <button className="btn-header-action" onClick={handleDownload}>
                  📥 Descargar
                </button>
                <button className="btn-header-action" onClick={handleCopy}>
                  📋 Copiar
                </button>
                <div className="header-progress">
                  {Math.round(scrollProgress)}%
                </div>
                <div className="document-storage-info">
                  Lexiius 2.0
                </div>
              </div>
            </div>
          </header>

          {/* Contenido del documento + mapa de scroll de búsqueda */}
          <div className="reader-content-wrap">
            <article
              className="document-content"
              ref={contentRef}
              onScroll={handleScroll}
            >
              <div className="content-wrapper">
                {renderContent()}
              </div>
            </article>
            {matchPositions.length > 0 && (
              <div className="search-scroll-map">
                {matchPositions.map((pct, i) => (
                  <div
                    key={i}
                    className="search-scroll-dot"
                    style={{ top: `${pct}%` }}
                    onClick={() => scrollToMatchAt(pct)}
                    title={`Ir a coincidencia ${i + 1} de ${matchPositions.length}`}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocumentReader;
