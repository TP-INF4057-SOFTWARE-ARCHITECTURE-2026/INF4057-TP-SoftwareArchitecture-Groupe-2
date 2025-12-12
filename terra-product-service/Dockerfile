FROM python:3.11-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DJANGO_SETTINGS_MODULE=terra_product_service.settings
ENV PYTHONPATH=/app

WORKDIR /app

# Install system dependencies for MySQL (mysqlclient)
# Sur Alpine, on utilise mariadb-connector-c-dev pour mysqlclient
RUN apk add --no-cache \
    gcc \
    musl-dev \
    mariadb-connector-c-dev \
    pkgconfig \
    libffi-dev \
    openssl-dev \
    cargo

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# COPY d'abord le code source
COPY . .

# Créer le dossier pour les logs
RUN mkdir -p /app/logs

# Vérifier que manage.py existe
RUN ls -la /app/ && echo "=== Checking manage.py ===" && [ -f /app/manage.py ] && echo "manage.py exists" || echo "manage.py NOT found"

# Exécuter les migrations (optionnel - peut être fait à l'exécution)
# RUN python manage.py makemigrations --noinput
# RUN python manage.py migrate --noinput

# Remove build dependencies to keep image small
RUN apk del gcc musl-dev mariadb-connector-c-dev pkgconfig libffi-dev openssl-dev cargo

# Conserver uniquement les bibliothèques runtime nécessaires
RUN apk add --no-cache mariadb-connector-c

EXPOSE 8085

# Commande de démarrage qui exécute les migrations avant de lancer le serveur
CMD ["sh", "-c", "python manage.py makemigrations --noinput && python manage.py migrate --noinput && gunicorn --bind 0.0.0.0:8085 --workers 3 --timeout 120 terra_product_service.wsgi:application"]