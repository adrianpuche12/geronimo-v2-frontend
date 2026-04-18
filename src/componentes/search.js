import React, { useState, useEffect } from 'react';
import { formatDate, highlightText } from './utilities';

export const Search = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  handleSearch,
  searchResults,
  searchFilters,
  setSearchFilters,
  projects,
  handleViewDocument
}) => {
  const [filtersVisible, setFiltersVisible] = useState(true);

  // Auto-collapse when results arrive
  useEffect(() => {
    if (searchResults.length > 0) setFiltersVisible(false);
  }, [searchResults.length]);

  const clearFilters = () => {
    setSearchQuery('');
    setSearchFilters({ projectId: '', dateFrom: '', dateTo: '', fileType: '' });
  };

  const hasActiveFilters = !!(searchFilters.projectId || searchFilters.dateFrom || searchFilters.dateTo || searchFilters.fileType || searchQuery);

  return (

    <section className="search-section">
      <div className="search-hero">
        <div className="search-hero-content">
          {/* Enhanced Search Bar */}
          <div className="search-bar-enhanced">
            <div className="search-input-wrapper">
              <span className="search-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              <input
                type="text"
                placeholder="Escribe para buscar en documentos, títulos, contenido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isSearching}
                className="search-input-enhanced"
              />
              {hasActiveFilters && (
                <button
                  className="search-clear-btn"
                  onClick={clearFilters}
                  title="Limpiar búsqueda y filtros"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || (!searchQuery.trim() && !searchFilters.projectId && !searchFilters.dateFrom && !searchFilters.dateTo && !searchFilters.fileType)}
              className="search-btn-enhanced"
            >
              {isSearching ? (
                <>
                  <span className="search-btn-spinner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:"search-spin 0.7s linear infinite",display:"inline-block"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></span> Buscando...
                </>
              ) : (
                <>
                  Buscar
                </>
              )}
            </button>
          </div>

          {/* Search stats */}
          {searchResults.length > 0 && (
            <div className="search-stats">
              <span className="search-stats-count">
                {searchResults.length} resultado{searchResults.length > 1 ? 's' : ''} encontrado{searchResults.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="search-container">

        {/* Filter controls bar */}
        <div className="search-filter-controls">
          <button
            className="search-filters-toggle"
            onClick={() => setFiltersVisible(v => !v)}
          >
            <span className="search-filters-toggle-icon">{filtersVisible ? '▲' : '▼'}</span>
            {filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros'}
            {hasActiveFilters && !filtersVisible && <span className="filter-active-dot" />}
          </button>
        </div>

        {/* Filters */}
        {filtersVisible && (
        <div className="search-filters">
          <select
            value={searchFilters.projectId}
            onChange={(e) => setSearchFilters({...searchFilters, projectId: e.target.value})}
          >
            <option value="">Todos los proyectos</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <div className="search-filter-date">
            <span className="search-filter-date-label">Desde</span>
            <input
              type="date"
              value={searchFilters.dateFrom}
              onChange={(e) => setSearchFilters({...searchFilters, dateFrom: e.target.value})}
            />
          </div>

          <div className="search-filter-date">
            <span className="search-filter-date-label">Hasta</span>
            <input
              type="date"
              value={searchFilters.dateTo}
              onChange={(e) => setSearchFilters({...searchFilters, dateTo: e.target.value})}
            />
          </div>

          <select
            value={searchFilters.fileType}
            onChange={(e) => setSearchFilters({...searchFilters, fileType: e.target.value})}
          >
            <option value="">Todos los tipos</option>
            <option value="md">Markdown (.md)</option>
            <option value="txt">Texto (.txt)</option>
            <option value="json">JSON (.json)</option>
            <option value="js">JavaScript (.js)</option>
            <option value="ts">TypeScript (.ts)</option>
            <option value="py">Python (.py)</option>
          </select>
        </div>
        )}

        {/* Results */}
        <div className="search-results">
          {searchResults.length === 0 && !isSearching && (searchQuery || hasActiveFilters) && (
            <div className="empty-state">
              <div className="empty-state-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
              <p>No se encontraron resultados</p>
              <p style={{fontSize: '0.85rem', marginTop: '0.5rem'}}>
                Intenta con otros términos de búsqueda
              </p>
            </div>
          )}

          {searchResults.length === 0 && !isSearching && !searchQuery && !hasActiveFilters && (
            <div className="empty-state">
              <div className="empty-state-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
              <p>Escribe algo para buscar</p>
              <p style={{fontSize: '0.85rem', marginTop: '0.5rem'}}>
                Busca en paths, títulos o contenido de documentos
              </p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="exp-doc-list">
              {searchResults.map(result => (
                <div
                  key={result.id}
                  className="exp-doc-row"
                  onClick={() => handleViewDocument(result)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="exp-doc-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </span>
                  <div className="exp-doc-info">
                    <div className="exp-doc-path">{highlightText(result.path, searchQuery)}</div>
                    <div className="exp-doc-meta">
                      {result.projectName && <span>{result.projectName}</span>}
                      {result.projectName && <span> &middot; </span>}
                      <span>{formatDate(result.created_at || result.createdAt)}</span>
                      {result.snippet && (
                        <span className="result-snippet-meta"> &middot; {highlightText(result.snippet.substring(0, 100), searchQuery)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Search;
