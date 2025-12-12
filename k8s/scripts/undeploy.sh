#!/bin/bash

echo "🗑️ Suppression de Terrabia de Kubernetes..."

# Supprimer toutes les ressources
kubectl delete -f ../ingress/terrabia-ingress.yaml
kubectl delete -f ../services/
kubectl delete -f ../databases/
kubectl delete -f ../configs/
kubectl delete -f ../namespaces/terrabia-namespace.yaml

# Nettoyer les PVC
echo "🧹 Nettoyage des PVC..."
kubectl delete pvc -n terrabia --all 2>/dev/null || true

# Nettoyer les PV
echo "🧹 Nettoyage des PV..."
kubectl delete pv -n terrabia --all 2>/dev/null || true

echo "✅ Terrabia a été supprimé avec succès."
