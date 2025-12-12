// Configuration des logs pour Docker (stdout/stderr)
process.stdout.setEncoding('utf8');
process.stderr.setEncoding('utf8');

// Logger amélioré pour Docker
const logger = {
  info: (msg, ...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${msg}`, ...args);
  },
  error: (msg, ...args) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${msg}`, ...args);
  },
  debug: (msg, ...args) => {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] [DEBUG] ${msg}`, ...args);
  }
};

logger.info('🚀 Notification Service starting...');

import express from 'express';
import { connectDB } from './database/index.js';
import { connectRabbitMQ } from './events/rabbitmq.js';
import { startConsumer } from './events/consumer.js';
import { startodercreationconsumer } from './events/consumeordercreation.js';
import { initializeConfig } from './config/index.js';
import Notification from './models/Notification.js';

import UserCreated from './routes/usercreated.Routes.js';
import ordercreated from './routes/ordercreated.Routes.js';
import ordercompleted from './routes/ordercompleted.routes.js';
import orderpaid from './routes/orderpaid.routes.js';
import ordercancelled from './routes/order.cancelled.routes.js';

import { startodercancelledconsumer } from './events/consumeordercamcelled.js';
import { startoderpaidconsumer } from './events/consumeorderpaid.js';
import { startodercompletionconsumer } from './events/consumordercompletion.js';
import eurekaService from './services/eurekaClient.js';

(async () => {
  let server = null;
  
  try {
    logger.info('📡 Fetching configuration from Config Service...');
    
    const config = await initializeConfig();
    logger.info('✅ Configuration loaded successfully');
    logger.info(`🔧 Port: ${config.port}, Service: ${config.serviceName}`);
    logger.info(`📡 Eureka: ${config.eureka.host}:${config.eureka.port}`);
    logger.info(`🗄️  Database: ${config.database.host}/${config.database.name}`);
    logger.info(`🐇 RabbitMQ: ${config.rabbitmq.url}`);

    // Initialiser Eureka avec la config chargée
    logger.info('🔧 Initializing Eureka client...');
    eurekaService.initialize(config);

    const app = express();
    app.use(express.json());

    // Route pour tester que le service est en marche
    app.get('/', (req, res) => {
      res.json({
        service: 'Notification Service',
        status: 'RUNNING',
        version: '1.0.0',
        port: config.port,
        endpoints: {
          health: '/health',
          info: '/info',
          consume: '/api/consume/user-created',
          manualTrigger: '/api/events/user-created'
        },
        eurekaRegistered: eurekaService.isConnected(),
        timestamp: new Date().toISOString()
      });
    });

    // Routes RabbitMQ
    app.use('/api', UserCreated);
    app.use('/api', ordercreated);
    app.use('/api', ordercompleted);
    app.use('/api', orderpaid);
    app.use('/api', ordercancelled);
    
    // Health check pour Eureka
    app.get('/health', (req, res) => {
      res.json({
        status: 'UP',
        service: 'Notification Service',
        timestamp: new Date().toISOString(),
        port: config.port,
        eurekaRegistered: eurekaService.isConnected(),
        database: 'connected',
        rabbitmq: 'connected'
      });
    });

    // Info endpoint pour Eureka
    app.get('/info', (req, res) => {
      res.json({
        app: {
          name: 'TERRA-NOTIFICATION-SERVICE',
          version: '1.0.0',
          description: 'Notification Microservice'
        }
      });
    });

    logger.info('🔌 Connecting to database...');
    await connectDB();
    logger.info('✅ Database connected');

    logger.info('🔄 Syncing Notification model...');
    await Notification.sync();
    logger.info('✅ Notification model synced');

    logger.info('🐇 Connecting to RabbitMQ...');
    await connectRabbitMQ();
    logger.info('✅ RabbitMQ connected');

    logger.info('👤 Starting user consumer...');
    await startConsumer();

    logger.info('✅ Starting order completion consumer...');
    await startodercompletionconsumer();

    logger.info('❌ Starting order cancelled consumer...');
    await startodercancelledconsumer();

    logger.info('🛒 Starting order creation consumer...');
    await startodercreationconsumer();

    logger.info('💳 Starting order paid consumer...');
    await startoderpaidconsumer();

    logger.info('🎉 All consumers started successfully');

    // Démarrer le serveur
    server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Notification Service running on port ${config.port}`);
      logger.info(`🌐 Health endpoint: http://0.0.0.0:${config.port}/health`);
      logger.info(`📊 Info endpoint: http://0.0.0.0:${config.port}/info`);
      
      // Attendre un peu avant d'enregistrer sur Eureka pour s'assurer que le serveur est prêt
      setTimeout(() => {
        logger.info('📡 Registering with Eureka...');
        eurekaService.start();
        
        // Vérifier l'enregistrement après 5 secondes
        setTimeout(() => {
          if (eurekaService.isConnected()) {
            logger.info('✅ Successfully registered with Eureka');
          } else {
            logger.warn('⚠️ Eureka registration pending...');
          }
        }, 5000);
      }, 2000);
    });

    // Gestion propre de l'arrêt
    const gracefulShutdown = () => {
      logger.info('🛑 Shutting down gracefully...');
      
      if (eurekaService) {
        eurekaService.stop();
      }
      
      if (server) {
        server.close(() => {
          logger.info('✅ Server closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
      
      // Force shutdown après 10s
      setTimeout(() => {
        logger.error('⏰ Force shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Gestion des erreurs non capturées
    process.on('uncaughtException', (err) => {
      logger.error('💥 Uncaught Exception:', err);
      logger.error('Stack:', err.stack);
      gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise);
      logger.error('Reason:', reason);
      gracefulShutdown();
    });

  } catch (err) {
    logger.error('❌ Startup error:', err.message);
    logger.error('Stack:', err.stack);
    
    // Essayer de s'enregistrer quand même sur Eureka si possible
    try {
      if (eurekaService) {
        eurekaService.stop();
      }
    } catch (e) {
      logger.error('Error stopping Eureka:', e.message);
    }
    
    process.exit(1);
  }
})();
