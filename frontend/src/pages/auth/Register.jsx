import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo1 from '../../assets/terrabia-logo.png';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer', // Frontend role
    phone: '',
    location: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    setError(''); // Clear error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('Veuillez accepter les conditions d\'utilisation');
      setLoading(false);
      return;
    }

    // ============ MAPPING DES RÔLES ============
    // Frontend → Backend
    const roleMapping = {
      'buyer': 'acheteur',
      'farmer': 'vendeur',  // "Agriculteur" = "vendeur" dans le backend
      'driver': 'livreur'
    };

    const backendRole = roleMapping[formData.role] || 'acheteur';

    // Préparer les données pour le backend
    const { confirmPassword, acceptTerms, ...submitData } = formData;
    
    const registrationData = {
      ...submitData,
      role: backendRole, // Envoyer le rôle backend
      fullName: submitData.name, // Certains backends attendent fullName
      phone_number: submitData.phone, // Format possible du backend
      address: submitData.location // Format possible du backend
    };

    console.log('Envoi des données:', registrationData);

    try {
      const result = await register(registrationData);
      
      if (result.success) {
        setSuccess('Compte créé avec succès ! Redirection...');
        
        // Redirection selon le rôle frontend
        setTimeout(() => {
          switch(formData.role) {
            case 'farmer':
              navigate('/farmer/dashboard', { replace: true });
              break;
            case 'driver':
              navigate('/driver/dashboard', { replace: true });
              break;
            case 'buyer':
            default:
              navigate('/buyer/dashboard', { replace: true });
          }
        }, 1500);
      } else {
        setError(result.error || 'Une erreur est survenue lors de l\'inscription');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'buyer',
      label: 'Acheteur',
      backendValue: 'acheteur', // Pour l'affichage
      description: 'Achetez des produits frais directement des agriculteurs',
      icon: UserIcon,
      color: 'blue',
      badge: 'acheteur'
    },
    {
      value: 'farmer',
      label: 'Agriculteur',
      backendValue: 'vendeur',
      description: 'Vendez vos produits agricoles directement aux consommateurs',
      icon: BuildingStorefrontIcon,
      color: 'green',
      badge: 'vendeur'
    },
    {
      value: 'driver',
      label: 'Entreprise de livraison',
      backendValue: 'livreur',
      description: 'Rejoignez notre réseau de livraison',
      icon: TruckIcon,
      color: 'orange',
      badge: 'livreur'
    }
  ];

  const getColorClasses = (color, selected) => {
    const baseColors = {
      green: selected ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300',
      blue: selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300',
      orange: selected ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-orange-300'
    };
    return baseColors[color] || baseColors.green;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
            <img
              src={logo1}
              alt="Terrabia Logo"
              className="h-10 w-auto"
            />
          </Link>
        </div>
        <h2 className="mt-8 text-center text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
          Rejoignez notre communauté
        </h2>
        <p className="mt-3 text-center text-sm text-gray-600 max-w-sm mx-auto">
          Créez votre compte et commencez à bénéficier de produits frais directement de la ferme
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center animate-fade-in">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center animate-fade-in">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="Votre nom complet"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="email@exemple.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="+237 6 XX XX XX XX"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                  Localisation *
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="Ville, Région"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Type de compte *
                <span className="text-xs font-normal text-gray-500 ml-2">
                  (Rôle backend: {roleOptions.find(r => r.value === formData.role)?.badge})
                </span>
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {roleOptions.map((role) => {
                  const IconComponent = role.icon;
                  const isSelected = formData.role === role.value;
                  
                  return (
                    <div
                      key={role.value}
                      className={`relative cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 transform hover:scale-[1.02] ${getColorClasses(role.color, isSelected)}`}
                      onClick={() => setFormData({ ...formData, role: role.value })}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="h-4 w-4" />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-current bg-opacity-10' : 'bg-gray-100'}`}>
                          <IconComponent className={`w-5 h-5 ${isSelected ? 'text-current' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <span className="text-sm font-medium">{role.label}</span>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Rôle: {role.badge}
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 pr-12"
                    placeholder="Minimum 8 caractères"
                    minLength="8"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmation *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="Retapez votre mot de passe"
                />
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                required
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-600 cursor-pointer">
                J'accepte les{' '}
                <a href="#" className="text-green-600 hover:text-green-500 font-medium">
                  conditions d'utilisation
                </a>{' '}
                et la{' '}
                <a href="#" className="text-green-600 hover:text-green-500 font-medium">
                  politique de confidentialité
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Création du compte...</span>
                </>
              ) : (
                <span className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Créer mon compte
                </span>
              )}
            </button>

            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Déjà membre ?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-green-600 hover:text-green-500 transition-colors"
                >
                  Connectez-vous ici
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Rôles disponibles :</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-center">acheteur</div>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-center">vendeur</div>
              <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-center">livreur</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Votre sélection sera automatiquement convertie au format backend
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;