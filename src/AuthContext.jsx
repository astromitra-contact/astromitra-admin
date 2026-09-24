import { createContext, useContext, useState, useCallback } from 'react';
import { apiRequest, getToken, setToken, clearToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [email, setEmailState] = useState(localStorage.getItem('astromitra_admin_email') || '');

  const login = useCallback(async (emailInput, password) => {
    const res = await apiRequest('/api/admin/auth/login', {
      method: 'POST',
      body: { email: emailInput, password },
      auth: false,
    });
    setToken(res.token);
    localStorage.setItem('astromitra_admin_email', emailInput);
    setTokenState(res.token);
    setEmailState(emailInput);
    return res;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem('astromitra_admin_email');
    setTokenState(null);
    setEmailState('');
  }, []);

  // Called by any page when an apiRequest() throws a 401 mid-session —
  // syncs React state with the token already cleared by api.js, so the
  // UI (ProtectedRoute) reacts immediately rather than on next reload.
  const handleSessionExpired = useCallback(() => {
    setTokenState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, email, login, logout, handleSessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
