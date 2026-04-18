import React, { useState, useRef, useCallback } from 'react';

/* ─── Iconos inline (sin dependencias externas) ─────────────────────── */
const IconFolder    = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2H6l1.5 2H13.5A1.5 1.5 0 0 1 15 5.5v7A1.5 1.5 0 0 1 13.5 14h-11A1.5 1.5 0 0 1 1 12.5v-9Z" fill="currentColor" opacity=".9"/></svg>;
const IconPlus      = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconTrash     = () => <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2h4M2 4h12M5 4l.5 9h5l.5-9"/></svg>;
const IconEdit      = () => <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M11 2l3 3-8 8H3v-3l8-8Z"/></svg>;
const IconGrip      = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="4" r="1.2"/><circle cx="5" cy="8" r="1.2"/><circle cx="5" cy="12" r="1.2"/><circle cx="11" cy="4" r="1.2"/><circle cx="11" cy="8" r="1.2"/><circle cx="11" cy="12" r="1.2"/></svg>;
const IconUpload    = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconFolderBig = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity=".7"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>;

/* ─── Utilidades ─────────────────────────────────────────────────────── */
let _uid = 1;
const uid = () => 'f' + (_uid++);

function buildTreeFromFiles(files) {
  // Reconstruct folder tree from webkitRelativePath
  const nodeMap = {}; // path → {id, name, parentId, children, fileCount}
  const roots = [];

  Array.from(files).forEach(file => {
    const parts = file.webkitRelativePath.split('/');
    // parts[0] = root folder, parts[last] = filename
    // We only care about folders (skip last segment which is file)
    for (let i = 0; i < parts.length - 1; i++) {
      const path = parts.slice(0, i + 1).join('/');
      if (!nodeMap[path]) {
        const parentPath = i === 0 ? null : parts.slice(0, i).join('/');
        const node = { id: uid(), name: parts[i], parentPath, children: [], fileCount: 0 };
        nodeMap[path] = node;
        if (parentPath) {
          nodeMap[parentPath]?.children.push(node);
        } else {
          roots.push(node);
        }
      }
    }
    // Count file in its immediate folder
    const folderPath = parts.slice(0, parts.length - 1).join('/');
    if (nodeMap[folderPath]) nodeMap[folderPath].fileCount++;
  });

  // Count total children recursively
  function countAll(node) {
    let total = node.fileCount;
    node.children.forEach(c => { total += countAll(c); });
    node.totalCount = total;
    return total;
  }
  roots.forEach(countAll);

  // Flatten to [{id, name, parentId}] list preserving order
  const flat = [];
  function flatten(node, parentId) {
    flat.push({ id: node.id, name: node.name, parentId: parentId || null });
    node.children.forEach(c => flatten(c, node.id));
  }
  roots.forEach(r => flatten(r, null));

  // Map each File to its folder temp ID
  const fileList = Array.from(files).map(file => {
    const parts = file.webkitRelativePath.split('/');
    const folderPath = parts.slice(0, parts.length - 1).join('/');
    return { file, folderTempId: nodeMap[folderPath]?.id || null };
  });

  return { flat, roots, totalFolders: flat.length, totalFiles: files.length, fileList };
}

function flatToRoots(nodes) {
  const map = {};
  nodes.forEach(n => { map[n.id] = { ...n, children: [] }; });
  const roots = [];
  nodes.forEach(n => {
    if (n.parentId && map[n.parentId]) {
      map[n.parentId].children.push(map[n.id]);
    } else {
      roots.push(map[n.id]);
    }
  });
  return roots;
}

