import React, { createContext, useContext, useState, useEffect } from 'react';
import Keycloak from 'keycloak-js';
import axios from 'axios';

const AuthContext = createContext(null);

// Configuración de Keycloak desde variables de entorno
const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://62.171.160.238:8095/',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'geronimo-v2',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'geronimo-v2-frontend',
};

const keycloak = new Keycloak(keycloakConfig);

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [keycloakInstance, setKeycloakInstance] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Si la autenticación está deshabilitada, permitir acceso sin Keycloak
    if (process.env.REACT_APP_DISABLE_AUTH === 'true') {
      console.log('[AUTH] Authentication disabled by REACT_APP_DISABLE_AUTH');
      setAuthenticated(true);
      setUser({
        id: 'local-user',
        username: 'usuario',
        email: 'usuario@geronimo.local',
        firstName: 'Usuario',
        lastName: 'Local',
        roles: ['user'],
      });
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Inicializar Keycloak SOLO UNA VEZ
    if (!window.keycloakInitialized) {
      window.keycloakInitialized = true;

      keycloak.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        enableLogging: true,
      }).then((auth) => {
        if (!mounted) return;

        console.log('[AUTH] Keycloak initialized. Authenticated:', auth);

        if (auth) {
          // Usuario autenticado
          setAuthenticated(true);
          setKeycloakInstance(keycloak);
          window.keycloak = keycloak;

          // Configurar axios
          if (keycloak.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;
            console.log('[AUTH] Token configured');
          }

          // Cargar perfil del token
          if (keycloak.tokenParsed) {
            const tokenParsed = keycloak.tokenParsed;
            const realmRoles = tokenParsed?.realm_access?.roles || [];

            setUser({
              id: tokenParsed.sub,
              username: tokenParsed.preferred_username,
              email: tokenParsed.email,
              firstName: tokenParsed.given_name,
              lastName: tokenParsed.family_name,
              roles: realmRoles,
            });
            setIsAdmin(realmRoles.includes('admin'));
            console.log('[AUTH] User loaded:', tokenParsed.preferred_username);
          }

          // Configurar actualización automática del token
          keycloak.onTokenExpired = () => {
            keycloak.updateToken(30).then((refreshed) => {
              if (refreshed) {
                console.log('[AUTH] Token refreshed');
                axios.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;
              }
            }).catch(() => {
              console.error('[AUTH] Error refreshing token');
              logout();
            });
          };
        } else {
          // No autenticado - mostrar pantalla de login
          console.log('[AUTH] Not authenticated, showing login screen');
        }

        setLoading(false);
      }).catch((error) => {
        if (!mounted) return;
        console.error('[AUTH] Error initializing Keycloak:', error);
        setLoading(false);
      });
    } else {
      // Ya inicializado (React Strict Mode), solo actualizar estado
      console.log('[AUTH] Keycloak already initialized, reusing state');

      if (keycloak.authenticated) {
        setAuthenticated(true);
        setKeycloakInstance(keycloak);

        // Configurar axios con el token
        if (keycloak.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`;
          console.log('[AUTH] Token configured on reinitialization');
        }

        if (keycloak.tokenParsed) {
          const tokenParsed = keycloak.tokenParsed;
          const realmRoles = tokenParsed?.realm_access?.roles || [];
          setUser({
            id: tokenParsed.sub,
            username: tokenParsed.preferred_username,
            email: tokenParsed.email,
            firstName: tokenParsed.given_name,
            lastName: tokenParsed.family_name,
            roles: realmRoles,
          });
          setIsAdmin(realmRoles.includes('admin'));
        }
      }
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await keycloak.loadUserProfile();
      const tokenParsed = keycloak.tokenParsed;

      // Extraer roles del token
      const realmRoles = tokenParsed?.realm_access?.roles || [];
      const isUserAdmin = realmRoles.includes('admin');

      setUser({
        id: profile.id,
        username: profile.username,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        roles: realmRoles,
      });
      setIsAdmin(isUserAdmin);

      console.log('Usuario autenticado:', profile.username, 'Admin:', isUserAdmin);
    } catch (error) {
      console.error('Error cargando perfil de usuario:', error);
    }
  };

  const login = () => {
    keycloak.login({
      redirectUri: window.location.origin,
    });
  };

  const logout = () => {
    keycloak.logout({
      redirectUri: window.location.origin,
    });
  };

  const getToken = () => {
    return keycloakInstance?.token || keycloak.token;
  };

  const value = {
    authenticated,
    user,
    isAdmin,
    loading,
    login,
    logout,
    getToken,
    keycloak: keycloakInstance,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
