import axios from 'axios';

// ============ CONFIGURATION SIMPLIFIÉE ============
// TOUJOURS utiliser localhost depuis le navigateur
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

// ============ INTERCEPTEURS ESSENTIELS ============
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
      console.log(`💡 Test manually: curl ${API_GATEWAY_URL}/health`);
    }
    
    return Promise.reject(error);
  }
);

// ============ TEST DE CONNEXION AMÉLIORÉ ============
export const testGatewayConnection = async () => {
  console.log('🔍 Testing Gateway connection to:', API_GATEWAY_URL);
  
  // Test multiple endpoints
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
};

// ============ SERVICES DES PRODUITS ============
export const productsAPI = {
  getAll: (params = {}) => api.get('/api/products/produits/', { params }),
  getById: (id) => api.get(`/api/products/produits/${id}/`),
  getByFarmer: (farmerId, params = {}) => api.get('/api/products/produits/', { 
    params: { farmer: farmerId, ...params } 
  }),
  create: (productData) => api.post('/api/products/produits/', productData),
  update: (id, productData) => api.put(`/api/products/produits/${id}/`, productData),
  delete: (id) => api.delete(`/api/products/produits/${id}/`),
  search: (query, params = {}) => api.get('/api/products/produits/recherche/', { 
    params: { q: query, ...params } 
  }),
  getCategories: (params = {}) => api.get('/api/products/categories/', { params }),
};

// ============ SERVICES DES CATÉGORIES ============
export const categoriesAPI = {
  getAll: (params = {}) => api.get('/api/products/categories/', { params }),
  getById: (id) => api.get(`/api/products/categories/${id}/`),
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
};

// ============ SERVICES DE SANTÉ ============
export const healthCheck = {
  checkGateway: () => api.get('/health'),
  checkAuth: () => api.get('/api/auth/health/'),
};


// ============ SERVICES DES STATISTIQUES ============
export const analyticsAPI = {
  getDashboardStats: (params = {}) => api.get('/api/analytics/dashboard/', { params }).catch(() => ({ data: {} })),
  getSalesAnalytics: (params = {}) => api.get('/api/analytics/sales/', { params }).catch(() => ({ data: {} })),
  getFarmerStats: (farmerId, params = {}) => api.get(`/api/analytics/farmers/${farmerId}/stats/`, { params }).catch(() => ({ data: {} })),
  getFarmerAnalytics: (farmerId, params = {}) => api.get(`/api/analytics/farmers/${farmerId}/stats/`, { params }).catch(() => ({ data: {} })),
  getMonthlyRevenue: (params = {}) => api.get('/api/analytics/revenue/monthly/', { params }).catch(() => ({ data: {} })),
  getTopProducts: (params = {}) => api.get('/api/analytics/products/top/', { params }).catch(() => ({ data: {} })),
  getCustomerMetrics: (params = {}) => api.get('/api/analytics/customers/metrics/', { params }).catch(() => ({ data: {} })),
  generateReport: (reportData) => api.post('/api/analytics/reports/', reportData).catch(() => ({ data: {} })),
};
// ============ EXPORT PAR DÉFAUT ============
export default api;

// ============ TEST AUTOMATIQUE AU DÉMARRAGE ============
if (import.meta.env.DEV) {
  setTimeout(() => {
    console.log('🧪 Auto-testing Gateway connection...');
    testGatewayConnection();
  }, 2000);
}
