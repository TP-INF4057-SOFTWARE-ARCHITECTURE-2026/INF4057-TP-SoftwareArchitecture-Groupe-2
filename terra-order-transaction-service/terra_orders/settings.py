import os, sys
import environ
import requests
import json
from pathlib import Path
import threading
import time

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Environment variables
env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# Configuration Eureka Client
try:
    from py_eureka_client import eureka_client
    EUREKA_AVAILABLE = True
    print("✅ py-eureka-client importé avec succès")
except ImportError as e:
    print(f"⚠️ py-eureka-client non installé: {e}")
    print("🔄 L'enregistrement Eureka automatique sera désactivé")
    EUREKA_AVAILABLE = False

# Configuration Service
CONFIG_SERVICE_URL = env('CONFIG_SERVICE_URL', default='http://terra-conf-service:8080')
SERVICE_NAME = env('SERVICE_NAME', default='terra-order-transaction-service')
SERVICE_PROFILE = env('SERVICE_PROFILE', default='dev')

def get_config_from_config_service():
    """Récupère la configuration depuis le service de configuration Spring Boot"""
    config_url = f"{CONFIG_SERVICE_URL}/{SERVICE_NAME}-{SERVICE_PROFILE}.json"
    
    try:
        print(f"🔧 Tentative de récupération de la configuration depuis: {config_url}")
        response = requests.get(config_url, timeout=10)
        response.raise_for_status()
        
        config_data = response.json()
        print("✅ Configuration récupérée avec succès depuis le service de configuration")
        return config_data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Impossible de récupérer la configuration: {e}")
        print("🔄 Utilisation des valeurs par défaut...")
        return {}

def setup_configuration():
    """Configure l'application avec les valeurs du service de configuration ou les valeurs par défaut"""
    config_data = get_config_from_config_service()
    
    # DEBUG IMPORTANT - Afficher la structure complète
    if config_data:
        print(f"🎯 Configuration reçue - Clés: {list(config_data.keys())}")
    else:
        print("🔍 DEBUG - Aucune donnée de configuration reçue")
    
    # SECRET_KEY
    secret_key = None
    if config_data:
        secret_key = config_data.get('secret_key')
    
    # DEBUG
    debug = env.bool('DEBUG', default=True)
    
    # PORT
    server_port = None
    if config_data:
        server_port = (
            config_data.get('server', {}).get('port') or
            config_data.get('port')
        )
    
    # Si le port n'est pas trouvé dans la config, utiliser .env ou défaut
    if not server_port:
        server_port = env.int('SERVICE_PORT', default=8086)
    
    # Database configuration
    db_config = {}
    if config_data:
        db_config = config_data.get('database', {})
    
    # RabbitMQ configuration
    rabbitmq_config = {}
    if config_data:
        rabbitmq_config = config_data.get('rabbitmq', {})
    
    # Redis configuration
    redis_config = {}
    if config_data:
        redis_config = config_data.get('redis', {})
    
    return {
        'secret_key': secret_key,
        'debug': debug,
        'server_port': server_port,
        'db_config': db_config or {},
        'rabbitmq_config': rabbitmq_config or {},
        'redis_config': redis_config or {},
        'config_data': config_data
    }

# Chargement de la configuration
app_config = setup_configuration()

# Configuration Django de base avec fallbacks robustes
SECRET_KEY = app_config['secret_key'] or env('SECRET_KEY', default='terra-order-service-secret-key-2024-change-in-production')
DEBUG = app_config['debug']
SERVICE_PORT = app_config['server_port']
ALLOWED_HOSTS = [
    '*',
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'terra-conf-service'
    'terra-order-transaction-service',
    'terra-order-transaction-service.terra-network',
    'host.docker.internal'
]

print(f"🔧 Configuration finale:")
print(f"   - SERVICE_NAME: {SERVICE_NAME}")
print(f"   - SERVICE_PORT: {SERVICE_PORT}")
print(f"   - DEBUG: {DEBUG}")


