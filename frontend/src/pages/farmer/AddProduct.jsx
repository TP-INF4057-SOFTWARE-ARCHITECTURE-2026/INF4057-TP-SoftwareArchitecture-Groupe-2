import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PhotoIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const AddProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '', // Nom de la catégorie
    price: '',
    unit: 'kg',
    stock_quantity: '',
    conditions_conservation: '',
    harvest_date: '',
    cultivation_method: 'conventionnelle',
    is_organic: false,
    images: []
  });

  // Unités de mesure
  const units = [
    { value: 'kg', label: 'Kilogramme (kg)' },
    { value: 'g', label: 'Gramme (g)' },
    { value: 'L', label: 'Litre (L)' },
    { value: 'mL', label: 'Millilitre (mL)' },
    { value: 'pièce', label: 'Pièce' },
    { value: 'régime', label: 'Régime' },
    { value: 'bot', label: 'Bot' },
    { value: 'sachet', label: 'Sachet' },
    { value: 'carton', label: 'Carton' }
  ];

  // Méthodes de culture
  const cultivationMethods = [
    { value: 'conventionnelle', label: 'Conventionnelle' },
    { value: 'biologique', label: 'Biologique' },
    { value: 'raisonnée', label: 'Raisonnée' },
    { value: 'permaculture', label: 'Permaculture' },
    { value: 'agroécologie', label: 'Agroécologie' }
  ];

  // Catégories par défaut
  const defaultCategories = [
    { categorie_id: 1, nom: 'Fruits', description: 'Fruits frais et secs' },
    { categorie_id: 2, nom: 'Légumes', description: 'Légumes frais et transformés' },
    { categorie_id: 3, nom: 'Céréales', description: 'Céréales et dérivés' },
    { categorie_id: 4, nom: 'Tubercules', description: 'Manioc, igname, patate' },
    { categorie_id: 5, nom: 'Épicerie', description: 'Produits d\'épicerie' },
    { categorie_id: 6, nom: 'Boissons', description: 'Jus et boissons naturelles' },
    { categorie_id: 7, nom: 'Produits Laitiers', description: 'Lait, fromage, yaourt' },
    { categorie_id: 8, nom: 'Viandes', description: 'Viandes et volailles' },
    { categorie_id: 9, nom: 'Poissons', description: 'Poissons et fruits de mer' },
    { categorie_id: 10, nom: 'Œufs', description: 'Œufs frais' },
    { categorie_id: 11, nom: 'Miels', description: 'Miels et produits de la ruche' },
    { categorie_id: 12, nom: 'Épices', description: 'Épices et condiments' }
  ];

  // Charger les catégories depuis l'API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        console.log('🔄 Chargement des catégories...');
        
        const response = await productsAPI.getCategories();
        console.log('📦 Réponse API catégories:', response);
        
        if (response && response.data) {
          // Format 1: Tableau direct
          if (Array.isArray(response.data)) {
            console.log('✅ Format tableau direct - Catégories:', response.data.length);
            setCategories(response.data);
          } 
          // Format 2: Pagination avec results
          else if (response.data.results && Array.isArray(response.data.results)) {
            console.log('✅ Format pagination - Catégories:', response.data.results.length);
            setCategories(response.data.results);
          }
          // Format 3: Objet avec clé 'categories'
          else if (response.data.categories && Array.isArray(response.data.categories)) {
            console.log('✅ Format categories - Catégories:', response.data.categories.length);
            setCategories(response.data.categories);
          }
          // Format 4: Aucun format reconnu
          else {
            console.warn('⚠️ Format inattendu, utilisation des catégories par défaut');
            setCategories(defaultCategories);
          }
        } else {
          console.warn('⚠️ Réponse vide, utilisation des catégories par défaut');
          setCategories(defaultCategories);
        }
      } catch (error) {
        console.error('❌ Erreur chargement catégories:', error);
        
        // Utiliser les catégories par défaut
        setCategories(defaultCategories);
        
        // Message temporaire
        setError('Chargement des catégories échoué. Utilisation des catégories par défaut.');
        setTimeout(() => setError(''), 3000);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = value;
    if (name === 'price' || name === 'stock_quantity') {
      processedValue = value === '' ? '' : Number(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));
    
    if (error || success) {
      setError('');
      setSuccess('');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('Maximum 5 images autorisées');
      return;
    }
    
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError('Certains fichiers dépassent la taille maximale de 10MB');
      return;
    }
    
    const newImages = [...formData.images, ...files];
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Le nom du produit est requis');
    if (!formData.category) errors.push('La catégorie est requise');
    if (!formData.price || formData.price <= 0) errors.push('Le prix doit être supérieur à 0');
    if (!formData.stock_quantity || formData.stock_quantity <= 0) errors.push('La quantité en stock doit être supérieure à 0');
    if (!formData.description?.trim()) errors.push('La description est requise');
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation du formulaire
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    // Vérifier que l'utilisateur est connecté et a un rôle d'agriculteur
    if (!user?.id) {
      setError('Vous devez être connecté pour créer un produit');
      setLoading(false);
      return;
    }

    // Vérifier le rôle (accepter multiple rôles)
    const validRoles = ['farmer', 'vendeur', 'agriculteur'];
    if (!validRoles.includes(user?.role?.toLowerCase())) {
      setError('Seuls les agriculteurs peuvent créer des produits');
      setLoading(false);
      return;
    }

    try {
      console.log('🟡 Début création produit');
      console.log('🟡 Catégorie sélectionnée:', formData.category);
      console.log('🟡 User ID:', user.id);

      // Préparer les données pour l'API
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category, // Nom de la catégorie
        price: parseFloat(formData.price),
        unit: formData.unit,
        stock_quantity: parseInt(formData.stock_quantity),
        conditions_conservation: formData.conditions_conservation?.trim() || '',
        harvest_date: formData.harvest_date || null,
        cultivation_method: formData.cultivation_method,
        is_organic: formData.is_organic,
        farmer: user.id,
        status: 'available' // Produit disponible immédiatement
      };

      console.log('📤 Données envoyées à l\'API:', productData);

      // Appel API pour créer le produit
      const response = await productsAPI.create(productData);
      console.log('✅ Réponse de l\'API:', response.data);

      // Gérer l'upload des images si présentes
      if (formData.images.length > 0) {
        console.log('📸 Début de l\'upload des images');
        
        // Obtenir l'ID du produit créé (vérifier plusieurs formats de réponse)
        let productId = null;
        if (response.data?.id) {
          productId = response.data.id;
        } else if (response.data?.data?.id) {
          productId = response.data.data.id;
        } else if (response.data?.product_id) {
          productId = response.data.product_id;
        }
        
        if (productId) {
          for (let i = 0; i < formData.images.length; i++) {
            try {
              await productsAPI.uploadImage(productId, formData.images[i]);
              console.log(`✅ Image ${i + 1} uploadée avec succès`);
            } catch (imgError) {
              console.warn(`⚠️ Erreur lors de l'upload de l'image ${i + 1}:`, imgError);
            }
          }
        } else {
          console.warn('⚠️ Impossible de récupérer l\'ID du produit pour l\'upload des images');
        }
      }

      // Message de succès avec informations
      const productName = response.data?.name || response.data?.data?.name || formData.name;
      setSuccess(`✅ Produit "${productName}" créé avec succès !\nVotre produit est maintenant visible sur le marketplace.\nRedirection vers votre dashboard...`);
      
      // Redirection après succès (3 secondes pour lire le message)
      setTimeout(() => {
        navigate('/farmer/dashboard', {
          state: {
            productCreated: true,
            productName: productName,
            productId: response.data?.id || response.data?.data?.id,
            timestamp: new Date().toISOString()
          }
        });
      }, 3000);

    } catch (error) {
      console.error('❌ Erreur lors de la création du produit:', error);
      
      let errorMessage = 'Erreur lors de la création du produit';
      let errorDetails = '';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        console.log('📄 Réponse d\'erreur:', errorData);
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors;
        } else {
          // Afficher les erreurs de validation par champ
          const fieldErrors = [];
          Object.entries(errorData).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${errors.join(', ')}`);
            } else if (typeof errors === 'string') {
              fieldErrors.push(`${field}: ${errors}`);
            }
          });
          
          if (fieldErrors.length > 0) {
            errorMessage = 'Erreurs de validation:';
            errorDetails = fieldErrors.join('; ');
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Afficher l'erreur
      if (errorDetails) {
        setError(`${errorMessage} - ${errorDetails}`);
      } else {
        setError(`❌ ${errorMessage}`);
      }
      
    } finally {
      setLoading(false);
    }
  };

  // Rendu du composant
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Ajouter un <span className="text-green-600">nouveau produit</span>
          </h1>
          <p className="text-xl text-gray-600">
            Remplissez les informations de votre produit agricole
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Votre produit sera automatiquement publié sur le marketplace après création
          </p>
        </div>

        {/* Messages d'erreur/succès */}
        {(error || success) && (
          <div className={`mb-6 p-4 rounded-xl ${error ? 'bg-red-50 border-red-200 text-red-700 border' : 'bg-green-50 border-green-200 text-green-700 border'} animate-fade-in`}>
            <div className="flex items-start">
              {error ? (
                <ExclamationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              )}
              <span className="whitespace-pre-line text-sm">{error || success}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations de base */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <PhotoIcon className="h-6 w-6 mr-3 text-green-600" />
              Informations du produit
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom du produit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-300"
                  placeholder="Ex: Tomates fraîches bio"
                  disabled={loading}
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catégorie *
                </label>
                {loadingCategories ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-gray-600">Chargement des catégories...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-300 disabled:opacity-50"
                      disabled={loading}
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      {categories.map(category => (
                        <option key={category.categorie_id || category.id} value={category.nom}>
                          {category.nom}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      {categories.length} catégorie(s) disponible(s)
                    </p>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description détaillée *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-300 disabled:opacity-50"
                  placeholder="Décrivez votre produit en détail (qualité, fraîcheur, particularités...)"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Prix et stock */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <CurrencyDollarIcon className="h-6 w-6 mr-3 text-green-600" />
              Prix et disponibilité
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Prix */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prix (FCFA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="1"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-300 disabled:opacity-50"
                    placeholder="1500"
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">FCFA</span>
                  </div>
                </div>
              </div>

              {/* Unité */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unité de vente *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-300 disabled:opacity-50"
                  disabled={loading}
                >
                  {units.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantité en stock *
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-300 disabled:opacity-50"
                  placeholder="50"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Informations agricoles */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <ScaleIcon className="h-6 w-6 mr-3 text-green-600" />
              Informations agricoles
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Méthode de culture */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Méthode de culture
                </label>
                <select
                  name="cultivation_method"
                  value={formData.cultivation_method}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-300 disabled:opacity-50"
                  disabled={loading}
                >
                  {cultivationMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date de récolte */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de récolte
                </label>
                <input
                  type="date"
                  name="harvest_date"
                  value={formData.harvest_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-300 disabled:opacity-50"
                  disabled={loading}
                />
              </div>

              {/* Agriculture biologique */}
              <div className="flex items-center p-4 bg-green-50 rounded-xl">
                <input
                  type="checkbox"
                  name="is_organic"
                  checked={formData.is_organic}
                  onChange={handleChange}
                  className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                  disabled={loading}
                />
                <label className="ml-3 text-sm font-semibold text-gray-700 cursor-pointer">
                  Produit issu de l'agriculture biologique
                </label>
              </div>

              {/* Conditions de conservation */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Conditions de conservation
                </label>
                <input
                  type="text"
                  name="conditions_conservation"
                  value={formData.conditions_conservation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-green-300 disabled:opacity-50"
                  placeholder="Ex: Conserver au frais, à l'abri de la lumière"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Upload d'images */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <PhotoIcon className="h-6 w-6 mr-3 text-green-600" />
              Photos du produit (Optionnel)
            </h2>

            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-green-400 transition-all duration-300">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="images" className="cursor-pointer">
                  <span 
                    className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-all duration-300 inline-block disabled:opacity-50 disabled:cursor-not-allowed"
                    style={loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    📸 Choisir des photos
                  </span>
                  <input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  PNG, JPG, JPEG jusqu'à 10MB (max 5 images)
                </p>
              </div>
            </div>

            {/* Aperçu des images */}
            {formData.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Aperçu des photos ({formData.images.length}/5)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      {!loading && (
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Informations de débogage */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
                <h3 className="text-sm font-semibold text-blue-800">Mode Développement</h3>
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <p>User ID: {user?.id || 'Non connecté'}</p>
                <p>Rôle: {user?.role || 'Non défini'}</p>
                <p>Catégories chargées: {categories.length}</p>
                <p>Catégorie sélectionnée: {formData.category || 'Aucune'}</p>
                <p>Images sélectionnées: {formData.images.length}</p>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/farmer/dashboard')}
              className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || loadingCategories}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Publication en cours...
                </>
              ) : (
                <>
                  🌱 Publier le produit
                </>
              )}
            </button>
          </div>
        </form>

        {/* Informations supplémentaires */}
        <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <InformationCircleIcon className="h-5 w-5 mr-2 text-green-600" />
            Informations importantes
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Votre produit sera automatiquement publié sur le marketplace</li>
            <li>• Les champs marqués d'un * sont obligatoires</li>
            <li>• Vous pourrez modifier votre produit depuis votre dashboard</li>
            <li>• Les produits sont visibles par tous les utilisateurs du site</li>
            <li>• Assurez-vous que vos informations sont exactes et complètes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;