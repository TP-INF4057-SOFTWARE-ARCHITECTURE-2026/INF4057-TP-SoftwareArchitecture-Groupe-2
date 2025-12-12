import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  StarIcon,
  MapPinIcon,
  ShieldCheckIcon,
  TruckIcon,
  ShoppingCartIcon,
  HeartIcon,
  CalendarIcon,
  TagIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [images, setImages] = useState([]);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    fetchProduct();
    fetchProductImages();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(id);
      const productData = response.data;
      
      console.log('📦 Données du produit récupérées:', productData);
      setProduct(productData);
      
      // Récupérer le nom de la catégorie si c'est un ID
      if (productData.category && typeof productData.category === 'number') {
        fetchCategoryName(productData.category);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du produit:', error);
      // Fallback avec des données mockées pour le développement
      setProduct(getMockProduct());
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryName = async (categoryId) => {
    try {
      const response = await productsAPI.getCategories();
      const category = response.data.find(cat => cat.categorie_id === categoryId);
      if (category) {
        setCategoryName(category.nom);
      }
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer le nom de la catégorie:', error);
    }
  };

  const fetchProductImages = async () => {
    try {
      const response = await productsAPI.getProductImages(id);
      console.log('📸 Images du produit:', response.data);
      setImages(response.data || []);
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer les images du produit:', error);
      // Images par défaut pour le développement
      setImages([
        { media_id: 1, url_fichier: '/api/placeholder/600/400', type_media: 'image' },
        { media_id: 2, url_fichier: '/api/placeholder/600/400', type_media: 'image' },
        { media_id: 3, url_fichier: '/api/placeholder/600/400', type_media: 'image' }
      ]);
    }
  };

  const getMockProduct = () => ({
    id: parseInt(id),
    name: 'Tomates fraîches bio',
    description: 'Tomates rouges et juteuses cultivées localement avec des méthodes respectueuses de l\'environnement. Récoltées quotidiennement pour garantir une fraîcheur optimale.',
    price: 1500,
    category: 'Légumes',
    unit: 'kg',
    stock_quantity: 50,
    farmer_name: 'Jean Agriculteur',
    farmer_location: 'Yaoundé, Cameroun',
    farmer_id: '7de46e9a-bb6a-46bf-b46f-9aad116025b2',
    rating: 4.5,
    review_count: 23,
    is_organic: true,
    harvest_date: '2024-01-10',
    created_at: '2024-01-01T10:00:00Z',
    conditions_conservation: 'Conserver au frais, à l\'abri de la lumière',
    cultivation_method: 'biologique'
  });

  const handleAddToCart = () => {
    if (!user) {
      alert('Veuillez vous connecter pour ajouter des produits au panier');
      return;
    }
    
    console.log('🛒 Ajout au panier:', { 
      product: product, 
      quantity: quantity,
      total: product.price * quantity 
    });
    
    // TODO: Intégrer la logique du panier
    alert(`${quantity} ${product.unit} de ${product.name} ajouté(s) au panier`);
  };

  const handleBuyNow = () => {
    if (!user) {
      alert('Veuillez vous connecter pour effectuer un achat');
      return;
    }
    
    console.log('⚡ Achat immédiat:', { 
      product: product, 
      quantity: quantity,
      total: product.price * quantity 
    });
    
    // TODO: Intégrer la logique de commande rapide
    alert(`Commande de ${quantity} ${product.unit} de ${product.name} créée`);
  };

  const toggleWishlist = () => {
    if (!user) {
      alert('Veuillez vous connecter pour ajouter aux favoris');
      return;
    }
    
    setIsInWishlist(!isInWishlist);
    const action = isInWishlist ? 'retiré des' : 'ajouté aux';
    console.log(`⭐ Produit ${action} favoris:`, product.name);
    
    // TODO: Intégrer la logique des favoris
    alert(`Produit ${action} favoris`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            {/* Breadcrumb skeleton */}
            <div className="h-4 bg-gray-200 rounded w-64"></div>
            
            {/* Product skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image skeleton */}
              <div className="space-y-4">
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="h-20 bg-gray-200 rounded-xl"></div>
                  <div className="h-20 bg-gray-200 rounded-xl"></div>
                  <div className="h-20 bg-gray-200 rounded-xl"></div>
                  <div className="h-20 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
              
              {/* Info skeleton */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                
                <div className="h-20 bg-gray-200 rounded"></div>
                
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produit non trouvé</h2>
          <p className="text-gray-600 mb-6">
            Le produit que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Retour au marché
          </Link>
        </div>
      </div>
    );
  }

  // Déterminer le nom de la catégorie à afficher
  const displayCategory = categoryName || product.category || 'Non spécifiée';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link to="/" className="hover:text-green-600 transition-colors">
                Accueil
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link to="/marketplace" className="hover:text-green-600 transition-colors">
                Marché
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium truncate" title={product.name}>
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Images du produit */}
            <div>
              <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-2xl overflow-hidden mb-4">
                <img
                  src={images[selectedImage]?.url_fichier || '/api/placeholder/600/600'}
                  alt={product.name}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    e.target.src = '/api/placeholder/600/600';
                  }}
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={image.media_id || index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-w-1 aspect-h-1 bg-gray-200 rounded-xl overflow-hidden transition-all duration-200 ${
                        selectedImage === index ? 'ring-2 ring-green-500 ring-offset-2' : 'hover:opacity-80'
                      }`}
                    >
                      <img
                        src={image.url_fichier}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-20 object-cover"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/150/150';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informations du produit */}
            <div className="flex flex-col">
              <div className="flex-1">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {displayCategory}
                  </span>
                  {product.is_organic && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                      🌱 Biologique
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`h-5 w-5 ${
                          star <= (product.rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {product.rating || 'N/A'} ({product.review_count || 0} avis)
                  </span>
                </div>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {product.description}
                </p>

                <div className="mb-6 space-y-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <UserCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Vendu par: </span>
                    <Link
                      to={`/farmer/${product.farmer_id}`}
                      className="ml-1 text-green-600 hover:text-green-500 font-medium"
                    >
                      {product.farmer_name || 'Agriculteur'}
                    </Link>
                  </div>
                  {product.farmer_location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{product.farmer_location}</span>
                    </div>
                  )}
                  {product.cultivation_method && (
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">🌱</span>
                      <span>Méthode: {product.cultivation_method}</span>
                    </div>
                  )}
                  {product.harvest_date && (
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Récolté le: {new Date(product.harvest_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {product.conditions_conservation && (
                    <div className="text-sm text-gray-500 mt-2">
                      <span className="font-medium">Conservation:</span> {product.conditions_conservation}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {product.price?.toLocaleString()} FCFA
                    <span className="text-sm text-gray-500 font-normal ml-2">
                      / {product.unit}
                    </span>
                  </div>
                  
                  {product.stock_quantity > 0 ? (
                    <div className="flex items-center text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      En stock ({product.stock_quantity} {product.unit})
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      Rupture de stock
                    </div>
                  )}
                </div>

                {/* Sélection de quantité */}
                <div className="mb-6">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité
                  </label>
                  <div className="flex items-center">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={product.stock_quantity === 0}
                      className="px-4 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      max={product.stock_quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 py-2 text-center border-t border-b border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                      disabled={product.stock_quantity === 0}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      disabled={product.stock_quantity === 0}
                      className="px-4 py-2 border border-gray-300 rounded-r-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                    <span className="ml-2 text-sm text-gray-500">
                      {product.unit}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0 || !user}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    {user ? 'Ajouter au panier' : 'Connectez-vous'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock_quantity === 0 || !user}
                    className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {user ? 'Acheter maintenant' : 'Connectez-vous'}
                  </button>
                  <button
                    onClick={toggleWishlist}
                    disabled={!user}
                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HeartIcon className={`h-6 w-6 ${isInWishlist ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>

              {/* Garanties */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <TruckIcon className="h-5 w-5 mr-2 text-green-500" />
                    Livraison gratuite à partir de 50,000 FCFA
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Paiement sécurisé
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-5 h-5 mr-2">🔄</span>
                    Retour facile sous 7 jours
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section recommandations */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Produits similaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <p>D'autres produits vous seront bientôt recommandés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;