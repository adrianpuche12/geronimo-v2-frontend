import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatDate, formatFileSize } from './utilities';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const IconFolder = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open
      ? <path d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      : <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />}
  </svg>
);
const getFileIcon = (path = '') => {
  const ext = (path.split('.').pop() || '').toLowerCase();
  const types = {
    pdf:  { color: '#F87171', label: 'PDF' },
    docx: { color: '#60A5FA', label: 'DOC' },
    doc:  { color: '#60A5FA', label: 'DOC' },
    txt:  { color: '#9CA3AF', label: 'TXT' },
    md:   { color: '#9CA3AF', label: 'MD'  },
    json: { color: '#FBBF24', label: 'JSON'},
    js:   { color: '#FBBF24', label: 'JS'  },
    ts:   { color: '#60A5FA', label: 'TS'  },
    py:   { color: '#34D399', label: 'PY'  },
    csv:  { color: '#34D399', label: 'CSV' },
    zip:  { color: '#A78BFA', label: 'ZIP' },
  };
  return types[ext] || { color: '#9CA3AF', label: ext.toUpperCase() || 'FILE' };
};

const FileIcon = ({ path }) => {
  const { color, label } = getFileIcon(path);
  return (
    <span className="exp-file-icon-wrap" style={{ color }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span className="exp-file-ext">{label}</span>
    </span>
  );
};
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
const IconUpload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);
const IconChevron = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const InlineInput = ({ defaultValue, onConfirm, onCancel }) => {
  const [val, setVal] = useState(defaultValue || '');
  return (
    <input autoFocus className="exp-inline-input" value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') onConfirm(val.trim());
        if (e.key === 'Escape') onCancel();
      }}
      onBlur={() => onCancel()}
      onClick={e => e.stopPropagation()}
    />
  );
};

const DeleteModal = ({ name, onConfirm, onCancel }) => (
  <div className="exp-modal-overlay" onClick={onCancel}>
    <div className="exp-modal" onClick={e => e.stopPropagation()}>
      <h3 className="exp-modal-title">Eliminar carpeta</h3>
      <p className="exp-modal-body">
        Eliminar <strong>"{name}"</strong>?<br />
        <span className="exp-modal-note">Los archivos dentro quedan en la raiz del proyecto.</span>
      </p>
      <div className="exp-modal-actions">
        <button className="exp-btn exp-btn--ghost" onClick={onCancel}>Cancelar</button>
        <button className="exp-btn exp-btn--danger" onClick={onConfirm}>Eliminar</button>
      </div>
    </div>
  </div>
);

function flattenTree(tree) {
  return tree.reduce(function(acc, node) {
    var children = node.children || [];
    var folder = Object.assign({}, node);
    delete folder.children;
    return acc.concat([folder], flattenTree(children));
  }, []);
}

function flattenFolders(folders, parentId, depth) {
  if (parentId === undefined) parentId = null;
  if (depth === undefined) depth = 0;
  return folders
    .filter(function(f) { return parentId === null ? !f.parent_id : f.parent_id === parentId; })
    .reduce(function(acc, f) {
      return acc.concat([Object.assign({}, f, { depth: depth })], flattenFolders(folders, f.id, depth + 1));
    }, []);
}

const MoveModal = ({ doc, folders, currentFolderId, onMove, onCancel }) => {
  const [selected, setSelected] = useState(currentFolderId || '');
  const flat = flattenFolders(folders);
  return (
    <div className="exp-modal-overlay" onClick={onCancel}>
      <div className="exp-modal" onClick={e => e.stopPropagation()}>
        <h3 className="exp-modal-title">Mover documento</h3>
        <p className="exp-modal-body">Destino para <strong>"{doc.path}"</strong></p>
        <select className="exp-modal-select" value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Raiz del proyecto</option>
          {flat.map(f => (
            <option key={f.id} value={f.id}>{'\u00A0\u00A0'.repeat(f.depth)}{f.name}</option>
          ))}
        </select>
        <div className="exp-modal-actions">
          <button className="exp-btn exp-btn--ghost" onClick={onCancel}>Cancelar</button>
          <button className="exp-btn exp-btn--primary" onClick={() => onMove(selected || null)}>Mover</button>
        </div>
      </div>
    </div>
  );
};

