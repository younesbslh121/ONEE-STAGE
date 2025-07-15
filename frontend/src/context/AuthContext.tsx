import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Mode de développement - authentification automatique
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [user, setUser] = useState<any>({
    username: 'demo',
    role: 'admin'
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulation d'une authentification
    // En production, ceci devrait faire appel à votre API
    if (username === 'admin' && password === 'password') {
      const token = 'fake-jwt-token';
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      setUser({ username, role: 'admin' });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
