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

// Example PUT function
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
      // Reset form and update UI
      setShowAddSubCategory(false);
      setEditingSubCategory(null);
      setSubCategoryForm({ name: '', description: '', categoryId: '' });
      onUpdate(); // Refresh the data
    }
  } catch (error) {
    console.error('Error saving subcategory:', error);
  }
};

// In your handleDeleteCategory function, add error logging:
const handleDeleteCategory = async (categoryId) => {
  if (confirm('Are you sure? This will also delete all subcategories and dishes in this category.')) {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        onUpdate();
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


// Example DELETE function
const handleDeleteSubCategory = async (subCategoryId) => {
  if (confirm('Are you sure you want to delete this subcategory?')) {
    try {
      const response = await fetch(`/api/subcategories/${subCategoryId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        onUpdate(); // Refresh the data
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Menu Categories</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowAddCategory(true);
              setEditingCategory(null);
              setCategoryForm({ name: '', description: '' });
            }}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            + Add Category
          </button>
          <button
            onClick={() => {
              setShowAddSubCategory(true);
              setEditingSubCategory(null);
              setSubCategoryForm({ name: '', description: '', categoryId: activeCategory?._id || '' });
            }}
            disabled={!activeCategory}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Sub Category
          </button>
        </div>
      </div>

      {/* Add/Edit Category Form */}
      {showAddCategory && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="text-lg font-medium mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h4>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Sub Category Form */}
      {showAddSubCategory && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="text-lg font-medium mb-4">
            {editingSubCategory ? 'Edit Sub Category' : 'Add New Sub Category'}
          </h4>
          <form onSubmit={handleSubCategorySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Category *
              </label>
              <select
                value={subCategoryForm.categoryId}
                onChange={(e) => setSubCategoryForm(prev => ({ ...prev, categoryId: e.target.value }))}
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
                Sub Category Name *
              </label>
              <input
                type="text"
                value={subCategoryForm.name}
                onChange={(e) => setSubCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={subCategoryForm.description}
                onChange={(e) => setSubCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {editingSubCategory ? 'Update Sub Category' : 'Add Sub Category'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddSubCategory(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories and Subcategories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories List */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4">Categories</h4>
          <div className="space-y-3">
            {categories.map(category => (
              <div
                key={category._id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  activeCategory?._id === category._id
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300'
                }`}
                onClick={() => onCategorySelect(category)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-gray-900">{category.name}</h5>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category._id);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subcategories List */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4">
            Subcategories {activeCategory && `- ${activeCategory.name}`}
          </h4>
          <div className="space-y-3">
            {activeCategory ? (
              categorySubCategories.length > 0 ? (
                categorySubCategories.map(subCategory => (
                  <div
                    key={subCategory._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      activeSubCategory?._id === subCategory._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => onSubCategorySelect(subCategory)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-900">{subCategory.name}</h5>
                        {subCategory.description && (
                          <p className="text-sm text-gray-600 mt-1">{subCategory.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSubCategory(subCategory);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubCategory(subCategory._id);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No subcategories yet</p>
              )
            ) : (
              <p className="text-gray-500 text-center py-4">Select a category to view subcategories</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}