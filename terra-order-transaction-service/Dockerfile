FROM python:3.11-alpine

# Optimisation Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=terra_orders.settings

WORKDIR /app

# Alpine utilise APK, pas APT-GET !
# Pour psycopg2, on a besoin de postgresql-libs
RUN apk update && apk add --no-cache \
    postgresql-libs \
    && rm -rf /var/cache/apk/*

# Pour compiler psycopg2 (si besoin), ajoutez aussi les dev packages
# RUN apk add --no-cache --virtual .build-deps \
#     gcc \
#     musl-dev \
#     postgresql-dev \
#     && pip install --no-cache-dir -r requirements.txt \
#     && apk del .build-deps

COPY requirements.txt .

# Installation pip
RUN pip install --upgrade pip --no-cache-dir \
    && pip install --default-timeout=200 --retries=5 --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "terra_orders.wsgi:application", "--bind", "0.0.0.0:8086"]