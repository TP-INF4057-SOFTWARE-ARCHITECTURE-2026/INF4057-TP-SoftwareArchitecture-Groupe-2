# eureka_client.py
import threading
import time
import os
import logging
import requests
from typing import Optional, Dict, Any
from django.conf import settings

logger = logging.getLogger(__name__)

class EurekaClient:
    def __init__(self, app_name: str, default_port: str = "8080"):
        self.app_name = app_name
        self.instance_id = None
        self.eureka_url = None
        self.heartbeat_thread = None
        self.running = threading.Event()
        self.default_port = default_port
        
    def get_config(self) -> Dict[str, Any]:
        """Récupère la configuration depuis Django settings ou variables d'environnement"""
        config = {
            "app_name": self.app_name,
            "port": os.getenv("SERVER_PORT", 
                             getattr(settings, "SERVER_PORT", self.default_port)),
            "hostname": os.getenv("EUREKA_INSTANCE_HOSTNAME", 
                                os.getenv("SERVICE_NAME", self.app_name.lower().replace("_", "-"))),
            "eureka_url": os.getenv("EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE",
                                   getattr(settings, "EUREKA_URL", 
                                          "http://terra-registry-service:8761/eureka")),
            "health_path": os.getenv("HEALTH_CHECK_PATH", "/health"),
            "info_path": os.getenv("INFO_PATH", "/info")
        }
        return config
    
    def register_to_eureka(self) -> bool:
        """Enregistre l'instance auprès d'Eureka"""
        config = self.get_config()
        
        self.eureka_url = config["eureka_url"].rstrip("/")
        self.instance_id = f"{config['hostname']}:{config['port']}"
        
        payload = {
            "instance": {
                "instanceId": self.instance_id,
                "hostName": config["hostname"],
                "app": self.app_name.upper(),
                "ipAddr": config["hostname"],
                "port": {"$": int(config["port"]), "@enabled": True},
                "securePort": {"$": 443, "@enabled": False},
                "status": "UP",
                "healthCheckUrl": f"http://{config['hostname']}:{config['port']}{config['health_path']}",
                "statusPageUrl": f"http://{config['hostname']}:{config['port']}{config['info_path']}",
                "homePageUrl": f"http://{config['hostname']}:{config['port']}/",
                "dataCenterInfo": {
                    "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
                    "name": "MyOwn"
                },
                "metadata": {
                    "instanceId": self.instance_id,
                    "management.port": config["port"],
                    "version": os.getenv("APP_VERSION", "1.0.0"),
                    "zone": os.getenv("DEPLOYMENT_ZONE", "default")
                },
                "leaseInfo": {
                    "renewalIntervalInSecs": 30,
                    "durationInSecs": 90,
                    "registrationTimestamp": int(time.time() * 1000)
                },
                "vipAddress": config["app_name"].lower(),
                "secureVipAddress": config["app_name"].lower()
            }
        }
        
        try:
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    resp = requests.post(
                        f"{self.eureka_url}/apps/{self.app_name.upper()}",
                        json=payload,
                        headers={"Content-Type": "application/json", "Accept": "application/json"},
                        timeout=15
                    )
                    
                    if resp.status_code in [200, 204]:
                        logger.info(f"[Eureka] ✅ {self.app_name} enregistré : {self.instance_id}")
                        return True
                    else:
                        logger.warning(f"[Eureka] Tentative {attempt+1}/{max_retries} échouée : {resp.status_code}")
                        if attempt < max_retries - 1:
                            time.sleep(5 * (attempt + 1))
                            
                except requests.exceptions.ConnectionError:
                    logger.warning(f"[Eureka] Eureka indisponible, tentative {attempt+1}/{max_retries}")
                    time.sleep(10 * (attempt + 1))
                    
            logger.error(f"[Eureka] ❌ Échec d'enregistrement après {max_retries} tentatives")
            return False
            
        except Exception as e:
            logger.error(f"[Eureka] Erreur d'enregistrement : {e}")
            return False
    
    def start_heartbeat(self):
        """Démarre le heartbeat périodique avec re-registration si nécessaire"""
        self.running.set()
        
        def heartbeat_loop():
            failed_attempts = 0
            max_failed_attempts = 3
            
            while self.running.is_set():
                try:
                    time.sleep(25)  # 5 secondes avant la deadline de 30s
                    
                    if not self.instance_id or not self.eureka_url:
                        logger.warning("[Eureka] Instance non enregistrée, tentative de re-registration...")
                        if self.register_to_eureka():
                            failed_attempts = 0
                        continue
                    
                    # Envoi du heartbeat
                    resp = requests.put(
                        f"{self.eureka_url}/apps/{self.app_name.upper()}/{self.instance_id}",
                        timeout=10
                    )
                    
                    if resp.status_code in [200, 204]:
                        failed_attempts = 0
                        logger.debug(f"[Eureka] ♥ Heartbeat réussi pour {self.instance_id}")
                    else:
                        failed_attempts += 1
                        logger.warning(f"[Eureka] Heartbeat échoué ({failed_attempts}/{max_failed_attempts})")
                        
                        if failed_attempts >= max_failed_attempts:
                            logger.warning("[Eureka] Trop d'échecs, re-registration...")
                            if self.register_to_eureka():
                                failed_attempts = 0
                            
                except requests.exceptions.RequestException as e:
                    failed_attempts += 1
                    logger.warning(f"[Eureka] Erreur heartbeat: {e}")
                    
                    if failed_attempts >= max_failed_attempts:
                        logger.warning("[Eureka] Tentative de re-registration après erreurs réseau")
                        if self.register_to_eureka():
                            failed_attempts = 0
                
                except Exception as e:
                    logger.error(f"[Eureka] Erreur inattendue dans heartbeat: {e}")
        
        self.heartbeat_thread = threading.Thread(target=heartbeat_loop, daemon=True)
        self.heartbeat_thread.start()
        logger.info(f"[Eureka] Heartbeat démarré pour {self.app_name}")
    
    def deregister(self):
        """Désenregistre l'instance d'Eureka"""
        self.running.clear()
        
        if self.heartbeat_thread:
            self.heartbeat_thread.join(timeout=5)
        
        if self.instance_id and self.eureka_url:
            try:
                requests.delete(f"{self.eureka_url}/apps/{self.app_name.upper()}/{self.instance_id}",
                              timeout=10)
                logger.info(f"[Eureka] Service {self.app_name} désenregistré")
            except Exception as e:
                logger.warning(f"[Eureka] Erreur lors du désenregistrement: {e}")
