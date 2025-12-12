#!/bin/bash
set -e  # Arrêter le script en cas d'erreur

echo "🚀 Déploiement de Terrabia sur Kubernetes..."

# Se placer dans le dossier parent (k8s/) pour avoir les bons chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PARENT_DIR"

echo "📂 Dossier de travail: $(pwd)"

# 1. Créer le namespace
echo "📁 Création du namespace..."
kubectl apply -f namespaces/terrabia-namespace.yaml

# 2. Créer les secrets (avec vérification)
echo "🔐 Création des secrets..."
if [ -f "configs/secrets/database-secrets.yaml" ]; then
    kubectl apply -f configs/secrets/database-secrets.yaml
else
    echo "⚠️  Fichier configs/secrets/database-secrets.yaml non trouvé"
    # Essayer d'appliquer tous les secrets du dossier
    if [ -d "configs/secrets" ]; then
        echo "   Application de tous les fichiers dans configs/secrets/..."
        kubectl apply -f configs/secrets/ -n terrabia
    fi
fi

# 3. Créer les configmaps (avec vérification)
echo "⚙️ Création des configmaps..."
if [ -f "configs/configmaps/global-config.yaml" ]; then
    kubectl apply -f configs/configmaps/global-config.yaml
else
    echo "⚠️  Fichier configs/configmaps/global-config.yaml non trouvé"
    # Essayer d'appliquer tous les configmaps du dossier
    if [ -d "configs/configmaps" ]; then
        echo "   Application de tous les fichiers dans configs/configmaps/..."
        kubectl apply -f configs/configmaps/ -n terrabia
    fi
fi

# 4. Déployer les bases de données
echo "🗄️ Déploiement des bases de données..."

# Vérifier et appliquer chaque fichier individuellement
DB_FILES=(
    "databases/mysql-auth.yaml"
    "databases/postgres-users.yaml"
    "databases/mysql-product.yaml"
    "databases/postgres-orders.yaml"
    "databases/mysql-notification.yaml"
    "databases/rabbitmq.yaml"
)

for db_file in "${DB_FILES[@]}"; do
    if [ -f "$db_file" ]; then
        echo "   Application de $db_file..."
        kubectl apply -f "$db_file"
    else
        echo "⚠️  Fichier $db_file non trouvé"
    fi
done

# Attendre que les bases de données soient prêtes
echo "⏳ Attente du démarrage des bases de données..."
echo "   Vérification toutes les 10 secondes (max 3 minutes)..."

# Attendre un peu pour l'initialisation
sleep 15

# Vérifier l'état des pods de base de données
for i in {1..18}; do
    echo "   Vérification $i/18..."
    
    # Compter les pods de DB qui sont en cours d'exécution
    running_pods=$(kubectl get pods -n terrabia --no-headers 2>/dev/null | grep -E "(mysql|postgres|rabbitmq)" | grep -c "Running" || true)
    total_pods=$(kubectl get pods -n terrabia --no-headers 2>/dev/null | grep -E "(mysql|postgres|rabbitmq)" | wc -l || true)
    
    if [ $total_pods -eq 0 ]; then
        echo "   ℹ️  Aucun pod de base de données détecté, continuation..."
        sleep 10
        continue
    fi
    
    if [ $running_pods -eq $total_pods ]; then
        echo "✅ Toutes les bases de données sont prêtes ($running_pods/$total_pods)"
        break
    fi
    
    echo "   En attente: $running_pods/$total_pods pods prêts"
    
    if [ $i -eq 18 ]; then
        echo "⚠️  Timeout: Certaines bases de données ne sont pas prêtes, continuation..."
        kubectl get pods -n terrabia | grep -E "(mysql|postgres|rabbitmq)" || true
    fi
    
    sleep 10
done

# 5. Déployer les services Spring Boot
echo "🔧 Déploiement des services Spring Boot..."
kubectl apply -f services/terra-conf-service.yaml
kubectl apply -f services/terra-registry-service.yaml

# Attendre que les services de base soient prêts
echo "⏳ Attente du démarrage des services de configuration (30s)..."
sleep 30

# 6. Déployer les autres services
echo "🚀 Déploiement des autres services..."

SERVICE_FILES=(
    "services/terra-proxy-service.yaml"
    "services/terra-auth-service.yaml"
    "services/terra-users-service.yaml"
    "services/terra-product-service.yaml"
    "services/terra-order-transaction-service.yaml"
    "services/terra-notification-service.yaml"
    "services/frontend.yaml"
)

for service_file in "${SERVICE_FILES[@]}"; do
    if [ -f "$service_file" ]; then
        echo "   Application de $service_file..."
        kubectl apply -f "$service_file"
    else
        echo "⚠️  Fichier $service_file non trouvé"
    fi
done

# 7. Déployer l'ingress
echo "🌐 Déploiement de l'ingress..."
if [ -f "ingress/terrabia-ingress.yaml" ]; then
    kubectl apply -f ingress/terrabia-ingress.yaml
else
    echo "⚠️  Fichier ingress/terrabia-ingress.yaml non trouvé"
fi

# 8. Vérifier le déploiement
echo "✅ Vérification du déploiement..."
kubectl get all -n terrabia

# 9. Afficher les URLs
echo ""
echo "🌍 URLs d'accès :"
echo "=================="

# Activer l'ingress dans Minikube si ce n'est pas déjà fait
echo "🔧 Activation de l'ingress Minikube..."
minikube addons enable ingress 2>/dev/null || true

# Obtenir l'IP de Minikube
MINIKUBE_IP=$(minikube ip 2>/dev/null || echo "127.0.0.1")
echo ""
echo "📌 IP Minikube: $MINIKUBE_IP"
echo ""
echo "Pour accéder aux services via l'ingress, ajoutez cette ligne à /etc/hosts:"
echo "$MINIKUBE_IP terrabia.local"
echo ""
echo "🌐 Services disponibles:"
echo "  • Application: http://terrabia.local"
echo "  • Frontend direct: minikube service frontend -n terrabia --url"
echo "  • Eureka: minikube service terra-registry-service -n terrabia --url"
echo "  • API Gateway: minikube service terra-proxy-service -n terrabia --url"

# Vérifier l'ingress
echo ""
echo "🔍 Vérification de l'ingress:"
kubectl get ingress -n terrabia

# Instructions pour les logs
echo ""
echo "📊 Pour surveiller les logs:"
echo "  kubectl logs -n terrabia deployment/terra-auth-service -f"
echo "  kubectl logs -n terrabia deployment/frontend -f"
echo "  kubectl get pods -n terrabia -w"
