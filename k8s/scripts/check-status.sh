#!/bin/bash

echo "📊 État du cluster Terrabia :"
echo "=============================="

echo ""
echo "📦 Namespace :"
kubectl get ns terrabia

echo ""
echo "🐳 Pods :"
kubectl get pods -n terrabia

echo ""
echo "🔗 Services :"
kubectl get svc -n terrabia

echo ""
echo "📡 Ingress :"
kubectl get ingress -n terrabia

echo ""
echo "💾 PVC :"
kubectl get pvc -n terrabia

echo ""
echo "📈 Événements récents :"
kubectl get events -n terrabia --sort-by='.lastTimestamp' | tail -10

echo ""
echo "🧪 Tests de santé :"
echo "Frontend :"
kubectl exec -n terrabia deployment/frontend -- curl -s http://localhost:5173/health 2>/dev/null || echo "Non disponible"
echo "Eureka :"
kubectl exec -n terrabia deployment/terra-registry-service -- curl -s http://localhost:8761/actuator/health 2>/dev/null || echo "Non disponible"