# Configuration Business (fallback si config service non disponible)
BUSINESS_CONFIG = {}

if app_config['config_data']:
    BUSINESS_CONFIG = {
        'ORDER_CONFIG': app_config['config_data'].get('order', {}),
        'TRANSACTION_CONFIG': app_config['config_data'].get('transaction', {}),
        'PAYMENT_CONFIG': app_config['config_data'].get('payment', {}),
        'DELIVERY_CONFIG': app_config['config_data'].get('delivery', {}),
        'STOCK_CONFIG': app_config['config_data'].get('stock', {}),
        'NOTIFICATION_CONFIG': app_config['config_data'].get('notifications', {}),
        'EVENTS_CONFIG': app_config['config_data'].get('events', {}),
        'QUEUES_CONFIG': app_config['config_data'].get('queues', {}),
        'RATE_LIMITS': app_config['config_data'].get('rate_limits', {}),
        'TIMEOUTS': app_config['config_data'].get('timeouts', {}),
        'FEATURES': app_config['config_data'].get('features', {}),
        'CURRENCY': app_config['config_data'].get('currency', {}),
        'AUDIT': app_config['config_data'].get('audit', {}),
        'HEALTH_CHECK': app_config['config_data'].get('health_check', {}),
        'LOGGING_CONFIG': app_config['config_data'].get('logging', {}),
    }
else:
    # Fallback configuration
    BUSINESS_CONFIG = {
        'ORDER_CONFIG': {
            'status': {
                'pending': 'PENDING',
                'confirmed': 'CONFIRMED',
                'paid': 'PAID',
                'in_delivery': 'IN_DELIVERY',
                'delivered': 'DELIVERED',
                'completed': 'COMPLETED',
                'cancelled': 'CANCELLED'
            },
            'number_prefix': 'TRB'
        },
        'TRANSACTION_CONFIG': {
            'types': {
                'payment': 'PAYMENT',
                'refund': 'REFUND',
                'commission': 'COMMISSION',
                'payout': 'PAYOUT'
            },
            'payment_methods': {
                'mobile_money': 'MOBILE_MONEY',
                'orange_money': 'ORANGE_MONEY',
                'mtn_momo': 'MTN_MOMO',
                'cash': 'CASH',
                'bank_transfer': 'BANK_TRANSFER'
            },
            'status': {
                'pending': 'PENDING',
                'processing': 'PROCESSING',
                'success': 'SUCCESS',
                'failed': 'FAILED',
                'reversed': 'REVERSED'
            },
            'reference_prefix': 'TXN'
        },
        'PAYMENT_CONFIG': {
            'simulation_enabled': True,
            'platform_commission_rate': 5.0
        },
        'DELIVERY_CONFIG': {
            'base_fee': 500,
            'free_threshold': 10000
        }
    }

# Maintenant définir INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'channels',
    'order_app',
    'django_celery_results',
    'drf_spectacular',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'terra_orders.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'terra_orders.wsgi.application'
ASGI_APPLICATION = 'terra_orders.asgi.application'

# Database Configuration avec fallbacks robustes
db_config = app_config['db_config']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': db_config.get('name') or env('DB_NAME', default='terra_orders_db'),
        'USER': db_config.get('username') or env('DB_USER', default='terra_user'),
        'PASSWORD': db_config.get('password') or env('DB_PASSWORD', default='terra_password'),
        'HOST': db_config.get('host') or env('DB_HOST', default='terra-orders-db'),
        'PORT': db_config.get('port') or env('DB_PORT', default='5432'),
    }
}

print(f"🔧 Configuration Base de Données:")
print(f"   - HOST: {DATABASES['default']['HOST']}")
print(f"   - PORT: {DATABASES['default']['PORT']}")
print(f"   - NAME: {DATABASES['default']['NAME']}")

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Douala'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# CORS
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://frontend:5173",
]

