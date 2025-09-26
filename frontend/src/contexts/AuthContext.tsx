import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { apiService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // 점검 모드 확인 함수
  const checkMaintenanceMode = async () => {
    try {
      const response = await apiService.getPublicSettings();
      if (response.success && response.data) {
        const maintenanceMode = response.data.maintenanceMode || false;
        setIsMaintenanceMode(maintenanceMode);
        
        // 점검 모드가 활성화되어 있고, 사용자가 어드민이 아닌 경우 점검 페이지로 리다이렉트
        if (maintenanceMode && user && user.role !== 'admin') {
          window.location.href = '/maintenance';
        }
      }
    } catch (error) {
      console.error('Failed to check maintenance mode:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const response = await apiService.getCurrentUser();
          if (response.success) {
            setUser(response.data);
            setToken(storedToken);
          } else {
            localStorage.removeItem('auth_token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      
      // 점검 모드 확인
      await checkMaintenanceMode();
      setLoading(false);
    };

    initAuth();
  }, []);

  // 사용자가 변경될 때마다 점검 모드 확인
  useEffect(() => {
    if (user) {
      checkMaintenanceMode();
    }
  }, [user]);

  // 주기적으로 점검 모드 확인 (5분마다)
  useEffect(() => {
    const interval = setInterval(checkMaintenanceMode, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await apiService.login(username, password);
      if (response.success) {
        const { token: newToken, user: userData } = response.data;
        setUser(userData);
        setToken(newToken);
        localStorage.setItem('auth_token', newToken);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};