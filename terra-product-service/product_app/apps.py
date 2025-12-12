from django.apps import AppConfig
import threading
import time
import requests
import logging
import socket
import os
import sys
from .config_loader import get_app_config
# from .rabbitmq_consumer import start_consumer  # décommentez si utilisé

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductAppConfig(AppConfig):
    name = 'product_app'
    default_auto_field = 'django.db.models.BigAutoField'
    
    def __init__(self, app_name, app_module):
        super().__init__(app_name, app_module)
        self._threads_started = False
        self.heartbeat_thread = None
        self.running = threading.Event()
        self.instance_id = None
        self.eureka_url = None

    def ready(self):
        # Éviter double lancement (Django recharge parfois ready())
        if self._threads_started:
            return
        self._threads_started = True

        # Désactiver en mode test
        if self._is_test_mode():
            logger.info("[Product] Mode test → Eureka & RabbitMQ désactivés")
            return

        logger.info("[Product] Démarrage des services background (Eureka)")

        # Thread Eureka
        threading.Thread(target=self._start_eureka_registration, daemon=True).start()

        # Thread RabbitMQ (décommentez si nécessaire)
        # threading.Thread(target=start_consumer, daemon=True).start()

    def _is_test_mode(self):
        """Détecte si on est en mode test"""
        return any([
            'pytest' in sys.modules,
            'test' in sys.argv,
            'test' in os.environ.get('DJANGO_SETTINGS_MODULE', ''),
            os.environ.get('DISABLE_EUREKA', 'false').lower() == 'true'
        ])

    def _start_eureka_registration(self):
        """Démarre l'enregistrement Eureka après délai"""
        # Attendre que le serveur soit prêt
        time.sleep(8)
        
        try:
            if self._register_to_eureka():
                self._start_heartbeat()
        except Exception as e:
            logger.error(f"[Eureka] ❌ Erreur lors de l'enregistrement initial: {e}")

    def _register_to_eureka(self):
        """Enregistre le service auprès d'Eureka"""
        try:
            # Récupérer la configuration
            config = get_app_config()
            
            # PORT - toujours 8085 pour terra-product-service
            port = "8085"
            
            # HOSTNAME - DOIT être "terra-product-service" pour la découverte DNS
            hostname = "terra-product-service"
            
            # Instance ID
            self.instance_id = f"{hostname}:{port}"
            
            # URL Eureka
            self.eureka_url = os.getenv("EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE", 
                                      "http://terra-registry-service:8761/eureka")
            
            # Nettoyer l'URL
            self.eureka_url = self.eureka_url.rstrip("/")
            
            # Payload d'enregistrement Eureka
            payload = {
                "instance": {
                    "instanceId": self.instance_id,
                    "hostName": hostname,  # "terra-product-service"
                    "app": "TERRA-PRODUCT-SERVICE",  # Nom en majuscules pour Eureka
                    "ipAddr": hostname,    # "terra-product-service" - important pour DNS
                    "vipAddress": "terra-product-service",
                    "secureVipAddress": "terra-product-service",
                    "port": {"$": int(port), "@enabled": True},
                    "securePort": {"$": 443, "@enabled": False},
                    "status": "UP",
                    "healthCheckUrl": f"http://{hostname}:{port}/health",
                    "statusPageUrl": f"http://{hostname}:{port}/info",
                    "homePageUrl": f"http://{hostname}:{port}/",
                    "dataCenterInfo": {
                        "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
                        "name": "MyOwn"
                    },
                    "metadata": {
                        "instanceId": self.instance_id,
                        "management.port": port,
                        "version": os.getenv("APP_VERSION", "1.0.0"),
                        "service.type": "product",
                        "tags": "product,api,rest"
                    },
                    "leaseInfo": {
                        "renewalIntervalInSecs": 30,
                        "durationInSecs": 90,
                        "registrationTimestamp": int(time.time() * 1000)
                    }
                }
            }

            # Enregistrement auprès d'Eureka
            resp = requests.post(
                f"{self.eureka_url}/apps/TERRA-PRODUCT-SERVICE",
                json=payload,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                timeout=15
            )
            
            # Log du résultat
            if resp.status_code in [200, 204]:
                logger.info(f"[Eureka] ✅ TERRA-PRODUCT-SERVICE enregistré : {self.instance_id}")
                logger.info(f"[Eureka] Hostname: {hostname}, Port: {port}")
                return True
                
            else:
                logger.error(f"[Eureka] ❌ Échec enregistrement : {self.instance_id} → {resp.status_code}")
                if resp.text:
                    logger.error(f"Réponse Eureka: {resp.text[:200]}")
                return False

        except requests.exceptions.ConnectionError as e:
            logger.error(f"[Eureka] ❌ Impossible de se connecter à Eureka à {self.eureka_url}")
            logger.error(f"Détail: {e}")
            
            # Debug: tester la résolution DNS
            try:
                import socket
                ip = socket.gethostbyname("terra-registry-service")
                logger.info(f"[Debug] terra-registry-service résolu en: {ip}")
            except Exception as dns_error:
                logger.error(f"[Debug] Échec résolution DNS: {dns_error}")
            
            # Réessayer après délai
            logger.info(f"[Eureka] ⏳ Nouvelle tentative dans 30 secondes...")
            time.sleep(30)
            return self._register_to_eureka()
            
        except Exception as e:
            logger.error(f"[Eureka] ❌ Erreur lors de l'enregistrement: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False

    def _start_heartbeat(self):
        """Démarre le heartbeat périodique"""
        if not self.instance_id or not self.eureka_url:
            logger.error("[Eureka] ❌ Impossible de démarrer le heartbeat: instance non enregistrée")
            return
            
        self.running.set()
        
        def heartbeat_loop():
            failed_attempts = 0
            max_failed_attempts = 3
            
            while self.running.is_set():
                try:
                    time.sleep(25)  # 5 secondes avant la deadline de 30s
                    
                    # Envoi du heartbeat
                    resp = requests.put(
                        f"{self.eureka_url}/apps/TERRA-PRODUCT-SERVICE/{self.instance_id}",
                        timeout=10
                    )
                    
                    if resp.status_code in [200, 204]:
                        failed_attempts = 0
                        logger.debug(f"[Eureka] ♥ Heartbeat pour {self.instance_id}")
                    else:
                        failed_attempts += 1
                        logger.warning(f"[Eureka] ❌ Heartbeat échoué ({failed_attempts}/{max_failed_attempts})")
                        
                        if failed_attempts >= max_failed_attempts:
                            logger.warning("[Eureka] 🔄 Trop d'échecs, tentative de re-registration...")
                            if self._register_to_eureka():
                                failed_attempts = 0
                            
                except requests.exceptions.RequestException as e:
                    failed_attempts += 1
                    logger.warning(f"[Eureka] ❌ Erreur réseau heartbeat: {e}")
                    
                    if failed_attempts >= max_failed_attempts:
                        logger.warning("[Eureka] 🔄 Tentative de re-registration après erreurs réseau")
                        if self._register_to_eureka():
                            failed_attempts = 0
                
                except Exception as e:
                    logger.error(f"[Eureka] ⚠️ Erreur inattendue dans heartbeat: {e}")
        
        self.heartbeat_thread = threading.Thread(target=heartbeat_loop, daemon=True)
        self.heartbeat_thread.start()
        logger.info("[Eureka] ✅ Thread heartbeat démarré")

    def deregister_from_eureka(self):
        """Désenregistre le service d'Eureka (graceful shutdown)"""
        logger.info("[Eureka] 🛑 Démarrage du désenregistrement...")
        self.running.clear()
        
        if self.heartbeat_thread:
            self.heartbeat_thread.join(timeout=5)
        
        if self.instance_id and self.eureka_url:
            try:
                requests.delete(
                    f"{self.eureka_url}/apps/TERRA-PRODUCT-SERVICE/{self.instance_id}",
                    timeout=10
                )
                logger.info(f"[Eureka] ✅ Service TERRA-PRODUCT-SERVICE désenregistré")
            except Exception as e:
                logger.warning(f"[Eureka] ⚠️ Erreur lors du désenregistrement: {e}")
        else:
            logger.warning("[Eureka] ⚠️ Instance non enregistrée, pas de désenregistrement nécessaire")
