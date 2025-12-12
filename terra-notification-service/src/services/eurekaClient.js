// services/eurekaClient.js - VERSION COMPLÈTEMENT REFACTORISÉE
import { Eureka } from 'eureka-js-client';

class EurekaService {
  constructor() {
    this.client = null;
    this.isRegistered = false;
    this.config = null;
  }

  initialize(config) {
    if (!config) {
      throw new Error('Configuration is required for Eureka initialization');
    }

    this.config = config;
    const { port = 4002, serviceName = 'terra-notification-service', eureka } = config;
    
    // IMPORTANT: Utiliser le nom Docker comme hostname
    const hostName = process.env.HOSTNAME || 'terra-notification-service';
    const eurekaHost = eureka?.host || process.env.EUREKA_HOST || 'terra-registry-service';
    const eurekaPort = eureka?.port || process.env.EUREKA_PORT || 8761;

    const timestamp = new Date().toISOString();
    const logger = {
      info: (msg) => console.log(`[${timestamp}] [Eureka] [INFO] ${msg}`),
      warn: (msg) => console.warn(`[${timestamp}] [Eureka] [WARN] ${msg}`),
      error: (msg) => console.error(`[${timestamp}] [Eureka] [ERROR] ${msg}`),
      debug: (msg) => console.debug(`[${timestamp}] [Eureka] [DEBUG] ${msg}`)
    };

    logger.info(`🎯 Initializing Eureka registration`);
    logger.info(`   Service: ${serviceName.toUpperCase()}`);
    logger.info(`   Port: ${port}`);
    logger.info(`   Hostname: ${hostName}`);
    logger.info(`   Eureka Server: ${eurekaHost}:${eurekaPort}`);

    try {
      this.client = new Eureka({
        // Configuration Eureka
        eureka: {
          host: eurekaHost,
          port: eurekaPort,
          servicePath: '/eureka/apps/',
          maxRetries: 10,
          requestRetryDelay: 2000,
          fetchRegistry: false,
          registerWithEureka: true,
        },
        
        // Configuration de l'instance
        instance: {
          app: 'TERRA-NOTIFICATION-SERVICE',
          hostName: hostName,
          ipAddr: hostName,
          instanceId: `${hostName}:${port}`,
          statusPageUrl: `http://${hostName}:${port}/health`,
          healthCheckUrl: `http://${hostName}:${port}/health`,
          homePageUrl: `http://${hostName}:${port}`,
          port: {
            '$': parseInt(port),
            '@enabled': true,
          },
          vipAddress: 'TERRA-NOTIFICATION-SERVICE',
          secureVipAddress: 'TERRA-NOTIFICATION-SERVICE',
          dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
          },
          metadata: {
            'instanceId': `${hostName}:${port}`,
            'version': process.env.APP_VERSION || '1.0.0',
            'service.type': 'notification'
          },
          leaseInfo: {
            renewalIntervalInSecs: 30,
            durationInSecs: 90
          }
        },
        
        // Logger amélioré
        logger: logger
      });

      // Événements avec logging amélioré
      this.client.on('started', () => {
        logger.info('🚀 Eureka client started');
      });

      this.client.on('registered', () => {
        this.isRegistered = true;
        logger.info(`✅ Successfully registered: ${serviceName.toUpperCase()} (${hostName}:${port})`);
      });

      this.client.on('deregistered', () => {
        this.isRegistered = false;
        logger.warn('🏁 Deregistered from Eureka');
      });

      this.client.on('heartbeat', () => {
        logger.debug('💓 Heartbeat sent to Eureka');
      });

      this.client.on('registryUpdated', () => {
        logger.debug('📋 Registry updated');
      });

      this.client.on('registryFetchFailed', (error) => {
        logger.warn(`⚠️ Registry fetch failed: ${error.message}`);
      });

      this.client.on('heartbeatFailed', (error) => {
        logger.error(`❌ Heartbeat failed: ${error.message}`);
      });

      logger.info('✅ Eureka client initialized successfully');
      return this.client;
      
    } catch (error) {
      logger.error(`💥 Failed to initialize Eureka client: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }

  start() {
    if (!this.client) {
      if (!this.config) {
        console.error('[Eureka] ❌ Cannot start: Configuration not initialized');
        return;
      }
      this.initialize(this.config);
    }

    try {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [Eureka] [INFO] Starting Eureka registration...`);
      
      this.client.start(error => {
        const timestamp = new Date().toISOString();
        if (error) {
          console.error(`[${timestamp}] [Eureka] [ERROR] Registration failed: ${error.message}`);
          console.error(`[${timestamp}] [Eureka] [ERROR] Stack: ${error.stack}`);
          console.log(`[${timestamp}] [Eureka] [INFO] Retrying in 10 seconds...`);
          setTimeout(() => this.start(), 10000);
        } else {
          console.log(`[${timestamp}] [Eureka] [INFO] Registration process started`);
        }
      });
      
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [Eureka] [ERROR] Start error: ${error.message}`);
      console.error(`[${timestamp}] [Eureka] [ERROR] Stack: ${error.stack}`);
    }
  }

  stop() {
    if (this.client) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [Eureka] [INFO] Stopping Eureka client...`);
      try {
        this.client.stop();
        this.isRegistered = false;
        console.log(`[${timestamp}] [Eureka] [INFO] ✅ Eureka client stopped`);
      } catch (error) {
        console.error(`[${timestamp}] [Eureka] [ERROR] Error stopping client: ${error.message}`);
      }
    }
  }

  isConnected() {
    return this.isRegistered;
  }
}

export default new EurekaService();
