// components/DishManager.jsx
'use client';
import { useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';

export default function DishManager({ restaurant, categories, subCategories, dishes, activeCategory, activeSubCategory, onUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    subCategoryId: '',
    ingredients: [],
    dietaryInfo: {
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false
    },
    promoCode: {
      code: '',
      discountType: 'percentage',
      discountValue: '',
      isActive: false
    }
  });
  const [imageUrl, setImageUrl] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('dietaryInfo.')) {
      const dietaryField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dietaryInfo: {
          ...prev.dietaryInfo,
          [dietaryField]: checked
        }
      }));
    } else if (name.startsWith('promoCode.')) {
      const promoField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        promoCode: {
          ...prev.promoCode,
          [promoField]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const getPublicIdFromUrl = (url) => {
    const regex = /\/v\d+\/([^/]+)\.\w{3,4}$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleDeleteImage = async (imageUrl) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (!publicId) {
        alert('Could not extract image ID');
        return;
      }

      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId }),
      });

      if (response.ok) {
        if (editingDish) {
          setImageUrl('');
        }
        onUpdate();
        alert('Image deleted successfully');
      } else {
        const errorData = await response.json();
        alert('Failed to delete image: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image');
    }
  };

  const handleImageUpload = (result) => {
    if (result.event === 'success') {
      setImageUrl(result.info.secure_url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      restaurantId: restaurant._id,
      price: parseFloat(formData.price),
      image: imageUrl,
      promoCode: {
        ...formData.promoCode,
        discountValue: formData.promoCode.discountValue ? parseFloat(formData.promoCode.discountValue) : 0
      }
    };

    try {
      const url = editingDish ? `/api/dishes/${editingDish._id}` : '/api/dishes';
      const method = editingDish ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        setShowAddForm(false);
        setEditingDish(null);
        setFormData({
          name: '',
          description: '',
          price: '',
          categoryId: '',
          subCategoryId: '',
          ingredients: [],
          dietaryInfo: {
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false
          },
          promoCode: {
            code: '',
            discountType: 'percentage',
            discountValue: '',
            isActive: false
          }
        });
        setImageUrl('');
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving dish:', error);
    }
  };

  const handleEdit = (dish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description || '',
      price: dish.price.toString(),
      categoryId: dish.categoryId,
      subCategoryId: dish.subCategoryId || '',
      ingredients: dish.ingredients || [],
      dietaryInfo: dish.dietaryInfo || {
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false
      },
      promoCode: dish.promoCode || {
        code: '',
        discountType: 'percentage',
        discountValue: '',
        isActive: false
      }
    });
    setImageUrl(dish.image || '');
    setShowAddForm(true);
  };

  const handleDelete = async (dishId) => {
    if (confirm('Are you sure you want to delete this dish?')) {
      try {
        const response = await fetch(`/api/dishes/${dishId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error deleting dish:', error);
      }
    }
  };

  const filteredDishes = dishes.filter(dish => {
    if (activeSubCategory) {
      return dish.subCategoryId === activeSubCategory._id;
    }
    if (activeCategory) {
      return dish.categoryId === activeCategory._id;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Menu Items</h3>
          <div className="flex items-center space-x-2 mt-1">
            {activeCategory && (
              <span className="text-amber-600 font-medium">{activeCategory.name}</span>
            )}
            {activeSubCategory && (
              <>
                <span className="text-gray-400">→</span>
                <span className="text-blue-600 font-medium">{activeSubCategory.name}</span>
              </>
            )}
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {filteredDishes.length} items
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 sm:mt-0 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-sm hover:shadow-md font-semibold flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Add/Edit Dish Form */}
      {showAddForm && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-gray-900">
              {editingDish ? 'Edit Dish' : 'Add New Dish'}
            </h4>
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">🍽️</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                    placeholder="Enter dish name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sub Category
                  </label>
                  <select
                    name="subCategoryId"
                    value={formData.subCategoryId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Select Sub Category</option>
                    {subCategories
                      .filter(sub => sub.categoryId === formData.categoryId)
                      .map(subCategory => (
                        <option key={subCategory._id} value={subCategory._id}>
                          {subCategory.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                placeholder="Describe your delicious dish..."
              />
            </div>

            {/* Image Upload */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Dish Image
              </label>
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                signatureEndpoint="/api/sign-cloudinary-params"
                onSuccess={handleImageUpload}
                options={{
                  multiple: false,
                  resourceType: 'image',
                  cropping: true,
                  croppingAspectRatio: 1,
                  showSkipCropButton: false,
                }}
              >
                {({ open }) => (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => open()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium flex items-center space-x-2"
                      >
                        <span>📷</span>
                        <span>Upload Image</span>
                      </button>
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                    {imageUrl && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
                        <div className="relative inline-block">
                          <img 
                            src={imageUrl} 
                            alt="Dish preview" 
                            className="w-32 h-32 object-cover rounded-2xl shadow-sm border border-gray-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CldUploadWidget>
            </div>

            {/* Dietary Information */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h5 className="text-lg font-semibold text-gray-900 mb-4">Dietary Information</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="dietaryInfo.isVegetarian"
                    checked={formData.dietaryInfo.isVegetarian}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700 font-medium">Vegetarian 🌱</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="dietaryInfo.isVegan"
                    checked={formData.dietaryInfo.isVegan}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700 font-medium">Vegan 💚</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="dietaryInfo.isGlutenFree"
                    checked={formData.dietaryInfo.isGlutenFree}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700 font-medium">Gluten Free 🌾</span>
                </label>
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
              <h5 className="text-lg font-semibold text-green-900 mb-4">Promotional Settings</h5>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Promo Code
                    </label>
                    <input
                      type="text"
                      name="promoCode.code"
                      value={formData.promoCode.code}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                      placeholder="SUMMER25"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount Type
                    </label>
                    <select
                      name="promoCode.discountType"
                      value={formData.promoCode.discountType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                    >
                      <option value="percentage">Percentage %</option>
                      <option value="fixed">Fixed Amount $</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="promoCode.discountValue"
                      value={formData.promoCode.discountValue}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                      placeholder="0.00"
                    />
                  </div>

                  <label className="flex items-center space-x-3 p-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="promoCode.isActive"
                      checked={formData.promoCode.isActive}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 font-medium">Activate Promo Code</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="px-8 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all duration-200 shadow-sm hover:shadow-md font-semibold"
              >
                {editingDish ? 'Update Dish' : 'Create Dish'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingDish(null);
                  setFormData({
                    name: '',
                    description: '',
                    price: '',
                    categoryId: '',
                    subCategoryId: '',
                    ingredients: [],
                    dietaryInfo: {
                      isVegetarian: false,
                      isVegan: false,
                      isGlutenFree: false
                    },
                    promoCode: {
                      code: '',
                      discountType: 'percentage',
                      discountValue: '',
                      isActive: false
                    }
                  });
                  setImageUrl('');
                }}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDishes.map(dish => (
          <div key={dish._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group">
            {dish.image && (
              <div className="relative overflow-hidden">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 flex space-x-2">
                  {dish.dietaryInfo?.isVegetarian && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">🌱 Veg</span>
                  )}
                  {dish.dietaryInfo?.isVegan && (
                    <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">💚 Vegan</span>
                  )}
                  {dish.dietaryInfo?.isGlutenFree && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">🌾 GF</span>
                  )}
                </div>
              </div>
            )}
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-lg text-gray-900">{dish.name}</h4>
                <span className="text-xl font-bold text-amber-600">${dish.price}</span>
              </div>

              {dish.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{dish.description}</p>
              )}

              {dish.promoCode?.isActive && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-xl mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">PROMO: {dish.promoCode.code}</p>
                      <p className="text-xs opacity-90">
                        {dish.promoCode.discountType === 'percentage'
                          ? `${dish.promoCode.discountValue}% OFF`
                          : `$${dish.promoCode.discountValue} OFF`
                        }
                      </p>
                    </div>
                    <span className="bg-white text-green-600 px-2 py-1 rounded-full text-xs font-bold">SAVE</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(dish)}
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <span>✏️</span>
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(dish._id)}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDishes.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🍽️</span>
          </div>
          <h4 className="text-xl font-semibold text-gray-600 mb-2">No dishes yet</h4>
          <p className="text-gray-500 mb-6">Add your first dish to start building your menu</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-semibold"
          >
            + Add Your First Dish
          </button>
        </div>
      )}
    </div>
  );
}