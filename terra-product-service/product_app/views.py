# product_app/views.py
from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Q
from django.utils import timezone
from .models import Produit, Categorie, Media
from .serializers import (
    ProduitSerializer,
    CategorieSerializer,
    MediaSerializer,
    ProduitCreateSerializer,
    ProduitSearchSerializer
)
import requests
import os
import logging
import json

logger = logging.getLogger(__name__)

USERS_SERVICE_URL = os.getenv("USERS_SERVICE_URL", "http://terra-users-service:8084")

# ============ VUE DE SANTÉ ============
class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        logger.info(f"🏥 Health check - Method: {request.method}, Path: {request.path}")
        
        # Vérifier la connexion à la base de données
        db_status = 'healthy'
        try:
            Produit.objects.count()
        except Exception as e:
            db_status = f'error: {str(e)}'
        
        return Response({
            'status': 'healthy',
            'service': 'terra-product-service',
            'timestamp': timezone.now().isoformat(),
            'database': db_status,
            'endpoints': {
                'produits': '/api/produits/',
                'categories': '/api/categories/',
                'health': '/health/',
                'test': '/test/'
            }
        })

# ============ VUE DE TEST ============
class TestView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Endpoint de test pour vérifier le fonctionnement"""
        logger.info(f"🧪 TestView appelé - Headers: {dict(request.headers)}")
        
        return Response({
            'message': 'Product Service fonctionnel',
            'method': request.method,
            'path': request.path,
            'query_params': dict(request.query_params),
            'headers': {
                'content-type': request.content_type,
                'authorization': 'Bearer ****' if 'authorization' in request.headers else 'none'
            },
            'timestamp': timezone.now().isoformat()
        })
    
    def post(self, request):
        """Endpoint pour tester la création"""
        logger.info(f"🧪 TestView POST - Data: {request.data}")
        
        return Response({
            'message': 'Test POST réussi',
            'received_data': request.data,
            'timestamp': timezone.now().isoformat()
        })

# ============ CRUD PRODUITS ============
class ProduitViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour les produits.
    """
    queryset = Produit.objects.all().order_by('-date_publication')
    serializer_class = ProduitSerializer  # Pour GET, PUT, DELETE
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    
    def get_serializer_class(self):
        """Utiliser ProduitCreateSerializer pour la création"""
        if self.action == 'create':
            return ProduitCreateSerializer
        return ProduitSerializer
    
    def get_queryset(self):
        """Filtrer les produits selon les paramètres"""
        queryset = super().get_queryset()
        
        # Filtres
        categorie_id = self.request.query_params.get('categorie')
        agriculteur_id = self.request.query_params.get('agriculteur')
        est_bio = self.request.query_params.get('est_bio')
        statut = self.request.query_params.get('statut')
        search = self.request.query_params.get('search')
        
        if categorie_id:
            queryset = queryset.filter(categorie_id=categorie_id)
        
        if agriculteur_id:
            queryset = queryset.filter(id_agriculteur=agriculteur_id)
        
        if est_bio:
            queryset = queryset.filter(est_bio=(est_bio.lower() == 'true'))
        
        if statut:
            queryset = queryset.filter(statut=statut)
        
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) | 
                Q(description__icontains=search)
            )
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Liste des produits"""
        logger.info(f"📦 ProduitViewSet.list() - Query: {request.query_params}")
        
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"❌ Erreur dans ProduitViewSet.list(): {str(e)}", exc_info=True)
            return Response({
                'error': 'Erreur serveur',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request, *args, **kwargs):
        """Créer un produit - Utilise ProduitCreateSerializer"""
        logger.info(f"📦 ProduitViewSet.create() appelé")
        logger.debug(f"📦 Data reçue: {request.data}")
        
        try:
            # Utiliser ProduitCreateSerializer pour la création
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            logger.debug(f"📦 Données validées: {serializer.validated_data}")
            
            # Créer le produit
            produit = serializer.save()
            
            logger.info(f"✅ Produit créé avec ID: {produit.produit_id}")
            
            # Retourner la représentation du produit
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )
            
        except Exception as e:
            logger.error(f"❌ Erreur création produit: {str(e)}", exc_info=True)
            logger.debug(f"❌ Données invalides: {request.data}")
            
            error_response = {
                'error': 'Erreur lors de la création du produit',
                'detail': str(e),
                'received_data': request.data
            }
            
            # Ajouter les erreurs de validation si disponibles
            if hasattr(e, 'detail'):
                error_response['validation_errors'] = e.detail
            
            return Response(
                error_response,
                status=status.HTTP_400_BAD_REQUEST
            )

# ============ CRUD CATÉGORIES ============
class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all().order_by('nom')
    serializer_class = CategorieSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """Retourner les catégories au format simple pour le frontend"""
        logger.info(f"🏷️ CategorieViewSet.list() appelé")
        
        try:
            categories = self.get_queryset()
            serializer = self.get_serializer(categories, many=True)
            
            # Retourner un simple tableau pour le frontend
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"❌ Erreur lors du chargement des catégories: {str(e)}")
            return Response({
                'error': 'Erreur serveur',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============ CRUD MÉDIAS ============
class MediaViewSet(viewsets.ModelViewSet):
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

# ============ RECHERCHE ============
class ProduitSearchView(generics.ListAPIView):
    serializer_class = ProduitSearchSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Produit.objects.filter(est_publier=True)
        
        q = self.request.query_params.get('q')
        categorie = self.request.query_params.get('categorie')
        
        if q:
            queryset = queryset.filter(
                Q(nom__icontains=q) | 
                Q(description__icontains=q)
            )
        
        if categorie:
            queryset = queryset.filter(categorie__nom__icontains=categorie)
        
        return queryset