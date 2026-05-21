import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
const API_URL = process.env.REACT_APP_API_URL || '/api';
import { formatDate, formatFileSize } from './utilities';
import { ProgressOverlay } from './ProgressOverlay';
import { WorkspaceMembers } from './WorkspaceMembers';
import { WorkspaceNotas } from './WorkspaceNotas';

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
    pdf:  { color: 'var(--text-error)',    label: 'PDF' },
    docx: { color: 'var(--text-info)',     label: 'DOC' },
    doc:  { color: 'var(--text-info)',     label: 'DOC' },
    txt:  { color: 'var(--text-disabled)', label: 'TXT' },
    md:   { color: 'var(--text-disabled)', label: 'MD'  },
    json: { color: 'var(--text-warning)',  label: 'JSON'},
    js:   { color: 'var(--text-warning)',  label: 'JS'  },
    ts:   { color: 'var(--text-accent)',   label: 'TS'  },
    py:   { color: 'var(--text-success)',  label: 'PY'  },
    csv:  { color: 'var(--text-success)',  label: 'CSV' },
    zip:  { color: 'var(--text-tertiary)', label: 'ZIP' },
  };
  return types[ext] || { color: 'var(--text-disabled)', label: ext.toUpperCase() || 'FILE' };
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


const CmpSources = ({ sources }) => {
  const juris = (sources || []).filter(s => s.type === 'jurisprudencia_publica' || s.type === 'base_conocimiento');
  if (!juris.length) return null;
  return (
    <div className="juris-sources" style={{marginTop:'var(--space-4)',paddingTop:'var(--space-3)',borderTop:'1px solid var(--border-subtle)'}}>
      <span className="juris-sources-label">Fuentes normativas verificadas</span>
      {juris.map((s, i) => (
        <span key={i} className="source-badge badge-juris">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0}}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          {s.type === 'base_conocimiento'
            ? s.titulo
            : s.titulo
              ? (s.tipo === 'decreto' ? 'Decreto' : 'Ley') + (s.numero_id ? ' N° ' + s.numero_id : '') + ' — ' + s.titulo.slice(0, 40) + (s.titulo.length > 40 ? '...' : '')
              : s.fuente ? s.fuente.toUpperCase() + (s.numero_id ? ' N°' + s.numero_id : '') : 'Infoleg'}
          {s.infoleg_url && (
            <a href={s.infoleg_url} target="_blank" rel="noopener noreferrer" className="juris-source-link"
              onClick={e => e.stopPropagation()} title="Ver en Infoleg">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          )}
        </span>
      ))}
    </div>
  );
};



// -- ANALYSIS ACTIONS (wired to compareModeModal) -------------------------
const ANALYSIS_ACTIONS = [
  {
    id: "compare", compareMode: "synthesis",
    label: "Comparar",
    desc: "Diferencias y similitudes entre los documentos",
    color: "var(--text-info, #60A5FA)", bg: "var(--bg-info, rgba(96,165,250,.1))",
    minDocs: 2,
    icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>),
    suggestedQ: "Compara los documentos: indica diferencias clave, similitudes y puntos de conflicto.",
  },
  {
    id: "generate", compareMode: "generate",
    label: "Generar",
    desc: "Documento nuevo a partir de los existentes",
    color: "var(--text-accent)", bg: "var(--bg-accent-subtle)",
    minDocs: 1,
    icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
    suggestedQ: "Genera un documento consolidado con los puntos clave de todos.",
  },
  {
    id: "audit", compareMode: "compliance",
    label: "Auditar",
    desc: "Clausulas problematicas o incumplimientos normativos",
    color: "var(--text-warning)", bg: "var(--bg-warning)",
    minDocs: 1,
    icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
    suggestedQ: "Busca clausulas problematicas, riesgos legales o terminos desfavorables.",
  },
  {
    id: "inconsistencies", compareMode: "inconsistencies",
    label: "Inconsistencias",
    desc: "Contradicciones o datos que no coinciden",
    color: "var(--text-error)", bg: "var(--bg-error)",
    minDocs: 2,
    icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>),
    suggestedQ: "Identifica inconsistencias, contradicciones o datos que no coinciden.",
  },
  {
    id: "positions", compareMode: "positions",
    label: "Posiciones",
    desc: "Que pretende cada parte segun los documentos",
    color: "oklch(60% 0.18 185)", bg: "rgba(45,212,191,.08)",
    minDocs: 2,
    icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>),
    suggestedQ: "Analiza las posiciones juridicas de cada parte. Que pretende cada una?",
  },
  {
    id: "extract", compareMode: "extract",
    label: "Extraer datos",
    desc: "Fechas, partes, montos y hechos relevantes",
    color: "var(--text-success)", bg: "var(--bg-success)",
    minDocs: 1,
    icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
    suggestedQ: "Extrae los datos clave: partes, fechas, montos, hechos relevantes y articulos citados.",
  },
];

