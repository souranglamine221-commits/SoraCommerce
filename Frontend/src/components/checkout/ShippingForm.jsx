// Frontend/src/components/checkout/ShippingForm.jsx
import React from 'react';
import { User, Mail, Phone, MapPin, Building2 } from 'lucide-react';

const ShippingForm = ({ formData, onChange, errors }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <MapPin className="h-6 w-6" />
        Informations de livraison
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom complet *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName || ''}
              onChange={handleChange}
              placeholder="Jean Dupont"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
          </div>
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="jean@example.com"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="+221 77 123 45 67"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
          </div>
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pays *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              name="country"
              value={formData.country || ''}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white ${
                errors.country ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Sélectionner un pays</option>
              <option value="Canada">🇨🇦 Canada</option>
              <option value="Sénégal">🇸🇳 Sénégal</option>
              <option value="France">🇫🇷 France</option>
              <option value="États-Unis">🇺🇸 États-Unis</option>
              <option value="Belgique">🇧🇪 Belgique</option>
              <option value="Côte d'Ivoire">🇨🇮 Côte d'Ivoire</option>
              <option value="Mali">🇲🇱 Mali</option>
              <option value="Autre">🌍 Autre</option>
            </select>
          </div>
          {errors.country && (
            <p className="text-red-500 text-sm mt-1">{errors.country}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse complète *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              placeholder="123 Rue Principale, Quartier"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
          </div>
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ville *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city || ''}
            onChange={handleChange}
            placeholder="Dakar"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code postal
          </label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode || ''}
            onChange={handleChange}
            placeholder="12345"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>
    </div>
  );
};

export default ShippingForm;
