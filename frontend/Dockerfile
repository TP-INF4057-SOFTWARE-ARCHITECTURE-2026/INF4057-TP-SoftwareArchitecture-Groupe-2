# Dockerfile
FROM node:20-alpine as builder

# Étape de build
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit
COPY . .
ARG VITE_API_GATEWAY_URL
ARG VITE_APP_NAME
ARG VITE_BASE_URL
ENV VITE_API_GATEWAY_URL=${VITE_API_GATEWAY_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_BASE_URL=${VITE_BASE_URL}
RUN npm run build

# Étape de production avec Nginx
FROM nginx:alpine

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposition du port (Nginx écoute sur 80)
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
