# product_app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProduitViewSet, 
    CategorieViewSet, 
    MediaViewSet, 
    ProduitSearchView,
    HealthCheckView,
    TestView
)

router = DefaultRouter()
router.register(r'produits', ProduitViewSet, basename='produit')
router.register(r'categories', CategorieViewSet, basename='categorie')
router.register(r'medias', MediaViewSet, basename='media')

urlpatterns = [
    # Routes du router
    path('', include(router.urls)),
    
    # Routes supplémentaires
    path('produits/recherche/', ProduitSearchView.as_view(), name='produit-search'),
    
    # Routes de santé et test
    path('health/', HealthCheckView.as_view(), name='health'),
    path('test/', TestView.as_view(), name='test'),
]