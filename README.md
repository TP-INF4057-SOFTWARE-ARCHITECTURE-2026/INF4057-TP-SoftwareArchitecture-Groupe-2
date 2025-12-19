# 🚀 TERRABIA - Marketplace Agricole Camerounaise

![Architecture Microservices](https://img.shields.io/badge/architecture-microservices-blue)
![Python](https://img.shields.io/badge/python-97.6%25-yellow)
![Docker](https://img.shields.io/badge/docker-ready-green)
![Kubernetes](https://img.shields.io/badge/kubernetes-deployment-orange)

**Une plateforme numérique révolutionnaire qui connecte directement les agriculteurs camerounais aux acheteurs, optimisant la chaîne de valeur agricole locale.**

## 📋 Table des Matières
- [🎯 Aperçu du Projet](#-aperçu-du-projet)
- [🏗️ Architecture Technique](#️-architecture-technique)
- [✨ Fonctionnalités Clés](#-fonctionnalités-clés)
- [👥 Rôles Utilisateurs](#-rôles-utilisateurs)
- [🚀 Démarrage Rapide](#-démarrage-rapide)
- [🐳 Déploiement avec Docker](#-déploiement-avec-docker)
- [⚙️ Configuration des Services](#️-configuration-des-services)
- [🔧 Guide de Développement](#-guide-de-développement)
- [📊 API Documentation](#-api-documentation)
- [🧪 Tests et Qualité](#-tests-et-qualité)
- [🤝 Contribution](#-contribution)
- [📄 Licence](#-licence)

## 🎯 Aperçu du Projet

**TERRABIA** est une solution e-commerce complète spécialisée dans les produits du terroir camerounais. La plateforme vise à :
- 🔗 **Connecter directement** agriculteurs et acheteurs
- 📈 **Optimiser la chaîne logistique** agricole
- 💰 **Augmenter les revenus** des producteurs locaux
- 🛡️ **Instaurer un système de confiance** via notation et feedback
- 🌱 **Promouvoir l'agriculture locale** et durable

**Objectif principal** : Créer un écosystème numérique complet facilitant la commercialisation des produits agricoles camerounais.

## 🏗️ Architecture Technique

### Architecture Microservices
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React + Vite) │
│ http://localhost:5173 │
└───────────────────────────┬─────────────────────────────────┘
│
┌───────────────────────────▼─────────────────────────────────┐
│ API Gateway (Spring Boot) │
│ terra-proxy-service:8080 │
└─────┬────────────┬────────────┬────────────┬───────────────┘
│ │ │ │
▼ ▼ ▼ ▼
┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│ Auth ││ Users ││ Products ││ Orders ││ Notif │
│ Service ││ Service ││ Service ││ Service ││ Service │
│ 8082 ││ 8001 ││ 8002 ││ 8003 ││ 8004 │
└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘
│ │ │ │ │
└────────────┴────────────┴────────────┴────────────┘
│
┌───────────────────────────▼─────────────────────────────────┐
│ Service Registry (Eureka) │
│ terra-registry-service:8761 │
└─────────────────────────────────────────────────────────────┘

text

### Stack Technologique
| Composant | Technologie | Port | Description |
|-----------|-------------|------|-------------|
| **Frontend** | React + Vite + Tailwind CSS | 5173 | Interface utilisateur responsive |
| **terra-proxy-service** | Spring Boot | 8082 | Routage et agrégation des APIs |
| **terra-auth-service** | Django + JWT | 8083 | Gestion des tokens et RBAC |
| **terra-user-service** | Django | 8085 | Gestion des profils utilisateurs |
| **terra-product-service** | Django | 8084 | Catalogue et stocks produits |
| **terra-order-transaction-service** | Django | 8086 | Commandes et transactions |
| **terra-notification-service** | Node.js + RabbitMQ | 4002| Notifications multi-canaux |
| **terra-registry-service ** | Spring Cloud Eureka | 8761 | Découverte des services |
| **terra-conf-service** | Spring Cloud Config | 8080 | Gestion centralisée de configuration |
| **Message Broker** | RabbitMQ | 5672 | Communication asynchrone |
| **Database** | PostgreSQL | 5432 | Base de données principale |

## ✨ Fonctionnalités Clés

### 🛒 Gestion des Produits
- 📸 **Publication avec médias** (images/vidéos)
- 📊 **Mise à jour dynamique** des stocks
- 🏷️ **Catégorisation avancée** des produits
- 🔍 **Recherche et filtres** multicritères

### 💳 Processus d'Achat
- 🛍️ **Panier persistant** et sécurisé
- 💰 **Paiement Mobile Money** (MTN/Orange)
- 🚚 **Calcul automatique** des frais de livraison
- 📍 **Attribution intelligente** des livreurs
- 🔄 **Suivi en temps réel** des commandes

### 👥 Gestion des Comptes
- 👨‍🌾 **Profils personnalisés** (Agriculteur/Acheteur/Livreur/Admin)
- ⭐ **Système de notation** et réputation
- 🔐 **Authentification sécurisée** JWT + OAuth2
- 📱 **Multi-device** support

### 📊 Administration
- 📈 **Dashboard administrateur** complet
- 👁️ **Surveillance en temps réel** des activités
- ⚙️ **Gestion des utilisateurs** et permissions
- 📊 **Analytics et rapports** détaillés

## 👥 Rôles Utilisateurs

| Rôle | Permissions | Accès |
|------|-------------|-------|
| **Agriculteur/Vendeur** | Publier produits, gérer stocks, voir commandes | Catalogue, Dashboard vendeur |
| **Acheteur/Client** | Rechercher, commander, payer, notifier | Marketplace, Panier, Historique |
| **Livreur** | Voir missions, mettre à jour statuts, géolocalisation | Application mobile de livraison |
| **Administrateur** | Tout gérer, modérer, générer rapports | Dashboard admin complet |

## 🚀 Démarrage Rapide

### Prérequis

# Outils obligatoires
- Docker 20.10+ et Docker Compose
- Python 3.9+ (pour les services Django)
- Node.js 18+ (pour frontend et service notifications)
- Java 11+ (pour services Spring)
- Git

# Outils optionnels (pour développement)
- kubectl et Minikube (déploiement Kubernetes)
- PostgreSQL 14+ (développement local)
- RabbitMQ 3.11+
Installation en 5 minutes
bash
# 1. Cloner le dépôt
git clone https://github.com/TP-Master1-GL/TERRABIA.git
cd TERRABIA

# 2. Lancer avec Docker Compose (recommandé)
docker-compose up -d

# 3. Vérifier que tous les services sont opérationnels
docker-compose ps

# 4. Accéder aux interfaces
# Frontend: http://localhost:5173
# API Gateway: http://localhost:8082
# Eureka Dashboard: http://localhost:8761
# RabbitMQ Management: http://localhost:15672 (guest/guest)
Installation Manuelle
bash
# Démarrer le service registry (prérequis pour les autres)
cd terra-registry-service
mvn spring-boot:run

# Dans un autre terminal, démarrer les services métier
cd terra-auth-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver 8083

# Répéter pour chaque service (users, products, orders)
# Ports par défaut: users(8085), products(8084), orders(8086)

# Démarrer le frontend
cd frontend
npm install
npm run dev
🐳 Déploiement avec Docker

Script de démarrage automatique
bash
#!/bin/bash
# start-all.sh - Script pour démarrer tous les services
echo "🚀 Démarrage de TERRABIA..."

# Démarrer les services de base
docker-compose up -d postgres rabbitmq
sleep 10

# Démarrer Eureka (service registry)
docker-compose up -d terra-registry-service
sleep 15

# Démarrer les services de configuration
docker-compose up -d terra-conf-service
sleep 10

# Démarrer les microservices
docker-compose up -d terra-auth-service terra-users-service terra-products-service terra-orders-transaction-service terra-notification-service

# Démarrer l'API Gateway
docker-compose up -d terra-proxy-service

# Démarrer le frontend
cd frontend
npm run build
docker build -t terrabia-frontend .
docker run -d -p 5173:80 terrabia-frontend

echo "✅ TERRABIA est opérationnel!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 API Gateway: http://localhost:8080"
echo "📊 Eureka Dashboard: http://localhost:8761"
⚙️ Configuration des Services
Variables d'Environnement
bash
# Fichier .env à la racine
# Base de données
DB_HOST=postgres
DB_PORT=5432
DB_NAME=terrabia
DB_USER=terrabia_user
DB_PASSWORD=secure_password

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# JWT Configuration
JWT_SECRET_KEY=votre_clé_secrète_très_longue_et_complexe
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Service URLs
EUREKA_SERVER_URL=http://eureka:8761/eureka
CONFIG_SERVER_URL=http://config-service:8888

# External APIs
PAYMENT_GATEWAY_URL=https://api.mobile-money.cm
SMS_PROVIDER_URL=https://api.sms-provider.cm
Configuration Spring Cloud
properties
# terra-cloud-conf/application.properties
# Configuration centrale partagée
spring.application.name=terrabia-config
server.port=8888
spring.profiles.active=native

# Configuration des services individuels
# terra-auth-service.properties
auth.jwt.secret=${JWT_SECRET_KEY}
auth.jwt.expiration=900000

# terra-product-service.properties
product.media.storage=s3
product.media.max-size=10485760
🔧 Guide de Développement
Structure du Projet
text
TERRABIA/
├── frontend/                    # Application React
│   ├── src/                    # Composants et pages
│   ├── public/                 # Assets statiques
│   └── package.json           # Dépendances frontend
├── terra-auth-service/         # Service d'authentification
│   ├── auth_app/              # Application Django
│   ├── requirements.txt       # Dépendances Python
│   └── Dockerfile            # Configuration Docker
├── terra-users-service/        # Gestion utilisateurs
├── terra-product-service/      # Catalogue produits
├── terra-order-transaction-service/ # Commandes
├── terra-notification-service/ # Notifications (Node.js)
├── terra-proxy-service/        # API Gateway (Spring)
├── terra-registry-service/     # Eureka Server (Spring)
├── terra-cloud-conf/           # Configuration centrale
├── terra-conf-service/         # Config Server (Spring)
├── k8s/                       # Manifests Kubernetes
├── docker-compose.yml         # Orchestration locale
└── start-all.sh              # Script de démarrage
Développement d'un Service Python
bash
# Création d'un environnement virtuel
cd terra-auth-service
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Installation des dépendances
pip install -r requirements.txt

# Migration de la base de données
python manage.py makemigrations
python manage.py migrate

# Création d'un superutilisateur
python manage.py createsuperuser

# Lancement du serveur de développement
python manage.py runserver 8082

# Exécution des tests
python manage.py test
pytest
Développement Frontend
bash
cd frontend

# Installation des dépendances
npm install

# Développement avec hot reload
npm run dev

# Build pour production
npm run build

# Exécution des tests
npm test
npm run test:e2e
Communication Inter-Services

📊 API Documentation
Points d'Accès Principaux
Toutes les APIs sont accessibles via l'API Gateway: http://localhost:8080/api/

Service	Endpoints	Description
Auth	POST /auth/login
POST /auth/register
POST /auth/refresh
POST /auth/logout	Gestion authentification JWT
Users	GET /users/{id}
PUT /users/{id}
GET /users/{id}/profile	Gestion profils utilisateurs
Products	GET /products
POST /products
GET /products/{id}
PUT /products/{id}	Catalogue produits
Orders	POST /orders
GET /orders/{id}
PUT /orders/{id}/status
POST /orders/{id}/pay	Commandes et paiements
Notifications	GET /notifications
POST /notifications/subscribe	Système de notifications



Documentation Swagger
Chaque service expose sa documentation Swagger/OpenAPI:

Auth Service: http://localhost:8083/swagger/

Product Service: http://localhost:8084/swagger/

Order Service: http://localhost:8086/swagger/



Sécurité
🔐 Authentification: JWT avec expiration courte (15 minutes)

🛡️ RBAC: 4 rôles avec permissions granulaires


🤝 Contribution
Processus de Contribution
Fork le projet sur GitHub

Clone votre fork localement

Créez une branche pour votre fonctionnalité

Développez avec les standards du projet

Testez vos changements

Soumettez une Pull Request



📄 Licence
Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

Droits
✅ Utilisation commerciale autorisée

✅ Modification autorisée

✅ Distribution autorisée

✅ Utilisation privée autorisée

❌ Responsabilité limitée

❌ Garantie limitée

📞 Support et Contact
Équipe de Développement
NGUEMBU YEPMO JOHN - Architecte Technique ,Chef de Projet et Développeur fullstack

MAFFO NGALEU LAETITIA - Développeuse backend

TSABENG DELPHAN - Développeur Backend

MAAMOC KENGUIM RONEL - Développeur Backend

Ressources
📖 Documentation Technique

🐛 Signaler un Bug

💡 Suggestions d'Amélioration

📧 Contact: terrabia237@gmail.com 

Statut du Projet
Version: 1.0.0 (MVP)

État: 🟢 Actif - En développement

Dernière mise à jour: Décembre 2025

Prochaine version: V1.1 - Système de recommandation

🎯 Roadmap
Phase 1 - MVP (Décembre 2025)
✅ Architecture microservices

✅ Authentification et gestion utilisateurs

✅ Catalogue produits de base

✅ Système de commandes

✅ Paiements Mobile Money

✅ Notifications par email

Phase 2 - Q1 2026
🔄 Application mobile livreurs

🔄 Système de recommandation IA

🔄 Analytics avancés

🔄 Support multi-langues

Phase 3 - Q2 2026
📅 Contract farming digital

📅 Marketplace B2B

📅 API publique pour partenaires

📅 Certification produits


TERRABIA - Transformer l'agriculture camerounaise par le numérique 🌱
# INF4057-TP-SoftwareArchitecture-Groupe-2
