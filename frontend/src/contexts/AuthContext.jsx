import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, tokenService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenService.getToken();
    if (token && tokenService.isValid()) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      // Adaptation selon la structure de réponse de votre backend (support des deux formats)
      const data = response.data;
      const accessToken = data.accessToken || data.access || data.token;
      const refreshToken = data.refreshToken || data.refresh;
      const userData = data.user || {
        email: credentials.email,
        role: data.role || 'acheteur'
      };
      
      // Stockage des tokens
      if (accessToken) {
        tokenService.setToken(accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Normaliser les données utilisateur
      const normalizedUser = {
        ...userData,
        name: userData.name || userData.username || userData.email?.split("@")[0],
        email: userData.email || credentials.email
      };
      
      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Email ou mot de passe incorrect';
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Adaptation des données pour correspondre à votre backend
      const registerData = {
        email: userData.email,
        password: userData.password,
        username: userData.name || userData.email.split("@")[0],
        role: userData.role || 'acheteur',
        phone_number: userData.phone || '',
        address: userData.location || ''
      };
      
      const response = await authAPI.register(registerData);
      
      // Gestion de la réponse selon votre backend (support des deux formats)
      const data = response.data;
      const accessToken = data.accessToken || data.access || data.token;
      const refreshToken = data.refreshToken || data.refresh;
      const newUser = data.user || {
        id: data.id,
        email: registerData.email,
        username: registerData.username,
        role: registerData.role,
        name: registerData.username
      };
      
      // Stockage des tokens
      if (accessToken) {
        tokenService.setToken(accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Normaliser les données utilisateur
      const normalizedUser = {
        ...newUser,
        name: newUser.name || newUser.username || registerData.username,
        email: newUser.email || registerData.email,
        role: newUser.role || registerData.role
      };
      
      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Erreur d'inscription";
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      tokenService.removeToken();
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Erreur de mise à jour' 
      };
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        logout();
        return false;
      }

      const response = await authAPI.refreshToken(refreshToken);
      const { accessToken, access } = response.data;
      
      tokenService.setToken(accessToken || access);
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    loading,
    isAuthenticated: !!user && tokenService.isValid(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};