import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// Configuration par défaut (fallback)
const defaultConfig = {
  port: process.env.PORT || 4002,
  serviceName: process.env.SERVICE_NAME || 'terra-notification-service',
  database: {
    host: process.env.DB_HOST || 'terra-notification-db',
    user: process.env.DB_USER || 'terra_notification_user',
    password: process.env.DB_PASSWORD || 'terra_notification_pass',
    name: process.env.DB_NAME || 'terra_notification_db'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://terra-rabbitmq:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'user.events',
    queue: process.env.RABBITMQ_QUEUE || 'queue.user.created'
  },
  email: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  eureka: {
    host: process.env.EUREKA_HOST || 'terra-registry-service',
    port: process.env.EUREKA_PORT || 8761
  }
};

let currentConfig = { ...defaultConfig };

export async function initializeConfig() {
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[${timestamp}] [Config] [INFO] 📡 Fetching configuration from Config Service...`);
    
    const remoteConfig = await fetchConfigFromSpringConfig();
    
    // Fusion intelligente qui garde les valeurs par défaut
    currentConfig = {
      port: remoteConfig.port || defaultConfig.port,
      serviceName: remoteConfig.serviceName || defaultConfig.serviceName,
      database: { ...defaultConfig.database, ...remoteConfig.database },
      rabbitmq: { ...defaultConfig.rabbitmq, ...remoteConfig.rabbitmq },
      email: { ...defaultConfig.email, ...remoteConfig.email },
      eureka: { ...defaultConfig.eureka, ...remoteConfig.eureka }
    };
    
    console.log(`[${timestamp}] [Config] [INFO] ✅ Configuration loaded successfully`);
    console.log(`[${timestamp}] [Config] [INFO]    Port: ${currentConfig.port}`);
    console.log(`[${timestamp}] [Config] [INFO]    Service: ${currentConfig.serviceName}`);
    console.log(`[${timestamp}] [Config] [INFO]    Eureka: ${currentConfig.eureka.host}:${currentConfig.eureka.port}`);
    console.log(`[${timestamp}] [Config] [INFO]    Database: ${currentConfig.database.host}/${currentConfig.database.name}`);
    console.log(`[${timestamp}] [Config] [INFO]    RabbitMQ: ${currentConfig.rabbitmq.url}`);
    
    return currentConfig;
    
  } catch (error) {
    console.warn(`[${timestamp}] [Config] [WARN] ⚠️ Using default configuration (Config Service unavailable)`);
    console.warn(`[${timestamp}] [Config] [WARN] Error: ${error.message}`);
    console.log(`[${timestamp}] [Config] [INFO] 🔧 Default port: ${defaultConfig.port}`);
    console.log(`[${timestamp}] [Config] [INFO] 🔧 Default Eureka: ${defaultConfig.eureka.host}:${defaultConfig.eureka.port}`);
    return currentConfig;
  }
}

async function fetchConfigFromSpringConfig() {
  const configServiceUrl = process.env.CONFIG_SERVICE_URL || 'http://terra-conf-service:8080';
  const serviceName = process.env.SERVICE_NAME || 'terra-notification-service';
  const configUrl = `${configServiceUrl}/${serviceName}/default`;
  
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[${timestamp}] [Config] [INFO] 🔧 Calling Config Service: ${configUrl}`);
    
    const response = await fetch(configUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 secondes timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const configData = await response.json();
    console.log(`[${timestamp}] [Config] [INFO] 📋 Config Service response received`);
    console.log(`[${timestamp}] [Config] [DEBUG] Response keys: ${Object.keys(configData).join(', ')}`);
    
    return extractConfigFromSpringResponse(configData);
    
  } catch (error) {
    console.error(`[${timestamp}] [Config] [ERROR] ❌ Config Service error: ${error.message}`);
    if (error.stack) {
      console.error(`[${timestamp}] [Config] [ERROR] Stack: ${error.stack}`);
    }
    throw error;
  }
}

