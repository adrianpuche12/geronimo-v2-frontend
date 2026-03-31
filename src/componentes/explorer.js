import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatDate, formatFileSize } from './utilities';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// SVG Icons
const IconFolder = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open
      ? <path d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      : <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />}
  </svg>
);
const IconFile = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
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
const IconChevron = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Inline name input
const InlineInput = ({ defaultValue, onConfirm, onCancel }) => {
  const [val, setVal] = useState(defaultValue || '');
  return (
    <input
      autoFocus
      className="exp-inline-input"
      value={val}
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

// Delete confirm modal
const DeleteModal = ({ name, onConfirm, onCancel }) => (
  <div className="exp-modal-overlay" onClick={onCancel}>
    <div className="exp-modal" onClick={e => e.stopPropagation()}>
      <h3 className="exp-modal-title">Eliminar carpeta</h3>
      <p className="exp-modal-body">
        Eliminar <strong>"{name}"</strong>?
        <br />
        <span className="exp-modal-note">Los archivos dentro quedan en la raiz del proyecto.</span>
      </p>
      <div className="exp-modal-actions">
        <button className="exp-btn exp-btn--ghost" onClick={onCancel}>Cancelar</button>
        <button className="exp-btn exp-btn--danger" onClick={onConfirm}>Eliminar</button>
      </div>
    </div>
  </div>
);

// Move document modal
function flattenFolders(folders, parentId, depth) {
  if (parentId === undefined) parentId = null;
  if (depth === undefined) depth = 0;
  return folders
    .filter(function(f) { return parentId === null ? !f.parentId : f.parentId === parentId; })
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
            <option key={f.id} value={f.id}>
              {'\u00A0\u00A0'.repeat(f.depth)}{f.name}
            </option>
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

// Folder node (recursive)
const FolderNode = ({ folder, allFolders, level, activeId, onSelect, onCreateChild, onRename, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const children = allFolders.filter(f => f.parentId === folder.id);
  const isActive = activeId === folder.id;

  return (
    <div className="exp-folder-node">
      <div
        className={'exp-folder-row' + (isActive ? ' exp-folder-row--active' : '')}
        style={{ paddingLeft: (level * 16 + 8) + 'px' }}
        onClick={() => { onSelect(folder.id); setOpen(true); }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <span className="exp-chevron" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
          {children.length > 0 ? <IconChevron open={open} /> : <span style={{ width: 12, display: 'inline-block' }} />}
        </span>
        <span className="exp-folder-icon"><IconFolder open={open && children.length > 0} /></span>

        {renaming ? (
          <InlineInput
            defaultValue={folder.name}
            onConfirm={name => { if (name) onRename(folder.id, name); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <span className="exp-folder-name">{folder.name}</span>
        )}

        {hovering && !renaming && (
          <span className="exp-folder-actions">
            <button className="exp-icon-btn" title="Nueva subcarpeta"
              onClick={e => { e.stopPropagation(); setAddingChild(true); setOpen(true); }}>
              <IconPlus />
            </button>
            <button className="exp-icon-btn" title="Renombrar"
              onClick={e => { e.stopPropagation(); setRenaming(true); }}>
              <IconEdit />
            </button>
            <button className="exp-icon-btn exp-icon-btn--danger" title="Eliminar"
              onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}>
              <IconTrash />
            </button>
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
                onCancel={() => setAddingChild(false)}
              />
            </div>
          )}
          {children.map(child => (
            <FolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              level={level + 1}
              activeId={activeId}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {confirmDelete && (
        <DeleteModal
          name={folder.name}
          onConfirm={() => { onDelete(folder.id); setConfirmDelete(false); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

// Main Explorer
export const Explorer = ({
  projects,
  expandedProjects,
  toggleProjectExpand,
  handleViewDocument,
  handleDeleteDocument,
  isLoading,
  activeFolderId,
  onFolderSelect,
}) => {
  const [folders, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);
  const [addingRoot, setAddingRoot] = useState(false);
  const [moveDoc, setMoveDoc] = useState(null);
  const [loadingFolders, setLoadingFolders] = useState(false);

  const activeProject = projects.find(p => expandedProjects[p.id]) || projects[0];
  const projectId = activeProject ? activeProject.id : null;

  const loadFolders = useCallback(async () => {
    if (!projectId) return;
    setLoadingFolders(true);
    try {
      const res = await axios.get(API_URL + '/folders?projectId=' + projectId);
      setFolders(res.data);
    } catch (e) {
      console.error('Error loading folders:', e);
    } finally {
      setLoadingFolders(false);
    }
  }, [projectId]);

  const loadDocs = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(API_URL + '/docs/project/' + projectId);
      setDocs(res.data);
    } catch (e) {
      console.error('Error loading docs:', e);
    }
  }, [projectId]);

  useEffect(() => {
    loadFolders();
    loadDocs();
  }, [loadFolders, loadDocs]);

  const createFolder = async (parentId, name) => {
    if (!name) return;
    try {
      await axios.post(API_URL + '/folders', { projectId, parentId: parentId || null, name });
      await loadFolders();
    } catch (e) { console.error('Error creating folder:', e); }
  };

  const renameFolder = async (folderId, name) => {
    try {
      await axios.patch(API_URL + '/folders/' + folderId, { name });
      await loadFolders();
    } catch (e) { console.error('Error renaming folder:', e); }
  };

  const deleteFolder = async (folderId) => {
    try {
      await axios.delete(API_URL + '/folders/' + folderId);
      if (activeFolderId === folderId) onFolderSelect(null);
      await loadFolders();
      await loadDocs();
    } catch (e) { console.error('Error deleting folder:', e); }
  };

  const moveDocument = async (docId, targetFolderId) => {
    try {
      await axios.post(API_URL + '/folders/move-document', {
        documentId: docId, targetFolderId: targetFolderId || null, projectId,
      });
      setMoveDoc(null);
      await loadDocs();
    } catch (e) { console.error('Error moving document:', e); }
  };

  const activeFolderObj = folders.find(f => f.id === activeFolderId);
  const rootFolders = folders.filter(f => !f.parentId);
  const docsForFolder = (folderId) => docs.filter(d => folderId ? d.folderId === folderId : !d.folderId);
  const displayDocs = docsForFolder(activeFolderId || null);

  return (
    <section className="exp-root">
      <div className="exp-header">
        <div>
          <h2 className="exp-title">Explorador de Documentos</h2>
          <p className="exp-subtitle">
            {activeFolderId
              ? <span className="exp-active-badge">Filtrando: <strong>{activeFolderObj ? activeFolderObj.path || activeFolderObj.name : ''}</strong></span>
              : 'Todos los documentos del proyecto'}
          </p>
        </div>
        {activeFolderId && (
          <button className="exp-btn exp-btn--ghost exp-btn--sm" onClick={() => onFolderSelect(null)}>
            Ver todo
          </button>
        )}
      </div>

      <div className="exp-body">
        <div className="exp-panel-left">
          <div className="exp-panel-title">
            <span>Carpetas</span>
            <button className="exp-icon-btn" title="Nueva carpeta" onClick={() => setAddingRoot(true)}>
              <IconPlus />
            </button>
          </div>
          {loadingFolders ? (
            <div className="exp-empty">Cargando...</div>
          ) : (
            <div className="exp-tree">
              <div
                className={'exp-folder-row' + (!activeFolderId ? ' exp-folder-row--active' : '')}
                style={{ paddingLeft: 8 }}
                onClick={() => onFolderSelect(null)}
              >
                <span style={{ width: 12, display: 'inline-block' }} />
                <span className="exp-folder-icon"><IconFolder open={!activeFolderId} /></span>
                <span className="exp-folder-name">/ Raiz</span>
                <span className="exp-badge">{docsForFolder(null).length}</span>
              </div>

              {addingRoot && (
                <div className="exp-new-folder-row" style={{ paddingLeft: 8 }}>
                  <span className="exp-folder-icon"><IconFolder /></span>
                  <InlineInput
                    onConfirm={name => { if (name) createFolder(null, name); setAddingRoot(false); }}
                    onCancel={() => setAddingRoot(false)}
                  />
                </div>
              )}

              {rootFolders.map(folder => (
                <FolderNode
                  key={folder.id}
                  folder={folder}
                  allFolders={folders}
                  level={0}
                  activeId={activeFolderId}
                  onSelect={onFolderSelect}
                  onCreateChild={createFolder}
                  onRename={renameFolder}
                  onDelete={deleteFolder}
                />
              ))}

              {folders.length === 0 && !addingRoot && (
                <div className="exp-empty">Sin carpetas. Click en + para crear.</div>
              )}
            </div>
          )}
        </div>

        <div className="exp-panel-right">
          <div className="exp-panel-title">
            <span>
              {activeFolderId
                ? 'Documentos en "' + (activeFolderObj ? activeFolderObj.name : '') + '"'
                : 'Todos los documentos (' + docs.length + ')'}
            </span>
          </div>
          <div className="exp-doc-list">
            {displayDocs.length === 0 ? (
              <div className="exp-empty">
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📄</div>
                <div>Sin documentos{activeFolderId ? ' en esta carpeta' : ''}</div>
              </div>
            ) : (
              displayDocs.map(doc => (
                <div key={doc.id} className="exp-doc-row">
                  <span className="exp-doc-icon"><IconFile /></span>
                  <div className="exp-doc-info">
                    <div className="exp-doc-path">{doc.path}</div>
                    <div className="exp-doc-meta">{formatDate(doc.createdAt)} · {formatFileSize(doc.content)}</div>
                  </div>
                  <div className="exp-doc-actions">
                    <button className="exp-icon-btn" title="Mover" onClick={() => setMoveDoc(doc)}>↗</button>
                    <button className="exp-icon-btn" title="Ver" onClick={() => handleViewDocument(doc)}>👁️</button>
                    <button className="exp-icon-btn exp-icon-btn--danger" title="Eliminar"
                      onClick={() => handleDeleteDocument(doc.id, doc.path)} disabled={isLoading}>
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {moveDoc && (
        <MoveModal
          doc={moveDoc}
          folders={folders}
          currentFolderId={moveDoc.folderId}
          onMove={targetFolderId => moveDocument(moveDoc.id, targetFolderId)}
          onCancel={() => setMoveDoc(null)}
        />
      )}
    </section>
  );
};

export default Explorer;
