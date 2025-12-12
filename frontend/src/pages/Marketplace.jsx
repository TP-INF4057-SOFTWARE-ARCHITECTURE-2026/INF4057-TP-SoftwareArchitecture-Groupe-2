import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ShoppingCartIcon,
  HeartIcon,
  EyeIcon,
  TagIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [wishlist, setWishlist] = useState(new Set());
  const [categoryNames, setCategoryNames] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      
      // Si l'API retourne un objet avec une propriété 'results'
      const productsData = response.data.results || response.data || [];
      
      // Transformer les données si nécessaire
      const transformedProducts = Array.isArray(productsData) 
        ? productsData.map(product => ({
            id: product.id || product.produit_id,
            name: product.name || product.nom,
            description: product.description,
            price: product.price || product.prix_unitaire,
            category: product.category,
            category_id: product.category,
            unit: product.unit || product.unite_mesure,
            stock_quantity: product.stock_quantity || product.quantite_stock,
            farmer_name: product.farmer_name,
            farmer_id: product.farmer || product.id_agriculteur,
            farmer_location: product.farmer_location,
            rating: product.rating,
            review_count: product.review_count,
            images: product.images || [],
            is_organic: product.is_organic || product.est_bio,
            created_at: product.created_at || product.date_publication,
            conditions_conservation: product.conditions_conservation,
            status: product.status || product.statut
          }))
        : [];
      
      setProducts(transformedProducts);
      
      // Extraire les IDs de catégories pour récupérer les noms
      const categoryIds = [...new Set(transformedProducts
        .filter(p => p.category_id)
        .map(p => p.category_id))];
      
      if (categoryIds.length > 0) {
        fetchCategoryNames(categoryIds);
      }
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      // Fallback avec des données mockées pour le développement
      setProducts(getMockProducts());
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      const categoriesData = response.data.results || response.data || [];
      
      // Transformer les catégories
      const transformedCategories = categoriesData.map(cat => ({
        id: cat.categorie_id || cat.id,
        name: cat.nom,
        description: cat.description,
        product_count: cat.product_count || 0
      }));
      
      setCategories(transformedCategories);
      
      // Créer un mapping ID -> Nom pour référence rapide
      const categoryMapping = {};
      transformedCategories.forEach(cat => {
        categoryMapping[cat.id] = cat.name;
      });
      setCategoryNames(categoryMapping);
      
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setCategories(getMockCategories());
    }
  };

  const fetchCategoryNames = async (categoryIds) => {
    try {
      const response = await productsAPI.getCategories();
      const categoriesData = response.data.results || response.data || [];
      
      const mapping = {};
      categoriesData.forEach(cat => {
        const catId = cat.categorie_id || cat.id;
        if (categoryIds.includes(catId)) {
          mapping[catId] = cat.nom;
        }
      });
      
      setCategoryNames(prev => ({ ...prev, ...mapping }));
      
    } catch (error) {
      console.warn('⚠️ Could not fetch category names:', error);
    }
  };

  const getMockProducts = () => [
    {
      id: 1,
      name: 'Tomates fraîches bio',
      description: 'Tomates rouges et juteuses cultivées localement avec des méthodes respectueuses de l\'environnement.',
      price: 1500,
      category: 'Légumes',
      category_id: 2,
      unit: 'kg',
      stock_quantity: 50,
      farmer_name: 'Jean Agriculteur',
      farmer_location: 'Yaoundé, Cameroun',
      rating: 4.5,
      review_count: 23,
      images: ['/api/placeholder/400/300'],
      is_organic: true,
      created_at: new Date().toISOString(),
      conditions_conservation: 'Conserver au frais',
      status: 'available'
    },
    {
      id: 2,
      name: 'Bananes plantains',
      description: 'Bananes plantains mûres et savoureuses, parfaites pour la cuisson.',
      price: 800,
      category: 'Fruits',
      category_id: 1,
      unit: 'régime',
      stock_quantity: 25,
      farmer_name: 'Marie Fermière',
      farmer_location: 'Douala, Cameroun',
      rating: 4.8,
      review_count: 15,
      images: ['/api/placeholder/400/300'],
      is_organic: false,
      created_at: new Date().toISOString(),
      conditions_conservation: 'Conserver à température ambiante',
      status: 'available'
    },
    {
      id: 3,
      name: 'Carottes bio',
      description: 'Carottes croquantes et sucrées issues de l\'agriculture biologique.',
      price: 1200,
      category: 'Légumes',
      category_id: 2,
      unit: 'kg',
      stock_quantity: 40,
      farmer_name: 'Pierre Cultivateur',
      farmer_location: 'Bafoussam, Cameroun',
      rating: 4.7,
      review_count: 18,
      images: ['/api/placeholder/400/300'],
      is_organic: true,
      created_at: new Date().toISOString(),
      conditions_conservation: 'Conserver au frais et à l\'abri de la lumière',
      status: 'available'
    },
    {
      id: 4,
      name: 'Miel pur',
      description: 'Miel 100% naturel produit par nos abeilles locales.',
      price: 3500,
      category: 'Miels',
      category_id: 11,
      unit: 'pot',
      stock_quantity: 15,
      farmer_name: 'Apiculteur Traditionnel',
      farmer_location: 'Limbe, Cameroun',
      rating: 4.9,
      review_count: 32,
      images: ['/api/placeholder/400/300'],
      is_organic: true,
      created_at: new Date().toISOString(),
      conditions_conservation: 'Conserver à l\'abri de la chaleur',
      status: 'available'
    }
  ];

  const getMockCategories = () => [
    { id: 1, name: 'Fruits', product_count: 24 },
    { id: 2, name: 'Légumes', product_count: 18 },
    { id: 3, name: 'Céréales', product_count: 12 },
    { id: 4, name: 'Tubercules', product_count: 8 },
    { id: 5, name: 'Épicerie', product_count: 15 },
    { id: 6, name: 'Boissons', product_count: 6 },
    { id: 7, name: 'Produits Laitiers', product_count: 9 },
    { id: 8, name: 'Viandes', product_count: 7 },
    { id: 9, name: 'Poissons', product_count: 5 },
    { id: 10, name: 'Œufs', product_count: 11 },
    { id: 11, name: 'Miels', product_count: 4 },
    { id: 12, name: 'Épices', product_count: 13 }
  ];

  const toggleWishlist = (productId) => {
    const newWishlist = new Set(wishlist);
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId);
    } else {
      newWishlist.add(productId);
    }
    setWishlist(newWishlist);
  };

  // Fonction pour obtenir le nom de la catégorie (ID ou nom)
  const getCategoryName = (product) => {
    if (product.category && typeof product.category === 'string') {
      return product.category;
    }
    if (product.category_id && categoryNames[product.category_id]) {
      return categoryNames[product.category_id];
    }
    return 'Non catégorisé';
  };

  // Fonction pour obtenir l'image du produit
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      // Si c'est un tableau d'objets avec url_fichier
      if (typeof product.images[0] === 'object' && product.images[0].url_fichier) {
        return product.images[0].url_fichier;
      }
      // Si c'est directement un string (URL)
      if (typeof product.images[0] === 'string') {
        return product.images[0];
      }
    }
    return '/api/placeholder/400/300';
  };

  const filteredProducts = products
    .filter(product => {
      // Recherche par nom, description ou agriculteur
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.farmer_name?.toLowerCase().includes(searchLower)
      );
    })
    .filter(product => {
      // Filtre par catégorie
      if (!selectedCategory) return true;
      const categoryName = getCategoryName(product);
      return categoryName === selectedCategory;
    })
    .filter(product => {
      // Filtre par prix
      return product.price >= priceRange[0] && product.price <= priceRange[1];
    })
    .filter(product => {
      // Filtre par disponibilité (optionnel)
      return product.status !== 'out_of_stock';
    })
    .sort((a, b) => {
      // Tri des produits
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'stock':
          return b.stock_quantity - a.stock_quantity;
        default:
          return a.name?.localeCompare(b.name);
      }
    });

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🛒 Added to cart:', {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      unit: product.unit
    });
    
    // TODO: Intégrer la logique du panier
    alert(`1 ${product.unit} de ${product.name} ajouté au panier`);
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange([0, 100000]);
    setSortBy('name');
    setIsFilterOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Skeleton de l'en-tête */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-2xl mb-6 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto animate-pulse"></div>
          </div>

          {/* Skeleton de la barre de recherche */}
          <div className="bg-white rounded-2xl p-6 mb-8 animate-pulse">
            <div className="h-12 bg-gray-200 rounded-xl"></div>
          </div>

          {/* Skeleton des catégories */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-xl w-24 animate-pulse"></div>
            ))}
          </div>

          {/* Skeleton des produits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-2xl mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête professionnel */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-6 transform transition-transform hover:scale-105 duration-300">
            <span className="text-3xl text-white">🌾</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-700">
            Marché Agricole TerraBia
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Découvrez des produits frais et locaux directement de nos agriculteurs partenaires. 
            Qualité garantie, traçabilité assurée.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {products.length} produits disponibles
            </div>
            <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
              <UserCircleIcon className="w-4 h-4 mr-2" />
              {new Set(products.map(p => p.farmer_id)).size} agriculteurs
            </div>
            <div className="flex items-center text-sm text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full">
              <TagIcon className="w-4 h-4 mr-2" />
              {categories.length} catégories
            </div>
          </div>
        </div>

        {/* Filtres et recherche avancés */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            {/* Barre de recherche principale */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-green-500" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher des produits, agriculteurs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 placeholder-gray-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Contrôles de filtre */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Bouton filtre mobile */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="lg:hidden px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 flex items-center gap-2 font-medium border border-green-200"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                Filtres
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {selectedCategory ? 1 : 0}
                </span>
              </button>

              {/* Filtres desktop */}
              <div className={`${isFilterOpen ? 'flex flex-col space-y-4' : 'hidden lg:flex lg:flex-row lg:space-y-0 lg:space-x-4'}`}>
                {/* Catégories */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 cursor-pointer min-w-[200px] font-medium hover:border-green-300"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name} ({category.product_count || 0})
                      </option>
                    ))}
                  </select>
                  <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 pointer-events-none" />
                </div>

                {/* Tri */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 cursor-pointer min-w-[180px] font-medium hover:border-green-300"
                  >
                    <option value="name">Trier par: Nom</option>
                    <option value="price-low">Prix: Croissant</option>
                    <option value="price-high">Prix: Décroissant</option>
                    <option value="rating">Meilleures notes</option>
                    <option value="newest">Plus récents</option>
                    <option value="stock">Stock disponible</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres avancés (prix) */}
          {isFilterOpen && (
            <div className="mt-6 pt-6 border-t border-gray-200 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fourchette de prix (FCFA)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 transition-all duration-200"
                      min="0"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 transition-all duration-200"
                      min="0"
                    />
                    <button
                      onClick={() => setPriceRange([0, 100000])}
                      className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Statut du produit
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => {}}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">En stock</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => {}}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Bio</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation par catégories */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Parcourir par catégorie
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedCategory === '' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-green-300 hover:shadow-md hover:scale-105'
              }`}
            >
              <span>🏪</span>
              Tous les produits
              <span className="text-xs opacity-75 bg-white/20 px-2 py-0.5 rounded-full">
                {products.length}
              </span>
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedCategory === category.name
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-green-300 hover:shadow-md hover:scale-105'
                }`}
              >
                <span>{
                  category.name === 'Fruits' ? '🍎' :
                  category.name === 'Légumes' ? '🥦' :
                  category.name === 'Céréales' ? '🌾' :
                  category.name === 'Tubercules' ? '🥔' :
                  category.name === 'Épicerie' ? '🫙' :
                  category.name === 'Boissons' ? '🥤' :
                  category.name === 'Produits Laitiers' ? '🥛' :
                  category.name === 'Viandes' ? '🥩' :
                  category.name === 'Poissons' ? '🐟' :
                  category.name === 'Œufs' ? '🥚' :
                  category.name === 'Miels' ? '🍯' :
                  category.name === 'Épices' ? '🌶️' : '🌱'
                }</span>
                {category.name}
                <span className="text-xs opacity-75 bg-white/20 px-2 py-0.5 rounded-full">
                  {category.product_count || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* En-tête des résultats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory || 'Tous les produits'}
            </h2>
            <p className="text-gray-600 mt-1">
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} disponible{filteredProducts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            <FunnelIcon className="h-4 w-4 mr-2 text-green-500" />
            Tri: {
              sortBy === 'name' ? 'Nom' :
              sortBy === 'price-low' ? 'Prix croissant' :
              sortBy === 'price-high' ? 'Prix décroissant' :
              sortBy === 'rating' ? 'Meilleures notes' :
              sortBy === 'newest' ? 'Plus récents' : 'Stock disponible'
            }
          </div>
        </div>

        {/* Grille de produits professionnelle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredProducts.map((product) => {
            const categoryName = getCategoryName(product);
            const productImage = getProductImage(product);
            
            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
              >
                {/* En-tête de la carte avec image */}
                <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={productImage}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/400/300';
                        e.target.className = 'w-full h-48 object-cover bg-gradient-to-br from-green-50 to-emerald-100';
                      }}
                    />
                  </Link>

                  {/* Actions rapides */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className={`p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 ${
                        wishlist.has(product.id)
                          ? 'bg-red-500 text-white transform scale-110'
                          : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-110'
                      }`}
                      title={wishlist.has(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <HeartIcon className={`h-4 w-4 ${wishlist.has(product.id) ? 'fill-current' : ''}`} />
                    </button>
                    <Link 
                      to={`/product/${product.id}`}
                      className="p-2 rounded-full bg-white/90 text-gray-700 shadow-lg backdrop-blur-sm hover:bg-white hover:scale-110 transition-all duration-200"
                      title="Voir les détails"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                      {categoryName}
                    </span>
                    {product.is_organic && (
                      <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm flex items-center gap-1">
                        <span>🌱</span> Bio
                      </span>
                    )}
                    {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                      <span className="bg-orange-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                        Stock limité
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenu de la carte */}
                <div className="p-5">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors duration-200 leading-tight text-lg">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed min-h-[40px]">
                    {product.description}
                  </p>

                  {/* Informations du vendeur */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPinIcon className="h-4 w-4 mr-1.5 text-green-500 flex-shrink-0" />
                      <span className="truncate max-w-[120px]" title={product.farmer_location}>
                        {product.farmer_location || 'Localisation non précisée'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <StarIcon className="h-4 w-4 mr-1 text-yellow-400 flex-shrink-0" />
                      <span className="font-medium">{product.rating || '4.5'}</span>
                      <span className="text-gray-400 ml-1">({product.review_count || 0})</span>
                    </div>
                  </div>

                  {/* Prix et action */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {product.price?.toLocaleString()} FCFA
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>par {product.unit || 'unité'}</span>
                        {product.stock_quantity > 0 && (
                          <span className="text-green-500">• {product.stock_quantity} disponibles</span>
                        )}
                      </div>
                    </div>

                    {product.stock_quantity > 0 ? (
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-2.5 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
                        title="Ajouter au panier"
                      >
                        <ShoppingCartIcon className="h-5 w-5" />
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                        Rupture de stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* État vide */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-4xl text-gray-400">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Aucun produit trouvé
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {searchTerm 
                ? `Aucun produit ne correspond à "${searchTerm}"`
                : 'Aucun produit ne correspond à vos critères de recherche.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetFilters}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Réinitialiser les filtres
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border border-gray-300 hover:border-green-300 hover:shadow-md transition-all duration-200"
              >
                Actualiser la page
              </button>
            </div>
          </div>
        )}

        {/* Pagination (exemple) */}
        {filteredProducts.length > 0 && filteredProducts.length > 12 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors flex items-center">
              ← Précédent
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium">1</button>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors">2</button>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors">3</button>
            <span className="px-2 text-gray-400">...</span>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors">10</button>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors flex items-center">
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;