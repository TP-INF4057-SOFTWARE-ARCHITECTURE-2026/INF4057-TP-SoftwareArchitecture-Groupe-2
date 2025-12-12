FROM python:3.11-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Create and set work directory
WORKDIR /app

# Install system dependencies for PostgreSQL
# Note: Sur Alpine, libpq-dev est postgresql-dev
RUN apk add --no-cache \
    gcc \
    musl-dev \
    postgresql-dev

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 8084

# CORRECTION : Utiliser python -m gunicorn au lieu de gunicorn directement
CMD ["python", "-m", "gunicorn", "--bind", "0.0.0.0:8084", "--workers", "3", "user_service.wsgi:application"]