# Service Configuration
SERVICE_CONFIG = {
    'name': SERVICE_NAME,
    'version': '1.0.0',
    'port': SERVICE_PORT,
}

# Microservices URLs
MICROSERVICES = {
    'config_service': CONFIG_SERVICE_URL,
    'eureka_service': env('EUREKA_SERVICE_URL', default='http://terra-registry-service:8761'),
}

# RabbitMQ Configuration
rabbitmq_config = app_config['rabbitmq_config']

RABBITMQ = {
    'host': rabbitmq_config.get('host') or env('RABBITMQ_HOST', default='terra-rabbitmq'),
    'port': rabbitmq_config.get('port') or env.int('RABBITMQ_PORT', default=5672),
    'username': rabbitmq_config.get('username') or env('RABBITMQ_USERNAME', default='guest'),
    'password': rabbitmq_config.get('password') or env('RABBITMQ_PASSWORD', default='guest'),
    'vhost': rabbitmq_config.get('virtual-host') or env('RABBITMQ_VHOST', default='/'),
}

# Celery Configuration
CELERY_BROKER_URL = f"amqp://{RABBITMQ['username']}:{RABBITMQ['password']}@{RABBITMQ['host']}:{RABBITMQ['port']}/{RABBITMQ['vhost']}"
CELERY_RESULT_BACKEND = 'django-db'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Channels for WebSockets
redis_config = app_config['redis_config']

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(
                redis_config.get('host') or env('REDIS_HOST', default='terra-redis'),
                redis_config.get('port') or env.int('REDIS_PORT', default=6379)
            )],
        },
    },
}

# Logging
import logging.config
LOGS_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOGS_DIR, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(LOGS_DIR, 'order_service.log'),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'order_app': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Swagger Settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'Terrabia Order & Transaction Service API',
    'DESCRIPTION': 'API for managing orders and transactions in Terrabia platform',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
# =============================================================================
# CONFIGURATION EUREKA CLIENT - VERSION CORRIGÉE
# =============================================================================

EUREKA_SERVER_URL = env('EUREKA_SERVER_URL', default='http://terra-registry-service:8761/eureka/')
EUREKA_ENABLED = env.bool('EUREKA_ENABLED', default=True)

def init_eureka_client():
    """Initialise et enregistre le service auprès d'Eureka - VERSION CORRIGÉE"""
    if not EUREKA_AVAILABLE or not EUREKA_ENABLED:
        print("⚠️ Client Eureka désactivé (non disponible ou explicitement désactivé)")
        return None
    
    try:
        print(f"🔧 Initialisation du client Eureka...")
        print(f"   Server: {EUREKA_SERVER_URL}")
        print(f"   App Name: {SERVICE_NAME}")
        print(f"   Port: {SERVICE_PORT}")
        
        # IMPORTANT: Utiliser les bons noms de paramètres
        # Vérifier la version de py-eureka-client
        import py_eureka_client
        print(f"   py-eureka-client version: {py_eureka_client.__version__}")
        
        # Configuration pour Docker - VERSION CORRIGÉE
        eureka_client.init(
            eureka_server=EUREKA_SERVER_URL.rstrip('/'),
            app_name=SERVICE_NAME.upper(),  # TERRA-ORDER-TRANSACTION-SERVICE
            instance_port=int(SERVICE_PORT),  # Convertir en int
            instance_host="terra-order-transaction-service",  # Nom Docker
            # instance_ip est optionnel, laisser py-eureka-client le déterminer
            renewal_interval_in_secs=30,
            duration_in_secs=90,
            # CORRECTION: vipAddress au lieu de vip_address
            vip_address=SERVICE_NAME,
            secure_vip_address=SERVICE_NAME,
            data_center_name="MyOwn",
            region="default",
            metadata={
                "VERSION": "1.0.0",
                "ENVIRONMENT": SERVICE_PROFILE.upper(),
                "SERVICE_TYPE": "DJANGO",
                "HEALTH_CHECK_URL": f"http://terra-order-transaction-service:{SERVICE_PORT}/health/"
            }
        )
        
        print("✅ Client Eureka initialisé avec succès!")
        return eureka_client
        
    except TypeError as e:
        # Si erreur de paramètre, essayer sans les paramètres problématiques
        print(f"⚠️ Erreur de paramètre: {e}")
        print("🔄 Essai avec configuration simplifiée...")
        try:
            eureka_client.init(
                eureka_server=EUREKA_SERVER_URL.rstrip('/'),
                app_name=SERVICE_NAME.upper(),
                instance_port=int(SERVICE_PORT),
                instance_host="terra-order-transaction-service",
            )
            print("✅ Client Eureka initialisé (version simplifiée)")
            return eureka_client
        except Exception as e2:
            print(f"❌ Échec même en simplifié: {e2}")
            return None
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation d'Eureka: {e}")
        import traceback
        traceback.print_exc()
        return None

