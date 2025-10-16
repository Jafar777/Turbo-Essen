// components/CategoryManager.jsx
'use client';
import { useState, useEffect } from 'react';

export default function CategoryManager({ 
  restaurant, 
  categories, 
  subCategories,
  activeCategory,
  activeSubCategory,
  onCategorySelect,
  onSubCategorySelect,
  onUpdate 
}) {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [subCategoryForm, setSubCategoryForm] = useState({ name: '', description: '', categoryId: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);

  // Set default categories if none exist
  useEffect(() => {
    if (categories.length === 0) {
      createDefaultCategories();
    }
  }, [categories]);

  const createDefaultCategories = async () => {
    const defaultCategories = [
      { name: 'Main Menu', description: 'Main dishes and entrees' },
      { name: 'Side Menu', description: 'Appetizers and side dishes' },
      { name: 'Beverages', description: 'Drinks and beverages' }
    ];

    try {
      for (const category of defaultCategories) {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...category,
            restaurantId: restaurant._id
          })
        });
      }
      onUpdate();
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  };

  // Clear active subcategory when category changes
  const handleCategorySelect = (category) => {
    onCategorySelect(category);
    // Clear the active subcategory when switching categories
    onSubCategorySelect(null);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCategory ? `/api/categories/${editingCategory._id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryForm,
          restaurantId: restaurant._id
        })
      });

      if (response.ok) {
        setShowAddCategory(false);
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '' });
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleSubCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSubCategory ? `/api/subcategories/${editingSubCategory._id}` : '/api/subcategories';
      const method = editingSubCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subCategoryForm,
          restaurantId: restaurant._id
        })
      });

      if (response.ok) {
        setShowAddSubCategory(false);
        setEditingSubCategory(null);
        setSubCategoryForm({ name: '', description: '', categoryId: '' });
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving subcategory:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (confirm('Are you sure? This will also delete all subcategories and dishes in this category.')) {
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          onUpdate();
          // Clear selections if the deleted category was active
          if (activeCategory?._id === categoryId) {
            onCategorySelect(null);
            onSubCategorySelect(null);
          }
        } else {
          const errorData = await response.json();
          console.error('Delete failed:', errorData);
          alert('Failed to delete category: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Network error while deleting category');
      }
    }
  };

  const handleDeleteSubCategory = async (subCategoryId) => {
    if (confirm('Are you sure you want to delete this subcategory?')) {
      try {
        const response = await fetch(`/api/subcategories/${subCategoryId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          onUpdate();
          // Clear selection if the deleted subcategory was active
          if (activeSubCategory?._id === subCategoryId) {
            onSubCategorySelect(null);
          }
        } else {
          console.error('Delete failed');
        }
      } catch (error) {
        console.error('Error deleting subcategory:', error);
      }
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, description: category.description || '' });
    setShowAddCategory(true);
  };

  const handleEditSubCategory = (subCategory) => {
    setEditingSubCategory(subCategory);
    setSubCategoryForm({ 
      name: subCategory.name, 
      description: subCategory.description || '',
      categoryId: subCategory.categoryId
    });
    setShowAddSubCategory(true);
  };

  const categorySubCategories = subCategories.filter(sub => 
    activeCategory && sub.categoryId === activeCategory._id
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Menu Categories</h3>
          <p className="text-gray-600 mt-1">Organize your menu with categories and subcategories</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => {
              setShowAddCategory(true);
              setEditingCategory(null);
              setCategoryForm({ name: '', description: '' });
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
          >
            <span>+</span>
            <span>Add Category</span>
          </button>
          <button
            onClick={() => {
              setShowAddSubCategory(true);
              setEditingSubCategory(null);
              setSubCategoryForm({ name: '', description: '', categoryId: activeCategory?._id || '' });
            }}
            disabled={!activeCategory}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>+</span>
            <span>Add Sub Category</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Category Form */}
      {showAddCategory && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl mb-8 border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-amber-900">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h4>
            <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
              <span className="text-amber-700 font-bold">📁</span>
            </div>
          </div>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                placeholder="e.g., Main Courses, Desserts"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                placeholder="Brief description of this category..."
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Sub Category Form */}
      {showAddSubCategory && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl mb-8 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-blue-900">
              {editingSubCategory ? 'Edit Sub Category' : 'Add New Sub Category'}
            </h4>
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-bold">📂</span>
            </div>
          </div>
          <form onSubmit={handleSubCategorySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Parent Category *
              </label>
              <select
                value={subCategoryForm.categoryId}
                onChange={(e) => setSubCategoryForm(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sub Category Name *
              </label>
              <input
                type="text"
                value={subCategoryForm.name}
                onChange={(e) => setSubCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                placeholder="e.g., Pasta, Salads, Soups"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={subCategoryForm.description}
                onChange={(e) => setSubCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                placeholder="Brief description of this subcategory..."
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                {editingSubCategory ? 'Update Sub Category' : 'Create Sub Category'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddSubCategory(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories and Subcategories Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Categories List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">Categories</h4>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              {categories.length} total
            </span>
          </div>
          <div className="space-y-4">
            {categories.map(category => (
              <div
                key={category._id}
                className={`p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 group ${
                  activeCategory?._id === category._id
                    ? 'border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm'
                    : 'border-gray-200 hover:border-amber-300 hover:shadow-md bg-white'
                }`}
                onClick={() => handleCategorySelect(category)} // Changed to use handleCategorySelect
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      activeCategory?._id === category._id ? 'bg-amber-500' : 'bg-gray-100'
                    } group-hover:bg-amber-500 transition-colors duration-200`}>
                      <span className={`font-bold ${
                        activeCategory?._id === category._id ? 'text-white' : 'text-gray-600'
                      } group-hover:text-white`}>
                        📁
                      </span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 text-lg">{category.name}</h5>
                      {category.description && (
                        <p className="text-gray-600 mt-1 text-sm">{category.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {subCategories.filter(sub => sub.categoryId === category._id).length} subcategories
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category);
                      }}
                      className="w-8 h-8 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                      title="Edit category"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category._id);
                      }}
                      className="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                      title="Delete category"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subcategories List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900">
              Subcategories {activeCategory && (
                <span className="text-amber-600">- {activeCategory.name}</span>
              )}
            </h4>
            {activeCategory && (
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                {categorySubCategories.length} subcategories
              </span>
            )}
          </div>
          <div className="space-y-4">
            {activeCategory ? (
              categorySubCategories.length > 0 ? (
                categorySubCategories.map(subCategory => (
                  <div
                    key={subCategory._id}
                    className={`p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 group ${
                      activeSubCategory?._id === subCategory._id
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                    }`}
                    onClick={() => onSubCategorySelect(subCategory)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          activeSubCategory?._id === subCategory._id ? 'bg-blue-500' : 'bg-gray-100'
                        } group-hover:bg-blue-500 transition-colors duration-200`}>
                          <span className={`font-bold ${
                            activeSubCategory?._id === subCategory._id ? 'text-white' : 'text-gray-600'
                          } group-hover:text-white`}>
                            📂
                          </span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 text-lg">{subCategory.name}</h5>
                          {subCategory.description && (
                            <p className="text-gray-600 mt-1 text-sm">{subCategory.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSubCategory(subCategory);
                          }}
                          className="w-8 h-8 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                          title="Edit subcategory"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubCategory(subCategory._id);
                          }}
                          className="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                          title="Delete subcategory"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📂</span>
                  </div>
                  <p className="text-gray-500 font-medium">No subcategories yet</p>
                  <p className="text-gray-400 text-sm mt-1">Add your first subcategory to get started</p>
                </div>
              )
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👆</span>
                </div>
                <p className="text-gray-500 font-medium">Select a category</p>
                <p className="text-gray-400 text-sm mt-1">Choose a category to view its subcategories</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}