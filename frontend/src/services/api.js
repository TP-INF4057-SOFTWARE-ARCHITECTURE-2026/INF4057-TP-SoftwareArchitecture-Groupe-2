// src/services/api.js
import axios from 'axios';

// ============ CONFIGURATION ============
const API_GATEWAY_URL = 'http://localhost:8082';
const API_TIMEOUT = 30000;

console.log('🚀 API Gateway URL:', API_GATEWAY_URL);

// ============ CONFIGURATION AXIOS ============
const api = axios.create({
  baseURL: API_GATEWAY_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ============ INTERCEPTEURS ============
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🌐 Request: ${config.method} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response ${response.status}: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.message);
    
    if (error.message === 'Network Error') {
      console.error(`🔌 Network Error: Cannot reach ${API_GATEWAY_URL}`);
    }
    
    return Promise.reject(error);
  }
);

// ============ SERVICE DE GESTION DES TOKENS ============
export const tokenService = {
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token) => localStorage.setItem('authToken', token),
  removeToken: () => localStorage.removeItem('authToken'),
  isValid: () => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
};

// ============ UTILITAIRE DE MAPPING DES PRODUITS ============
export const productMapper = {
  // Frontend → Django (version simplifiée)
  toBackend: (frontendData) => {
    console.log('📦 Mapping frontend → backend:', frontendData);
    
    const mappedData = {
      name: frontendData.name,
      description: frontendData.description || '',
      price: parseFloat(frontendData.price),
      unit: frontendData.unit,
      stock_quantity: parseInt(frontendData.stock_quantity) || 0,
      is_organic: frontendData.is_organic || false,
      conditions_conservation: frontendData.conditions_conservation || '',
      harvest_date: frontendData.harvest_date || null,
      cultivation_method: frontendData.cultivation_method || 'conventionnelle',
      status: frontendData.status || 'available',
      farmer: frontendData.farmer,
      category: frontendData.category // On envoie directement le nom de la catégorie
    };
    
    console.log('📦 Données mappées:', mappedData);
    return mappedData;
  },
  
  // Django → Frontend
  toFrontend: (backendData) => {
    return {
      id: backendData.produit_id || backendData.id,
      name: backendData.nom,
      description: backendData.description,
      price: backendData.prix_unitaire,
      unit: backendData.unite_mesure,
      stock_quantity: backendData.quantite_stock,
      is_organic: backendData.est_bio,
      conditions_conservation: backendData.condition_conservation,
      category: backendData.categorie_nom || backendData.categorie?.nom,
      farmer: backendData.id_agriculteur,
      is_published: backendData.est_publier,
      created_at: backendData.date_publication,
      images: backendData.medias || [],
      status: backendData.statut
    };
  }
};

// ============ SERVICES DES CATÉGORIES ============
export const categoriesAPI = {
  // Récupérer toutes les catégories
  getAll: async (params = {}) => {
    try {
      console.log('🔄 Chargement catégories depuis:', '/api/products/categories/');
      const response = await api.get('/api/products/categories/', { params });
      console.log('✅ Catégories chargées:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Erreur categoriesAPI.getAll:', error);
      
      // Fallback pour le développement
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Utilisation des catégories par défaut');
        return {
          data: [
            { categorie_id: 1, nom: 'Fruits', description: 'Fruits frais et secs' },
            { categorie_id: 2, nom: 'Légumes', description: 'Légumes frais et transformés' },
            { categorie_id: 3, nom: 'Céréales', description: 'Céréales et dérivés' },
            { categorie_id: 4, nom: 'Tubercules', description: 'Manioc, igname, patate' },
            { categorie_id: 5, nom: 'Épicerie', description: 'Produits d\'épicerie' },
            { categorie_id: 6, nom: 'Boissons', description: 'Jus et boissons naturelles' },
            { categorie_id: 7, nom: 'Produits Laitiers', description: 'Lait, fromage, yaourt' },
            { categorie_id: 8, nom: 'Viandes', description: 'Viandes et volailles' },
            { categorie_id: 9, nom: 'Poissons', description: 'Poissons et fruits de mer' },
            { categorie_id: 10, nom: 'Œufs', description: 'Œufs frais' },
            { categorie_id: 11, nom: 'Miels', description: 'Miels et produits de la ruche' },
            { categorie_id: 12, nom: 'Épices', description: 'Épices et condiments' }
          ]
        };
      }
      
      throw error;
    }
  },
  
  // Récupérer une catégorie par ID
  getById: (id) => api.get(`/api/products/categories/${id}/`),
  
  // Créer une catégorie
  create: (categoryData) => api.post('/api/products/categories/', categoryData),
  
  // Mettre à jour une catégorie
  update: (id, categoryData) => api.put(`/api/products/categories/${id}/`, categoryData),
  
  // Supprimer une catégorie
  delete: (id) => api.delete(`/api/products/categories/${id}/`),
  
  // Rechercher des catégories par nom
  search: (query, params = {}) => api.get('/api/products/categories/', {
    params: { nom: query, ...params }
  })
};

