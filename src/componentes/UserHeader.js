import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/UserHeader.css';
import logo from '../assets/images/logo.png';

export const UserHeader = ({ onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const getInitials = () => {
    const name = user.fullName || user.email || '';
    if (!name) return 'U';
    // If it looks like an email, use first two chars of the username part
    if (name.includes('@')) {
      return name.split('@')[0].substring(0, 2).toUpperCase();
    }
    // Full name: first letter of first word + first letter of last word
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    const name = user.fullName || '';
    // If fullName is actually just an email, return the username part
    if (name.includes('@')) return name.split('@')[0];
    return name || user.email || 'Usuario';
  };

  return (
    <div className="user-header">
      {/* Solo Avatar - Clickeable */}
      <button
        className="user-avatar-button"
        onClick={() => setShowMenu(!showMenu)}
        aria-label="Menú de usuario"
        title={getDisplayName()}
      >
        <div className="user-avatar">
          {getInitials()}
        </div>
      </button>

      {/* User menu - Dropdown con estilos NILO */}
      {showMenu && (
        <div className="user-menu">
          <div className="user-menu-header">
            <div className="user-menu-avatar">{getInitials()}</div>
            <div className="user-menu-info">
              <div className="user-menu-name">{getDisplayName()}</div>
              <div className="user-menu-email">{user.email}</div>
            </div>
          </div>

          <div className="user-menu-divider"></div>

          {/* Menu Options - Sin iconos */}
          <div className="user-menu-options">
            <button className="menu-option-button" onClick={() => { setShowMenu(false); if (onNavigate) onNavigate('profile'); }}>
              Mi Perfil
            </button>

            <button className="menu-option-button" style={{opacity:0.45,cursor:"not-allowed"}} title="Próximamente disponible">
              Configuración <span style={{fontSize:10,color:"var(--text-disabled)",marginLeft:4}}>próximamente</span>
            </button>

            <button className="menu-option-button" style={{opacity:0.45,cursor:"not-allowed"}} title="Próximamente disponible">
              Preferencias <span style={{fontSize:10,color:"var(--text-disabled)",marginLeft:4}}>próximamente</span>
            </button>

            <button className="menu-option-button" style={{opacity:0.45,cursor:"not-allowed"}} title="Próximamente disponible">
              Ayuda <span style={{fontSize:10,color:"var(--text-disabled)",marginLeft:4}}>próximamente</span>
            </button>
          </div>

          <div className="user-menu-divider"></div>

          <button onClick={logout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      )}

      {showMenu && (
        <div
          className="user-menu-overlay"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