// -- DOC ANALYSIS MODAL (opens compareModeModal, never goes to chat) -------
const DocAnalysisModal = ({ docs, onClose, onAction }) => {
  const docCount = docs.length;
  return (
    <div className="exp-modal-overlay" onClick={onClose}>
      <div className="exp-analysis-modal" onClick={e => e.stopPropagation()}>
        <div className="exp-analysis-header">
          <div style={{flex:1}}>
            <h3 className="exp-analysis-title">
              Analizar {docCount} documento{docCount !== 1 ? "s" : ""}
            </h3>
            <div className="exp-analysis-docs">
              {docs.map(d => (
                <span key={d.id} className="exp-analysis-doc-chip">
                  <span className="exp-file-ext" style={{fontSize:9}}>
                    {(d.path || "").split(".").pop().toUpperCase() || "FILE"}
                  </span>
                  {(d.path || d.title || "documento").split("/").pop()}
                </span>
              ))}
            </div>
          </div>
          <button className="exp-modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="exp-analysis-grid">
          {ANALYSIS_ACTIONS.map(action => {
            const enabled = docCount >= action.minDocs;
            return (
              <button
                key={action.id}
                className={"exp-analysis-action" + (!enabled ? " exp-analysis-action--disabled" : "")}
                disabled={!enabled}
                title={!enabled ? "Necesitas al menos " + action.minDocs + " documentos" : action.desc}
                onClick={() => enabled && onAction(action)}
              >
                <div className="exp-action-icon" style={{color: action.color, background: action.bg}}>
                  {action.icon}
                </div>
                <div>
                  <div className="exp-action-title">{action.label}</div>
                  <div className="exp-action-desc">{action.desc}</div>
                  {!enabled && <div className="exp-action-need">Necesitas {action.minDocs} docs minimo</div>}
                </div>
              </button>
            );
          })}
          <button
            className="exp-analysis-action exp-analysis-action--full"
            onClick={() => onAction({ id: "qa", compareMode: "qa", suggestedQ: "" })}
          >
            <div className="exp-action-icon" style={{color:"var(--text-accent)",background:"var(--bg-accent-subtle)"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <div className="exp-action-title">Preguntar sobre estos documentos</div>
              <div className="exp-action-desc">Hacele tu propia pregunta a los {docCount} documentos seleccionados</div>
            </div>
          </button>
        </div>
        <div className="exp-analysis-footer">
          <button className="exp-btn exp-btn--ghost exp-btn--sm" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

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
  onJurisUpload,
  onEditProject,
  onDeleteProject,
  onCreateProject,
  can,
}) => {
  const [view, setView] = useState('projects');
  const [workspaceTab, setWorkspaceTab] = useState('documentos'); // documentos | miembros | notas
  const [hoveredProject, setHoveredProject] = useState(null);
  const [folders, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);
  const [addingRoot, setAddingRoot] = useState(false);
  const [moveDoc, setMoveDoc] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  const [compareModeModal, setCompareModeModal] = useState(false);
  const [compareMode, setCompareMode] = useState('synthesis');
  const [compareQuestion, setCompareQuestion] = useState('');
  const [compareRefDocId, setCompareRefDocId] = useState('');
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const clearSelection = () => setSelectedDocs([]);
  const selectedDocObjects = docs.filter(d => selectedDocs.includes(d.id));

  const handleAnalysisAction = (action) => {
    setShowAnalysisModal(false);
    setCompareMode(action.compareMode || 'synthesis');
    setCompareQuestion(action.suggestedQ || '');
    setCompareRefDocId('');
    setCompareModeModal(true);
  };

  const toggleDocSelect = (docId) => {
    setSelectedDocs(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]);
  };

  const handleCompare = () => {
    if (selectedDocs.length < 2) return;
    setCompareMode('synthesis');
    setCompareQuestion('');
    setCompareRefDocId('');
    setCompareModeModal(true);
  };

  const handleRunCompare = async () => {
    if (!compareQuestion.trim()) return;
    setCompareModeModal(false);
    setComparing(true);
    try {
      const body = {
        documentIds: selectedDocs,
        mode: compareMode,
        question: compareQuestion,
      };
      if (compareMode === 'compliance' && compareRefDocId) {
        body.options = { referenceDocId: compareRefDocId };
      }
      const { data } = await axios.post(API_URL + '/docs/compare', body);
      setCompareResult(data);
    } catch (e) {
      alert('Error al analizar: ' + (e.response?.data?.message || e.message));
    } finally { setComparing(false); }
  };

  const handleDownload = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'iurivia-analisis.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = (csvData) => {
    const csv = csvData.map(row =>
      row.map(cell => '"' + (cell || '').replace(/"/g, '""') + '"').join(',')
    ).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iurivia-datos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

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
    setLoadingDocs(true);
    try {
      const res = await axios.get(API_URL + '/docs/project/' + projectId);
      setDocs(res.data);
    } catch (e) { console.error('Error loading docs:', e); }
    finally { setLoadingDocs(false); }
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
            <h2 className="exp-title">Workspaces</h2>
            <p className="exp-subtitle">Seleccioná un workspace para navegar sus documentos</p>
          </div>
          {can && can("MANAGE_PROJECTS") && onCreateProject && (
            <button className="exp-btn exp-btn--primary exp-btn--sm" onClick={onCreateProject}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight:4}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo workspace
            </button>
          )}
        </div>
        <div className="exp-project-list">
          {projects.length === 0 ? (
            <div className="exp-empty-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{color:'var(--text-disabled)',marginBottom:'var(--space-3)'}}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
              <h3 className="exp-empty-title">Creá tu primer workspace</h3>
              <p className="exp-empty-desc">Un workspace es el espacio de trabajo de un caso o expediente. Contiene documentos, historial y plazos.</p>
              <p className="exp-empty-hint">Ejemplo: "García c/ Municipalidad — Daños 2024"</p>
            </div>
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
          <button className="exp-bc-btn" onClick={() => { setView('projects'); onFolderSelect(null); setWorkspaceTab('documentos'); }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Workspaces
          </button>
          <span className="exp-bc-sep">/</span>
          <button className="exp-bc-btn" onClick={() => { onFolderSelect(null); setWorkspaceTab('documentos'); }}>
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

        {/* Sub-tabs del workspace */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
          {['documentos', 'miembros', 'notas'].map(tab => (
            <button key={tab} onClick={() => setWorkspaceTab(tab)}
              style={{
                padding: '3px 10px', fontSize: 'var(--text-xs)', fontWeight: 500,
                borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
                background: workspaceTab === tab ? 'var(--bg-accent-muted)' : 'transparent',
                color: workspaceTab === tab ? 'var(--text-accent)' : 'var(--text-muted)',
                textTransform: 'capitalize',
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Render del tab activo — Miembros y Notas reemplazan el exp-body */}
      {workspaceTab === 'miembros' && activeProject && (
        <WorkspaceMembers workspaceId={activeProject.id} miRol={activeProject.workspace_rol || 'RESPONSABLE'} />
      )}
      {workspaceTab === 'notas' && activeProject && (
        <WorkspaceNotas workspaceId={activeProject.id} miRol={activeProject.workspace_rol || 'RESPONSABLE'} />
      )}

      <div className="exp-body" style={{ display: workspaceTab === 'documentos' ? undefined : 'none' }}>
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
                <div className="exp-folders-empty">
                <p className="exp-folders-empty-title">Sin carpetas aún</p>
                <p className="exp-folders-empty-desc">Organizá tus documentos por tipo (demanda, contestación, pruebas) o por año.</p>
              </div>
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Importar ZIP<span className="exp-btn-hint">carpeta completa</span>
                </button>
              )}

              {selectedDocs.length >= 2 && (
                <button className="exp-btn exp-btn--primary exp-btn--sm" onClick={handleCompare} disabled={comparing} style={{background:"var(--accent)",color:"#fff"}}>
                  {comparing ? "Comparando..." : "Comparar (" + selectedDocs.length + ")"}
                </button>
              )}
              {onJurisUpload && (
                <button className="exp-btn exp-btn--secondary exp-btn--sm" onClick={onJurisUpload} title="Subir fallo judicial o jurisprudencia" style={{background:"var(--accent-dim, rgba(99,102,241,0.15))"}}>
                  <span style={{marginRight:4}}>⚖️</span>Jurisprudencia
                </button>
              )}
            </div>
          </div>
          <div className="exp-doc-list">
            {loadingDocs ? (
              /* Skeleton loader — evita el flash del estado vacío mientras carga la API */
              <div style={{padding:'var(--space-4)',display:'flex',flexDirection:'column',gap:'var(--space-2)'}}>
                {[1,2,3].map(i => (
                  <div key={i} style={{
                    height:56,borderRadius:'var(--radius-md)',
                    background:'linear-gradient(90deg, var(--bg-surface-1) 25%, var(--bg-surface-2) 50%, var(--bg-surface-1) 75%)',
                    backgroundSize:'200% 100%',
                    animation:'shimmer 1.4s infinite',
                    animationDelay: i * 0.15 + 's',
                    opacity: 1 - i * 0.15,
                  }} />
                ))}
              </div>
            ) : displayDocs.length === 0 ? (
              <div className="exp-docs-empty">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{color:'var(--text-disabled)',marginBottom:'var(--space-2)'}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p className="exp-docs-empty-title">{activeFolderId ? 'Esta carpeta está vacía' : 'Este workspace no tiene documentos'}</p>
                <p className="exp-docs-empty-desc">Subí expedientes, contratos o escritos en PDF o Word. Iurivia los indexará para que puedas consultarlos desde el chat.</p>
                {onUpload && <button className="exp-btn exp-btn--primary exp-btn--sm" style={{marginTop:'var(--space-4)'}} onClick={onUpload}>+ Subir primer documento</button>}
                <p className="exp-docs-empty-hint">También podés arrastrar archivos a esta ventana</p>
              </div>
            ) : displayDocs.map(doc => (
              <div
                key={doc.id}
                className={'exp-doc-row' + (selectedDocs.includes(doc.id) ? ' exp-doc-row--selected' : '')}
                onClick={() => handleViewDocument(doc)}
                title="Abrir lector — navegá por secciones, buscá términos y seguí el progreso de lectura"
              style={{ cursor: 'pointer' }}
              >
                <div
                  className={`exp-doc-checkbox${selectedDocs.includes(doc.id) ? ' exp-doc-checkbox--checked' : ''}`}
                  onClick={e => { e.stopPropagation(); toggleDocSelect(doc.id); }}
                  title={selectedDocs.includes(doc.id) ? 'Deseleccionar' : 'Seleccionar para analizar'}
                >
                  {selectedDocs.includes(doc.id) && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </div>
                <FileIcon path={doc.path} />
                {doc.document_type === "jurisprudencia" && <span title="Jurisprudencia" style={{marginRight:4,fontSize:14}}>⚖️</span>}
                <div className="exp-doc-info">
                  <div className="exp-doc-path">{doc.path}</div>
                  <div className="exp-doc-meta">{formatDate(doc.created_at || doc.createdAt)} · {formatFileSize(doc.content)}</div>
                </div>
                <div className="exp-doc-actions" onClick={e => e.stopPropagation()}>
                  <button className="exp-icon-btn" title="Mover a otra carpeta" onClick={() => setMoveDoc(doc)}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/><path d="M21 16v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg></button>
                  <button className="exp-icon-btn exp-icon-btn--danger" title="Eliminar"
                    onClick={() => handleDeleteDocument(doc.id, doc.path)} disabled={isLoading}><IconTrash /></button>
                </div>
              </div>
            ))}
          </div>
          {displayDocs.length > 0 && selectedDocs.length === 0 && (
            <div className="exp-hint-bar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Marca documentos con el checkbox para comparar o analizarlos juntos
            </div>
          )}

          {selectedDocs.length > 0 && (
            <div className="exp-selection-bar">
              <span className="exp-sel-count">{selectedDocs.length} seleccionado{selectedDocs.length !== 1 ? "s" : ""}</span>
              {selectedDocs.length === 1 && <span className="exp-sel-hint">Selecciona 1 mas para analizar juntos</span>}
              {selectedDocs.length >= 2 && (
                <button className="exp-sel-btn exp-sel-btn--primary" onClick={() => setShowAnalysisModal(true)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                  Analizar {selectedDocs.length} documentos
                </button>
              )}
              {selectedDocs.length === 1 && (
                <button className="exp-sel-btn exp-sel-btn--ghost exp-sel-btn--disabled" disabled>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                  Analizar (selecciona 1 mas)
                </button>
              )}
              <button className="exp-sel-btn exp-sel-btn--ghost" onClick={() => { handleAnalysisAction({ id: 'qa', compareMode: 'qa', suggestedQ: '' }); clearSelection(); }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Preguntar{selectedDocs.length > 1 ? " sobre los " + selectedDocs.length : ""}
              </button>
              <button className="exp-sel-btn exp-sel-btn--clear" onClick={clearSelection}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Limpiar
              </button>
            </div>
          )}

        </div>
      </div>

      {moveDoc && (
        <MoveModal doc={moveDoc} folders={folders} currentFolderId={moveDoc.folder_id}
          onMove={targetFolderId => moveDocument(moveDoc.id, targetFolderId)}
          onCancel={() => setMoveDoc(null)} />
      )}

      {showAnalysisModal && (
        <DocAnalysisModal
          docs={selectedDocObjects}
          onClose={() => setShowAnalysisModal(false)}
          onAction={handleAnalysisAction}
        />
      )}

      <ProgressOverlay show={comparing} message={
        compareMode === 'synthesis'       ? 'Comparando documentos...' :
        compareMode === 'generate'        ? 'Generando documento...' :
        compareMode === 'compliance'      ? 'Auditando cumplimiento...' :
        compareMode === 'inconsistencies' ? 'Detectando inconsistencias...' :
        compareMode === 'positions'       ? 'Mapeando posiciones...' :
        compareMode === 'qa'              ? 'Consultando documentos...' :
        compareMode === 'extract'         ? 'Extrayendo datos...' :
        'Analizando...'
      } />

      {compareModeModal && (
        <div
          style={{position:'fixed',inset:0,background:'var(--bg-overlay)',backdropFilter:'blur(6px)',
            WebkitBackdropFilter:'blur(6px)',display:'flex',alignItems:'center',
            justifyContent:'center',padding:'var(--space-5)',zIndex:'var(--z-modal)'}}
          onClick={() => setCompareModeModal(false)}>
          <div
            style={{width:580,maxWidth:'calc(100vw - 40px)',maxHeight:'calc(100vh - 80px)',
              overflowY:'auto',background:'var(--bg-surface-1)',
              border:'1px solid var(--border-default)',borderRadius:'var(--modal-radius)',
              boxShadow:'var(--shadow-xl)',display:'flex',flexDirection:'column'}}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{padding:'var(--space-5) var(--space-6)',
              borderBottom:'1px solid var(--border-subtle)',
              display:'flex',justifyContent:'space-between',alignItems:'flex-start',
              flexShrink:0}}>
              <div style={{display:'flex',flexDirection:'column',gap:'var(--space-1)'}}>
                <span style={{fontSize:'var(--text-base)',fontWeight:'var(--font-semibold)',
                  color:'var(--text-primary)'}}>
                  Analizar {selectedDocs.length} {selectedDocs.length === 1 ? 'documento' : 'documentos'}
                </span>
                <span style={{fontSize:'var(--text-xs)',color:'var(--text-muted)'}}>
                  Elegí qué querés hacer con los documentos seleccionados
                </span>
              </div>
              <button
                onClick={() => setCompareModeModal(false)}
                style={{width:28,height:28,background:'var(--bg-surface-2)',
                  border:'1px solid var(--border-default)',borderRadius:'var(--radius-sm)',
                  cursor:'pointer',color:'var(--text-muted)',fontSize:'var(--text-sm)',
                  display:'inline-flex',alignItems:'center',justifyContent:'center',
                  flexShrink:0,transition:'var(--transition-fast)'}}>
                x
              </button>
            </div>

            {/* Grilla de modos */}
            <div style={{padding:'var(--space-5) var(--space-6) var(--space-4)'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'var(--space-3)'}}>

                  <button
                    key="synthesis"
                    onClick={() => setCompareMode('synthesis')}
                    style={{
                      textAlign:'left',
                      padding:'var(--space-4)',
                      border: compareMode === 'synthesis'
                        ? '1.5px solid var(--border-accent)'
                        : '1px solid var(--border-default)',
                      borderRadius:'var(--radius-lg)',
                      background: compareMode === 'synthesis'
                        ? 'var(--bg-accent-subtle)'
                        : 'var(--bg-surface-2)',
                      cursor:'pointer',
                      transition:'var(--transition-fast)',
                      minHeight:76,
                      display:'flex',
                      flexDirection:'column',
                      gap:'var(--space-1)',
                    }}>
                    <div style={{color:'var(--text-accent)',marginBottom:'var(--space-1)'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg></div>
                    <span style={{
                      fontSize:'var(--text-sm)',
                      fontWeight:'var(--font-semibold)',
                      color:'var(--text-primary)',
                      lineHeight:1.3,
                    }}>Comparar</span>
                    <span style={{
                      fontSize:'var(--text-xs)',
                      color:'var(--text-muted)',
                      lineHeight:1.4,
                    }}>Tabla de diferencias y similitudes</span>
                  </button>
                  <button
                    key="generate"
                    onClick={() => setCompareMode('generate')}
                    style={{
                      textAlign:'left',
                      padding:'var(--space-4)',
                      border: compareMode === 'generate'
                        ? '1.5px solid var(--border-accent)'
                        : '1px solid var(--border-default)',
                      borderRadius:'var(--radius-lg)',
                      background: compareMode === 'generate'
                        ? 'var(--bg-accent-subtle)'
                        : 'var(--bg-surface-2)',
                      cursor:'pointer',
                      transition:'var(--transition-fast)',
                      minHeight:76,
                      display:'flex',
                      flexDirection:'column',
                      gap:'var(--space-1)',
                    }}>
                    <div style={{color:'var(--text-accent)',marginBottom:'var(--space-1)'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg></div>
                    <span style={{
                      fontSize:'var(--text-sm)',
                      fontWeight:'var(--font-semibold)',
                      color:'var(--text-primary)',
                      lineHeight:1.3,
                    }}>Generar</span>
                    <span style={{
                      fontSize:'var(--text-xs)',
                      color:'var(--text-muted)',
                      lineHeight:1.4,
                    }}>Documento nuevo a partir de los existentes</span>
                  </button>
                  <button
                    key="compliance"
                    onClick={() => setCompareMode('compliance')}
                    style={{
                      textAlign:'left',
                      padding:'var(--space-4)',
                      border: compareMode === 'compliance'
                        ? '1.5px solid var(--border-accent)'
                        : '1px solid var(--border-default)',
                      borderRadius:'var(--radius-lg)',
                      background: compareMode === 'compliance'
                        ? 'var(--bg-accent-subtle)'
                        : 'var(--bg-surface-2)',
                      cursor:'pointer',
                      transition:'var(--transition-fast)',
                      minHeight:76,
                      display:'flex',
                      flexDirection:'column',
                      gap:'var(--space-1)',
                    }}>
                    <div style={{color:'var(--text-accent)',marginBottom:'var(--space-1)'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                    <span style={{
                      fontSize:'var(--text-sm)',
                      fontWeight:'var(--font-semibold)',
                      color:'var(--text-primary)',
                      lineHeight:1.3,
                    }}>Auditar</span>
                    <span style={{
                      fontSize:'var(--text-xs)',
                      color:'var(--text-muted)',
                      lineHeight:1.4,
                    }}>Verificar cumplimiento normativo</span>
                  </button>
                  <button
                    key="inconsistencies"
                    onClick={() => setCompareMode('inconsistencies')}
                    style={{
                      textAlign:'left',
                      padding:'var(--space-4)',
                      border: compareMode === 'inconsistencies'
                        ? '1.5px solid var(--border-accent)'
                        : '1px solid var(--border-default)',
                      borderRadius:'var(--radius-lg)',
                      background: compareMode === 'inconsistencies'
                        ? 'var(--bg-accent-subtle)'
                        : 'var(--bg-surface-2)',
                      cursor:'pointer',
                      transition:'var(--transition-fast)',
                      minHeight:76,
                      display:'flex',
                      flexDirection:'column',
                      gap:'var(--space-1)',
                    }}>
                    <div style={{color:'var(--text-accent)',marginBottom:'var(--space-1)'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                    <span style={{
                      fontSize:'var(--text-sm)',
                      fontWeight:'var(--font-semibold)',
                      color:'var(--text-primary)',
                      lineHeight:1.3,
                    }}>Inconsistencias</span>
                    <span style={{
                      fontSize:'var(--text-xs)',
                      color:'var(--text-muted)',
                      lineHeight:1.4,
                    }}>Contradicciones entre documentos</span>
                  </button>
                  <button
                    key="positions"
                    onClick={() => setCompareMode('positions')}
                    style={{
                      textAlign:'left',
                      padding:'var(--space-4)',
                      border: compareMode === 'positions'
                        ? '1.5px solid var(--border-accent)'
                        : '1px solid var(--border-default)',
                      borderRadius:'var(--radius-lg)',
                      background: compareMode === 'positions'
                        ? 'var(--bg-accent-subtle)'
                        : 'var(--bg-surface-2)',
                      cursor:'pointer',
                      transition:'var(--transition-fast)',
                      minHeight:76,
                      display:'flex',
                      flexDirection:'column',
                      gap:'var(--space-1)',
                    }}>
                    <div style={{color:'var(--text-accent)',marginBottom:'var(--space-1)'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg></div>
                    <span style={{
                      fontSize:'var(--text-sm)',
                      fontWeight:'var(--font-semibold)',
                      color:'var(--text-primary)',
                      lineHeight:1.3,
                    }}>Posiciones</span>
                    <span style={{
                      fontSize:'var(--text-xs)',
                      color:'var(--text-muted)',
                      lineHeight:1.4,
                    }}>Acuerdos y conflictos entre partes</span>
                  </button>
                  <button
                    key="extract"
                    onClick={() => setCompareMode('extract')}
                    style={{
                      textAlign:'left',
                      padding:'var(--space-4)',
                      border: compareMode === 'extract'
                        ? '1.5px solid var(--border-accent)'
                        : '1px solid var(--border-default)',
                      borderRadius:'var(--radius-lg)',
                      background: compareMode === 'extract'
                        ? 'var(--bg-accent-subtle)'
                        : 'var(--bg-surface-2)',
                      cursor:'pointer',
                      transition:'var(--transition-fast)',
                      minHeight:76,
                      display:'flex',
                      flexDirection:'column',
                      gap:'var(--space-1)',
                    }}>
                    <div style={{color:'var(--text-accent)',marginBottom:'var(--space-1)'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                    <span style={{
                      fontSize:'var(--text-sm)',
                      fontWeight:'var(--font-semibold)',
                      color:'var(--text-primary)',
                      lineHeight:1.3,
                    }}>Extraer</span>
                    <span style={{
                      fontSize:'var(--text-xs)',
                      color:'var(--text-muted)',
                      lineHeight:1.4,
                    }}>Tabla de campos exportable a CSV</span>
                  </button>
              </div>

              {/* Preguntar — ancho completo */}
              <div style={{marginTop:'var(--space-3)'}}>
                <button
                  onClick={() => setCompareMode('qa')}
                  style={{width:'100%',textAlign:'left',padding:'var(--space-4)',
                    border: compareMode === 'qa'
                      ? '1.5px solid var(--border-accent)'
                      : '1px solid var(--border-default)',
                    borderRadius:'var(--radius-lg)',
                    background: compareMode === 'qa' ? 'var(--bg-accent-subtle)' : 'var(--bg-surface-2)',
                    cursor:'pointer',transition:'var(--transition-fast)',
                    display:'flex',flexDirection:'column',gap:'var(--space-1)'}}>
                  <span style={{fontSize:'var(--text-sm)',fontWeight:'var(--font-semibold)',
                    color:'var(--text-primary)',lineHeight:1.3}}>
                    Preguntar
                  </span>
                  <span style={{fontSize:'var(--text-xs)',color:'var(--text-muted)',lineHeight:1.4}}>
                    Hacer una pregunta sobre todos los documentos seleccionados
                  </span>
                </button>
              </div>
            </div>

            {/* Campo de pregunta — todos los modos */}
            <div style={{padding:'0 var(--space-6) var(--space-5)'}}>
              <label style={{display:'block',marginBottom:'var(--space-2)',
                fontSize:'var(--text-xs)',fontWeight:'var(--font-medium)',
                color:'var(--text-muted)'}}>
                ¿Qué querés hacer con estos documentos?
              </label>
              <textarea
                rows={3}
                placeholder={
                  compareMode === 'synthesis'       ? 'Ej: mostrame las diferencias en clausula penal y plazo' :
                  compareMode === 'generate'        ? 'Ej: genera una carta formal y protectora para el empleador' :
                  compareMode === 'compliance'      ? 'Ej: verificar si cumplen con las clausulas de actualizacion de precio' :
                  compareMode === 'inconsistencies' ? 'Ej: enfocate en las clausulas de rescision anticipada' :
                  compareMode === 'positions'       ? 'Ej: donde puede ceder cada parte sin violar los minimos legales' :
                  compareMode === 'qa'              ? 'Ej: cuantos de estos contratos vencen antes de junio de 2026' :
                  compareMode === 'extract'         ? 'Ej: necesito partes, monto mensual, plazo y fecha de vencimiento' :
                  'Describí qué querés hacer...'
                }
                value={compareQuestion}
                onChange={e => setCompareQuestion(e.target.value)}
                style={{width:'100%',boxSizing:'border-box',minHeight:72,maxHeight:140,
                  resize:'vertical',background:'var(--bg-surface-2)',
                  border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',
                  padding:'var(--space-3)',fontFamily:'var(--font-body)',
                  fontSize:'var(--text-sm)',color:'var(--text-primary)',
                  lineHeight:'var(--leading-normal)',transition:'var(--transition-fast)',
                  outline:'none'}}
                onFocus={e => { e.target.style.borderColor = 'var(--border-focus)'; e.target.style.boxShadow = '0 0 0 3px rgba(109,40,217,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Referencia — solo modo Auditar */}
            {compareMode === 'compliance' && (
              <div style={{padding:'0 var(--space-6) var(--space-4)',
                borderTop:'1px solid var(--border-subtle)',paddingTop:'var(--space-4)'}}>
                <span style={{display:'block',marginBottom:'var(--space-3)',
                  fontSize:'var(--text-xs)',fontWeight:'var(--font-medium)',
                  color:'var(--text-muted)'}}>
                  Comparar contra:
                </span>
                <div style={{display:'flex',flexDirection:'column',gap:'var(--space-2)'}}>
                  {[
                    { id:'kb:ley-27737', label:'Ley 27.737 — Locaciones urbanas' },
                    { id:'kb:lct',       label:'LCT Ley 20.744 — Contrato de trabajo' },
                    { id:'kb:ley-23187', label:'Ley 23.187 — Ejercicio de la Abogacia' },
                    { id:'',            label:'Criterio general del sistema' },
                  ].map(opt => (
                    <label
                      key={opt.id}
                      style={{display:'flex',alignItems:'center',gap:'var(--space-2)',
                        cursor:'pointer',padding:'var(--space-2) var(--space-3)',
                        borderRadius:'var(--radius-sm)',transition:'var(--transition-fast)',
                        background: compareRefDocId === opt.id ? 'var(--bg-hover)' : 'transparent'}}>
                      <input
                        type="radio"
                        name="compliance-ref"
                        value={opt.id}
                        checked={compareRefDocId === opt.id}
                        onChange={() => setCompareRefDocId(opt.id)}
                        style={{accentColor:'var(--accent)',width:14,height:14,flexShrink:0}}
                      />
                      <span style={{fontSize:'var(--text-sm)',
                        color: compareRefDocId === opt.id ? 'var(--text-primary)' : 'var(--text-secondary)'}}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{padding:'var(--space-4) var(--space-6)',
              borderTop:'1px solid var(--border-subtle)',
              display:'flex',justifyContent:'space-between',alignItems:'center',
              gap:'var(--space-3)',flexShrink:0}}>
              <button
                onClick={() => setCompareModeModal(false)}
                className="exp-btn exp-btn--ghost"
                style={{height:'var(--btn-height-md)',padding:'0 var(--btn-padding-x-md)',
                  display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                Cancelar
              </button>
              <button
                onClick={handleRunCompare}
                disabled={!compareQuestion.trim()}
                className="exp-btn exp-btn--primary"
                style={{height:'var(--btn-height-md)',padding:'0 var(--btn-padding-x-md)',
                  display:'inline-flex',alignItems:'center',justifyContent:'center',
                  opacity: !compareQuestion.trim() ? 0.4 : 1,
                  cursor: !compareQuestion.trim() ? 'not-allowed' : 'pointer'}}>
                Analizar
              </button>
            </div>
          </div>
        </div>
      )}

      {compareResult && (
        <div
          style={{position:'fixed',inset:0,background:'var(--bg-overlay)',backdropFilter:'blur(6px)',
            WebkitBackdropFilter:'blur(6px)',display:'flex',alignItems:'center',
            justifyContent:'center',padding:'var(--space-5)',zIndex:'var(--z-modal)'}}
          onClick={() => setCompareResult(null)}>
          <div
            style={{width:1200,maxWidth:'calc(100vw - 40px)',height:'90vh',maxHeight:1200,
              background:'var(--bg-surface-1)',border:'1px solid var(--border-default)',
              borderRadius:'var(--modal-radius)',boxShadow:'var(--shadow-xl)',
              display:'flex',flexDirection:'column',overflow:'hidden'}}
            onClick={e => e.stopPropagation()}>

            <div style={{padding:'var(--space-5) var(--space-6)',
              borderBottom:'1px solid var(--border-subtle)',
              display:'flex',justifyContent:'space-between',alignItems:'flex-start',
              flexShrink:0}}>
              <div style={{display:'flex',flexDirection:'column',gap:'var(--space-1)'}}>
                <span style={{fontSize:'var(--text-base)',fontWeight:'var(--font-semibold)',
                  color:'var(--text-primary)'}}>
                  {        compareResult.mode === 'synthesis' ? 'Comparacion' :
        compareResult.mode === 'generate' ? 'Documento Generado' :
        compareResult.mode === 'compliance' ? 'Auditoria de Cumplimiento' :
        compareResult.mode === 'inconsistencies' ? 'Inconsistencias Detectadas' :
        compareResult.mode === 'positions' ? 'Analisis de Posiciones' :
        compareResult.mode === 'qa' ? 'Consulta sobre Documentos' :
        compareResult.mode === 'extract' ? 'Datos Extraidos' :
        'Resultado'}
                </span>
                <span style={{fontSize:'var(--text-xs)',color:'var(--text-muted)'}}>
                  {compareResult.documentCount} documentos
                  {compareResult.charsPerDoc ? ` · ${compareResult.charsPerDoc.toLocaleString()} chars/doc` : ""}
                  {compareResult.contextUsedPct ? ` · ${compareResult.contextUsedPct}% contexto` : ""}
                </span>
              </div>
              <button
                onClick={() => setCompareResult(null)}
                style={{width:28,height:28,background:'var(--bg-surface-2)',
                  border:'1px solid var(--border-default)',borderRadius:'var(--radius-sm)',
                  cursor:'pointer',color:'var(--text-muted)',fontSize:'var(--text-sm)',
                  display:'inline-flex',alignItems:'center',justifyContent:'center',
                  flexShrink:0}}>
                x
              </button>
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'var(--space-6)',
              background:'var(--bg-base)',scrollbarWidth:'thin',
              scrollbarColor:'var(--scrollbar-thumb) transparent'}}>
              <div style={{color:'var(--text-primary)',fontSize:'var(--text-sm)',
                lineHeight:'var(--leading-relaxed)'}}>
                <div className="cmp-md">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{compareResult.markdown}</ReactMarkdown>
                </div>
                <CmpSources sources={compareResult.sources} />
              </div>
            </div>

            <div style={{padding:'var(--space-4) var(--space-6)',
              borderTop:'1px solid var(--border-subtle)',
              display:'flex',justifyContent:'space-between',alignItems:'center',
              gap:'var(--space-3)',flexShrink:0}}>
              <button
                onClick={() => { setCompareResult(null); setSelectedDocs([]); }}
                className="exp-btn exp-btn--secondary"
                style={{height:'var(--btn-height-md)',padding:'0 var(--btn-padding-x-md)',
                  display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                Cerrar
              </button>
              <div style={{display:'flex',gap:'var(--space-3)',alignItems:'center'}}>
                <button
                  className="exp-btn exp-btn--ghost"
                  style={{height:'var(--btn-height-md)',padding:'0 var(--btn-padding-x-md)',
                    display:'inline-flex',alignItems:'center',justifyContent:'center'}}
                  onClick={e => {
                    navigator.clipboard.writeText(compareResult.markdown);
                    const btn = e.currentTarget;
                    btn.textContent = 'Copiado';
                    btn.style.color = 'var(--text-accent)';
                    setTimeout(() => { btn.textContent = 'Copiar'; btn.style.color = ''; }, 2000);
                  }}>
                  Copiar
                </button>
                <button
                  className="exp-btn exp-btn--ghost"
                  style={{height:'var(--btn-height-md)',padding:'0 var(--btn-padding-x-md)',
                    display:'inline-flex',alignItems:'center',justifyContent:'center'}}
                  onClick={() => handleDownload(
                    compareResult.markdown,
                    (compareResult.generatedTitle || 'iurivia-analisis') + '.txt'
                  )}>
                  Descargar
                </button>
                {compareResult.isCsvExportable && compareResult.csvData && (
                  <button
                    className="exp-btn exp-btn--ghost"
                    style={{height:'var(--btn-height-md)',padding:'0 var(--btn-padding-x-md)',
                      display:'inline-flex',alignItems:'center',justifyContent:'center'}}
                    onClick={() => handleExportCsv(compareResult.csvData)}>
                    Exportar CSV
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Explorer;
