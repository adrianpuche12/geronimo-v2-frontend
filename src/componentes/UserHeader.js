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
              {isAdmin && <div className="user-menu-role">Administrador</div>}
            </div>
          </div>

          <div className="user-menu-divider"></div>

          {/* Menu Options - Sin iconos */}
          <div className="user-menu-options">
            <button className="menu-option-button">
              Mi Perfil
            </button>

            <button className="menu-option-button">
              Configuración
            </button>

            <button className="menu-option-button">
              Preferencias
            </button>

            <button className="menu-option-button">
              Ayuda
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