/* ─── FolderTreeBuilder ──────────────────────────────────────────────── */
export default function FolderTreeBuilder({ onDone, onCancel }) {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'import'

  /* ── Estado tab manual ── */
  const [nodes, setNodes]           = useState([]);
  const [editingId, setEditingId]   = useState(null);
  const [editVal, setEditVal]       = useState('');
  const [dragId, setDragId]         = useState(null);
  const [dropId, setDropId]         = useState(null);   // target folder id
  const [dropRoot, setDropRoot]     = useState(false);  // drop at root level

  /* ── Estado tab import ── */
  const [importResult, setImportResult] = useState(null); // {flat, roots, totalFolders, totalFiles}
  const [dzActive, setDzActive]         = useState(false);
  const fileInputRef = useRef(null);

  /* ──────────── Handlers tab manual ──────────── */
  function addRootFolder() {
    const id = uid();
    setNodes(prev => [...prev, { id, name: 'Nueva carpeta', parentId: null }]);
    setEditingId(id);
    setEditVal('Nueva carpeta');
  }

  function addSubfolder(parentId) {
    const id = uid();
    setNodes(prev => [...prev, { id, name: 'Nueva carpeta', parentId }]);
    setEditingId(id);
    setEditVal('Nueva carpeta');
  }

  function startEdit(id, name) {
    setEditingId(id);
    setEditVal(name);
  }

  function commitEdit(id) {
    if (editVal.trim()) {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, name: editVal.trim() } : n));
    }
    setEditingId(null);
    setEditVal('');
  }

  function deleteNode(id) {
    // Delete node and all descendants
    const getDescendants = (nid, list) => {
      const children = list.filter(n => n.parentId === nid);
      return [nid, ...children.flatMap(c => getDescendants(c.id, list))];
    };
    setNodes(prev => {
      const toRemove = new Set(getDescendants(id, prev));
      return prev.filter(n => !toRemove.has(n.id));
    });
  }

  /* Drag & drop para reordenar/anidar */
  function onDragStart(e, id) {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e, targetId) {
    e.preventDefault();
    if (targetId === dragId) return;
    // Prevent dropping onto own descendants
    const isDescendant = (parentId, checkId, list) => {
      if (!parentId) return false;
      if (parentId === checkId) return true;
      const parent = list.find(n => n.id === parentId);
      return parent ? isDescendant(parent.parentId, checkId, list) : false;
    };
    setNodes(prev => {
      if (isDescendant(targetId, dragId, prev)) return prev;
      return prev;
    });
    setDropId(targetId);
    setDropRoot(false);
  }

  function onDragOverRoot(e) {
    e.preventDefault();
    setDropId(null);
    setDropRoot(true);
  }

  function onDrop(e, targetId) {
    e.preventDefault();
    if (!dragId) return;
    if (targetId === dragId) { resetDrag(); return; }
    setNodes(prev => {
      const isDescendant = (pid, cid, list) => {
        if (!pid) return false;
        if (pid === cid) return true;
        const p = list.find(n => n.id === pid);
        return p ? isDescendant(p.parentId, cid, list) : false;
      };
      if (isDescendant(targetId, dragId, prev)) return prev;
      return prev.map(n => n.id === dragId ? { ...n, parentId: targetId } : n);
    });
    resetDrag();
  }

  function onDropRoot(e) {
    e.preventDefault();
    if (!dragId) return;
    setNodes(prev => prev.map(n => n.id === dragId ? { ...n, parentId: null } : n));
    resetDrag();
  }

  function resetDrag() {
    setDragId(null);
    setDropId(null);
    setDropRoot(false);
  }

  /* ──────────── Handlers tab import ──────────── */
  function handleFiles(files) {
    if (!files || files.length === 0) return;
    const result = buildTreeFromFiles(files);
    setImportResult(result);
  }

  function onDropZone(e) {
    e.preventDefault();
    setDzActive(false);
    const items = e.dataTransfer.items;
    // Try to get files from DataTransferItemList (directory support)
    if (items) {
      const allFiles = Array.from(e.dataTransfer.files);
      if (allFiles.length > 0) {
        handleFiles(allFiles);
      }
    }
  }

  function onFileInput(e) {
    handleFiles(e.target.files);
  }

  /* ──────────── Submit ──────────── */
  function handleDone() {
    if (activeTab === 'manual') {
      if (nodes.length === 0) { onCancel(); return; }
      onDone({ folders: nodes, files: [] });
    } else {
      if (!importResult) { onCancel(); return; }
      onDone({ folders: importResult.flat, files: importResult.fileList || [] });
    }
  }

  /* ──────────── Render árbol manual ──────────── */
  const manualRoots = flatToRoots(nodes);

  function renderNode(node, depth = 0) {
    const isEditing = editingId === node.id;
    const isDragging = dragId === node.id;
    const isDropTarget = dropId === node.id;

    return (
      <div key={node.id} style={{ paddingLeft: depth * 16 + 'px' }}>
        <div
          className={`fb-item${isDragging ? ' dragging' : ''}${isDropTarget ? ' drop-over' : ''}`}
          draggable
          onDragStart={e => onDragStart(e, node.id)}
          onDragOver={e => onDragOver(e, node.id)}
          onDrop={e => onDrop(e, node.id)}
          onDragEnd={resetDrag}
        >
          <span className="fb-drag-handle" title="Arrastrar"><IconGrip /></span>
          <span className="fb-item-icon"><IconFolder /></span>
          {isEditing ? (
            <input
              className="fb-item-name editing"
              value={editVal}
              autoFocus
              onChange={e => setEditVal(e.target.value)}
              onBlur={() => commitEdit(node.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit(node.id);
                if (e.key === 'Escape') { setEditingId(null); setEditVal(''); }
              }}
            />
          ) : (
            <span
              className="fb-item-name"
              onDoubleClick={() => startEdit(node.id, node.name)}
            >
              {node.name}
            </span>
          )}
          <div className="fb-item-actions">
            <button
              className="fb-item-btn"
              title="Agregar subcarpeta"
              onClick={() => addSubfolder(node.id)}
            ><IconPlus /></button>
            <button
              className="fb-item-btn"
              title="Renombrar"
              onClick={() => startEdit(node.id, node.name)}
            ><IconEdit /></button>
            <button
              className="fb-item-btn delete"
              title="Eliminar"
              onClick={() => deleteNode(node.id)}
            ><IconTrash /></button>
          </div>
        </div>
        {node.children && node.children.map(c => renderNode(c, depth + 1))}
      </div>
    );
  }

  /* ──────────── Render árbol preview (import) ──────────── */
  function renderPreviewNode(node, depth = 0) {
    return (
      <div key={node.id}>
        <div className="fb-preview-item" style={{ paddingLeft: 8 + depth * 16 + 'px' }}>
          <span className="fb-pi-icon"><IconFolder /></span>
          <span className="fb-pi-name">{node.name}</span>
          {node.totalCount > 0 && (
            <span className="fb-pi-count">{node.totalCount}</span>
          )}
        </div>
        {node.children && node.children.map(c => renderPreviewNode(c, depth + 1))}
      </div>
    );
  }

  /* ──────────── Contadores para footer ──────────── */
  const manualCount = nodes.length;
  const importCount = importResult ? importResult.totalFolders : 0;
  const currentCount = activeTab === 'manual' ? manualCount : importCount;
  const canDone = (activeTab === 'manual' && manualCount > 0) || (activeTab === 'import' && importResult);

  return (
    <div className="folder-builder-modal">

      {/* Tabs */}
      <div className="fb-tabs">
        <button
          className={`fb-tab${activeTab === 'manual' ? ' active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          <IconFolderBig /> Construir manualmente
        </button>
        <button
          className={`fb-tab${activeTab === 'import' ? ' active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          <IconUpload /> Importar desde mi PC
        </button>
      </div>

      {/* ── Tab: Manual ── */}
      {activeTab === 'manual' && (
        <div className="fb-tab-content">
          <div
            className={`fb-tree${dropRoot ? ' drag-over-root' : ''}`}
            onDragOver={onDragOverRoot}
            onDrop={onDropRoot}
          >
            {nodes.length === 0 ? (
              <div className="fb-tree-empty">
                <IconFolderBig />
                <span>Aún no hay carpetas.<br/>Haz clic en "Agregar carpeta" para comenzar.</span>
              </div>
            ) : (
              manualRoots.map(r => renderNode(r, 0))
            )}
          </div>
          <button className="fb-add-root" onClick={addRootFolder}>
            <IconPlus /> Agregar carpeta raíz
          </button>
          {nodes.length > 0 && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Tip: arrastra carpetas para anidarlas. Doble clic para renombrar.
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Import desde PC ── */}
      {activeTab === 'import' && (
        <div className="fb-tab-content">
          {!importResult ? (
            <>
              <div
                className={`fb-dropzone${dzActive ? ' drag-active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDzActive(true); }}
                onDragLeave={() => setDzActive(false)}
                onDrop={onDropZone}
              >
                <div className={`fb-dz-icon`}>📁</div>
                <div className="fb-dz-title">Arrastra tu carpeta aquí</div>
                <div className="fb-dz-sub">
                  o <span>haz clic para seleccionar</span>
                </div>
                <div className="fb-dz-formats">
                  Se importará la estructura de carpetas. Los archivos no se subirán en este paso.
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                // eslint-disable-next-line react/no-unknown-property
                webkitdirectory=""
                directory=""
                multiple
                style={{ display: 'none' }}
                onChange={onFileInput}
              />
            </>
          ) : (
            <div className="fb-preview">
              <div className="fb-preview-header">
                <span className="fb-preview-title">Estructura detectada</span>
                <div className="fb-preview-stats">
                  <span className="fb-preview-stat">
                    <IconFolder /> {importResult.totalFolders} carpetas
                  </span>
                  <span className="fb-preview-stat">
                    📄 {importResult.totalFiles} archivos
                  </span>
                </div>
                <button className="fb-change-btn" onClick={() => { setImportResult(null); fileInputRef.current && (fileInputRef.current.value = ''); }}>
                  Cambiar
                </button>
              </div>
              <div className="fb-preview-tree">
                {importResult.roots.map(r => renderPreviewNode(r, 0))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="fb-footer">
        <span className="fb-footer-info">
          {currentCount > 0
            ? `${currentCount} carpeta${currentCount !== 1 ? 's' : ''} listas para crear`
            : 'Añade o importa carpetas para continuar'}
        </span>
        <div className="fb-footer-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
          <button
            className="btn-primary"
            disabled={!canDone}
            onClick={handleDone}
          >
            Usar esta estructura
          </button>
        </div>
      </div>

    </div>
  );
}
