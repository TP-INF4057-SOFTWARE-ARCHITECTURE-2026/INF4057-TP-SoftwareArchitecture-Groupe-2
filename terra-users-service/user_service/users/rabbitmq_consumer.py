# users/rabbitmq_consumer.py
import json
import pika
import os
import logging
import time
from django.db import transaction
from django.apps import apps

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Configuration RabbitMQ
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'terra-rabbitmq')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', 5672))
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBITMQ_PASSWORD = os.getenv('RABBITMQ_PASSWORD', 'guest')
RABBITMQ_EXCHANGE = os.getenv('RABBITMQ_EXCHANGE', 'users_exchange')
RABBITMQ_QUEUE = os.getenv('RABBITMQ_QUEUE', 'users_service_queue')


def handle_user_created(payload):
    """Gère l'événement user_created depuis auth-service"""
    try:
        User = apps.get_model("users", "User")
        
        user_id = payload.get("user_id")
        email = payload.get("email")
        username = payload.get("username") or email.split("@")[0]
        role = payload.get("role", "acheteur")
        phone_number = payload.get("phone_number", "")
        address = payload.get("address", "")
        
        logger.info(f"[RabbitMQ Consumer] user_created reçu: {email} ({user_id})")
        
        # Créer ou mettre à jour l'utilisateur dans users-service
        user, created = User.objects.update_or_create(
            id=user_id,
            defaults={
                "email": email,
                "username": username,
                "role": role,
                "phone_number": phone_number,
                "address": address,
                "is_active": True
            }
        )
        
        if created:
            logger.info(f"[RabbitMQ Consumer] ✅ Utilisateur créé dans users-service: {email}")
        else:
            logger.info(f"[RabbitMQ Consumer] ✅ Utilisateur mis à jour dans users-service: {email}")
            
    except Exception as e:
        logger.error(f"[RabbitMQ Consumer] ❌ Erreur lors du traitement user_created: {e}")
        raise


def handle_user_updated(payload):
    """Gère l'événement user_updated depuis auth-service"""
    try:
        User = apps.get_model("users", "User")
        
        user_id = payload.get("user_id")
        logger.info(f"[RabbitMQ Consumer] user_updated reçu: {user_id}")
        
        user = User.objects.filter(id=user_id).first()
        if user:
            if "email" in payload:
                user.email = payload["email"]
            if "username" in payload:
                user.username = payload["username"]
            if "role" in payload:
                user.role = payload["role"]
            if "phone_number" in payload:
                user.phone_number = payload["phone_number"]
            if "address" in payload:
                user.address = payload["address"]
            user.save()
            logger.info(f"[RabbitMQ Consumer] ✅ Utilisateur mis à jour: {user.email}")
        else:
            logger.warning(f"[RabbitMQ Consumer] ⚠️ Utilisateur {user_id} introuvable")
            
    except Exception as e:
        logger.error(f"[RabbitMQ Consumer] ❌ Erreur lors du traitement user_updated: {e}")


def handle_user_deleted(payload):
    """Gère l'événement user_deleted depuis auth-service"""
    try:
        User = apps.get_model("users", "User")
        
        user_id = payload.get("user_id")
        logger.info(f"[RabbitMQ Consumer] user_deleted reçu: {user_id}")
        
        User.objects.filter(id=user_id).delete()
        logger.info(f"[RabbitMQ Consumer] ✅ Utilisateur supprimé: {user_id}")
        
    except Exception as e:
        logger.error(f"[RabbitMQ Consumer] ❌ Erreur lors du traitement user_deleted: {e}")


# Table de routage des événements
EVENT_HANDLERS = {
    "user_created": handle_user_created,
    "user_updated": handle_user_updated,
    "user_deleted": handle_user_deleted,
}


def start_consumer():
    """Démarre le consommateur RabbitMQ dans un thread"""
    logger.info(f"[RabbitMQ Consumer] Démarrage du consommateur...")
    logger.info(f"[RabbitMQ Consumer] Configuration: {RABBITMQ_HOST}:{RABBITMQ_PORT}, Exchange: {RABBITMQ_EXCHANGE}, Queue: {RABBITMQ_QUEUE}")
    
    while True:
        try:
            logger.info(f"[RabbitMQ Consumer] Connexion à {RABBITMQ_HOST}:{RABBITMQ_PORT}...")
            credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=RABBITMQ_HOST,
                    port=RABBITMQ_PORT,
                    credentials=credentials,
                    heartbeat=600,
                    blocked_connection_timeout=300
                )
            )
            channel = connection.channel()
            
            # Déclaration de l'exchange et de la queue
            channel.exchange_declare(exchange=RABBITMQ_EXCHANGE, exchange_type='fanout', durable=True)
            channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)
            channel.queue_bind(exchange=RABBITMQ_EXCHANGE, queue=RABBITMQ_QUEUE)
            
            logger.info(f"[RabbitMQ Consumer] ✅ En écoute sur {RABBITMQ_QUEUE}...")
            
            def callback(ch, method, properties, body):
                try:
                    message = json.loads(body.decode("utf-8"))
                    event_type = message.get("type")
                    payload = message.get("payload", {})
                    
                    logger.info(f"[RabbitMQ Consumer] 📥 Événement reçu: {event_type}")
                    
                    handler = EVENT_HANDLERS.get(event_type)
                    if handler:
                        with transaction.atomic():
                            handler(payload)
                        ch.basic_ack(delivery_tag=method.delivery_tag)
                        logger.info(f"[RabbitMQ Consumer] ✅ Événement {event_type} traité avec succès")
                    else:
                        logger.warning(f"[RabbitMQ Consumer] ⚠️ Événement inconnu: {event_type}")
                        ch.basic_ack(delivery_tag=method.delivery_tag)  # Ack même si inconnu
                        
                except Exception as e:
                    logger.error(f"[RabbitMQ Consumer] ❌ Erreur traitement message: {e}")
                    logger.error(f"[RabbitMQ Consumer] Stack trace: {str(e)}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=RABBITMQ_QUEUE, on_message_callback=callback)
            channel.start_consuming()
            
        except Exception as e:
            logger.error(f"[RabbitMQ Consumer] ❌ Connexion échouée: {e}. Nouvelle tentative dans 10s...")
            time.sleep(10)