const FolderNode = ({ folder, allFolders, level, activeId, onSelect, onCreateChild, onRename, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const children = allFolders.filter(f => f.parent_id === folder.id);
  const isActive = activeId === folder.id;
  return (
    <div className="exp-folder-node">
      <div
        className={'exp-folder-row' + (isActive ? ' exp-folder-row--active' : '')}
        style={{ paddingLeft: (level * 16 + 8) + 'px' }}
        onClick={() => { onSelect(folder.id, folder.name); setOpen(true); }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <span className="exp-chevron" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
          {children.length > 0 ? <IconChevron open={open} /> : <span style={{ width: 12, display: 'inline-block' }} />}
        </span>
        <span className="exp-folder-icon"><IconFolder open={open && children.length > 0} /></span>
        {renaming ? (
          <InlineInput defaultValue={folder.name}
            onConfirm={name => { if (name) onRename(folder.id, name); setRenaming(false); }}
            onCancel={() => setRenaming(false)} />
        ) : (
          <span className="exp-folder-name">{folder.name}</span>
        )}
        {hovering && !renaming && (
          <span className="exp-folder-actions">
            <button className="exp-icon-btn" title="Nueva subcarpeta"
              onClick={e => { e.stopPropagation(); setAddingChild(true); setOpen(true); }}><IconPlus /></button>
            <button className="exp-icon-btn" title="Renombrar"
              onClick={e => { e.stopPropagation(); setRenaming(true); }}><IconEdit /></button>
            <button className="exp-icon-btn exp-icon-btn--danger" title="Eliminar"
              onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}><IconTrash /></button>
          </span>
        )}
      </div>
      {(open || addingChild) && (
        <div className="exp-folder-children">
          {addingChild && (
            <div className="exp-new-folder-row" style={{ paddingLeft: ((level + 1) * 16 + 8) + 'px' }}>
              <span className="exp-folder-icon"><IconFolder /></span>
              <InlineInput
                onConfirm={name => { if (name) onCreateChild(folder.id, name); setAddingChild(false); }}
                onCancel={() => setAddingChild(false)} />
            </div>
          )}
          {children.map(child => (
            <FolderNode key={child.id} folder={child} allFolders={allFolders} level={level + 1}
              activeId={activeId} onSelect={onSelect} onCreateChild={onCreateChild}
              onRename={onRename} onDelete={onDelete} />
          ))}
        </div>
      )}
      {confirmDelete && (
        <DeleteModal name={folder.name}
          onConfirm={() => { onDelete(folder.id); setConfirmDelete(false); }}
          onCancel={() => setConfirmDelete(false)} />
      )}
    </div>
  );
};

// ── Main Explorer ─────────────────────────────────────────────────────────────
export const Explorer = ({
  projects,
  selectedProject,
  onProjectSelect,
  handleViewDocument,
  handleDeleteDocument,
  isLoading,
  activeFolderId,
  onFolderSelect,
  docRefreshKey,
  onUpload,
  onZipUpload,
  onEditProject,
  onDeleteProject,
  onCreateProject,
  can,
}) => {
  const [view, setView] = useState('projects');
  const [hoveredProject, setHoveredProject] = useState(null);
  const [folders, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);
  const [addingRoot, setAddingRoot] = useState(false);
  const [moveDoc, setMoveDoc] = useState(null);
  const [loadingFolders, setLoadingFolders] = useState(false);

  const activeProject = projects.find(p => p.id === selectedProject) || null;
  const projectId = activeProject ? activeProject.id : null;

  const loadFolders = useCallback(async () => {
    if (!projectId) return;
    setLoadingFolders(true);
    try {
      const res = await axios.get(API_URL + '/folders?projectId=' + projectId);
      setFolders(flattenTree(res.data));
    } catch (e) { console.error('Error loading folders:', e); }
    finally { setLoadingFolders(false); }
  }, [projectId]);

  const loadDocs = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(API_URL + '/docs/project/' + projectId);
      setDocs(res.data);
    } catch (e) { console.error('Error loading docs:', e); }
  }, [projectId]);

  useEffect(() => {
    if (view === 'folders' && projectId) { loadFolders(); loadDocs(); }
  }, [view, loadFolders, loadDocs, projectId, docRefreshKey]);

  const createFolder = async (parentId, name) => {
    if (!name) return;
    try { await axios.post(API_URL + '/folders', { project_id: projectId, parent_id: parentId || null, name }); await loadFolders(); }
    catch (e) { console.error('Error creating folder:', e); }
  };
  const renameFolder = async (folderId, name) => {
    try { await axios.patch(API_URL + '/folders/' + folderId, { name }); await loadFolders(); }
    catch (e) { console.error('Error renaming folder:', e); }
  };
  const deleteFolder = async (folderId) => {
    try {
      await axios.delete(API_URL + '/folders/' + folderId);
      if (activeFolderId === folderId) onFolderSelect(null);
      await loadFolders(); await loadDocs();
    } catch (e) { console.error('Error deleting folder:', e); }
  };
  const moveDocument = async (docId, targetFolderId) => {
    try {
      await axios.post(API_URL + '/folders/move-document', { document_id: docId, folder_id: targetFolderId || null });
      setMoveDoc(null); await loadDocs();
    } catch (e) { console.error('Error moving document:', e); }
  };

  const activeFolderObj = folders.find(f => f.id === activeFolderId);
  const rootFolders = folders.filter(f => !f.parent_id);
  const docsForFolder = (folderId) => docs.filter(d => folderId ? d.folder_id === folderId : !d.folder_id);
  const displayDocs = docsForFolder(activeFolderId || null);

  // ── Vista: lista de proyectos ───────────────────────────────────────────
  if (view === "projects") {
    return (
      <section className="exp-root">
        <div className="exp-header">
          <div>
            <h2 className="exp-title">Proyectos</h2>
            <p className="exp-subtitle">Seleccióná un proyecto para navegar sus documentos</p>
          </div>
          {can && can("MANAGE_PROJECTS") && onCreateProject && (
            <button className="exp-btn exp-btn--primary exp-btn--sm" onClick={onCreateProject}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight:4}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo proyecto
            </button>
          )}
        </div>
        <div className="exp-project-list">
          {projects.length === 0 ? (
            <div className="exp-empty">Sin proyectos aún.</div>
          ) : projects.map(project => (
            <div key={project.id}
              className={"exp-project-item" + (project.id === selectedProject ? " exp-project-item--active" : "")}
              onClick={() => { onProjectSelect(project.id); setView("folders"); }}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <span className="exp-project-item-icon"><IconFolder open={project.id === selectedProject} /></span>
              <div className="exp-project-item-info">
                <div className="exp-project-item-name">{project.name}</div>
                {project.description?.trim() && <div className="exp-project-item-desc">{project.description}</div>}
              </div>
              {can && can("MANAGE_PROJECTS") && hoveredProject === project.id ? (
                <span className="exp-project-item-actions" onClick={e => e.stopPropagation()}>
                  <button className="exp-icon-btn" title="Editar proyecto"
                    onClick={() => onEditProject && onEditProject(project)}>
                    <IconEdit />
                  </button>
                  <button className="exp-icon-btn exp-icon-btn--danger" title="Eliminar proyecto"
                    onClick={() => onDeleteProject && onDeleteProject(project)}>
                    <IconTrash />
                  </button>
                </span>
              ) : (
                <span className="exp-project-item-arrow">›</span>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

      // ── Vista: arbol de carpetas ──────────────────────────────────────────────
  return (
    <section className="exp-root">
      <div className="exp-header" style={{flexDirection:'column',alignItems:'flex-start',gap:'var(--space-2)',padding:'var(--space-3) var(--space-6)'}}>
        <nav className="exp-breadcrumb">
          <button className="exp-bc-btn" onClick={() => { setView('projects'); onFolderSelect(null); }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Proyectos
          </button>
          <span className="exp-bc-sep">/</span>
          <button className="exp-bc-btn" onClick={() => onFolderSelect(null)}>
            {activeProject ? activeProject.name : 'Proyecto'}
          </button>
          {activeFolderObj && (() => {
            const path = [];
            let cur = activeFolderObj;
            while (cur) { path.unshift(cur); cur = folders.find(f => f.id === cur.parent_id); }
            return path.map((folder, i) => (
              <React.Fragment key={folder.id}>
                <span className="exp-bc-sep">/</span>
                {i < path.length - 1
                  ? <button className="exp-bc-btn" onClick={() => onFolderSelect(folder.id, folder.name)}>{folder.name}</button>
                  : <span className="exp-bc-current">{folder.name}</span>
                }
              </React.Fragment>
            ));
          })()}
        </nav>
      </div>

      <div className="exp-body">
        <div className="exp-panel-left">
          <div className="exp-panel-title">
            <span>Carpetas</span>
            <button className="exp-icon-btn" title="Nueva carpeta" onClick={() => setAddingRoot(true)}><IconPlus /></button>
          </div>
          {loadingFolders ? <div className="exp-empty">Cargando...</div> : (
            <div className="exp-tree">
              <div className={'exp-folder-row' + (!activeFolderId ? ' exp-folder-row--active' : '')}
                style={{ paddingLeft: 8 }} onClick={() => onFolderSelect(null)}>
                <span style={{ width: 12, display: 'inline-block' }} />
                <span className="exp-folder-icon"><IconFolder open={!activeFolderId} /></span>
                <span className="exp-folder-name">/ {activeProject ? activeProject.name : "Raiz"}</span>
                <span className="exp-badge">{docsForFolder(null).length}</span>
              </div>
              {addingRoot && (
                <div className="exp-new-folder-row" style={{ paddingLeft: 8 }}>
                  <span className="exp-folder-icon"><IconFolder /></span>
                  <InlineInput
                    onConfirm={name => { if (name) createFolder(null, name); setAddingRoot(false); }}
                    onCancel={() => setAddingRoot(false)} />
                </div>
              )}
              {rootFolders.map(folder => (
                <FolderNode key={folder.id} folder={folder} allFolders={folders} level={0}
                  activeId={activeFolderId} onSelect={onFolderSelect} onCreateChild={createFolder}
                  onRename={renameFolder} onDelete={deleteFolder} />
              ))}
              {folders.length === 0 && !addingRoot && (
                <div className="exp-empty">Sin carpetas. Click en + para crear.</div>
              )}
            </div>
          )}
        </div>

        <div className="exp-panel-right">
          <div className="exp-panel-title">
            <span>{activeFolderId
              ? 'Documentos en "' + (activeFolderObj ? activeFolderObj.name : '') + '"'
              : 'Todos los documentos (' + docs.length + ')'}</span>
            <div style={{display:"flex",gap:6}}>
              {onUpload && (
                <button className="exp-btn exp-btn--primary exp-btn--sm" onClick={onUpload}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight:4}}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>Subir archivo
                </button>
              )}
              {onZipUpload && (
                <button className="exp-btn exp-btn--secondary exp-btn--sm" onClick={onZipUpload} title="Importar todos los archivos de un ZIP">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Subir ZIP
                </button>
              )}
            </div>
          </div>
          <div className="exp-doc-list">
            {displayDocs.length === 0 ? (
              <div className="exp-empty">
                <div style={{ marginBottom: 8, color: 'var(--text-disabled)', opacity: 0.5 }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                <div>Sin documentos{activeFolderId ? ' en esta carpeta' : ''}</div>
              </div>
            ) : displayDocs.map(doc => (
              <div
                key={doc.id}
                className="exp-doc-row"
                onClick={() => handleViewDocument(doc)}
                style={{ cursor: 'pointer' }}
              >
                <FileIcon path={doc.path} />
                <div className="exp-doc-info">
                  <div className="exp-doc-path">{doc.path}</div>
                  <div className="exp-doc-meta">{formatDate(doc.created_at || doc.createdAt)} · {formatFileSize(doc.content)}</div>
                </div>
                <div className="exp-doc-actions" onClick={e => e.stopPropagation()}>
                  <button className="exp-icon-btn" title="Mover a carpeta" onClick={() => setMoveDoc(doc)}>↗</button>
                  <button className="exp-icon-btn exp-icon-btn--danger" title="Eliminar"
                    onClick={() => handleDeleteDocument(doc.id, doc.path)} disabled={isLoading}><IconTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {moveDoc && (
        <MoveModal doc={moveDoc} folders={folders} currentFolderId={moveDoc.folder_id}
          onMove={targetFolderId => moveDocument(moveDoc.id, targetFolderId)}
          onCancel={() => setMoveDoc(null)} />
      )}
    </section>
  );
};

export default Explorer;
