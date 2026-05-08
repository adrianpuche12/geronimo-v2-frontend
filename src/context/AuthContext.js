import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { hasPermission } from '../config/permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession]       = useState(null);
  const [user, setUser]             = useState(null);
  const [role, setRole]             = useState(null);
  const [firstLogin, setFirstLogin] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const authenticated = !!session;
  const isRoot  = role === 'ROOT';
  const isAdmin = role === 'ROOT' || role === 'ADMIN';

  // Chequea si el rol actual tiene un permiso específico
  // Uso: can('MANAGE_PROJECTS'), can('VIEW_USERS'), etc.
  const can = useCallback(
    (permission) => hasPermission(role, permission),
    [role]
  );

  const configureAxios = (accessToken) => {
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const extractRole = (supabaseSession) => {
    if (!supabaseSession) return null;
    return supabaseSession.user?.app_metadata?.role || null;
  };

  const buildUser = (supabaseSession) => {
    if (!supabaseSession) return null;
    const u = supabaseSession.user;
    return {
      id:        u.id,
      email:     u.email,
      fullName:  u.user_metadata?.full_name || u.email,
      role:      u.app_metadata?.role || null,
      createdAt: u.created_at,
    };
  };

  const checkFirstLogin = async (userId, accessToken) => {
    if (!userId || !accessToken) return false;
    try {
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = res.data?.find((u) => u.id === userId);
      return profile?.first_login === true;
    } catch {
      return false;
    }
  };

  const applySession = async (s) => {
    setSession(s);
    setUser(buildUser(s));
    setRole(extractRole(s));
    configureAxios(s?.access_token);

    if (s) {
      const fl = await checkFirstLogin(s.user.id, s.access_token);
      setFirstLogin(fl);
    } else {
      setFirstLogin(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      await applySession(s);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecovery(true);
          configureAxios(s?.access_token);
          return; // don't fully apply session yet
        }
        await applySession(s);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const clearPasswordRecovery = () => setPasswordRecovery(false);

  const changePassword = async (newPassword) => {
    const res = await axios.post('/api/auth/change-password', { newPassword });
    if (res.status === 200 || res.status === 201) {
      setFirstLogin(false);
    }
    return res.data;
  };

  const updateProfile = async (fullName) => {
    setUser(prev => prev ? { ...prev, fullName } : prev);
  };

  const getToken = () => session?.access_token || null;

  const login  = () => {};
  const logout = signOut;

  const value = {
    session,
    role,
    firstLogin,
    passwordRecovery,
    clearPasswordRecovery,
    signIn,
    signOut,
    changePassword,
    isRoot,
    isAdmin,
    can,
    authenticated,
    user,
    loading,
    login,
    logout,
    getToken,
    updateProfile,
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
