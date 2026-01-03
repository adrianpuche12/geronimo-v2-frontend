import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import './styles/unified-header.css'; // Barra única unificada
import { DuplicateAlertModal, DocumentPreviewModal } from './componentes/modal';
import { DocumentReader } from './componentes/document-reader'; // NUEVO: Reader Mode
import { Sidebar } from './componentes/sidebar';
import { Chat } from './componentes/chat';
import { Explorer } from './componentes/explorer';
import { Search } from './componentes/search';
import { Integrations } from './componentes/integrations';
import { UnifiedHeader } from './componentes/unified-header'; // Barra unificada
import { formatDate, formatFileSize } from './componentes/utilities';
import { Login } from './componentes/Login';
import { UserHeader } from './componentes/UserHeader';
import { useAuth } from './context/AuthContext';
import logo from './assets/images/logo.png';


// URL del backend Geronimo V2
// Si está vacío, usa rutas relativas para que el proxy de package.json funcione
const API_URL = process.env.REACT_APP_API_URL || '/api';

function App() {
  const { authenticated, loading, getToken } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'explorer', or 'search'
  const [expandedProjects, setExpandedProjects] = useState({});
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [showReaderMode, setShowReaderMode] = useState(false); // NUEVO: Control del Reader Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    projectId: '',
    dateFrom: '',
    dateTo: '',
    fileType: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(null); // Para menú de exportación
  const [duplicateAlert, setDuplicateAlert] = useState(null); // Para modal de duplicados
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Para colapsar sidebar
  const [selectedMode, setSelectedMode] = useState('general'); // CAPA 4: Modo de análisis (general, stats, business)

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Cargar proyectos al iniciar
  useEffect(() => {
    if (authenticated) {
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  // Auto-scroll en mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Configurar axios para incluir el token en todas las peticiones
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = getToken();
      console.log('[AXIOS INTERCEPTOR] Token:', token ? 'EXISTS (length: ' + token.length + ')' : 'NULL/UNDEFINED');
      console.log('[AXIOS INTERCEPTOR] Request URL:', config.url);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[AXIOS INTERCEPTOR] Authorization header added');
      } else {
        console.warn('[AXIOS INTERCEPTOR] NO TOKEN - Authorization header NOT added');
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [getToken]);

  // Mostrar pantalla de carga mientras se inicializa Keycloak
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.5rem',
        fontWeight: '600'
      }}>
        <div>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>🔐</div>
          Verificando autenticación...
        </div>
      </div>
    );
  }

  // Mostrar pantalla de login si no está autenticado
  if (!authenticated) {
    return <Login />;
  }

  const loadProjects = async () => {
    try {
      console.log('[LOAD PROJECTS] Fetching from:', `${API_URL}/projects`);
      const response = await axios.get(`${API_URL}/projects`);
      console.log('[LOAD PROJECTS] Response:', response.data);
      console.log('[LOAD PROJECTS] Number of projects:', response.data?.length || 0);

      setProjects(response.data);

      if (response.data.length > 0) {
        setSelectedProject(response.data[0].id);
        console.log('[LOAD PROJECTS] Selected first project:', response.data[0].id);
      } else {
        console.warn('[LOAD PROJECTS] No projects found');
      }
    } catch (error) {
      console.error('[LOAD PROJECTS] Error:', error);
      console.error('[LOAD PROJECTS] Error response:', error.response?.data);
      console.error('[LOAD PROJECTS] Error status:', error.response?.status);
      addSystemMessage('Error al cargar proyectos. Verifica la conexión con el servidor.');
    }
  };

  const addSystemMessage = (content) => {
    setMessages(prev => [...prev, {
      role: 'system',
      content,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      addSystemMessage('Por favor ingresa un nombre para el proyecto.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/projects`, {
        name: newProjectName,
        description: newProjectDescription || undefined
      });

      addSystemMessage(`✓ Proyecto "${newProjectName}" creado correctamente.`);

      // Recargar lista de proyectos
      await loadProjects();

      // Seleccionar el nuevo proyecto
      setSelectedProject(response.data.id);

      // Limpiar formulario y cerrar modal
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateProject(false);
    } catch (error) {
      console.error('Error creating project:', error);
      addSystemMessage(`✗ Error al crear proyecto: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    // Reset input para permitir subir el mismo archivo de nuevo
    e.target.value = '';
  };

  const handleFiles = async (files) => {
    if (!selectedProject) {
      addSystemMessage('Por favor selecciona un proyecto primero.');
      return;
    }

    if (files.length === 0) {
      return;
    }

    setIsLoading(true);
    let filesUploaded = 0;

    for (const file of files) {
      try {
        // Usar FormData para enviar el archivo binario
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', selectedProject);
        formData.append('path', `docs/${file.name}`);
        formData.append('title', file.name);

        const response = await axios.post(`${API_URL}/docs`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Verificar si el backend detectó un duplicado
        if (response.data.statusCode === 409) {
          addSystemMessage(`⚠️ "${file.name}" es un duplicado - ${response.data.message}`);
        } else {
          setUploadedFiles(prev => [...prev, {
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString()
          }]);
          addSystemMessage(`✓ Archivo "${file.name}" subido correctamente.`);
          filesUploaded++;
        }
      } catch (error) {
        console.error('Error uploading file:', error);

        // Manejar error de duplicado
        if (error.response?.status === 409) {
          const details = error.response.data.details || {};
          const existingDoc = details.existingDocument || {};

          // Mostrar modal de alerta de duplicado
          setDuplicateAlert({
            fileName: file.name,
            duplicateType: details.duplicateType,
            existingPath: existingDoc.path || 'archivo similar',
            existingTitle: existingDoc.title,
            message: error.response.data.message
          });

          addSystemMessage(`⚠️ "${file.name}" es un duplicado. Ya existe: ${existingDoc.path || 'archivo similar'}`);
        } else {
          addSystemMessage(`✗ Error al subir "${file.name}": ${error.response?.data?.message || error.message}`);
        }
      }
    }

    setIsLoading(false);

    // Recargar proyectos si se subió al menos un archivo exitosamente
    if (filesUploaded > 0) {
      await loadProjects();
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedProject) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // CAPA 4: Enviar modo de análisis en la petición
      const response = await axios.post(`${API_URL}/query`, {
        projectId: selectedProject,
        question: inputMessage,
        mode: selectedMode // general, stats o business
      });

      // CAPA 4: Procesar respuesta estructurada
      const assistantMessage = {
        role: 'assistant',
        content: response.data.answer || response.data.message || 'Sin respuesta',
        timestamp: new Date().toISOString(),
        // Datos estructurados de CAPA 4
        mode: response.data.mode || selectedMode,
        charts: response.data.charts || [],
        tables: response.data.tables || [],
        metrics: response.data.metrics || [],
        recommendations: response.data.recommendations || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      addSystemMessage(`Error al enviar mensaje: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleProjectExpand = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const handleDeleteDocument = async (docId, docTitle) => {
    if (!window.confirm(`¿Eliminar documento "${docTitle}"?`)) return;

    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/docs/${docId}`);
      addSystemMessage(`✓ Documento "${docTitle}" eliminado.`);
      await loadProjects(); // Recargar para actualizar la lista
    } catch (error) {
      console.error('Error deleting document:', error);
      addSystemMessage(`✗ Error al eliminar documento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDocument = async (doc) => {
    console.log('🔍 handleViewDocument called with:', doc);

    // Si el documento ya tiene contenido completo, mostrarlo directamente en Reader Mode
    if (doc.content || doc.content_text) {
      console.log('✅ Document has content, showing Reader Mode');
      setSelectedDocument(doc);
      setShowReaderMode(true); // NUEVO: Activar Reader Mode
      return;
    }

    // Si solo tenemos el ID (desde búsqueda), cargar el documento completo
    console.log('⏳ Document has no content, fetching from API...');
    setIsLoading(true);
    try {
      console.log(`📡 Fetching: ${API_URL}/docs/${doc.id}`);
      const response = await axios.get(`${API_URL}/docs/${doc.id}`);
      console.log('✅ Document fetched:', response.data);
      setSelectedDocument(response.data);
      setShowReaderMode(true); // NUEVO: Activar Reader Mode
      console.log('✅ Reader Mode should be showing now');
    } catch (error) {
      console.error('❌ Error loading document:', error);
      addSystemMessage(`✗ Error al cargar documento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    console.log('🔍 Searching for:', searchQuery);
    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(searchFilters.projectId && { projectId: searchFilters.projectId }),
        ...(searchFilters.dateFrom && { dateFrom: searchFilters.dateFrom }),
        ...(searchFilters.dateTo && { dateTo: searchFilters.dateTo }),
        ...(searchFilters.fileType && { fileType: searchFilters.fileType }),
      });

      const url = `${API_URL}/docs/search?${params}`;
      console.log('📡 Search URL:', url);

      const response = await axios.get(url);
      console.log('✅ Search response:', response.data);

      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching:', error);
      addSystemMessage(`✗ Error en la búsqueda: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Función para exportar un documento individual (comentada por no estar en uso actualmente)
  // const exportDocument = async (documentId, format = 'txt') => {
  //   try {
  //     const response = await axios.get(
  //       `${API_URL}/docs/${documentId}/export?format=${format}`,
  //       { responseType: 'blob' }
  //     );

  //     // Crear un enlace de descarga
  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.setAttribute('download', `document.${format}`);
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();

  //     addSystemMessage(`✓ Documento exportado como ${format.toUpperCase()}`);
  //   } catch (error) {
  //     console.error('Error exporting document:', error);
  //     addSystemMessage(`✗ Error al exportar documento: ${error.message}`);
  //   }
  // };

  // Función para exportar una respuesta de IA
  const exportAIResponse = async (message, format = 'txt') => {
    try {
      // Buscar el mensaje de pregunta anterior
      const messageIndex = messages.findIndex(m => m === message);
      const questionMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;

      const question = questionMessage?.role === 'user' ? questionMessage.content : 'Sin pregunta';
      const answer = message.content;
      const sources = message.sources || [];

      const response = await axios.post(
        `${API_URL}/query/export`,
        {
          question,
          answer,
          sources,
          format,
          title: 'Nilo AI Response',
          metadata: {
            projectId: selectedProject,
            exportedAt: new Date().toISOString()
          }
        },
        { responseType: 'blob' }
      );

      // Crear un enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `geronimo_response_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      addSystemMessage(`✓ Respuesta exportada como ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting AI response:', error);
      addSystemMessage(`✗ Error al exportar respuesta: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-left">
          <div className="header-brand">
            <div className="header-logo">
              <img
                src={logo}
                alt="Nilo Solutions Logo"
                className="logo-image"
              />
            </div>
            <p className="header-subtitle">Asistente de Documentación Inteligente</p>
          </div>
        </div>
        <UserHeader />
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <Sidebar
          projects={projects}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          isLoading={isLoading}
          showCreateProject={showCreateProject}
          setShowCreateProject={setShowCreateProject}
          newProjectName={newProjectName}
          setNewProjectName={setNewProjectName}
          newProjectDescription={newProjectDescription}
          setNewProjectDescription={setNewProjectDescription}
          handleCreateProject={handleCreateProject}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          isDragging={isDragging}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          uploadedFiles={uploadedFiles}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Content Area */}
        <main className="content-area">
          {/* BARRA ÚNICA UNIFICADA - Todo en una sola línea */}
          <UnifiedHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            projects={projects}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
            onCreateProject={() => setShowCreateProject(true)}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
            isLoading={isLoading}
          />

          {/* Chat Section */}
          {activeTab === 'chat' && (
            <Chat
              messages={messages}
              messagesEndRef={messagesEndRef}
              isLoading={isLoading}
              selectedProject={selectedProject}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              handleKeyPress={handleKeyPress}
              handleSendMessage={handleSendMessage}
              showExportMenu={showExportMenu}
              setShowExportMenu={setShowExportMenu}
              exportAIResponse={exportAIResponse}
            />
          )}

          {/* Explorer Section */}
          {activeTab === 'explorer' && (
            <Explorer
              projects={projects}
              expandedProjects={expandedProjects}
              toggleProjectExpand={toggleProjectExpand}
              handleViewDocument={handleViewDocument}
              handleDeleteDocument={handleDeleteDocument}
              isLoading={isLoading}
            />
          )}

          {/* Search Section */}
          {activeTab === 'search' && (
            <Search
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isSearching={isSearching}
              handleSearch={handleSearch}
              searchResults={searchResults}
              searchFilters={searchFilters}
              setSearchFilters={setSearchFilters}
              projects={projects}
              handleViewDocument={handleViewDocument}
            />
          )}

          {/* Integrations Section */}
          {activeTab === 'integrations' && (
            <Integrations />
          )}
        </main>

        {/* NUEVO: Document Reader Mode - Vista profesional */}
        {showReaderMode && selectedDocument && (
          <DocumentReader
            document={selectedDocument}
            onClose={() => {
              setShowReaderMode(false);
              setSelectedDocument(null);
            }}
          />
        )}

        {/* Document Preview Modal - Global (works from any tab) - DEPRECATED: usar Reader Mode */}
        {showDocPreview && selectedDocument && !showReaderMode && (
          <DocumentPreviewModal
            document={selectedDocument}
            onClose={() => setShowDocPreview(false)}
            formatDate={formatDate}
            formatFileSize={formatFileSize}
          />
        )}

        {/* Modal de alerta de duplicados */}
        <DuplicateAlertModal
          alert={duplicateAlert}
          onClose={() => setDuplicateAlert(null)}
        />

        {/* Modal de crear proyecto */}
        {showCreateProject && (
          <div className="modal-overlay" onClick={() => setShowCreateProject(false)}>
            <div className="modal-content create-project-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Crear Nuevo Proyecto</h3>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Proyecto:</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Ej: Mi Proyecto"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Descripción (opcional):</label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Breve descripción del proyecto..."
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowCreateProject(false)}>
                  Cancelar
                </button>
                <button
                  className="btn-create"
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || isLoading}
                >
                  {isLoading ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
