import React from 'react';
import '../styles/project-bar.css';

/**
 * Barra de selección de proyectos (unificada en el header)
 * Solo visible cuando el tab activo es 'chat'
 */
export const ProjectBar = ({
  projects,
  selectedProject,
  onProjectChange,
  onCreateProject,
  disabled
}) => {
  return (
    <div className="project-bar">
      <div className="project-bar-content">
        <label className="project-label">Proyecto:</label>

        <select
          className="project-select"
          value={selectedProject || ''}
          onChange={(e) => onProjectChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Selecciona un proyecto...</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
              {project.documents && ` (${project.documents.length} docs)`}
            </option>
          ))}
        </select>

        <button
          className="btn-create-project"
          onClick={onCreateProject}
          disabled={disabled}
          title="Crear nuevo proyecto"
        >
          Nuevo Proyecto
        </button>
      </div>
    </div>
  );
};

export default ProjectBar;
