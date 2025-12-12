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

// Fonction pour décoder le JWT
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    return {
      id: payload.user_id || payload.sub || payload.id,
      email: payload.email || '',
      role: payload.role,
      exp: payload.exp
    };
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Fonction pour obtenir le chemin du dashboard
const getDashboardPath = (role) => {
  switch(role) {
    case 'farmer': return '/farmer/dashboard';
    case 'driver': return '/driver/dashboard';
    case 'admin': return '/admin/dashboard';
    case 'buyer': 
    default: return '/buyer/dashboard';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenService.getToken();
    const storedUser = localStorage.getItem('user');
    
    if (token && tokenService.isValid() && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      const data = response.data;
      const accessToken = data.accessToken;
      const refreshToken = data.refreshToken;
      
      if (!accessToken) {
        throw new Error('No access token received');
      }
      
      // Stockage des tokens
      tokenService.setToken(accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Décoder le JWT
      const decodedToken = decodeJWT(accessToken);
      
      if (!decodedToken) {
        throw new Error('Invalid token received');
      }
      
      // Mapping des rôles backend → frontend
      const roleMapping = {
        'vendeur': 'farmer',
        'livreur': 'driver',
        'acheteur': 'buyer',
        'admin': 'admin'
      };
      
      const frontendRole = roleMapping[decodedToken.role] || decodedToken.role || 'buyer';
      
      // Créer l'objet utilisateur
      const normalizedUser = {
        id: decodedToken.id,
        email: credentials.email,
        role: frontendRole,
        name: credentials.email.split('@')[0],
        originalRole: decodedToken.role // Garder le rôle original pour référence
      };
      
      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      // Redirection
      const redirectTo = getDashboardPath(frontendRole);
      
      return { 
        success: true, 
        user: normalizedUser,
        redirectTo: redirectTo
      };
      
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
      
      // ============ CORRECTION CRITIQUE POUR LE REGISTER ============
      // Votre formulaire envoie ces champs, mais le backend Django peut attendre un format différent
      
      // 1. Mapping des rôles frontend → backend
      const frontendToBackendRole = {
        'buyer': 'acheteur',
        'farmer': 'vendeur',
        'driver': 'livreur'
      };
      
      // 2. Formatage des données pour le backend Django
      const registerData = {
        email: userData.email,
        password: userData.password,
        full_name: userData.name || userData.fullName,
        role: frontendToBackendRole[userData.role] || userData.role || 'acheteur',
        phone: userData.phone || userData.phone_number,
        location: userData.location || userData.address,
        accept_terms: true
      };
      
      console.log('📤 Données envoyées au backend:', registerData);
      
      const response = await authAPI.register(registerData);
      const data = response.data;
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken || data.refresh;
      
      if (accessToken) {
        tokenService.setToken(accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Décoder le JWT pour obtenir les infos utilisateur
      let decodedToken = null;
      let userInfo = null;
      
      if (accessToken) {
        decodedToken = decodeJWT(accessToken);
      }
      
      if (data.user) {
        // Si le backend retourne directement l'utilisateur
        userInfo = data.user;
      }
      
      // Mapping backend → frontend pour la navigation
      const backendToFrontendRole = {
        'vendeur': 'farmer',
        'livreur': 'driver',
        'acheteur': 'buyer',
        'admin': 'admin'
      };
      
      const backendRole = userInfo?.role || decodedToken?.role || registerData.role;
      const frontendRole = backendToFrontendRole[backendRole] || backendRole || 'buyer';
      
      const normalizedUser = {
        id: userInfo?.id || decodedToken?.id,
        email: userData.email,
        role: frontendRole,
        name: userData.name || userData.fullName || userData.email.split('@')[0],
        originalRole: backendRole // Rôle backend original
      };
      
      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      return { 
        success: true, 
        user: normalizedUser,
        redirectTo: getDashboardPath(frontendRole)
      };
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Gestion améliorée des erreurs
      let errorMessage = "Erreur d'inscription";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Essayer différents formats d'erreur Django
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors.join(', ');
        } else {
          // Afficher toutes les erreurs de validation
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = fieldErrors || 'Erreur de validation des données';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
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
      const { accessToken } = response.data;
      
      tokenService.setToken(accessToken);
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  // Fonction utilitaire pour aider au débogage
  const getCurrentUserInfo = () => {
    return {
      user: user,
      token: tokenService.getToken(),
      tokenValid: tokenService.isValid()
    };
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    getCurrentUserInfo,
    loading,
    isAuthenticated: !!user && tokenService.isValid(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};