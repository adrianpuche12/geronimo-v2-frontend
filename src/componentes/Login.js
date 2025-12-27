import React from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.png';
import '../styles/Login.css';

export const Login = () => {
  const { login } = useAuth();

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="Geronimo Logo" className="login-logo" />
          <h1>Geronimo</h1>
          <p>Asistente de Documentación Inteligente</p>
        </div>

        <div className="login-content">
          <h2>Bienvenido</h2>
          <p>Inicia sesión para acceder a tus proyectos y documentación</p>

          <button onClick={login} className="login-button">
            <span className="login-icon">🔐</span>
            Iniciar Sesión con Keycloak
          </button>

          <div className="login-footer">
            <p>Sistema de gestión documental con IA</p>
            <p className="login-version">v2.0 - Powered by OpenAI & Groq</p>
          </div>
        </div>
      </div>
    </div>
  );
};
