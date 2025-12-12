# product_app/models.py
from django.db import models
import uuid

class Categorie(models.Model):
    categorie_id = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nom

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"


class Produit(models.Model):
    STATUT_CHOICES = [
        ('available', 'Disponible'),
        ('out_of_stock', 'Rupture de stock'),
        ('draft', 'Brouillon'),
    ]
    
    produit_id = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=150, verbose_name="Nom du produit")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    prix_unitaire = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name="Prix unitaire"
    )
    unite_mesure = models.CharField(
        max_length=50,
        verbose_name="Unité de mesure"
    )
    quantite_stock = models.IntegerField(
        default=0,
        verbose_name="Quantité en stock"
    )
    est_bio = models.BooleanField(
        default=False,
        verbose_name="Produit biologique"
    )
    est_publier = models.BooleanField(
        default=True,
        verbose_name="Publié"
    )
    date_publication = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de publication"
    )
    condition_conservation = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Conditions de conservation"
    )
    
    # Nouveaux champs pour correspondre au frontend
    date_recolte = models.DateField(
        null=True, 
        blank=True,
        verbose_name="Date de récolte"
    )
    methode_culture = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Méthode de culture"
    )
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='available',
        verbose_name="Statut du produit"
    )
    
    categorie = models.ForeignKey(
        Categorie,
        on_delete=models.SET_NULL,
        null=True,
        related_name='produits',
        verbose_name="Catégorie"
    )
    
    # Changer en UUIDField pour correspondre au service users
    id_agriculteur = models.UUIDField(
        verbose_name="ID de l'agriculteur"
    )

    def __str__(self):
        return f"{self.nom} - {self.prix_unitaire} FCFA"

    class Meta:
        verbose_name = "Produit"
        verbose_name_plural = "Produits"
        ordering = ['-date_publication']


class Media(models.Model):
    MEDIA_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]

    media_id = models.AutoField(primary_key=True)
    url_fichier = models.URLField(verbose_name="URL du fichier")
    type_media = models.CharField(
        max_length=10, 
        choices=MEDIA_TYPE_CHOICES,
        verbose_name="Type de média"
    )
    date_upload = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'upload"
    )
    produit = models.ForeignKey(
        Produit,
        on_delete=models.CASCADE,
        related_name='medias',
        verbose_name="Produit"
    )

    def __str__(self):
        return f"{self.type_media} - {self.url_fichier}"

    class Meta:
        verbose_name = "Média"
        verbose_name_plural = "Médias"