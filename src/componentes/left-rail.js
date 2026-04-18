import React, { useState, useRef } from 'react';
import '../styles/left-rail.css';

// Icons
const IcoChat = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);
const IcoExplorer = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);
const IcoSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IcoIntegrations = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
    <path d="M15.54 8.46a5 5 0 010 7.07M8.46 8.46a5 5 0 000 7.07" />
  </svg>
);
const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoUpload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);
const IcoEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IcoTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
const IcoUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IcoDot = () => (
  <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
    <circle cx="3" cy="3" r="3" />
  </svg>
);

// permission requerido para ver cada item de nav.
// Si no tiene 'requiredPermission', lo ve cualquier usuario autenticado.
const NAV_ITEMS = [
  { id: 'chat',         label: 'Chat',          Icon: IcoChat },
  { id: 'explorer',     label: 'Proyectos',     Icon: IcoExplorer },
  { id: 'search',       label: 'Búsqueda',      Icon: IcoSearch },
  { id: 'integrations', label: 'Integraciones', Icon: IcoIntegrations, requiredPermission: 'VIEW_INTEGRATIONS' },
  { id: 'users',        label: 'Usuarios',      Icon: IcoUsers,        requiredPermission: 'VIEW_USERS' },
];

const SETTINGS_ITEM = { id: 'settings', label: 'Configuracion', Icon: IcoSettings, requiredPermission: 'VIEW_SETTINGS' };

export const LeftRail = ({
  activeTab,
  onTabChange,
  projects,
  selectedProject,
  onProjectSelect,
  activeFolderId,
  activeFolderName,
  can,
  onCreateProject,
  onUpload,
  isLoading,
  onCollapsedChange,
  mobileNavOpen,
  onMobileClose,
}) => {
  const collapsed = true;

  const visibleNavItems = NAV_ITEMS.filter(item =>
    !item.requiredPermission || can(item.requiredPermission)
  );

  return (
    <aside
      className={`rail rail--collapsed${mobileNavOpen ? ' rail--mobile-open' : ''}`}
    >

      {/* Botón cerrar — solo visible en mobile */}
      <div className="rail-mobile-close">
        <button className="rail-mobile-close-btn" onClick={onMobileClose} title="Cerrar menú">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── Nav items ─────────────────────────────────── */}
      <nav className="rail-nav">
        {visibleNavItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`rail-item${activeTab === id ? ' rail-item--active' : ''}`}
            onClick={() => { onTabChange(id); if (onMobileClose) onMobileClose(); }}
            title={label}
          >
            <span className="rail-item-icon"><Icon /></span>
            <span className="rail-item-label">{label}</span>
            {id === 'chat' && activeFolderId && (
              <span className="rail-badge" title={activeFolderName || 'Filtro de carpeta activo'} />
            )}
          </button>
        ))}
      </nav>

      {/* bottom: settings fijo */}
      {(!SETTINGS_ITEM.requiredPermission || can(SETTINGS_ITEM.requiredPermission)) && (
        <div className="rail-bottom">
          <button
            className={"rail-item" + (activeTab === "settings" ? " rail-item--active" : "")}
            onClick={() => { onTabChange("settings"); if (onMobileClose) onMobileClose(); }}
            title="Configuracion"
          >
            <span className="rail-item-icon"><IcoSettings /></span>
            <span className="rail-item-label">Configuracion</span>
          </button>
        </div>
      )}

    </aside>
  );
};

export default LeftRail;
