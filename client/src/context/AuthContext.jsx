import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jobmatch_token') || null);
  const [loading, setLoading] = useState(true);

  // Verify existing token on initial load
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem('jobmatch_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Session verification error:', err);
        localStorage.removeItem('jobmatch_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    verifySession();
  }, [token]);

  const login = async (identifier, password, role = null) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password,
          role
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('jobmatch_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('jobmatch_token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(user && token);
  const isStudent = user?.role === 'STUDENT';
  const isTP = user?.role === 'T_AND_P';
  const isHOD = user?.role === 'HOD';

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      isAuthenticated,
      isStudent,
      isTP,
      isHOD,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
