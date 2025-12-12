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
    mariadb-connector-c-dev

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Remove build dependencies to keep image small
# Sur Alpine, on supprime les paquets de développement
RUN apk del gcc musl-dev mariadb-connector-c-dev

# Conserver uniquement les bibliothèques runtime nécessaires
RUN apk add --no-cache libpq mariadb-connector-c

COPY . .

RUN mkdir -p /app/logs

EXPOSE 8085

CMD ["gunicorn", "--bind", "0.0.0.0:8085", "--workers", "3", "terra_product_service.wsgi:application"]
