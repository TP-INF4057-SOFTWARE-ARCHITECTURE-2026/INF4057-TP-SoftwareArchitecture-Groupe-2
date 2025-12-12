from django.apps import AppConfig
import threading
import os
import logging
from .config_loader import get_app_config
from .rabbitmq_consumer import start_consumer
from .eureka_client import EurekaClient  # Module partagé

logger = logging.getLogger(__name__)

class AuthAppConfig(AppConfig):
    name = 'auth_app'
    default_auto_field = 'django.db.models.BigAutoField'
    
    def __init__(self, app_name, app_module):
        super().__init__(app_name, app_module)
        self.eureka_client = None
        self._threads_started = False

    def ready(self):
        if self._threads_started:
            return
        self._threads_started = True

        if self._is_test_mode():
            logger.info("[Auth] Mode test → Eureka & RabbitMQ désactivés")
            return

        logger.info("[Auth] Démarrage des services background")
        
        # Initialiser le client Eureka
        self.eureka_client = EurekaClient("TERRA-AUTH-SERVICE", "8083")
        
        # Thread pour l'enregistrement Eureka
        threading.Thread(target=self._start_eureka_registration, daemon=True).start()
        
        # Thread RabbitMQ
        threading.Thread(target=start_consumer, daemon=True).start()
    
    def _is_test_mode(self):
        """Détecte si on est en mode test"""
        return any([
            'test' in os.environ.get('DJANGO_SETTINGS_MODULE', ''),
            os.environ.get('DISABLE_EUREKA', 'false').lower() == 'true',
            os.environ.get('RUNNING_TESTS', 'false').lower() == 'true'
        ])
    
    def _start_eureka_registration(self):
        """Démarre l'enregistrement Eureka après délai"""
        import time
        
        # Délai plus court pour le service auth (5 secondes)
        time.sleep(5)
        
        if self.eureka_client and self.eureka_client.register_to_eureka():
            self.eureka_client.start_heartbeat()
