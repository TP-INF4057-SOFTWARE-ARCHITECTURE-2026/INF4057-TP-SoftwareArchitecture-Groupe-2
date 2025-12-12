import json
import pika
import os
import logging
import time
from .config import get_config

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class RabbitMQPublisher:
    """Publisher RabbitMQ pour publier des événements depuis auth-service"""
    
    def __init__(self):
        self.connection = None
        self.channel = None
        self._connect()
    
    def _connect(self, retries=5, delay=3):
        """Tentative de connexion avec plusieurs essais"""
        config = get_config()
        host = config.get("rabbitmq.host", os.getenv("RABBITMQ_HOST", "terra-rabbitmq"))
        port = int(config.get("rabbitmq.port", os.getenv("RABBITMQ_PORT", 5672)))
        user = config.get("rabbitmq.user", os.getenv("RABBITMQ_USER", "guest"))
        password = config.get("rabbitmq.password", os.getenv("RABBITMQ_PASSWORD", "guest"))
        exchange = config.get("rabbitmq.exchange", os.getenv("RABBITMQ_EXCHANGE", "users_exchange"))
        
        for attempt in range(1, retries + 1):
            try:
                logger.info(f"[RabbitMQ Publisher] Connexion à {host}:{port} (tentative {attempt}/{retries})...")
                credentials = pika.PlainCredentials(user, password)
                self.connection = pika.BlockingConnection(
                    pika.ConnectionParameters(
                        host=host,
                        port=port,
                        credentials=credentials,
                        heartbeat=600,
                        blocked_connection_timeout=300
                    )
                )
                self.channel = self.connection.channel()
                self.channel.exchange_declare(
                    exchange=exchange,
                    exchange_type='fanout',
                    durable=True
                )
                logger.info(f"[RabbitMQ Publisher] ✅ Connexion établie et échange '{exchange}' déclaré.")
                return
            except Exception as e:
                logger.error(f"[RabbitMQ Publisher] ❌ Erreur de connexion : {e}")
                if attempt < retries:
                    time.sleep(delay)
        
        logger.warning("[RabbitMQ Publisher] ⚠️ Impossible d'établir une connexion après plusieurs tentatives.")
        self.connection = None
        self.channel = None
    
    def publish(self, event_type: str, payload: dict):
        """Publier un événement JSON vers RabbitMQ"""
        config = get_config()
        exchange = config.get("rabbitmq.exchange", os.getenv("RABBITMQ_EXCHANGE", "users_exchange"))
        
        if self.channel is None or (self.connection and self.connection.is_closed):
            self._connect()
        
        if self.channel:
            message = json.dumps({
                'type': event_type,
                'payload': payload
            })
            
            try:
                self.channel.basic_publish(
                    exchange=exchange,
                    routing_key='',
                    body=message,
                    properties=pika.BasicProperties(
                        delivery_mode=2  # rendre le message persistant
                    )
                )
                logger.info(f"[RabbitMQ Publisher] 📤 Événement publié : {event_type}")
            except Exception as e:
                logger.error(f"[RabbitMQ Publisher] ❌ Erreur publication {event_type} : {e}")
                # Réessayer de se connecter
                self._connect()
                if self.channel:
                    try:
                        self.channel.basic_publish(
                            exchange=exchange,
                            routing_key='',
                            body=message,
                            properties=pika.BasicProperties(delivery_mode=2)
                        )
                        logger.info(f"[RabbitMQ Publisher] 📤 Événement publié (retry) : {event_type}")
                    except Exception as e2:
                        logger.error(f"[RabbitMQ Publisher] ❌ Erreur publication (retry) {event_type} : {e2}")
    
    def close(self):
        """Fermer proprement la connexion"""
        try:
            if self.connection and self.connection.is_open:
                self.connection.close()
                logger.info("[RabbitMQ Publisher] 🔒 Connexion fermée proprement.")
        except Exception as e:
            logger.error(f"[RabbitMQ Publisher] ⚠️ Erreur fermeture connexion : {e}")


# Instance globale du publisher
_publisher_instance = None

def get_publisher():
    """Obtenir l'instance globale du publisher (singleton)"""
    global _publisher_instance
    if _publisher_instance is None:
        _publisher_instance = RabbitMQPublisher()
    return _publisher_instance


def publish_user_created(payload: dict):
    """Publier un événement user_created"""
    publisher = get_publisher()
    publisher.publish('user_created', payload)


def publish_user_updated(payload: dict):
    """Publier un événement user_updated"""
    publisher = get_publisher()
    publisher.publish('user_updated', payload)


def publish_user_deleted(payload: dict):
    """Publier un événement user_deleted"""
    publisher = get_publisher()
    publisher.publish('user_deleted', payload)

