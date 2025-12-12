# product_app/serializers.py
from rest_framework import serializers
from .models import Produit, Categorie, Media
import logging

logger = logging.getLogger(__name__)

class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ['media_id', 'url_fichier', 'type_media', 'date_upload', 'produit']

class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ['categorie_id', 'nom', 'description']
        read_only_fields = ['categorie_id']

class ProduitCreateSerializer(serializers.Serializer):
    """
    Serializer spécifique pour la création de produit.
    Utilise les noms de champs du frontend.
    """
    
    # Champs du frontend
    name = serializers.CharField(max_length=200, required=True)
    description = serializers.CharField(required=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=True, min_value=0)
    unit = serializers.CharField(max_length=50, required=True)
    stock_quantity = serializers.IntegerField(required=True, min_value=0)
    is_organic = serializers.BooleanField(default=False)
    conditions_conservation = serializers.CharField(required=False, allow_blank=True)
    harvest_date = serializers.DateField(required=False, allow_null=True)
    cultivation_method = serializers.CharField(required=False, default='conventionnelle')
    status = serializers.CharField(required=False, default='available')
    farmer = serializers.UUIDField(required=True)
    category = serializers.CharField(required=True)  # Nom de la catégorie
    
    def validate(self, data):
        """Validation simple"""
        logger.debug(f"📦 Validation des données: {data}")
        return data
    
    def create(self, validated_data):
        """Création du produit"""
        logger.info("📦 Création d'un produit")
        
        # Extraire les données
        name = validated_data['name']
        description = validated_data['description']
        price = validated_data['price']
        unit = validated_data['unit']
        stock_quantity = validated_data['stock_quantity']
        is_organic = validated_data.get('is_organic', False)
        conditions_conservation = validated_data.get('conditions_conservation', '')
        harvest_date = validated_data.get('harvest_date')
        cultivation_method = validated_data.get('cultivation_method', 'conventionnelle')
        status = validated_data.get('status', 'available')
        farmer = validated_data['farmer']
        category_name = validated_data['category']
        
        # Gérer la catégorie
        try:
            categorie, created = Categorie.objects.get_or_create(
                nom=category_name,
                defaults={'description': f'Catégorie: {category_name}'}
            )
            if created:
                logger.info(f"✅ Catégorie créée: {categorie.nom}")
            else:
                logger.info(f"✅ Catégorie trouvée: {categorie.nom}")
        except Exception as e:
            logger.error(f"❌ Erreur avec la catégorie: {str(e)}")
            raise serializers.ValidationError({'category': str(e)})
        
        # Créer le produit
        try:
            produit = Produit.objects.create(
                nom=name,
                description=description,
                prix_unitaire=price,
                unite_mesure=unit,
                quantite_stock=stock_quantity,
                est_bio=is_organic,
                condition_conservation=conditions_conservation,
                date_recolte=harvest_date,
                methode_culture=cultivation_method,
                statut=status,
                id_agriculteur=farmer,
                categorie=categorie,
                est_publier=True
            )
            
            logger.info(f"✅ Produit créé: {produit.nom} (ID: {produit.produit_id})")
            return produit
            
        except Exception as e:
            logger.error(f"❌ Erreur création produit: {str(e)}")
            raise serializers.ValidationError({'non_field_errors': str(e)})
    
    def to_representation(self, instance):
        """Format de réponse"""
        return {
            'id': str(instance.produit_id),
            'name': instance.nom,
            'description': instance.description,
            'price': float(instance.prix_unitaire),
            'unit': instance.unite_mesure,
            'stock_quantity': instance.quantite_stock,
            'is_organic': instance.est_bio,
            'conditions_conservation': instance.condition_conservation,
            'harvest_date': instance.date_recolte,
            'cultivation_method': instance.methode_culture,
            'status': instance.statut,
            'farmer': str(instance.id_agriculteur),
            'category_name': instance.categorie.nom if instance.categorie else None,
            'is_published': instance.est_publier,
            'created_at': instance.date_publication.isoformat() if instance.date_publication else None
        }

class ProduitSerializer(serializers.ModelSerializer):
    """Serializer pour la lecture/affichage"""
    category_name = serializers.CharField(source='categorie.nom', read_only=True)
    medias = MediaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Produit
        fields = [
            'produit_id', 'nom', 'description', 'prix_unitaire', 'unite_mesure',
            'quantite_stock', 'est_bio', 'est_publier', 'date_publication',
            'condition_conservation', 'date_recolte', 'methode_culture', 'statut',
            'id_agriculteur', 'categorie', 'category_name', 'medias'
        ]
        read_only_fields = ['produit_id', 'date_publication', 'est_publier']

class ProduitSearchSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    
    class Meta:
        model = Produit
        fields = [
            'produit_id', 'nom', 'description', 'prix_unitaire', 'unite_mesure',
            'quantite_stock', 'est_bio', 'categorie_nom', 'id_agriculteur'
        ]