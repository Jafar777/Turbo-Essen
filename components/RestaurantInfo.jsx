// components/RestaurantInfo.jsx
'use client';
import { useState, useEffect } from 'react';

export default function RestaurantInfo({ restaurant, onUpdate }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    cuisineType: ''
  });
  
  // Promo code management state
  const [promoForm, setPromoForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    isActive: true,
    validUntil: '',
    usageLimit: '',
    usedCount: 0
  });
  
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activePromoTab, setActivePromoTab] = useState('active');
  const [editingPromo, setEditingPromo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        cuisineType: restaurant.cuisineType || ''
      });
      fetchPromoCodes();
    }
  }, [restaurant]);

  const fetchPromoCodes = async () => {
    try {
      setPromoLoading(true);
      const response = await fetch(`/api/restaurants/${restaurant._id}/promo-codes`);
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.promoCodes || []);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      setMessage({ type: 'error', text: 'Failed to load promo codes' });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleEditPromoCode = (promo) => {
    setEditingPromo(promo);
    setPromoForm({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      isActive: promo.isActive,
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString().split('T')[0] : '',
      usageLimit: promo.usageLimit ? promo.usageLimit.toString() : '',
      usedCount: promo.usedCount || 0
    });
    setIsEditing(true);
  };

  const handleSavePromoCode = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!promoForm.code.trim()) {
      setMessage({ type: 'error', text: 'Promo code is required' });
      return;
    }

    if (!promoForm.discountValue || parseFloat(promoForm.discountValue) <= 0) {
      setMessage({ type: 'error', text: 'Valid discount value is required' });
      return;
    }

    try {
      const url = isEditing 
        ? `/api/restaurants/${restaurant._id}/promo-codes/${editingPromo._id}`
        : `/api/restaurants/${restaurant._id}/promo-codes`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...promoForm,
          discountValue: parseFloat(promoForm.discountValue),
          usageLimit: promoForm.usageLimit ? parseInt(promoForm.usageLimit) : null
        })
      });
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Promo code ${isEditing ? 'updated' : 'added'} successfully!` 
        });
        resetPromoForm();
        fetchPromoCodes();
        onUpdate();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || `Failed to ${isEditing ? 'update' : 'add'} promo code` });
      }
    } catch (error) {
      console.error('Failed to save promo code', error);
      setMessage({ type: 'error', text: `Error ${isEditing ? 'updating' : 'adding'} promo code` });
    }
  };

  const resetPromoForm = () => {
    setPromoForm({ 
      code: '', 
      discountType: 'percentage', 
      discountValue: '', 
      isActive: true, 
      validUntil: '',
      usageLimit: '',
      usedCount: 0
    });
    setEditingPromo(null);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePromoInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPromoForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/restaurants/${restaurant._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Restaurant information updated successfully!' });
        onUpdate();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to update restaurant information' });
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      setMessage({ type: 'error', text: 'Error updating restaurant information' });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePromoStatus = async (promoId, currentStatus) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurant._id}/promo-codes/${promoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Promo code ${!currentStatus ? 'activated' : 'deactivated'}!` });
        fetchPromoCodes();
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating promo code:', error);
      setMessage({ type: 'error', text: 'Failed to update promo code' });
    }
  };

  const handleDeletePromoCode = async (promoId) => {
    if (!confirm('Are you sure you want to delete this promo code?')) {
      return;
    }

    try {
      const response = await fetch(`/api/restaurants/${restaurant._id}/promo-codes/${promoId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Promo code deleted successfully!' });
        fetchPromoCodes();
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      setMessage({ type: 'error', text: 'Failed to delete promo code' });
    }
  };

  const filteredPromoCodes = promoCodes.filter(promo => {
    if (activePromoTab === 'active') return promo.isActive;
    if (activePromoTab === 'inactive') return !promo.isActive;
    return true;
  });

  if (!restaurant) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="animate-pulse">Loading restaurant information...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Restaurant Information Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Restaurant Information</h3>
        
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="cuisineType" className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Type *
              </label>
              <input
                type="text"
                id="cuisineType"
                name="cuisineType"
                value={formData.cuisineType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="e.g., Italian, Mexican, Chinese"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              placeholder="Describe your restaurant, your specialties, and what makes you unique..."
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              required
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Restaurant Info'}
            </button>
            
            <button
              type="button"
              onClick={() => setFormData({
                name: restaurant.name || '',
                description: restaurant.description || '',
                address: restaurant.address || '',
                phone: restaurant.phone || '',
                cuisineType: restaurant.cuisineType || ''
              })}
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors duration-200"
            >
              Reset Changes
            </button>
          </div>
        </form>
      </div>

      {/* Promo Code Management Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Promo Code Management</h3>
          <span className="text-sm text-gray-500">
            {promoCodes.length} promo code(s) configured
          </span>
        </div>

        {/* Add/Edit Promo Code Form */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            {isEditing ? 'Edit Promo Code' : 'Add New Promo Code'}
          </h4>
          <form onSubmit={handleSavePromoCode} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promo Code *
              </label>
              <input
                type="text"
                name="code"
                value={promoForm.code}
                onChange={handlePromoInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g., SAVE20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type
              </label>
              <select
                name="discountType"
                value={promoForm.discountType}
                onChange={handlePromoInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Value *
              </label>
              <input
                type="number"
                step="0.01"
                name="discountValue"
                value={promoForm.discountValue}
                onChange={handlePromoInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder={promoForm.discountType === 'percentage' ? '10' : '5.00'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                name="usageLimit"
                value={promoForm.usageLimit}
                onChange={handlePromoInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                name="validUntil"
                value={promoForm.validUntil}
                onChange={handlePromoInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={promoForm.isActive}
                  onChange={handlePromoInputChange}
                  className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div className="flex items-end space-x-2 md:col-span-2 lg:col-span-1">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {isEditing ? 'Update Promo Code' : 'Add Promo Code'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetPromoForm}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Promo Codes List */}
        <div>
          <div className="flex space-x-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActivePromoTab('all')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activePromoTab === 'all'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Promo Codes
            </button>
            <button
              onClick={() => setActivePromoTab('active')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activePromoTab === 'active'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActivePromoTab('inactive')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activePromoTab === 'inactive'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Inactive
            </button>
          </div>

          {promoLoading ? (
            <div className="animate-pulse">Loading promo codes...</div>
          ) : filteredPromoCodes.length > 0 ? (
            <div className="grid gap-4">
              {filteredPromoCodes.map(promo => (
                <div key={promo._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        promo.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="font-mono font-semibold text-lg">{promo.code}</span>
                      <span className="text-amber-600 font-semibold">
                        {promo.discountType === 'percentage' 
                          ? `${promo.discountValue}% OFF` 
                          : `$${promo.discountValue} OFF`}
                      </span>
                      {promo.usageLimit && (
                        <span className="text-sm text-gray-500">
                          Used: {promo.usedCount || 0}/{promo.usageLimit}
                        </span>
                      )}
                      {promo.validUntil && (
                        <span className="text-sm text-gray-500">
                          Valid until: {new Date(promo.validUntil).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditPromoCode(promo)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleTogglePromoStatus(promo._id, promo.isActive)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        promo.isActive
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {promo.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeletePromoCode(promo._id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No promo codes yet</p>
              <p className="mt-2">Add your first promo code to start offering discounts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}