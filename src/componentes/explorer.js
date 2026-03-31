import React from 'react';
import { formatDate, formatFileSize } from './utilities';

export const Explorer = ({
  projects,
  expandedProjects,
  toggleProjectExpand,
  handleViewDocument,
  handleDeleteDocument,
  isLoading
}) => {
  return (
    <section className="explorer-section">
      <div className="explorer-header">
        <h2>Explorador de Bases de Datos</h2>
        <p>Visualiza y administra documentos de todos los proyectos</p>
      </div>

      <div className="explorer-content">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <p>No hay proyectos todavía</p>
            <p style={{fontSize: '0.85rem', marginTop: '0.5rem'}}>
              Crea un proyecto para empezar
            </p>
          </div>
        ) : (
          <div className="projects-list">
            {projects.map(project => (
              <div key={project.id} className="project-item">
                <div
                  className="project-header"
                  onClick={() => toggleProjectExpand(project.id)}
                >
                  <span className="expand-icon">
                    {expandedProjects[project.id] ? '▼' : '▶'}
                  </span>
                  <span className="project-name">{project.name}</span>
                  <span className="doc-count">
                    {project.documents?.length || 0} docs
                  </span>
                </div>

                {expandedProjects[project.id] && (
                  <div className="documents-list">
                    {!project.documents || project.documents.length === 0 ? (
                      <div className="no-documents">
                        <span>📄</span> Sin documentos
                      </div>
                    ) : (
                      project.documents.map(doc => (
                        <div key={doc.id} className="document-item">
                          <div className="doc-main">
                            <span className="doc-icon">📄</span>
                            <div className="doc-info">
                              <div className="doc-path">{doc.path}</div>
                              <div className="doc-meta">
                                <span>📅 {formatDate(doc.createdAt)}</span>
                                <span>💾 {formatFileSize(doc.content)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="doc-actions">
                            <button
                              className="btn-view"
                              onClick={() => handleViewDocument(doc)}
                              title="Ver contenido"
                            >
                              👁️
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteDocument(doc.id, doc.path)}
                              disabled={isLoading}
                              title="Eliminar documento"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Explorer;