def register_with_eureka_manual():
    """
    Enregistrement manuel alternatif - VERSION AMÉLIORÉE
    """
    eureka_url = EUREKA_SERVER_URL.rstrip('/')
    app_name = SERVICE_NAME.upper()  # TERRA-ORDER-TRANSACTION-SERVICE
    
    print(f"🎯 Configuration manuelle Eureka:")
    print(f"   URL: {eureka_url}")
    print(f"   App: {app_name}")
    print(f"   Port: {SERVICE_PORT}")
    print(f"   Hostname: terra-order-transaction-service")
    
    # Tester d'abord la résolution DNS
    try:
        import socket
        eureka_host = eureka_url.replace('http://', '').split('/')[0].split(':')[0]
        eureka_ip = socket.gethostbyname(eureka_host)
        print(f"🔍 DNS: {eureka_host} → {eureka_ip}")
    except Exception as dns_error:
        print(f"⚠️  DNS Error: {dns_error}")
    
    eureka_payload = {
        "instance": {
            "instanceId": f"terra-order-transaction-service:{SERVICE_PORT}",
            "app": app_name,
            "hostName": "terra-order-transaction-service",
            "ipAddr": "terra-order-transaction-service",  # Nom DNS
            "status": "UP",
            "port": {
                "$": int(SERVICE_PORT),  # Convertir en int
                "@enabled": "true"
            },
            "securePort": {
                "$": 443,
                "@enabled": "false"
            },
            "healthCheckUrl": f"http://terra-order-transaction-service:{SERVICE_PORT}/health/",
            "statusPageUrl": f"http://terra-order-transaction-service:{SERVICE_PORT}/info/",
            "homePageUrl": f"http://terra-order-transaction-service:{SERVICE_PORT}/",
            "vipAddress": SERVICE_NAME.lower(),
            "secureVipAddress": SERVICE_NAME.lower(),
            "dataCenterInfo": {
                "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
                "name": "MyOwn"
            },
            "leaseInfo": {
                "renewalIntervalInSecs": 30,
                "durationInSecs": 90
            },
            "metadata": {
                "version": "1.0.0",
                "environment": SERVICE_PROFILE.upper(),
                "serviceType": "DJANGO",
                "management.port": str(SERVICE_PORT),
                "instanceId": f"terra-order-transaction-service:{SERVICE_PORT}"
            }
        }
    }
    
    urls_to_try = [
        f"{eureka_url}/apps/{app_name}",
        f"{eureka_url.rstrip('/eureka')}/eureka/apps/{app_name}",
    ]
    
    for i, url in enumerate(urls_to_try):
        try:
            print(f"🔧 Tentative {i+1} sur: {url}")
            
            # Debug: afficher le payload
            if i == 0:
                print(f"📦 Payload: {json.dumps(eureka_payload, indent=2)}")
            
            response = requests.post(
                url,
                json=eureka_payload,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            print(f"   Statut HTTP: {response.status_code}")
            print(f"   Réponse: {response.text[:200]}")
            
            if response.status_code in [200, 204]:
                print("✅ Enregistrement manuel Eureka réussi!")
                
                # Démarrer le heartbeat manuel
                start_manual_heartbeat(eureka_url, app_name)
                return True
            elif response.status_code == 404:
                print(f"⚠️  URL non trouvée: {url}")
                continue
            else:
                print(f"⚠️  Réponse inattendue: {response.status_code}")
                
        except requests.exceptions.ConnectionError as e:
            print(f"❌ Impossible de se connecter à Eureka: {e}")
        except requests.exceptions.Timeout:
            print("❌ Timeout lors de la connexion à Eureka")
        except Exception as e:
            print(f"❌ Erreur avec {url}: {e}")
    
    return False

def start_manual_heartbeat(eureka_url, app_name):
    """Démarre le heartbeat périodique manuel"""
    import threading
    
    def heartbeat():
        instance_id = f"terra-order-transaction-service:{SERVICE_PORT}"
        heartbeat_url = f"{eureka_url}/apps/{app_name}/{instance_id}"
        
        while True:
            time.sleep(25)  # 5 secondes avant la deadline de 30s
            try:
                response = requests.put(heartbeat_url, timeout=5)
                if response.status_code in [200, 204, 404]:
                    # 404 signifie que l'instance n'est plus enregistrée, on réessaye
                    pass
                else:
                    print(f"⚠️  Heartbeat échoué: {response.status_code}")
            except:
                pass
    
    thread = threading.Thread(target=heartbeat, daemon=True)
    thread.start()
    print("💓 Heartbeat manuel démarré")

def start_eureka_registration():
    """Démarre l'enregistrement Eureka avec retry - VERSION AMÉLIORÉE"""
    if not EUREKA_ENABLED:
        print("⚠️ Eureka désactivé via EUREKA_ENABLED=false")
        return
    
    print("=" * 60)
    print("🔄 DÉMARRAGE DE L'ENREGISTREMENT EUREKA")
    print("=" * 60)
    
    # Attendre un peu que les services soient démarrés
    print("⏳ Attente initiale de 15 secondes...")
    time.sleep(15)
    
    # Essayer d'abord le client automatique
    print("\n1️⃣  Tentative avec le client Eureka automatique...")
    client = init_eureka_client()
    
    if client:
        print("✅ Enregistrement Eureka automatique réussi!")
        return
    
    # Fallback: enregistrement manuel
    print("\n2️⃣  Tentative d'enregistrement manuel...")
    max_retries = 3  # Réduit pour éviter trop d'attente
    for attempt in range(max_retries):
        print(f"\n🔄 Tentative manuelle {attempt + 1}/{max_retries}...")
        if register_with_eureka_manual():
            print("✅ Enregistrement Eureka manuel réussi!")
            break
        else:
            wait_time = (attempt + 1) * 3  # Backoff plus court
            print(f"⏳ Nouvelle tentative dans {wait_time} secondes...")
            time.sleep(wait_time)
    else:
        print("❌ Échec de l'enregistrement Eureka après toutes les tentatives")
        print("ℹ️  Le service fonctionnera sans Eureka")

# Démarrer l'enregistrement Eureka au démarrage de l'application
if (not 'test' in sys.argv and 
    not 'migrate' in sys.argv and 
    not 'collectstatic' in sys.argv and
    not 'makemigrations' in sys.argv):
    
    # Démarrer dans un thread séparé avec un délai
    def delayed_eureka_start():
        """Attendre que Django soit complètement démarré"""
        print("⏳ Attente du démarrage complet de Django avant Eureka...")
        time.sleep(25)  # Attendre plus longtemps
        start_eureka_registration()
    
    eureka_thread = threading.Thread(target=delayed_eureka_start)
    eureka_thread.daemon = True
    eureka_thread.start()
    print("🧵 Thread Eureka démarré (démarrage dans 25 secondes)")
