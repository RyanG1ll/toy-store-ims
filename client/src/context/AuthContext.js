import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// On app load, it checks for a saved token and user in session storage to maintain the user's authenticated state across page refreshes
// The login and register functions make API calls to the backend to authenticate the user
// It then saves the token and user information in session storage
// While the logout function clears this information and resets the authentication state
// Essentially, sessionStorage keeps the token alive while the browser tab is open. 
// When you close the tab, it's gone.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if there's a saved token
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');
    if (token && savedUser) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const response = await api.post('/auth/login', { identifier, password });
    const { token, user } = response.data;

    // Save to session storage and set auth header
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
  };

  const register = async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    const { token, user } = response.data;

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}