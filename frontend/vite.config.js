import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement
  const env = loadEnv(mode, process.cwd(), '')
  
  // Configuration basée sur votre .env
  const API_GATEWAY_URL = env.VITE_API_GATEWAY_URL || 'http://localhost:8082'
  const AUTH_SERVICE_URL = env.VITE_AUTH_SERVICE_URL || 'http://localhost:8083'
  const USERS_SERVICE_URL = env.VITE_USERS_SERVICE_URL || 'http://localhost:8084'
  const PRODUCTS_SERVICE_URL = env.VITE_PRODUCTS_SERVICE_URL || 'http://localhost:8085'
  const ORDERS_SERVICE_URL = env.VITE_ORDERS_SERVICE_URL || 'http://localhost:8086'
  const NOTIFICATIONS_SERVICE_URL = env.VITE_NOTIFICATIONS_SERVICE_URL || 'http://localhost:4002'

  const isProduction = mode === 'production'
  
  return {
    // IMPORTANT: Base URL relative pour Docker
    base: isProduction ? './' : '/',
    
    plugins: [react()],
    
    // Configuration du serveur de développement
    server: {
      port: 5173,
      host: '0.0.0.0', // Important pour Docker
      strictPort: true,
      cors: true,
      // Proxy config pour le développement seulement
      proxy: !isProduction ? {
        // Routes via API Gateway
        '/api': {
          target: API_GATEWAY_URL,
          changeOrigin: true,
          secure: false,
        },
        // Routes directes vers les services (fallback)
        '/auth-service': {
          target: AUTH_SERVICE_URL,
          changeOrigin: true,
          secure: false,
        },
        '/users-service': {
          target: USERS_SERVICE_URL,
          changeOrigin: true,
          secure: false,
        },
        '/products-service': {
          target: PRODUCTS_SERVICE_URL,
          changeOrigin: true,
          secure: false,
        },
        '/orders-service': {
          target: ORDERS_SERVICE_URL,
          changeOrigin: true,
          secure: false,
        },
        '/notifications-service': {
          target: NOTIFICATIONS_SERVICE_URL,
          changeOrigin: true,
          secure: false,
        },
      } : undefined,
    },
    
    // Configuration du preview
    preview: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true,
    },
    
    // Configuration du build pour la production
    build: {
      outDir: 'dist',
      sourcemap: false, // Désactivé en production
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : undefined,
      
      // IMPORTANT: Configuration pour les assets
      rollupOptions: {
        output: {
          // Organisation claire des fichiers (VERSION CORRIGÉE)
          assetFileNames: (assetInfo) => {
            // Vérification de sécurité
            if (!assetInfo || !assetInfo.name) {
              return 'assets/[name]-[hash][extname]'
            }
            
            // Extraire l'extension
            const parts = assetInfo.name.split('.')
            if (parts.length < 2) {
              return 'assets/[name]-[hash][extname]'
            }
            
            const ext = parts.pop().toLowerCase()
            let category = 'misc'
            
            // Catégoriser par type de fichier
            if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'tiff', 'bmp', 'ico', 'webp'].includes(ext)) {
              category = 'img'
            } else if (['woff', 'woff2', 'ttf', 'eot', 'otf'].includes(ext)) {
              category = 'fonts'
            } else if (ext === 'css') {
              category = 'css'
            } else if (['js', 'mjs', 'cjs'].includes(ext)) {
              category = 'js'
            }
            
            return `assets/${category}/[name]-[hash][extname]`
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      
      // Augmenter la limite pour éviter les warnings
      chunkSizeWarningLimit: 800,
      
      // Vider le dossier dist avant chaque build
      emptyOutDir: true,
    },
    
    // Optimisation des dépendances
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios'],
      exclude: ['@heroicons/react'],
      force: !isProduction,
    },
    
    // Configuration CSS
    css: {
      postcss: './postcss.config.js',
      devSourcemap: !isProduction,
    },
    
    // Configuration des assets
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.gif'],
  }
})
