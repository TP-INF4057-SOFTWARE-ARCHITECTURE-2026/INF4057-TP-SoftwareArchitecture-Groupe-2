# product_app/__init__.py
import logging

# Configuration du logger
logger = logging.getLogger(__name__)

# Créer un handler personnalisé si nécessaire
class ProductServiceLogger:
    @staticmethod
    def info(message, **kwargs):
        logger.info(f"📦 {message}", **kwargs)
    
    @staticmethod
    def error(message, **kwargs):
        logger.error(f"❌ {message}", **kwargs)
    
    @staticmethod
    def debug(message, **kwargs):
        logger.debug(f"🔍 {message}", **kwargs)
    
    @staticmethod
    def warning(message, **kwargs):
        logger.warning(f"⚠️ {message}", **kwargs)

# Exporter le logger personnalisé
product_logger = ProductServiceLogger()