function extractConfigFromSpringResponse(springConfig) {
  const timestamp = new Date().toISOString();
  const config = {};
  
  if (springConfig.propertySources && springConfig.propertySources.length > 0) {
    // Extraire toutes les propriétés
    const allProperties = {};
    springConfig.propertySources.forEach(source => {
      Object.assign(allProperties, source.source);
    });
    
    const propertyKeys = Object.keys(allProperties);
    console.log(`[${timestamp}] [Config] [INFO] 🔍 Properties found: ${propertyKeys.length} properties`);
    console.log(`[${timestamp}] [Config] [DEBUG] Property keys: ${propertyKeys.slice(0, 10).join(', ')}${propertyKeys.length > 10 ? '...' : ''}`);
    
    // Extraction avec valeurs par défaut
    config.port = parseInt(allProperties['server.port']) || defaultConfig.port;
    config.serviceName = allProperties['spring.application.name'] || defaultConfig.serviceName;
    
    console.log(`[${timestamp}] [Config] [DEBUG] Extracted port: ${config.port}`);
    console.log(`[${timestamp}] [Config] [DEBUG] Extracted serviceName: ${config.serviceName}`);
    
    // Configuration base de données
    const dbUrl = allProperties['spring.datasource.url'];
    config.database = {
      host: extractHostFromUrl(dbUrl) || defaultConfig.database.host,
      user: allProperties['spring.datasource.username'] || defaultConfig.database.user,
      password: allProperties['spring.datasource.password'] || defaultConfig.database.password,
      name: extractDbName(dbUrl) || defaultConfig.database.name
    };
    
    console.log(`[${timestamp}] [Config] [DEBUG] Database config: ${config.database.host}/${config.database.name}`);
    
    // Configuration RabbitMQ
    const rabbitmqHost = allProperties['spring.rabbitmq.host'];
    const rabbitmqPort = allProperties['spring.rabbitmq.port'] || 5672;
    config.rabbitmq = {
      url: rabbitmqHost 
        ? `amqp://${rabbitmqHost}:${rabbitmqPort}`
        : defaultConfig.rabbitmq.url,
      exchange: allProperties['notification.rabbitmq.exchange'] || defaultConfig.rabbitmq.exchange,
      queue: allProperties['notification.rabbitmq.queue'] || defaultConfig.rabbitmq.queue
    };
    
    console.log(`[${timestamp}] [Config] [DEBUG] RabbitMQ config: ${config.rabbitmq.url}`);
    
    // Configuration Email
    config.email = {
      user: allProperties['spring.mail.username'] || defaultConfig.email.user,
      pass: allProperties['spring.mail.password'] || defaultConfig.email.pass
    };
    
    // Support pour les deux formats de clés Eureka
    const eurekaUrl = allProperties['eureka.client.service-url.defaultZone'] || 
                     allProperties['eureka.client.serviceUrl.defaultZone'] ||
                     allProperties['eureka.client.service-url.default-zone'];
    
    config.eureka = {
      host: extractEurekaHost(eurekaUrl) || defaultConfig.eureka.host,
      port: extractEurekaPort(eurekaUrl) || defaultConfig.eureka.port
    };
    
    console.log(`[${timestamp}] [Config] [DEBUG] Eureka config: ${config.eureka.host}:${config.eureka.port}`);
  } else {
    console.warn(`[${timestamp}] [Config] [WARN] No propertySources found in Spring Config response`);
  }
  
  return config;
}

function extractHostFromUrl(url) {
  if (!url) return null;
  const match = url.match(/:\/\/([^\/:]+)/);
  return match ? match[1] : null;
}

function extractDbName(url) {
  if (!url) return null;
  const match = url.match(/\/([^\/?]+)(\?|$)/);
  return match ? match[1] : null;
}

function extractEurekaHost(url) {
  if (!url) return null;
  const match = url.match(/https?:\/\/([^:]+)/);
  return match ? match[1] : 'localhost';
}

function extractEurekaPort(url) {
  if (!url) return null;
  const match = url.match(/https?:\/\/[^:]+:(\d+)/);
  return match ? parseInt(match[1]) : 8761;
}

// ⭐ AJOUTEZ LES EXPORTS POUR COMPATIBILITÉ ⭐
export const port = currentConfig.port;
export const serviceName = currentConfig.serviceName;
export const rabbiturl = currentConfig.rabbitmq.url;
export const emailUser = currentConfig.email.user;
export const emailPass = currentConfig.email.pass;

export default currentConfig;