// ============ SERVICES DES PRODUITS ============
export const productsAPI = {
  // Créer un produit (version simplifiée)
  create: async (productData) => {
    try {
      console.log('📤 Création produit - Données reçues:', productData);
      
      // Préparer les données pour l'API
      // On envoie les données telles quelles, le serializer Django va gérer le mapping
      const apiData = productMapper.toBackend(productData);
      console.log('📤 Données envoyées à l\'API:', apiData);
      
      const response = await api.post('/api/products/produits/', apiData);
      console.log('✅ Produit créé avec succès:', response.data);
      
      return response;
      
    } catch (error) {
      console.error('❌ Erreur productsAPI.create:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Récupérer toutes les catégories (alias vers categoriesAPI.getAll)
  getCategories: categoriesAPI.getAll,
  
  // Upload d'image pour un produit
  uploadImage: async (productId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('url_fichier', imageFile);
      formData.append('type_media', 'image');
      formData.append('produit', productId);
      
      const response = await api.post('/api/products/medias/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      return response;
    } catch (error) {
      console.error('❌ Erreur productsAPI.uploadImage:', error);
      throw error;
    }
  },
  
  // Récupérer tous les produits
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/api/products/produits/', { params });
      
      // Transformer les données si nécessaire
      if (response.data && Array.isArray(response.data.results)) {
        response.data.results = response.data.results.map(productMapper.toFrontend);
      } else if (Array.isArray(response.data)) {
        response.data = response.data.map(productMapper.toFrontend);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur productsAPI.getAll:', error);
      throw error;
    }
  },
  
  // Récupérer un produit par ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/products/produits/${id}/`);
      response.data = productMapper.toFrontend(response.data);
      return response;
    } catch (error) {
      console.error(`❌ Erreur productsAPI.getById(${id}):`, error);
      throw error;
    }
  },
  
  // Mettre à jour un produit
  update: async (id, productData) => {
    try {
      const mappedData = productMapper.toBackend(productData);
      const response = await api.put(`/api/products/produits/${id}/`, mappedData);
      response.data = productMapper.toFrontend(response.data);
      return response;
    } catch (error) {
      console.error(`❌ Erreur productsAPI.update(${id}):`, error);
      throw error;
    }
  },
  
  // Supprimer un produit
  delete: (id) => api.delete(`/api/products/produits/${id}/`),
  
  // Rechercher des produits
  search: async (query, params = {}) => {
    try {
      const response = await api.get('/api/products/produits/recherche/', { 
        params: { q: query, ...params } 
      });
      
      if (response.data && Array.isArray(response.data)) {
        response.data = response.data.map(productMapper.toFrontend);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur productsAPI.search:', error);
      throw error;
    }
  },
  
  // Récupérer tous les produits d'un agriculteur
  getByFarmer: async (farmerId, params = {}) => {
    try {
      const response = await api.get('/api/products/produits/', {
        params: { farmer: farmerId, ...params }
      });
      
      // Transformer les données
      if (response.data && Array.isArray(response.data.results)) {
        response.data.results = response.data.results.map(productMapper.toFrontend);
      } else if (Array.isArray(response.data)) {
        response.data = response.data.map(productMapper.toFrontend);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur productsAPI.getByFarmer:', error);
      throw error;
    }
  },
  
  // Récupérer les images d'un produit
  getProductImages: async (productId) => {
    try {
      const response = await api.get('/api/products/medias/', {
        params: { produit: productId }
      });
      return response;
    } catch (error) {
      console.error('❌ Erreur productsAPI.getProductImages:', error);
      return { data: [] };
    }
  },
  
  // Tester la connexion
  testConnection: async () => {
    try {
      const response = await api.get('/api/products/produits/');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        details: error.response?.data 
      };
    }
  }
};

// ============ SERVICES D'AUTHENTIFICATION ============
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login/', credentials),
  register: (userData) => api.post('/api/auth/register/', userData),
  logout: () => api.post('/api/auth/logout/'),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh/', { refreshToken }),
  validateToken: () => api.get('/api/auth/validate/'),
  getProfile: () => api.get('/api/auth/profile/'),
  updateProfile: (profileData) => api.put('/api/users/profile/', profileData),
};

// ============ SERVICES DES UTILISATEURS ============
export const usersAPI = {
  getAll: (params = {}) => api.get('/api/users/users/', { params }),
  getById: (id) => api.get(`/api/users/users/${id}/`),
  createUser: (userData) => api.post('/api/users/users/', userData),
  updateUser: (id, userData) => api.put(`/api/users/users/${id}/`, userData),
  getProfile: () => api.get('/api/users/profile/'),
  updateProfile: (profileData) => api.put('/api/users/profile/', profileData),
  search: (query, params = {}) => api.get('/api/users/users/search/', {
    params: { q: query, ...params }
  })
};

