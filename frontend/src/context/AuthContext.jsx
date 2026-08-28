import React, {createContext, useEffect, useState} from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({children}){
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser()
      .then(({user: currentUser}) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials){ const result = await authService.login(credentials); setUser(result.user); return result; }
  async function register(credentials){ const result = await authService.register(credentials); setUser(result.user); return result; }
  async function logout(){ await authService.logout(); setUser(null); }

  return (
    <AuthContext.Provider value={{user, loading, isAuthenticated: Boolean(user), login, register, logout}}>
      {children}
    </AuthContext.Provider>
  )
}
