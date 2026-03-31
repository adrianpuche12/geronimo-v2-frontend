import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../styles/unified-header.css';

/**
 * Custom dropdown para proyectos — usa React Portal
 * para renderizar el menu fuera de contenedores con overflow:hidden
 */
const ProjectDropdown = ({ projects, selectedProject, onProjectChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  const selectedName = projects.find(p => p.id === selectedProject)?.name || 'Seleccionar...';

  // Posicionar menu debajo del trigger
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  // Cerrar al click fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Cerrar al scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const handleSelect = (projectId) => {
    onProjectChange(projectId);
    setIsOpen(false);
  };

  return (
    <div className={`custom-dropdown ${disabled ? 'dropdown-disabled' : ''}`}>
      <button
        ref={triggerRef}
        className={`dropdown-trigger ${isOpen ? 'dropdown-open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        type="button"
      >
        <span className="dropdown-selected-text">{selectedName}</span>
        <span className={`dropdown-arrow ${isOpen ? 'arrow-up' : ''}`}>&#9660;</span>
      </button>
      {isOpen && ReactDOM.createPortal(
        <div className="dropdown-menu" ref={menuRef} style={menuStyle}>
          <div
            className={`dropdown-item ${!selectedProject ? 'dropdown-item-active' : ''}`}
            onClick={() => handleSelect('')}
          >
            Seleccionar...
          </div>
          {projects.map(project => (
            <div
              key={project.id}
              className={`dropdown-item ${selectedProject === project.id ? 'dropdown-item-active' : ''}`}
              onClick={() => handleSelect(project.id)}
            >
              {project.name}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

/**
 * Barra única unificada con todas las funcionalidades
 * Izquierda: Tabs + Dropdown Modo | Centro: Proyectos y archivos
 */
export const UnifiedHeader = ({
  // Tabs
  activeTab,
  onTabChange,

  // Proyectos
  projects,
  selectedProject,
  onProjectChange,
  onCreateProject,

  // Upload archivos
  fileInputRef,
  onFileSelect,

  // Modos de análisis (CAPA 4)
  selectedMode,
  onModeChange,

  // Estado
  isLoading,

  // Admin (CRUD proyectos)
  isAdmin,
  onEditProject,
  onDeleteProject
}) => {
  const [showModeDropdown, setShowModeDropdown] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef(null);

  const tabs = [
    { id: 'chat', label: 'Chat', icon: '⌨' },
    { id: 'explorer', label: 'Explorador', icon: '◫' },
    { id: 'search', label: 'Búsqueda', icon: '⌕' },
    { id: 'integrations', label: 'Integraciones', icon: '⚙' }
  ];

  const modes = [
    { id: 'general', label: 'General', description: 'Respuestas narrativas' },
    { id: 'stats', label: 'Estadísticas', description: 'Análisis cuantitativo' },
    { id: 'business', label: 'Negocio', description: 'Análisis estratégico' }
  ];

  // Calcular posición del dropdown cuando se abre
  React.useEffect(() => {
    if (showModeDropdown && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [showModeDropdown]);

  // Cerrar dropdown al hacer click fuera
  React.useEffect(() => {
    if (!showModeDropdown) return;

    const handleClickOutside = (event) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        const dropdownMenu = document.querySelector('.mode-dropdown-menu');
        if (dropdownMenu && !dropdownMenu.contains(event.target)) {
          setShowModeDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModeDropdown]);

  const handleModeSelect = (modeId) => {
    onModeChange(modeId);
    setShowModeDropdown(false);
  };

  return (
    <div className="unified-header">

      {/* SECCIÓN 1: TABS DE NAVEGACIÓN */}
      <div className="header-section tabs-section">
        <div className="tabs-pill-group">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`unified-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Indicador de modo automático — solo informativo */}
        {activeTab === 'chat' && selectedProject && (
          <div className="mode-auto-badge" title="El modo de respuesta se detecta automáticamente según tu pregunta">
            <span className="mode-auto-icon">◈</span>
            <span>Modo automático</span>
          </div>
        )}
      </div>

      {/* Separador */}
      <div className="header-divider"></div>

      {/* SECCIÓN 2: PROYECTO + ACCIONES */}
      <div className="header-section projects-section">

        {/* Selector de proyecto */}
        <div className="project-selector-group">
          <span className="project-selector-label">Proyecto</span>
          <ProjectDropdown
            projects={projects}
            selectedProject={selectedProject}
            onProjectChange={onProjectChange}
            disabled={isLoading}
          />
        </div>

        {/* Acción primaria: Nuevo proyecto */}
        <button
          className="btn-action btn-action-primary"
          onClick={onCreateProject}
          disabled={isLoading}
          title="Crear nuevo proyecto"
        >
          <span className="btn-action-icon">+</span>
          Nuevo
        </button>

        {/* Acción secundaria: Subir archivo */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={onFileSelect}
          style={{ display: 'none' }}
          accept=".txt,.md,.json,.js,.py,.java,.cpp,.html,.css,.pdf,.doc,.docx"
        />
        <button
          className="btn-action btn-action-upload"
          onClick={() => fileInputRef.current?.click()}
          disabled={!selectedProject || isLoading}
          title="Subir archivos al proyecto seleccionado"
        >
          <span className="btn-action-icon">↑</span>
          Subir
        </button>

        {/* Acciones admin: Editar y Eliminar */}
        {isAdmin && selectedProject && (
          <>
            <div className="header-divider-small"></div>
            <button
              className="btn-action btn-action-edit"
              onClick={() => {
                const project = projects.find(p => p.id === selectedProject);
                if (project) onEditProject(project);
              }}
              disabled={isLoading}
              title="Editar proyecto seleccionado"
            >
              <span className="btn-action-icon">✎</span>
              Editar
            </button>
            <button
              className="btn-action btn-action-delete"
              onClick={() => {
                const project = projects.find(p => p.id === selectedProject);
                if (project) onDeleteProject(project);
              }}
              disabled={isLoading}
              title="Eliminar proyecto seleccionado"
            >
              <span className="btn-action-icon">✕</span>
              Eliminar
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default UnifiedHeader;
