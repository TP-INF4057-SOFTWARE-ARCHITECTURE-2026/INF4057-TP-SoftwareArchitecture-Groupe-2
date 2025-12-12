# Dockerfile - terra-auth-service
# Version Alpine Linux

# Image de base Alpine (beaucoup plus léger que slim)
FROM python:3.10-alpine

# Variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8083

# Définir le répertoire de travail
WORKDIR /app

# Alpine utilise APK au lieu de APT-GET !
# Pour mysqlclient, on a besoin de mariadb-connector-c-dev
RUN apk update && \
    apk add --no-cache \
        mariadb-connector-c-dev \
        build-base \
        pkgconfig \
        && rm -rf /var/cache/apk/*

# Copier les fichiers requirements
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --upgrade pip --no-cache-dir && \
    pip install --no-cache-dir -r requirements.txt

# Nettoyer les packages de compilation (réduit la taille de l'image)
RUN apk del build-base pkgconfig && \
    rm -rf /var/cache/apk/*

# Copier tout le code
COPY . .

# Commande de démarrage
CMD ["sh", "-c", "python manage.py runserver 0.0.0.0:${PORT:-8083}"]