// ============ SERVICES DES COMMANDES ============
export const ordersAPI = {
  getAll: (params = {}) => api.get('/api/orders/', { params }),
  getById: (id) => api.get(`/api/orders/${id}/`),
  create: (orderData) => api.post('/api/orders/', orderData),
  update: (id, orderData) => api.put(`/api/orders/${id}/`, orderData),
  getBuyerOrders: (params = {}) => api.get('/api/orders/', { 
    params: { buyer: true, ...params } 
  }),
  getFarmerOrders: (params = {}) => api.get('/api/orders/', { 
    params: { farmer: true, ...params } 
  }),
  getOrderItems: (orderId) => api.get(`/api/orders/${orderId}/items/`),
  updateOrderStatus: (orderId, status) => api.patch(`/api/orders/${orderId}/`, { status })
};

// ============ SERVICES DES ANALYTICS ============
export const analyticsAPI = {
  getDashboardStats: (params = {}) => 
    api.get('/api/analytics/dashboard/', { params })
      .catch(() => ({ 
        data: {
          total_products: 0,
          total_orders: 0,
          total_revenue: 0,
          active_users: 0
        }
      })),
  
  getSalesAnalytics: (params = {}) => 
    api.get('/api/analytics/sales/', { params })
      .catch(() => ({ 
        data: {
          monthly_sales: [],
          top_products: [],
          revenue_trend: []
        }
      })),
  
  getFarmerStats: (farmerId, params = {}) => 
    api.get(`/api/analytics/farmers/${farmerId}/stats/`, { params })
      .catch(() => ({ 
        data: {
          total_products: 0,
          total_orders: 0,
          total_revenue: 0,
          pending_orders: 0
        }
      })),
  
  getMonthlyRevenue: (params = {}) => 
    api.get('/api/analytics/revenue/monthly/', { params })
      .catch(() => ({ 
        data: {
          labels: [],
          data: []
        }
      })),
  
  getTopProducts: (params = {}) => 
    api.get('/api/analytics/products/top/', { params })
      .catch(() => ({ 
        data: []
      }))
};

// ============ SERVICES DES NOTIFICATIONS ============
export const notificationsAPI = {
  getAll: (params = {}) => api.get('/api/notifications/', { params }),
  getUnread: (params = {}) => api.get('/api/notifications/unread/', { params }),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/`, { read: true }),
  markAllAsRead: () => api.post('/api/notifications/mark-all-read/'),
  create: (notificationData) => api.post('/api/notifications/', notificationData),
  delete: (id) => api.delete(`/api/notifications/${id}/`)
};

// ============ SERVICES DE SANTÉ ============
export const healthCheck = {
  checkGateway: () => api.get('/health'),
  checkAuth: () => api.get('/api/auth/health/'),
  checkProducts: () => api.get('/api/products/produits/'),
  checkUsers: () => api.get('/api/users/health/'),
  checkOrders: () => api.get('/api/orders/health/'),
  checkAnalytics: () => api.get('/api/analytics/health/')
};

// ============ SERVICE DE TEST DE CONNEXION ============
export const testGatewayConnection = async () => {
  console.log('🔍 Testing Gateway connection to:', API_GATEWAY_URL);
  
  const endpoints = ['/health', '/api/health', '/actuator/health'];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`   Trying ${endpoint}...`);
      const response = await api.get(endpoint);
      console.log(`✅ Gateway UP via ${endpoint}:`, response.data);
      return { 
        success: true, 
        data: response.data,
        endpoint: endpoint,
        gatewayUrl: API_GATEWAY_URL
      };
    } catch (error) {
      console.log(`   ${endpoint} failed: ${error.message}`);
    }
  }
  
  console.error('❌ All endpoints failed');
  console.log(`
  🔧 Solutions:
  1. Check if proxy is running: docker-compose ps terra-proxy-service
  2. Check proxy logs: docker-compose logs terra-proxy-service
  3. Test manually: curl http://localhost:8082/health
  4. Verify Eureka: curl http://localhost:8761
  `);
  
  return { 
    success: false, 
    error: 'Gateway unreachable',
    gatewayUrl: API_GATEWAY_URL
  };
};

// ============ EXPORT PAR DÉFAUT ============
export default api;

// ============ TEST AUTOMATIQUE AU DÉMARRAGE ============
if (import.meta.env.DEV) {
  setTimeout(async () => {
    console.log('🧪 Test automatique de connexion...');
    try {
      // Tester la connexion aux catégories
      const categoriesResult = await categoriesAPI.getAll();
      console.log('✅ Catégories disponibles:', categoriesResult.data?.length || 0);
      
      // Tester la connexion aux produits
      const productsResult = await productsAPI.getAll({ limit: 1 });
      console.log('✅ Service produits accessible');
      
    } catch (error) {
      console.warn('⚠️ Connexion partiellement échouée:', error.message);
    }
  }, 3000);
}