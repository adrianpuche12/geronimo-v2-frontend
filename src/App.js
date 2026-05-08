import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import './styles/modal.css';
import { DuplicateAlertModal, DocumentPreviewModal, ConfirmDeleteModal, Toast } from './componentes/modal';
import { DocumentReader } from './componentes/document-reader';
import { LeftRail } from './componentes/left-rail';
import { Chat } from './componentes/chat';
import { Explorer } from './componentes/explorer';
import { Search } from './componentes/search';
import { Integrations } from './componentes/integrations';
import { formatDate, formatFileSize } from './componentes/utilities';
import { Login } from './componentes/Login';
import { ResetPassword } from './componentes/ResetPassword';
import { SetPassword } from './componentes/SetPassword';
import { Users } from './componentes/Users';
import { Profile } from './componentes/Profile';
import { Settings } from './componentes/Settings';
import { UserHeader } from './componentes/UserHeader';
import { Onboarding } from './componentes/Onboarding';
import { SessionPanel } from './componentes/Sessions';
import { useAuth } from './context/AuthContext';
import './styles/explorer.css';
import './styles/folder-import.css';
import FolderTreeBuilder from './componentes/FolderTreeBuilder';
import logo from './assets/images/logo.png';
import { LexiiusLogo } from './componentes/LexiiusLogo';
import { supabase } from './lib/supabase';
import { ProgressOverlay } from './componentes/ProgressOverlay';
import { AnonymizationModal } from './componentes/AnonymizationModal';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function App() {
  const { authenticated, loading, firstLogin, getToken, can, passwordRecovery, user, logout } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [anonPending, setAnonPending] = useState(null);
  const [anonPreview, setAnonPreview] = useState(null);
  const [anonLoading, setAnonLoading] = useState(false);
  const [showAnonChoiceModal, setShowAnonChoiceModal] = useState(false);
  const [showAnonModal, setShowAnonModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepAnalysis, setIsDeepAnalysis] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectArea, setNewProjectArea] = useState('');
  const [newProjectObjects, setNewProjectObjects] = useState([]);
  const [newProjectObjectCustom, setNewProjectObjectCustom] = useState('');
  const [newProjectParties, setNewProjectParties] = useState([]);
  const [newProjectPartiesCustom, setNewProjectPartiesCustom] = useState('');
  const [newProjectCustomLaws, setNewProjectCustomLaws] = useState('');
  const [onboardingOptions, setOnboardingOptions] = useState(null);
  const [editProjectArea, setEditProjectArea] = useState('');
  const [editProjectObjects, setEditProjectObjects] = useState([]);
  const [editProjectObjectCustom, setEditProjectObjectCustom] = useState('');
  const [editProjectParties, setEditProjectParties] = useState([]);
  const [editProjectPartiesCustom, setEditProjectPartiesCustom] = useState('');
  const [editProjectCustomLaws, setEditProjectCustomLaws] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [showReaderMode, setShowReaderMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({ projectId: '', dateFrom: '', dateTo: '', fileType: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(null);
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [skipAllDuplicates, setSkipAllDuplicates] = useState(false);
  const [selectedMode, setSelectedMode] = useState('general');
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [activeFolderName, setActiveFolderName] = useState(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', name: '', onConfirm: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [sessionWarning, setSessionWarning] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [folderCache, setFolderCache] = useState({});
  const scopeRef = React.useRef(null);
  const [docRefreshKey, setDocRefreshKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showFolderBuilder, setShowFolderBuilder] = useState(false);
  const [plannedFolders, setPlannedFolders] = useState([]);
  const [plannedFiles, setPlannedFiles] = useState([]);
  const [isCreatingFolders, setIsCreatingFolders] = useState(false);
  const [folderProgress, setFolderProgress] = useState({ current: 0, total: 0, step: '' });
  const [progressOverlay, setProgressOverlay] = useState({ show: false, message: '', subMessage: '', progress: null });

  const showProgress = (message, subMessage = '', progress = null) =>
    setProgressOverlay({ show: true, message, subMessage, progress });
  const hideProgress = () =>
    setProgressOverlay({ show: false, message: '', subMessage: '', progress: null });

  const fileInputRef = useRef(null);
  const zipInputRef = useRef(null);
  const jurisInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const showToast = (message, type = 'success', duration = 3500) => {
    setToast({ show: true, message, type, duration });
    if (type !== 'loading') setTimeout(() => setToast(t => ({ ...t, show: false })), duration);
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  useEffect(() => {
    if (authenticated && !firstLogin) loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, firstLogin]);


  // Session timeout — 1 hora de inactividad, warning 5 min antes
  useEffect(() => {
    if (!authenticated) return;
    const SESSION = 60 * 60 * 1000;
    const WARN    =  5 * 60 * 1000;
    let warnTimer, logoutTimer;
    const schedule = () => {
      clearTimeout(warnTimer); clearTimeout(logoutTimer);
      warnTimer   = setTimeout(() => setSessionWarning(true),  SESSION - WARN);
      logoutTimer = setTimeout(() => logout(), SESSION);
    };
    schedule();
    const reset = () => { setSessionWarning(false); schedule(); };
    ['mousemove','keydown','click','touchstart'].forEach(e => window.addEventListener(e, reset));
    return () => {
      clearTimeout(warnTimer); clearTimeout(logoutTimer);
      ['mousemove','keydown','click','touchstart'].forEach(e => window.removeEventListener(e, reset));
    };
  }, [authenticated, logout]);

  // Clear chat state when user changes (logout / switch user)
  useEffect(() => {
    setMessages([]);
    setActiveSession(null);
    setSelectedProject('');
    setProjects([]);
    setOnboardingChecked(false);
  }, [user?.id]);

  useEffect(() => {
    if (!authenticated || firstLogin || onboardingChecked) return;
    axios.get(API_URL + '/onboarding/profile')
      .then(res => {
        setOnboardingChecked(true);
        if (!res.data.exists) setShowOnboarding(true);
      })
      .catch(() => setOnboardingChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, firstLogin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    }, (error) => Promise.reject(error));
    return () => axios.interceptors.request.eject(interceptor);
  }, [getToken]);

  const loadOnboardingOptions = React.useCallback(async () => {
    try {
      const r = await axios.get(`${API_URL}/projects/onboarding-options`);
      setOnboardingOptions(r.data);
    } catch (_) {}
  }, []);

  // Cargar opciones de onboarding cuando se abre el modal de crear/editar
  React.useEffect(() => {
    if ((showCreateProject || showEditProject) && !onboardingOptions) {
      loadOnboardingOptions();
    }
  }, [showCreateProject, showEditProject]);

  const loadProjects = async () => {
    try {
      console.log('[LOAD PROJECTS] Fetching from:', `${API_URL}/projects`);
      const response = await axios.get(`${API_URL}/projects`);
      console.log('[LOAD PROJECTS] Response:', response.data);
      setProjects(response.data);
      // Auto-seleccionar el primer proyecto si no hay ninguno seleccionado
      if (response.data.length > 0) {
        setSelectedProject(prev => prev || response.data[0].id);
      }
    } catch (error) {
      console.error('[LOAD PROJECTS] Error:', error);
      addSystemMessage('Error al cargar proyectos. Verifica la conexión con el servidor.');
    }
  };

  const addSystemMessage = (content) => {
    setMessages(prev => [...prev, { role: 'system', content, timestamp: new Date().toISOString() }]);
  };
  // ── Scope selector helpers ──────────────────────────────────────────────────
  const fetchFolders = React.useCallback((pid) => {
    if (folderCache[pid] !== undefined) return;
    axios.get((process.env.REACT_APP_API_URL || '/api') + '/folders?projectId=' + pid)
      .then(({ data }) => setFolderCache(c => ({ ...c, [pid]: data || [] })))
      .catch(() => setFolderCache(c => ({ ...c, [pid]: [] })));
  }, [folderCache]);

  React.useEffect(() => {
    if (!scopeOpen) return;
    const handler = (e) => { if (scopeRef.current && !scopeRef.current.contains(e.target)) setScopeOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [scopeOpen]);

  const renderFolderTree = (nodes, depth) => {
    if (!nodes || !nodes.length) return null;
    return nodes.map(f => (
      <React.Fragment key={f.id}>
        <button className={"scope-folder-item" + (activeFolderId === f.id ? " scope-folder-item--active" : "")}
          style={{ paddingLeft: 28 + depth * 14 }}
          onClick={() => { setActiveFolderId(f.id); setActiveFolderName(f.name); setScopeOpen(false); }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,opacity:0.6}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span>{f.name}</span>
        </button>
        {f.children && renderFolderTree(f.children, depth + 1)}
      </React.Fragment>
    ));
  };

    if (loading) {
    return (
      <div className="app-loading-screen">
        <LexiiusLogo iconSize={32} fontSize={18} />
        <div className="app-loading-dots"><span /><span /><span /></div>
      </div>
    );
  }


  if (!authenticated) return <Login />;
  if (passwordRecovery) return <ResetPassword />;
  if (firstLogin) return <SetPassword />;
  if (showOnboarding) return <Onboarding onComplete={async (domain) => { await supabase.auth.refreshSession(); setShowOnboarding(false); loadProjects(); }} />;


  const handleCreateProject = async () => {
    if (!newProjectName.trim()) { showToast('Por favor ingresa un nombre para el proyecto.', 'error'); return; }
    setIsLoading(true);
    const projectName = newProjectName;
    const foldersToCreate = [...plannedFolders];
    try {
      const response = await axios.post(`${API_URL}/projects`, {
        name: projectName,
        description: newProjectDescription || undefined,
        legal_domain: newProjectArea || undefined,
        onboarding: newProjectArea ? {
          area: newProjectArea,
          objects: newProjectObjects,
          objects_custom: newProjectObjectCustom || undefined,
          parties: newProjectParties,
          parties_custom: newProjectPartiesCustom || undefined,
        } : undefined,
        custom_laws: newProjectCustomLaws || undefined,
      });
      const projectId = response.data.id;
      const filesToUpload = [...plannedFiles];
      setNewProjectName(''); setNewProjectDescription(''); setNewProjectArea(''); setNewProjectObjects([]); setNewProjectObjectCustom(''); setNewProjectParties([]); setNewProjectPartiesCustom(''); setNewProjectCustomLaws(''); setPlannedFolders([]); setPlannedFiles([]); setShowCreateProject(false);

      const tempToReal = {};
      if (foldersToCreate.length > 0) {
        setIsCreatingFolders(true);
        setFolderProgress({ current: 0, total: foldersToCreate.length + filesToUpload.length, step: 'Iniciando...' });
        // BFS order: roots first, then their children
        const ordered = [];
        const queue = foldersToCreate.filter(f => !f.parentId);
        while (queue.length > 0) {
          const f = queue.shift();
          ordered.push(f);
          foldersToCreate.filter(c => c.parentId === f.id).forEach(c => queue.push(c));
        }
        for (let i = 0; i < ordered.length; i++) {
          const folder = ordered[i];
          const realParentId = folder.parentId ? (tempToReal[folder.parentId] || null) : null;
          setFolderProgress({ current: i + 1, total: foldersToCreate.length + filesToUpload.length, step: `Creando carpeta "${folder.name}"...` });
          const fr = await axios.post(`${API_URL}/folders`, {
            project_id: projectId, parent_id: realParentId, name: folder.name
          });
          tempToReal[folder.id] = fr.data.id;
        }
      }

      if (filesToUpload.length > 0) {
        if (!isCreatingFolders) setIsCreatingFolders(true);
        for (let i = 0; i < filesToUpload.length; i++) {
          const { file, folderTempId } = filesToUpload[i];
          const realFolderId = folderTempId ? (tempToReal[folderTempId] || null) : null;
          setFolderProgress({ current: foldersToCreate.length + i + 1, total: foldersToCreate.length + filesToUpload.length, step: `Subiendo "${file.name}"...` });
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', projectId);
          formData.append('path', `docs/${file.name}`);
          formData.append('title', file.name);
          if (realFolderId) formData.append('folderId', realFolderId);
          try {
            await axios.post(`${API_URL}/docs`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          } catch (uploadErr) {
            console.warn(`Error uploading ${file.name}:`, uploadErr.message);
          }
        }
      }

      setIsCreatingFolders(false);
      await loadProjects();
      loadOnboardingOptions();
      setSelectedProject(projectId);
      const parts = [];
      if (foldersToCreate.length > 0) parts.push(`${foldersToCreate.length} carpetas`);
      if (filesToUpload.length > 0) parts.push(`${filesToUpload.length} archivos`);
      showToast(
        parts.length > 0
          ? `Proyecto "${projectName}" creado con ${parts.join(' y ')}.`
          : `Proyecto "${projectName}" creado correctamente.`,
        'success'
      );
    } catch (error) {
      console.error('Error creating project:', error);
      setIsCreatingFolders(false);
      showToast(`Error al crear proyecto: ${error.message}`, 'error');
    } finally { setIsLoading(false); }
  };

  const handleOpenEditProject = (project) => {
    setEditingProject(project);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description || '');
    setEditProjectArea(project.legal_domain || '');
    setEditProjectObjects(Array.isArray(project.domain_laws) ? [] : []);
    setEditProjectObjectCustom('');
    setEditProjectParties([]);
    setEditProjectPartiesCustom('');
    setEditProjectCustomLaws(project.custom_laws || '');
    setShowEditProject(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !editProjectName.trim()) return;
    setIsLoading(true);
    try {
      await axios.put(`${API_URL}/projects/${editingProject.id}`, {
        name: editProjectName,
        description: editProjectDescription || undefined,
        legal_domain: editProjectArea || undefined,
        onboarding: editProjectArea ? {
          area: editProjectArea,
          objects: editProjectObjects,
          objects_custom: editProjectObjectCustom || undefined,
          parties: editProjectParties,
          parties_custom: editProjectPartiesCustom || undefined,
        } : undefined,
        custom_laws: editProjectCustomLaws || undefined,
      });
      await loadProjects();
      setShowEditProject(false); setEditingProject(null); setEditProjectName(''); setEditProjectDescription('');
      showToast(`Proyecto "${editProjectName}" actualizado correctamente.`, 'success');
    } catch (error) {
      console.error('Error updating project:', error);
      const msg = error.response?.status === 403
        ? 'No tienes permisos para editar proyectos.'
        : `Error al actualizar proyecto: ${error.response?.data?.message || error.message}`;
      showToast(msg, 'error');
    } finally { setIsLoading(false); }
  };

  const handleDeleteProject = (project) => {
    setConfirmModal({
      show: true, type: 'proyecto', name: project.name,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await axios.delete(`${API_URL}/projects/${project.id}`);
          if (selectedProject === project.id) setSelectedProject('');
          await loadProjects();
          setConfirmModal({ show: false, type: '', name: '', onConfirm: null });
          showToast(`Proyecto "${project.name}" eliminado correctamente.`, 'success');
        } catch (error) {
          console.error('Error deleting project:', error);
          const msg = error.response?.status === 403
            ? 'No tienes permisos para eliminar proyectos.'
            : `Error al eliminar proyecto: ${error.response?.data?.message || error.message}`;
          setConfirmModal({ show: false, type: '', name: '', onConfirm: null });
          showToast(msg, 'error');
        } finally { setIsDeleting(false); }
      }
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (files.length === 1 && selectedProject) {
      // Interceptar: preguntar si anonimizar
      setAnonPending({ file: files[0], projectId: selectedProject, folderId: activeFolderId });
      setShowAnonChoiceModal(true);
    } else {
      handleFiles(files);
    }
  };

  const handleStartAnonymization = async () => {
    setShowAnonChoiceModal(false);
    setAnonLoading(true);
    showProgress('Analizando datos personales...', 'Detectando informacion personal en el archivo', null);
    try {
      const formData = new FormData();
      formData.append('file', anonPending.file);
      const response = await axios.post(API_URL + '/docs/anonymize-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      hideProgress();
      const data = response.data;
      if (!data.hasEntities) {
        showToast('No se detectaron datos personales. Se subirá el archivo sin cambios.', 'info');
        await handleUploadDirect();
        return;
      }
      setAnonPreview(data);
      setShowAnonModal(true);
    } catch (err) {
      hideProgress();
      showToast('Error al analizar el archivo. Se subirá sin anonimizar.', 'error');
      await handleUploadDirect();
    } finally {
      setAnonLoading(false);
    }
  };

  const handleConfirmAnonymization = async () => {
    setShowAnonModal(false);
    setAnonLoading(true);
    showProgress('Subiendo documento anonimizado...', anonPending.file.name, 0);
    try {
      const formData = new FormData();
      formData.append('previewToken', anonPreview.previewToken);
      formData.append('projectId', anonPending.projectId);
      if (anonPending.folderId) formData.append('folderId', anonPending.folderId);
      formData.append('title', anonPending.file.name);
      formData.append('path', 'docs/' + anonPending.file.name);
      await axios.post(API_URL + '/docs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) setProgressOverlay(prev => ({ ...prev, progress: Math.round((evt.loaded / evt.total) * 100) }));
        },
      });
      hideProgress();
      showToast('"' + anonPending.file.name + '" subido y anonimizado correctamente.', 'success');
      setDocRefreshKey(prev => prev + 1);
      await loadProjects();
    } catch (err) {
      hideProgress();
      if (err.response?.status === 409) {
        const details = err.response.data?.details || err.response.data || {};
        const existingDoc = details.existingDocument || {};
        setDuplicateAlert({
          fileName: anonPending.file.name,
          duplicateType: details.duplicateType || 'file_hash',
          existingPath: existingDoc.path || 'archivo similar',
          existingTitle: existingDoc.title,
          message: err.response.data?.message,
        });
      } else if (err.response?.status === 410) {
        showToast('La sesion expiró. Intentá subir el archivo nuevamente.', 'error');
      } else {
        showToast('Error al subir el documento.', 'error');
      }
    } finally {
      setAnonLoading(false);
      setAnonPending(null);
      setAnonPreview(null);
    }
  };

  const handleUploadDirect = async () => {
    setShowAnonChoiceModal(false);
    const file = anonPending?.file;
    const pending = anonPending;
    setAnonPending(null);
    if (file && pending) {
      await handleFiles([file]);
    }
  };

  const handleFiles = async (files) => {
    if (!selectedProject) { addSystemMessage('Por favor selecciona un proyecto primero.'); return; }
    if (files.length === 0) return;
    setIsLoading(true);
    let filesUploaded = 0;
    // Validar tamanio antes de subir
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        showToast("" + file.name + " pesa " + sizeMB + " MB. El limite es 100 MB. Comprimi el archivo o dividilo en partes.", 'error');
        return;
      }
    }

    for (const file of files) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      showProgress('Subiendo "' + file.name + '"', sizeMB + ' MB - No cierres la ventana', 0);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', selectedProject);
        formData.append('path', 'docs/' + file.name);
        formData.append('title', file.name);
        if (activeFolderId) formData.append('folderId', activeFolderId);
        const response = await axios.post(API_URL + '/docs', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (evt.total) {
              const pct = Math.round((evt.loaded / evt.total) * 100);
              setProgressOverlay(prev => ({ ...prev, progress: pct }));
            }
          },
        });
        hideProgress();
        if (response.data.statusCode === 409) {
          showToast('"' + file.name + '" ya existe en el proyecto.', 'error');
        } else {
          setUploadedFiles(prev => [...prev, { name: file.name, size: file.size, uploadedAt: new Date().toISOString() }]);
          showToast('"' + file.name + '" subido correctamente.', 'success');
          filesUploaded++;
        }
      } catch (error) {
        hideProgress();
        console.error('Error uploading file:', error);
        if (error.response?.status === 409) {
          const details = error.response.data.details || {};
          const existingDoc = details.existingDocument || {};
          setDuplicateAlert({ fileName: file.name, duplicateType: details.duplicateType, existingPath: existingDoc.path || 'archivo similar', existingTitle: existingDoc.title, message: error.response.data.message, existingDocId: existingDoc.id, file: file, projectId: selectedProject, folderId: activeFolderId });
          showToast('"' + file.name + '" ya existe: ' + (existingDoc.path || 'archivo similar'), 'error');
        } else if (error.response?.status === 413) {
          showToast('"' + file.name + '" es demasiado grande. Limite: 100 MB.', 'error');
        } else {
          showToast('Error al subir "' + file.name + '": ' + (error.response?.data?.message || error.message), 'error');
        }
      }
    }
        setIsLoading(false);
    if (filesUploaded > 0) { await loadProjects(); setDocRefreshKey(prev => prev + 1); }
  };

  const handleZipUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !selectedProject) return;
    setIsLoading(true);
    showProgress('Procesando ZIP...', 'Esto puede tardar unos segundos');
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", selectedProject);
      if (activeFolderId) formData.append("folderId", activeFolderId);
      const response = await axios.post(API_URL + "/docs/upload-zip", formData, { headers: { "Content-Type": "multipart/form-data" }, timeout: 300000 });
      const { imported, skipped, errors } = response.data;
      await loadProjects();
      setDocRefreshKey(prev => prev + 1);
      hideProgress();
      showToast(imported + " archivo(s) importado(s)" + (skipped > 0 ? ", " + skipped + " omitido(s)" : "") + (errors > 0 ? ", " + errors + " error(es)" : "") + ".", imported > 0 ? "success" : "error");
    } catch (error) {
      hideProgress();
      showToast("Error al importar ZIP: " + (error.response?.data?.message || error.message), "error");
    } finally { setIsLoading(false); }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleJurisUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !selectedProject) { addSystemMessage('Por favor selecciona un proyecto primero.'); return; }
    const MAX = 100 * 1024 * 1024;
    if (file.size > MAX) { showToast(file.name + ' es demasiado grande. Limite: 100 MB.', 'error'); return; }
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    showProgress('Subiendo jurisprudencia', sizeMB + ' MB - No cierres la ventana', 0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', selectedProject);
      formData.append('path', 'docs/' + file.name);
      formData.append('title', file.name);
      formData.append('documentType', 'jurisprudencia');
      if (activeFolderId) formData.append('folderId', activeFolderId);
      await axios.post(API_URL + '/docs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) { const pct = Math.round((evt.loaded/evt.total)*100); setProgressOverlay(prev=>({...prev,progress:pct})); }
        },
      });
      hideProgress();
      showToast(file.name + ' subido como jurisprudencia.', 'success');
      setDocRefreshKey(prev => prev + 1);
    } catch (error) {
      hideProgress();
      if (error.response?.status === 413) {
        showToast(file.name + ' es demasiado grande. Limite: 100 MB.', 'error');
      } else {
        showToast('Error al subir jurisprudencia: ' + (error.response?.data?.message || error.message), 'error');
      }
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFiles(Array.from(e.dataTransfer.files)); };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedProject) return;
    const userMessage = { role: 'user', content: inputMessage, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    const deepKeywords = ['analiza','analizá','compara','compará','contrasta','explica en detalle','resume todos','cuales son todas','contradice','jurisprudencia','fundamenta','antecedentes','interpretacion','interpretación'];
    const msgLower = inputMessage.toLowerCase();
    const deep = inputMessage.length > 120 || deepKeywords.some(k => msgLower.includes(k));
    setIsDeepAnalysis(deep);
    setIsLoading(true);
    try {
      const history = messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-10).map(m => ({ role: m.role, content: m.content }));

      // If a session is active, use the session query endpoint (saves history)
      let response;
      let resolvedSessionId = activeSession?.id || null;
      if (activeSession) {
        response = await axios.post(`${API_URL}/sessions/${activeSession.id}/query`, {
          question: inputMessage, projectId: selectedProject,
          domain: projects.find(p => p.id === selectedProject)?.domain || 'general',
        });
      } else {
        // Create a new session automatically on first message
        try {
          const newSess = await axios.post(`${API_URL}/sessions`, { projectId: selectedProject, firstMessage: inputMessage });
          setActiveSession(newSess.data);
          resolvedSessionId = newSess.data.id; // capturar antes de que React actualice el state
          response = await axios.post(`${API_URL}/sessions/${newSess.data.id}/query`, {
            question: inputMessage, projectId: selectedProject,
            domain: projects.find(p => p.id === selectedProject)?.domain || 'general',
          });
        } catch (_e) {
          // Fallback to stateless query if session creation fails
          response = await axios.post(`${API_URL}/ai/query`, { projectId: selectedProject, question: inputMessage, mode: selectedMode, history, domain: projects.find(p => p.id === selectedProject)?.domain || 'general' });
        }
      }
      const assistantMessage = {
        role: 'assistant', content: response.data.answer || response.data.message || 'Sin respuesta',
        timestamp: new Date().toISOString(), mode: response.data.mode || selectedMode,
        domain: projects.find(p => p.id === selectedProject)?.domain || 'general',
        sourceMode: response.data.sourceMode || null,
        sources: response.data.sources || [],
        charts: response.data.charts || [], tables: response.data.tables || [],
        metrics: response.data.metrics || [], recommendations: response.data.recommendations || [],
        messageId: response.data.messageId || null,
        sessionId: resolvedSessionId,
        validatedResponse: response.data.validatedResponse || null,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.status === 402 || error.response?.data?.code === 'QUERY_LIMIT_EXCEEDED') {
        showToast('Alcanzaste el limite de consultas de tu plan. Actualizá tu plan para continuar.', 'warning', 6000);
      } else if (error.response?.status === 429) {
        showToast('Demasiadas consultas seguidas. Esperá unos segundos.', 'warning');
      } else if (!navigator.onLine || error.code === 'ERR_NETWORK') {
        showToast('Sin conexion. Verificá tu red e intentá de nuevo.', 'error');
      } else {
        addSystemMessage(`Error al enviar mensaje: ${error.message}`);
      }
    } finally { setIsLoading(false); setIsDeepAnalysis(false); }
  };

  // V4 Sprint 4 — Feedback 👍👎
  const sendFeedback = async (sessionId, messageId, rating) => {
    if (!sessionId || !messageId) return;
    try {
      await axios.post(`${API_URL}/sessions/${sessionId}/messages/${messageId}/feedback`, { rating });
    } catch (e) {
      console.error('Error enviando feedback:', e.message);
    }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

  const handleCopyMessage = async (content) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      addSystemMessage('✓ Contenido copiado al portapapeles');
    } catch (err) { addSystemMessage('✗ Error al copiar al portapapeles'); }
  };

  const handleRegenerateMessage = async (messageIndex) => {
    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.role !== 'user') { addSystemMessage('✗ No se puede regenerar: mensaje de usuario no encontrado'); return; }
    setMessages(prev => prev.slice(0, -1));
    setIsLoading(true);
    try {
      const historyForRegen = messages.slice(0, messageIndex - 1).filter(m => m.role === 'user' || m.role === 'assistant').slice(-10).map(m => ({ role: m.role, content: m.content }));
      const response = await axios.post(`${API_URL}/ai/query`, { projectId: selectedProject, question: userMessage.content, mode: selectedMode, history: historyForRegen, domain: projects.find(p => p.id === selectedProject)?.domain || 'general' });
      const assistantMessage = {
        role: 'assistant', content: response.data.answer || response.data.message || 'Sin respuesta',
        timestamp: new Date().toISOString(), mode: response.data.mode || selectedMode,
        domain: projects.find(p => p.id === selectedProject)?.domain || 'general',
        sourceMode: response.data.sourceMode || null,
        sources: response.data.sources || [],
        charts: response.data.charts || [], tables: response.data.tables || [],
        metrics: response.data.metrics || [], recommendations: response.data.recommendations || [],
        validatedResponse: response.data.validatedResponse || null,
      };
      setMessages(prev => [...prev, assistantMessage]);
      addSystemMessage('✓ Respuesta regenerada');
    } catch (error) { addSystemMessage(`✗ Error al regenerar respuesta: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  const handleDeleteDocument = (docId, docTitle) => {
    setConfirmModal({
      show: true, type: 'documento', name: docTitle,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await axios.delete(`${API_URL}/docs/${docId}`);
          await loadProjects();
          setDocRefreshKey(prev => prev + 1);
          setConfirmModal({ show: false, type: '', name: '', onConfirm: null });
          showToast(`Documento "${docTitle}" eliminado correctamente.`, 'success');
        } catch (error) {
          setConfirmModal({ show: false, type: '', name: '', onConfirm: null });
          showToast(`Error al eliminar documento: ${error.message}`, 'error');
        } finally { setIsDeleting(false); }
      }
    });
  };

  const handleViewDocument = async (doc) => {
    console.log('handleViewDocument called with:', doc);
    if (doc.content || doc.content_text) { setSelectedDocument(doc); setShowReaderMode(true); return; }
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/docs/${doc.id}`);
      setSelectedDocument(response.data); setShowReaderMode(true);
    } catch (error) { addSystemMessage(`✗ Error al cargar documento: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  const handleOpenDocument = async (documentId) => {
    if (!documentId) return;
    try {
      const response = await axios.get(API_URL + '/docs/' + documentId + '/view', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'text/plain' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Error opening document:', error);
    }
  };

  const handleSearch = async () => {
    const hasQuery = searchQuery.trim();
    const hasFilters = searchFilters.projectId || searchFilters.dateFrom || searchFilters.dateTo || searchFilters.fileType;
    if (!hasQuery && !hasFilters) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (hasQuery) params.set('q', searchQuery);
      if (searchFilters.projectId) params.set('projectId', searchFilters.projectId);
      if (searchFilters.dateFrom) params.set('dateFrom', searchFilters.dateFrom);
      if (searchFilters.dateTo) params.set('dateTo', searchFilters.dateTo);
      if (searchFilters.fileType) params.set('fileType', searchFilters.fileType);
      const response = await axios.get(`${API_URL}/docs/search?${params}`);
      setSearchResults(response.data.results || []);
    } catch (error) { addSystemMessage(`\u2717 Error en la búsqueda: ${error.message}`); }
    finally { setIsSearching(false); }
  };

  const exportAIResponse = async (message, format = 'txt') => {
    try {
      const messageIndex = messages.findIndex(m => m === message);
      const questionMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
      const question = questionMessage?.role === 'user' ? questionMessage.content : 'Sin pregunta';

      if (format === 'docx') {
        // Descargar como Word editable via nuevo endpoint
        const title = question.slice(0, 60) || 'Respuesta Iurivia';
        const response = await axios.post(`${API_URL}/export/docx`,
          { content: message.content, title },
          { responseType: 'arraybuffer' }
        );
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `iurivia_${Date.now()}.docx`);
        document.body.appendChild(link); link.click(); link.remove();
        window.URL.revokeObjectURL(url);
        return;
      }

      const response = await axios.post(`${API_URL}/ai/query/export`, { question, answer: message.content, sources: message.sources || [], format, title: 'Iurivia AI Response', metadata: { projectId: selectedProject, exportedAt: new Date().toISOString() } }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `iurivia_response_${Date.now()}.${format}`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) { addSystemMessage(`Error al exportar: ${error.message}`); }
  };

  // ── EXPORT TO PDF ───────────────────────────────────────────────────────────
  const exportToPDF = (message) => {
    const idx = messages.findIndex(m => m === message);
    const qMsg = idx > 0 ? messages[idx - 1] : null;
    const question = qMsg && qMsg.role === 'user' ? qMsg.content : 'Sin pregunta';
    const answer = message.content;
    const sources = message.sources || [];
    const esc = (t) => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const srcHtml = sources.length > 0
      ? '<div class="src"><h2>Fuentes</h2>' + sources.map((s,i) => '<div>' + (i+1) + '. ' + esc(s.path||s.title||'?') + '</div>').join('') + '</div>'
      : '';
    const now = new Date().toLocaleString('es-ES');
    const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Geronimo AI</title>'
      + '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#1a1a1a;line-height:1.6}'
      + 'h1{font-size:1.4rem;border-bottom:2px solid #ff6600;padding-bottom:10px;margin-bottom:20px}'
      + 'h2{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:24px 0 8px}'
      + '.q{background:#f5f5f5;padding:14px;border-left:3px solid #ff6600;border-radius:3px;white-space:pre-wrap}'
      + '.a{white-space:pre-wrap;line-height:1.7}.src{margin-top:20px;padding-top:14px;border-top:1px solid #ddd;font-size:.85rem;color:#555}'
      + '.foot{margin-top:32px;padding-top:10px;border-top:1px solid #eee;font-size:.75rem;color:#aaa;text-align:center}'
      + '@media print{body{margin:0;max-width:100%}}</style></head><body>'
      + '<h1>Iurivia AI</h1><h2>Pregunta</h2><div class="q">' + esc(question) + '</div>'
      + '<h2>Respuesta</h2><div class="a">' + esc(answer) + '</div>'
      + srcHtml
      + '<div class="foot">Generado por Geronimo &middot; ' + now + '</div>'
      + '</body></html>';
    const w = window.open('', '_blank', 'width=860,height=700');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 350);
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* ── Top Bar ── */}
      <header className="top-bar">
        <div
          className={`top-bar-brand${railCollapsed ? '' : ' top-bar-brand--expanded'}`}
          onClick={() => setActiveTab('chat')}
          style={{cursor:'pointer'}}
          title="Ir al inicio"
        >
          <LexiiusLogo iconSize={26} fontSize={16} />
        </div>
        <button
          className="top-bar-hamburger"
          onClick={() => setMobileNavOpen(v => !v)}
          title="Menú"
          aria-label="Abrir menú"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="top-bar-right">
          <UserHeader onNavigate={setActiveTab} />
        </div>
      </header>

      {/* ── App Body ── */}
      <div className="app-body">

        {/* Mobile overlay */}
        {mobileNavOpen && <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />}

        {/* Left Rail */}
        <LeftRail
          activeTab={activeTab}
          onTabChange={(tab) => { setActiveTab(tab); if (tab === 'sessions') setShowSessions(true); else setShowSessions(false); }}
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={(id) => { setSelectedProject(id); setActiveFolderId(null); setActiveFolderName(null); }}
          activeFolderId={activeFolderId}
          can={can}
          onCreateProject={() => setShowCreateProject(true)}
          onEditProject={handleOpenEditProject}
          onDeleteProject={handleDeleteProject}
          onUpload={() => fileInputRef.current?.click()}
          onZipUpload={() => zipInputRef.current?.click()}
          onJurisUpload={() => jurisInputRef.current?.click()}
          isLoading={isLoading}
          onCollapsedChange={setRailCollapsed}
          mobileNavOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />

        {/* Main Content */}
        <main className="app-main"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}>

          <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".txt,.md,.json,.js,.py,.java,.cpp,.html,.css,.pdf,.doc,.docx" />
          <input ref={zipInputRef} type="file" onChange={handleZipUpload} style={{display:"none"}} accept=".zip" />
          <input ref={jurisInputRef} type="file" onChange={handleJurisUpload} style={{display:"none"}} accept=".pdf,.doc,.docx,.txt" />

          {/* Chat */}
          {activeTab === 'chat' && (
            <div style={{display:'flex',height:'100%',overflow:'hidden'}}>
              {/* Session Panel sidebar */}
              <div style={{width:showSessions?220:0,minWidth:0,overflow:'hidden',borderRight:showSessions?'1px solid var(--border-subtle)':'none',transition:'width 0.2s',flexShrink:0,background:'var(--bg-secondary)'}}>
                <SessionPanel
                  projectId={selectedProject}
                  activeSessionId={activeSession?.id}
                  onFeedback={sendFeedback}
                  onSelectSession={async (s) => {
                    setActiveSession(s);
                    setShowSessions(false);
                    const res = await axios.get((process.env.REACT_APP_API_URL || '/api') + '/sessions/' + s.id + '/messages');
                    setMessages(res.data.map((m, i) => ({
                      id: i, role: m.role,
                      content: m.content,
                      sources: m.sources_json ? JSON.parse(m.sources_json) : [],
                      domain: m.role === 'assistant' ? (projects.find(p => p.id === selectedProject)?.domain || 'general') : undefined,
                    })));
                  }}
                  onNewSession={() => { setActiveSession(null); setMessages([]); }}
                  onDeleteSession={() => { setActiveSession(null); setMessages([]); }}
                  collapsed={!showSessions}
                />
              </div>
              <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div className="section-header">
                <div className="chat-header-left">
                  <button
                    onClick={() => setShowSessions(v => !v)}
                    title={showSessions ? "Ocultar conversaciones" : "Ver conversaciones"}
                    style={{background:'none',border:'none',cursor:'pointer',color:showSessions?'var(--text-accent)':'var(--text-tertiary)',padding:'4px 6px',borderRadius:6,display:'flex',alignItems:'center',gap:4,fontSize:12,marginRight:4}}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {showSessions ? 'Ocultar' : 'Historial'}
                  </button>

                  {/* Unified project+folder selector */}
                  <div className="chat-scope-bar" ref={scopeRef} style={{position:'relative'}}>
                    <button className={"chat-scope-btn" + (activeFolderId ? " chat-scope-btn--active" : "")}
                      onClick={() => { setScopeOpen(o => !o); if (!scopeOpen && selectedProject) { setExpandedProject(selectedProject); fetchFolders(selectedProject); } }}
                      title="Enfocá tu búsqueda en un proyecto o carpeta específica">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
                      <span className="scope-btn-project">{projects.find(p => p.id === selectedProject)?.name || 'Elegí un proyecto'}</span>
                      {activeFolderName && (<><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{opacity:0.4,flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg><span className="scope-btn-folder">{activeFolderName}</span></>)}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginLeft:2}}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    {scopeOpen && (
                      <div className="chat-scope-dropdown" style={{top:'calc(100% + 6px)',bottom:'auto'}}>
                        <div className="scope-dropdown-header">Proyecto y alcance</div>
                        {projects.map(p => (
                          <React.Fragment key={p.id}>
                            <button className={"scope-project-item" + (p.id === selectedProject ? " scope-project-item--active" : "")}
                              onClick={() => { setSelectedProject(p.id); setActiveFolderId(null); setActiveFolderName(null); setExpandedProject(expandedProject === p.id ? null : p.id); fetchFolders(p.id); }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
                              <span style={{flex:1}}>{p.name}</span>
                              {p.id === selectedProject && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>}
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{opacity:0.4,flexShrink:0,marginLeft:4}}>{expandedProject === p.id ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}</svg>
                            </button>
                            {expandedProject === p.id && (
                              <div className="scope-folders-group">
                                <button className={"scope-folder-item" + (p.id === selectedProject && !activeFolderId ? " scope-folder-item--active" : "")}
                                  style={{paddingLeft:20}}
                                  onClick={() => { setSelectedProject(p.id); setActiveFolderId(null); setActiveFolderName(null); setScopeOpen(false); }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,opacity:0.5}}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                                  <span style={{color:"var(--text-tertiary)"}}>Todo el proyecto</span>
                                </button>
                                {renderFolderTree(folderCache[p.id] || [], 0)}
                                {folderCache[p.id] === undefined && <p className="scope-dropdown-empty">Cargando...</p>}
                                {folderCache[p.id] && folderCache[p.id].length === 0 && <p className="scope-dropdown-empty">Sin carpetas</p>}
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
              <Chat
                messages={messages}
                messagesEndRef={messagesEndRef}
                isLoading={isLoading}
                isDeepAnalysis={isDeepAnalysis}
                selectedProject={selectedProject}
                projects={projects}
                onProjectSelect={(id) => { setSelectedProject(id); setActiveFolderId(null); }}
                onCreateProject={() => setShowCreateProject(true)}
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                handleKeyPress={handleKeyPress}
                handleSendMessage={handleSendMessage}
                showExportMenu={showExportMenu}
                setShowExportMenu={setShowExportMenu}
                exportAIResponse={exportAIResponse}
                exportToPDF={exportToPDF}
                handleCopyMessage={handleCopyMessage}
                handleRegenerateMessage={handleRegenerateMessage}
                onOpenDocument={handleOpenDocument}
                onFeedback={sendFeedback}
                currentUser={user}
                activeFolderId={activeFolderId}
                activeFolderName={activeFolderName}
                onScopeChange={(id, name) => { setActiveFolderId(id); setActiveFolderName(name || null); }}
                uploadedFiles={uploadedFiles}
                onUploadClick={() => { setActiveTab('explorer'); }}
              />
              </div>
            </div>
          )}

          {/* Explorer */}
          {activeTab === 'sessions' && (
            <div style={{height:'100%',overflow:'auto',background:'var(--bg-surface-1)'}}>
              <SessionPanel
                projectId={selectedProject}
                showAll={true}
                projects={projects}
                activeSessionId={activeSession?.id}
                onFeedback={sendFeedback}
                onSelectSession={async (s) => {
                  setActiveSession(s);
                  setActiveTab('chat');
                  const res = await axios.get((process.env.REACT_APP_API_URL || '/api') + '/sessions/' + s.id + '/messages');
                  setMessages(res.data.map((m, i) => ({
                    id: i, role: m.role, content: m.content,
                    sources: m.sources_json ? JSON.parse(m.sources_json) : [],
                    domain: m.role === 'assistant' ? (projects.find(p => p.id === selectedProject)?.domain || 'general') : undefined,
                  })));
                }}
                onNewSession={() => { setActiveSession(null); setMessages([]); setActiveTab('chat'); }}
                onDeleteSession={() => { setActiveSession(null); setMessages([]); }}
              />
            </div>
          )}

          {activeTab === 'explorer' && (
            <Explorer
              projects={projects}
              selectedProject={selectedProject}
              onProjectSelect={(id) => { setSelectedProject(id); setActiveFolderId(null); }}
              handleViewDocument={handleViewDocument}
              handleDeleteDocument={handleDeleteDocument}
              docRefreshKey={docRefreshKey}
              isLoading={isLoading}
              activeFolderId={activeFolderId}
              onFolderSelect={(folderId, folderName) => { setActiveFolderId(folderId); setActiveFolderName(folderName || null); }}
              onUpload={() => fileInputRef.current?.click()}
              onZipUpload={() => zipInputRef.current?.click()}
              onJurisUpload={() => jurisInputRef.current?.click()}
              onEditProject={handleOpenEditProject}
              onDeleteProject={handleDeleteProject}
              onCreateProject={() => setShowCreateProject(true)}
              can={can}
              onAnalyzeDocs={(action) => {
                setInputMessage(action.prompt || '');
                setActiveTab('chat');
              }}
            />
          )}

          {/* Search */}
          {activeTab === 'search' && (
            <>
              <div className="section-header">
                <h2 className="section-title">Búsqueda</h2>
              </div>
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
            </>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && (
            <>
              <div className="section-header">
                <h2 className="section-title">Integraciones</h2>
              </div>
              <Integrations />
            </>
          )}

          {/* Users */}
          {activeTab === 'users' && can('VIEW_USERS') && (
            <Users />
          )}

          {/* Profile */}
          {activeTab === 'profile' && (
            <Profile onBack={() => setActiveTab('chat')} onProfileUpdated={(name) => console.log('Profile updated:', name)} />
          )}

          {/* Settings */}
          {activeTab === 'settings' && can('VIEW_SETTINGS') && (
            <Settings />
          )}
        </main>
      </div>

      {/* ── Reader Mode ── */}
      {showReaderMode && selectedDocument && (
        <DocumentReader
          document={selectedDocument}
          onClose={() => { setShowReaderMode(false); setSelectedDocument(null); }}
        />
      )}

      {/* ── Modals ── */}
      {showDocPreview && selectedDocument && !showReaderMode && (
        <DocumentPreviewModal
          document={selectedDocument}
          onClose={() => setShowDocPreview(false)}
          formatDate={formatDate}
          formatFileSize={formatFileSize}
        />
      )}

      {showAnonChoiceModal && anonPending && (
        <div style={{position:'fixed',inset:0,background:'var(--bg-overlay)',backdropFilter:'blur(6px)',
          WebkitBackdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',
          padding:'var(--space-5)',zIndex:'var(--z-modal)'}}>
          <div style={{width:420,maxWidth:'calc(100vw - 40px)',background:'var(--bg-surface-1)',
            border:'1px solid var(--border-default)',borderRadius:'var(--modal-radius)',
            boxShadow:'var(--shadow-xl)',padding:'var(--space-6)',display:'flex',flexDirection:'column',gap:'var(--space-4)'}}>
            <div>
              <div style={{fontSize:'var(--text-base)',fontWeight:'var(--font-semibold)',color:'var(--text-primary)',marginBottom:'var(--space-2)'}}>
                Subir "{anonPending.file.name}"
              </div>
              <div style={{fontSize:'var(--text-sm)',color:'var(--text-secondary)',lineHeight:'var(--leading-relaxed)'}}>
                Los abogados tienen el deber legal de proteger los datos de sus clientes (Art. 10 Ley 23.187). ¿Deseas que Iurivia detecte y proteja los datos personales antes de subir el archivo?
              </div>
            </div>
            <div style={{display:'flex',gap:'var(--space-3)',justifyContent:'flex-end'}}>
              <button onClick={handleUploadDirect} className="exp-btn exp-btn--ghost"
                style={{height:'var(--btn-height-md)',padding:'0 var(--btn-padding-x-md)',
                  display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                No, subir tal cual
              </button>
              <button onClick={handleStartAnonymization} className="exp-btn exp-btn--primary"
                style={{height:'var(--btn-height-md)',padding:'0 var(--btn-padding-x-md)',
                  display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                Proteger datos
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnonModal && anonPreview && anonPending && (
        <AnonymizationModal
          fileName={anonPending.file.name}
          anonymizedPreview={anonPreview.anonymizedPreview}
          entityMap={anonPreview.entityMap}
          totalEntities={anonPreview.totalEntities}
          onConfirm={handleConfirmAnonymization}
          onCancel={() => { setShowAnonModal(false); setAnonPending(null); setAnonPreview(null); }}
        />
      )}

      <DuplicateAlertModal
        alert={duplicateAlert}
        onClose={() => setDuplicateAlert(null)}
        onReplace={async (alert) => {
          setDuplicateAlert(null);
          if (!alert.file || !alert.existingDocId) {
            showToast('No se puede reemplazar este archivo.', 'error');
            return;
          }
          try {
            showProgress('Reemplazando archivo...', alert.fileName, 0);
            await axios.delete(API_URL + '/docs/' + alert.existingDocId);
            const formData = new FormData();
            formData.append('file', alert.file);
            formData.append('projectId', alert.projectId);
            if (alert.folderId) formData.append('folderId', alert.folderId);
            formData.append('title', alert.fileName);
            formData.append('path', 'docs/' + alert.fileName);
            formData.append('skipDuplicateCheck', 'true');
            await axios.post(API_URL + '/docs', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (evt) => {
                if (evt.total) setProgressOverlay(prev => ({ ...prev, progress: Math.round((evt.loaded / evt.total) * 100) }));
              },
            });
            hideProgress();
            showToast('"' + alert.fileName + '" reemplazado correctamente.', 'success');
            setDocRefreshKey(prev => prev + 1);
            await loadProjects();
          } catch (err) {
            hideProgress();
            showToast('Error al reemplazar el archivo.', 'error');
          }
        }}
        onSkipAll={() => { setSkipAllDuplicates(true); setDuplicateAlert(null); showToast('Se omitirán los archivos duplicados restantes.', 'info'); }}
      />

      <ConfirmDeleteModal
        modal={confirmModal}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ show: false, type: '', name: '', onConfirm: null })}
        isProcessing={isDeleting}
      />

      <Toast toast={toast} onClose={() => setToast(t => ({...t, show:false}))} />
      <ProgressOverlay
        show={progressOverlay.show}
        message={progressOverlay.message}
        subMessage={progressOverlay.subMessage}
        progress={progressOverlay.progress}
      />

      {/* Modal crear proyecto */}
      {showCreateProject && (
        <div className="modal-overlay" onClick={() => { setShowCreateProject(false); setCreateStep(0); setPlannedFolders([]); setPlannedFiles([]); }}>
          <div className="modal-content create-project-modal" onClick={(e) => e.stopPropagation()}
               style={createStep === 3 ? {maxWidth:720, width:'95vw'} : {maxWidth:560, width:'95vw'}}>

            {/* Stepper indicator */}
            <div style={{display:'flex',alignItems:'center',gap:'var(--space-2)',padding:'var(--space-4) var(--space-5)',borderBottom:'1px solid var(--border-subtle)'}}>
              {['Proyecto','Área','Detalles','Carpetas'].map((label, i) => (
                <React.Fragment key={i}>
                  <div style={{display:'flex',alignItems:'center',gap:'var(--space-2)'}}>
                    <div style={{width:20,height:20,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:'var(--font-bold)',
                      background: i <= createStep ? 'var(--accent)' : 'var(--bg-surface-3)',
                      color: i <= createStep ? '#fff' : 'var(--text-disabled)',transition:'background 0.2s'}}>
                      {i < createStep ? '✓' : i + 1}
                    </div>
                    <span style={{fontSize:'var(--text-sm)',fontWeight: i === createStep ? 'var(--font-semibold)' : 'var(--font-regular)',
                      color: i === createStep ? 'var(--text-primary)' : 'var(--text-muted)'}}>{label}</span>
                  </div>
                  {i < 3 && <div style={{flex:1,height:1,background:'var(--border-default)'}} />}
                </React.Fragment>
              ))}
            </div>

            {createStep === 0 && (
              <>
                <div className="modal-body">
                  <h3>Crear Nuevo Proyecto</h3>
                  <div className="form-group">
                    <label>Nombre del Proyecto:</label>
                    <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Ej: Mi Proyecto" autoFocus />
                  </div>
                  <div className="form-group">
                    <label>Descripción (opcional):</label>
                    <textarea value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} placeholder="Ej: Expediente por cobro de alquileres adeudados. Cliente: María García. Contraparte: Juan López. Tribunal: Juzgado Civil N°15 CABA." rows="3" />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => { setShowCreateProject(false); setCreateStep(0); setPlannedFolders([]); setPlannedFiles([]); }}>Cancelar</button>
                  <button className="btn-create" onClick={() => setCreateStep(newProjectArea ? 2 : 1)} disabled={!newProjectName.trim()}>
                    Siguiente →
                  </button>
                </div>
              </>
            )}


            {createStep === 1 && (
              <>
                <div className="modal-body">
                  <h3 style={{marginBottom:'var(--space-2)'}}>Área del derecho</h3>
                  <p style={{color:'var(--text-tertiary)',fontSize:'var(--text-sm)',marginBottom:'var(--space-4)',margin:'0 0 var(--space-4)'}}>
                    ¿Cuál es el área jurídica principal de este proyecto?
                  </p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-2)'}}>
                    {(onboardingOptions?.legal_domains || []).map(d => (
                      <button key={d.value}
                        onClick={() => { setNewProjectArea(d.value); setNewProjectObjects([]); setNewProjectObjectCustom(''); }}
                        style={{padding:'var(--space-3)',borderRadius:'var(--radius-md)',border:'1px solid',
                          borderColor: newProjectArea === d.value ? 'var(--accent)' : 'var(--border-default)',
                          background: newProjectArea === d.value ? 'var(--bg-accent-subtle)' : 'var(--bg-surface-2)',
                          color: newProjectArea === d.value ? 'var(--text-accent)' : 'var(--text-secondary)',
                          cursor:'pointer',textAlign:'left',fontSize:'var(--text-sm)',
                          fontWeight: newProjectArea === d.value ? 'var(--font-semibold)' : 'var(--font-regular)',
                          transition:'all var(--duration-fast)',lineHeight:1.4}}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setCreateStep(0)}>← Atrás</button>
                  <button className="btn-create" onClick={() => setCreateStep(2)} disabled={!newProjectArea}>
                    Siguiente →
                  </button>
                </div>
              </>
            )}

            {createStep === 2 && (
              <>
                <div className="modal-body" style={{maxHeight:'60vh',overflowY:'auto'}}>
                  <h3 style={{marginBottom:'var(--space-4)'}}>Detalles del caso</h3>

                  {newProjectArea && (onboardingOptions?.objects_by_domain?.[newProjectArea] || []).length > 0 && (
                    <div style={{marginBottom:'var(--space-5)'}}>
                      <label style={{display:'block',fontSize:'var(--text-xs)',fontWeight:'var(--font-semibold)',color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'var(--space-2)'}}>
                        Objeto del proyecto
                      </label>
                      <div style={{display:'flex',flexDirection:'column',gap:'var(--space-2)'}}>
                        {(onboardingOptions.objects_by_domain[newProjectArea] || []).map(obj => (
                          obj.value === 'otro' ? (
                            <div key="otro-obj">
                              <label style={{display:'flex',alignItems:'center',gap:'var(--space-2)',cursor:'pointer',fontSize:'var(--text-sm)',color:'var(--text-secondary)'}}>
                                <input type="checkbox" checked={newProjectObjects.includes('otro')}
                                  onChange={e => setNewProjectObjects(p => e.target.checked ? [...p,'otro'] : p.filter(x=>x!=='otro'))}
                                  style={{accentColor:'var(--accent)'}} />
                                Otro
                              </label>
                              {newProjectObjects.includes('otro') && (
                                <input type="text" value={newProjectObjectCustom}
                                  onChange={e => setNewProjectObjectCustom(e.target.value)}
                                  placeholder="Especificá..."
                                  style={{marginTop:'var(--space-2)',width:'100%',boxSizing:'border-box',padding:'var(--space-2) var(--space-3)',background:'var(--bg-surface-2)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',color:'var(--text-primary)',fontSize:'var(--text-sm)'}} />
                              )}
                            </div>
                          ) : (
                            <label key={obj.value} style={{display:'flex',alignItems:'center',gap:'var(--space-2)',cursor:'pointer',fontSize:'var(--text-sm)',color:'var(--text-secondary)'}}>
                              <input type="checkbox" checked={newProjectObjects.includes(obj.value)}
                                onChange={e => setNewProjectObjects(p => e.target.checked ? [...p,obj.value] : p.filter(x=>x!==obj.value))}
                                style={{accentColor:'var(--accent)'}} />
                              {obj.label}
                            </label>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{marginBottom:'var(--space-5)'}}>
                    <label style={{display:'block',fontSize:'var(--text-xs)',fontWeight:'var(--font-semibold)',color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'var(--space-2)'}}>
                      Partes del proceso <span style={{color:'var(--text-disabled)',fontWeight:'normal'}}>(opcional)</span>
                    </label>
                    <div style={{display:'flex',flexDirection:'column',gap:'var(--space-2)'}}>
                      {(onboardingOptions?.parties_options || []).map(p => (
                        p.value === 'otro' ? (
                          <div key="otro-party">
                            <label style={{display:'flex',alignItems:'center',gap:'var(--space-2)',cursor:'pointer',fontSize:'var(--text-sm)',color:'var(--text-secondary)'}}>
                              <input type="checkbox" checked={newProjectParties.includes('otro')}
                                onChange={e => setNewProjectParties(prev => e.target.checked ? [...prev,'otro'] : prev.filter(x=>x!=='otro'))}
                                style={{accentColor:'var(--accent)'}} />
                              Otro
                            </label>
                            {newProjectParties.includes('otro') && (
                              <input type="text" value={newProjectPartiesCustom}
                                onChange={e => setNewProjectPartiesCustom(e.target.value)}
                                placeholder="Especificá las partes..."
                                style={{marginTop:'var(--space-2)',width:'100%',boxSizing:'border-box',padding:'var(--space-2) var(--space-3)',background:'var(--bg-surface-2)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',color:'var(--text-primary)',fontSize:'var(--text-sm)'}} />
                            )}
                          </div>
                        ) : (
                          <label key={p.value} style={{display:'flex',alignItems:'center',gap:'var(--space-2)',cursor:'pointer',fontSize:'var(--text-sm)',color:'var(--text-secondary)'}}>
                            <input type="checkbox" checked={newProjectParties.includes(p.value)}
                              onChange={e => setNewProjectParties(prev => e.target.checked ? [...prev,p.value] : prev.filter(x=>x!==p.value))}
                              style={{accentColor:'var(--accent)'}} />
                            {p.label}
                          </label>
                        )
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{display:'block',fontSize:'var(--text-xs)',fontWeight:'var(--font-semibold)',color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'var(--space-2)'}}>
                      Leyes mencionadas por el cliente <span style={{color:'var(--text-disabled)',fontWeight:'normal'}}>(opcional)</span>
                    </label>
                    <input type="text" value={newProjectCustomLaws}
                      onChange={e => setNewProjectCustomLaws(e.target.value)}
                      placeholder="Ej: Ley 27.737, Art. 2562 CCyC..."
                      style={{width:'100%',boxSizing:'border-box',padding:'var(--space-2) var(--space-3)',background:'var(--bg-surface-2)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',color:'var(--text-primary)',fontSize:'var(--text-sm)',outline:'none'}} />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setCreateStep(1)}>← Atrás</button>
                  <button className="btn-create" onClick={() => setCreateStep(3)}>
                    Siguiente →
                  </button>
                </div>
              </>
            )}

            {createStep === 3 && (
              <>
                <div style={{padding:0}}>
                  <FolderTreeBuilder
                    initialFolders={plannedFolders}
                    onDone={({ folders, files }) => { setPlannedFolders(folders); setPlannedFiles(files || []); }}
                    onCancel={() => setCreateStep(2)}
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setCreateStep(2)}>← Atrás</button>
                  <button className="btn-create" onClick={handleCreateProject} disabled={isLoading}>
                    {isLoading ? 'Creando...' : 'Crear Proyecto'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Progress overlay — crear carpetas */}
      {isCreatingFolders && (
        <div className="fp-progress-overlay">
          <div className="fp-progress-box">
            <div className="fp-progress-title">Creando estructura de carpetas</div>
            <div className="fp-progress-step">
              {folderProgress.step}
            </div>
            <div className="fp-progress-track">
              <div
                className="fp-progress-fill"
                style={{ width: folderProgress.total > 0 ? `${(folderProgress.current / folderProgress.total) * 100}%` : '0%' }}
              />
            </div>
            <div className="fp-progress-count">
              {folderProgress.current} / {folderProgress.total} carpetas
            </div>
          </div>
        </div>
      )}

      {/* Modal editar proyecto */}
      {showEditProject && editingProject && (
        <div className="modal-overlay" onClick={() => setShowEditProject(false)}>
          <div className="modal-content edit-project-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <h3>Editar Proyecto</h3>
              <div className="form-group">
                <label>Nombre del Proyecto:</label>
                <input type="text" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} placeholder="Ej: Mi Proyecto" autoFocus />
              </div>
              <div className="form-group">
                <label>Descripción (opcional):</label>
                <textarea value={editProjectDescription} onChange={(e) => setEditProjectDescription(e.target.value)}
                  placeholder="Ej: Expediente por cobro de alquileres adeudados. Cliente: María García." rows="3" />
              </div>
              {onboardingOptions && (
                <div className="form-group">
                  <label>Área del derecho</label>
                  <select value={editProjectArea} onChange={e => setEditProjectArea(e.target.value)}
                    style={{width:'100%',padding:'var(--space-2) var(--space-3)',background:'var(--bg-surface-2)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',color:'var(--text-primary)',fontSize:'var(--text-sm)'}}>
                    <option value="">Sin definir</option>
                    {onboardingOptions.legal_domains.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {editProjectArea && (
                <div className="form-group">
                  <label>Leyes específicas del caso (opcional)</label>
                  <input type="text" value={editProjectCustomLaws}
                    onChange={e => setEditProjectCustomLaws(e.target.value)}
                    placeholder="Ej: Ley 27.737, Art. 2562 CCyC..."
                    style={{width:'100%',boxSizing:'border-box'}} />
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditProject(false)}>Cancelar</button>
              <button className="btn-create" onClick={handleUpdateProject} disabled={!editProjectName.trim() || isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

    {sessionWarning && (
      <div style={{position:'fixed',bottom:'var(--space-5)',right:'var(--space-5)',maxWidth:340,
        background:'var(--bg-surface-1)',border:'1px solid var(--warning)',
        borderRadius:'var(--radius-xl)',padding:'var(--space-4)',boxShadow:'var(--shadow-xl)',
        zIndex:500,display:'flex',gap:'var(--space-3)',alignItems:'flex-start',
        animation:'toast-in 0.25s ease both'}}>
        <div style={{flex:1}}>
          <p style={{margin:'0 0 4px',fontSize:'var(--text-sm)',fontWeight:'var(--font-semibold)',color:'var(--text-primary)'}}>Tu sesion cierra en 5 minutos</p>
          <p style={{margin:0,fontSize:'var(--text-xs)',color:'var(--text-muted)'}}>Por seguridad, la sesion se cerrara pronto.</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'var(--space-2)',flexShrink:0}}>
          <button onClick={() => setSessionWarning(false)}
            style={{padding:'0 var(--space-3)',height:'var(--btn-height-sm)',background:'var(--accent)',
              color:'#fff',border:'none',borderRadius:'var(--btn-radius)',fontSize:'var(--text-xs)',
              fontWeight:'var(--font-semibold)',cursor:'pointer',whiteSpace:'nowrap'}}>
            Continuar
          </button>
          <button onClick={logout}
            style={{padding:'0 var(--space-3)',height:'var(--btn-height-sm)',background:'transparent',
              color:'var(--text-muted)',border:'1px solid var(--border-default)',
              borderRadius:'var(--btn-radius)',fontSize:'var(--text-xs)',cursor:'pointer'}}>
            Cerrar sesion
          </button>
        </div>
      </div>
    )}

    </div>
  );
}

export default App;
