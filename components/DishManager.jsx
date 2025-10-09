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
  // Add this function to your DishManager component
  const getPublicIdFromUrl = (url) => {
    const regex = /\/v\d+\/([^/]+)\.\w{3,4}$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Add this delete function to your DishManager
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
        // Remove image from current dish if editing
        if (editingDish) {
          setImageUrl('');
        }
        // Refresh the dish data
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

  return (
    <div className="space-y-6">
      {/* Add Dish Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">
          Dishes {activeCategory && `- ${activeCategory.name}`} {activeSubCategory && `> ${activeSubCategory.name}`}
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          + Add New Dish
        </button>
      </div>

      {/* Add/Edit Dish Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h4 className="text-lg font-semibold mb-4">
            {editingDish ? 'Edit Dish' : 'Add New Dish'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dish Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub Category
                </label>
                <select
                  name="subCategoryId"
                  value={formData.subCategoryId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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

            {/* Image Upload */}
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => open()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Upload Image
                    </button>
                    {imageUrl && (
                      <div className="mt-2">
                        <img src={imageUrl} alt="Dish preview" className="w-32 h-32 object-cover rounded-lg" />
                        {/* Add remove image button */}
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </CldUploadWidget>
            </div>

            {/* Promo Code Section */}
            <div className="border-t pt-4">
              <h5 className="text-lg font-medium mb-3">Promotional Settings</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    name="promoCode.code"
                    value={formData.promoCode.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Type
                  </label>
                  <select
                    name="promoCode.discountType"
                    value={formData.promoCode.discountType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="promoCode.discountValue"
                    value={formData.promoCode.discountValue}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="promoCode.isActive"
                    checked={formData.promoCode.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Activate Promo Code
                  </label>
                </div>
              </div>
            </div>

            {/* Dietary Information */}
            <div className="border-t pt-4">
              <h5 className="text-lg font-medium mb-3">Dietary Information</h5>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="dietaryInfo.isVegetarian"
                    checked={formData.dietaryInfo.isVegetarian}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Vegetarian</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="dietaryInfo.isVegan"
                    checked={formData.dietaryInfo.isVegan}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Vegan</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="dietaryInfo.isGlutenFree"
                    checked={formData.dietaryInfo.isGlutenFree}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Gluten Free</span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                {editingDish ? 'Update Dish' : 'Add Dish'}
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
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dishes.map(dish => (
          <div key={dish._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {dish.image && (
              <img
                src={dish.image}
                alt={dish.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-lg text-gray-900">{dish.name}</h4>
                <span className="text-lg font-bold text-amber-600">${dish.price}</span>
              </div>

              {dish.description && (
                <p className="text-gray-600 text-sm mb-3">{dish.description}</p>
              )}

              {dish.promoCode?.isActive && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-800 text-sm font-medium">
                      PROMO: {dish.promoCode.code}
                    </span>
                    <span className="text-green-600 text-sm">
                      {dish.promoCode.discountType === 'percentage'
                        ? `${dish.promoCode.discountValue}% OFF`
                        : `$${dish.promoCode.discountValue} OFF`
                      }
                    </span>
                  </div>
                </div>
              )}


              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => handleEdit(dish)}
                  className="flex-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dish._id)}
                  className="flex-1 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>


              </div>
            </div>
          </div>
        ))}
      </div>

      {dishes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">No dishes yet</p>
          <p className="mt-2">Add your first dish to get started!</p>
        </div>
      )}
    </div>
  );
}