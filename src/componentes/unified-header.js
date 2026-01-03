import React from 'react';
import ReactDOM from 'react-dom';
import '../styles/unified-header.css';

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
  isLoading
}) => {
  const [showModeDropdown, setShowModeDropdown] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef(null);

  const tabs = [
    { id: 'chat', label: 'Chat' },
    { id: 'explorer', label: 'Explorador' },
    { id: 'search', label: 'Búsqueda' },
    { id: 'integrations', label: 'Integrations' }
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
      {/* SECCIÓN 1: CHAT + MODO */}
      <div className="header-section tabs-section">
        {/* Tab Chat */}
        <button
          className={`unified-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => onTabChange('chat')}
        >
          Chat
        </button>

        {/* Botón Modo (solo visible en Chat con proyecto) - AL LADO DE CHAT */}
        {activeTab === 'chat' && selectedProject && (
          <>
            <button
              ref={triggerRef}
              className="unified-tab"
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              disabled={isLoading}
            >
              Modo ▼
            </button>

            {/* Dropdown renderizado con Portal para escapar overflow */}
            {showModeDropdown && ReactDOM.createPortal(
              <div
                className="mode-dropdown-menu"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                }}
              >
                {modes.map(mode => (
                  <button
                    key={mode.id}
                    className={`mode-dropdown-item ${selectedMode === mode.id ? 'active' : ''}`}
                    onClick={() => handleModeSelect(mode.id)}
                    title={mode.description}
                  >
                    {selectedMode === mode.id && '✓ '}
                    {mode.label}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </>
        )}
      </div>

      {/* Separador vertical - ENTRE CHAT+MODO Y DEMÁS TABS */}
      <div className="header-divider"></div>

      {/* SECCIÓN 2: DEMÁS TABS */}
      <div className="header-section tabs-section">
        {tabs.filter(tab => tab.id !== 'chat').map(tab => (
          <button
            key={tab.id}
            className={`unified-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Separador vertical - ENTRE TABS Y PROYECTOS */}
      <div className="header-divider"></div>

      {/* SECCIÓN 2: GESTIÓN DE PROYECTOS Y ARCHIVOS (Centro) */}
      <div className="header-section projects-section">
        <label className="section-label">Proyecto:</label>

        <select
          className="project-select-unified"
          value={selectedProject || ''}
          onChange={(e) => onProjectChange(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Seleccionar...</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
              {project.documents && ` (${project.documents.length})`}
            </option>
          ))}
        </select>

        <button
          className="btn-unified"
          onClick={onCreateProject}
          disabled={isLoading}
          title="Crear nuevo proyecto"
        >
          Nuevo
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={onFileSelect}
          style={{ display: 'none' }}
          accept=".txt,.md,.json,.js,.py,.java,.cpp,.html,.css,.pdf,.doc,.docx"
        />

        <button
          className="btn-unified"
          onClick={() => fileInputRef.current?.click()}
          disabled={!selectedProject || isLoading}
          title="Subir archivos al proyecto"
        >
          Upload
        </button>
      </div>

    </div>
  );
};

export default UnifiedHeader;
