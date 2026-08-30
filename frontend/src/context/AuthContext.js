/**
 * src/context/AuthContext.js
 * -----------------------------------------------------------------
 * Global authentication state for the GM University Event System.
 *
 * Provides:
 *  - user        : the logged-in user object ({ id, name, role_name, department_name })
 *                  or null if not logged in.
 *  - login(data) : persist user to state + localStorage
 *  - logout()    : clear state + localStorage
 *
 * Usage (in any component):
 *   import { useAuth } from '../context/AuthContext';
 *   const { user, login, logout } = useAuth();
 * -----------------------------------------------------------------
 */

import React, { createContext, useContext, useState } from 'react';
import { API_BASE } from '../config/api';

const AuthContext = createContext(null);

// Storage key — change this if you rename the app
const STORAGE_KEY = 'gmu_user';

/**
 * AuthProvider wraps the whole app (inside <BrowserRouter>) so that
 * any descendant can call useAuth() to read or update the auth state.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // One-time migration: clear any stale localStorage from the old system
    try {
      const oldData = localStorage.getItem(STORAGE_KEY);
      if (oldData) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore */ }

    // Restore session from sessionStorage on first render (isolated per tab)
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /**
   * Call after a successful login.php response.
   * @param {Object} userData - { id, name, role_name, department_name }
   */
  const login = (userData) => {
    setUser(userData);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch {
      // sessionStorage unavailable (private mode) — session still works in memory
    }
  };

  /**
   * Call when user clicks "Logout".
   * Clears both React state and the persisted sessionStorage entry.
   */
  const logout = () => {
    try {
      const token = sessionStorage.getItem('jwt_token');
      if (token) {
        fetch(`${API_BASE}/remove_fcm_token.php`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
      }
    } catch { /* ignore */ }

    setUser(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('jwt_token');
      localStorage.removeItem('jwt_token');
    } catch {
      // silently ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook — components import this instead of the context directly.
 * Throws a helpful error if used outside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth() must be used inside <AuthProvider>');
  }
  return ctx;
}
