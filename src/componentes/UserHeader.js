import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/UserHeader.css';
import logo from '../assets/images/footerlogo.png';

export const UserHeader = () => {
  const { user, isAdmin, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username ? user.username.substring(0, 2).toUpperCase() : 'U';
  };

  const getDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email || 'Usuario';
  };

  return (
    <div className="user-header">
      {/* Hamburger button - Mobile only */}
      <button
        className="hamburger-menu-button"
        onClick={() => setShowMenu(!showMenu)}
        aria-label="Menu"
      >
        <span className={`hamburger-icon ${showMenu ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Desktop user info */}
      <div className="user-info-container">
        <button
          className="user-avatar-button"
          onClick={() => setShowMenu(!showMenu)}
        >
          <div className="user-avatar">
            {getInitials()}
          </div>
          <div className="user-details">
            <span className="user-name">{getDisplayName()}</span>
            {isAdmin && <span className="admin-badge">Admin</span>}
          </div>
          <span className="dropdown-icon">{showMenu ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* User menu - Outside container so it works in mobile */}
      {showMenu && (
        <div className="user-menu">
          {/* Logo - Mobile only */}
          <div className="user-menu-logo">
            <img src={logo} alt="Nilo Solutions" />
          </div>

          <div className="user-menu-header">
            <div className="user-menu-avatar">{getInitials()}</div>
            <div className="user-menu-info">
              <div className="user-menu-name">{getDisplayName()}</div>
              <div className="user-menu-email">{user.email}</div>
              {isAdmin && <div className="user-menu-role">Administrador</div>}
            </div>
          </div>

          <div className="user-menu-divider"></div>

          {/* Menu Options */}
          <div className="user-menu-options">
            <button className="menu-option-button">
              <span className="menu-option-icon">👤</span>
              <span className="menu-option-text">Mi Perfil</span>
            </button>

            <button className="menu-option-button">
              <span className="menu-option-icon">⚙️</span>
              <span className="menu-option-text">Configuración</span>
            </button>

            <button className="menu-option-button">
              <span className="menu-option-icon">🎨</span>
              <span className="menu-option-text">Preferencias</span>
            </button>

            <button className="menu-option-button">
              <span className="menu-option-icon">❓</span>
              <span className="menu-option-text">Ayuda</span>
            </button>
          </div>

          <div className="user-menu-divider"></div>

          <button onClick={logout} className="logout-button">
            <span className="logout-icon">🚪</span>
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
