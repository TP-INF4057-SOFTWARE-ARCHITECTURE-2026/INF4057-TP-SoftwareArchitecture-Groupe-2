# Déploiement Kubernetes pour Terrabia

Ce dossier contient les configurations Kubernetes pour déployer l'application Terrabia.

## Structure
k8s/
├── namespaces/ # Configuration du namespace
├── configs/ # ConfigMaps et Secrets
│ ├── configmaps/
│ └── secrets/
├── databases/ # Configurations des bases de données
├── services/ # Déploiements et services des microservices
├── ingress/ # Configuration Ingress
├── scripts/ # Scripts de déploiement
└── kustomization.yaml # Configuration Kustomize

text

## Prérequis

- Kubernetes 1.20+
- kubectl installé
- Helm (optionnel)
- Ingress Controller (nginx)

## Déploiement

### 1. Pour Minikube (local)
```bash
cd k8s/scripts
./minikube-setup.sh
2. Déploiement manuel
bash
cd k8s
kubectl apply -k .
3. Utilisation des scripts
bash
cd k8s/scripts
./deploy.sh       # Déployer l'application
./check-status.sh # Vérifier l'état
./undeploy.sh     # Supprimer l'application
URLs d'accès
Frontend : http://terrabia.local

API Gateway : http://terrabia.local/api

Eureka Dashboard : http://terrabia.local/eureka

Configuration Service : http://terrabia.local/config

RabbitMQ Management : http://[IP]:15672 (guest/guest)

Commandes utiles
bash
# Voir tous les pods
kubectl get pods -n terrabia

# Voir les logs d'un service
kubectl logs -n terrabia deployment/terra-auth-service -f

# Accéder à un shell dans un pod
kubectl exec -n terrabia -it deployment/terra-auth-service -- /bin/bash

# Redémarrer un déploiement
kubectl rollout restart deployment/terra-auth-service -n terrabia

# Surveiller les événements
kubectl get events -n terrabia --watch
Configuration des bases de données
MySQL Auth : terra-auth-db:3306

PostgreSQL Users : terra-users-db:5432

MySQL Product : terabia-product-db:3306

PostgreSQL Orders : terra-orders-db:5432

MySQL Notification : terra-notification-db:3306

RabbitMQ : terra-rabbitmq:5672

Images Docker
Toutes les images sont disponibles sur Docker Hub sous le namespace nguembu/ :

nguembu/terrabia-web-terra-conf-service:latest

nguembu/terrabia-web-terra-registry-service:latest

nguembu/terrabia-web-terra-proxy-service:latest

nguembu/terrabia-web-terra-auth-service:latest

nguembu/terrabia-web-terra-users-service:latest

nguembu/terrabia-web-terra-product-service:latest

nguembu/terrabia-web-terra-order-transaction-service:latest

nguembu/terrabia-web-terra-notification-service:latest

nguembu/terrabia-web-frontend:latest
