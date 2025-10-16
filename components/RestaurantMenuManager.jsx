// components/RestaurantMenuManager.jsx
'use client';
import { useState, useEffect } from 'react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import CategoryManager from './CategoryManager';
import DishManager from './DishManager';

export default function RestaurantMenuManager({ restaurant }) {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurant) {
      fetchMenuData();
    }
  }, [restaurant]);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, dishesRes, subCategoriesRes] = await Promise.all([
        fetch(`/api/restaurants/${restaurant._id}/categories`),
        fetch(`/api/restaurants/${restaurant._id}/dishes`),
        fetch(`/api/restaurants/${restaurant._id}/subcategories`)
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories);
        if (categoriesData.categories.length > 0 && !activeCategory) {
          setActiveCategory(categoriesData.categories[0]);
        }
      }
      
      if (subCategoriesRes.ok) {
        const subCategoriesData = await subCategoriesRes.json();
        setSubCategories(subCategoriesData.subCategories);
      }

      if (dishesRes.ok) {
        const dishesData = await dishesRes.json();
        setDishes(dishesData.dishes);
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryUpdate = () => {
    fetchMenuData();
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-amber-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-amber-100 rounded-2xl p-6 space-y-4">
                <div className="h-48 bg-amber-200 rounded-xl"></div>
                <div className="h-4 bg-amber-200 rounded w-3/4"></div>
                <div className="h-4 bg-amber-200 rounded w-1/2"></div>
                <div className="h-8 bg-amber-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Your Restaurant Menu
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Organize your menu with categories and showcase your delicious dishes to customers
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-6 text-center border border-amber-200">
          <div className="text-3xl font-bold text-amber-700 mb-2">
            {categories.length}
          </div>
          <div className="text-amber-800 font-medium">Menu Categories</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-6 text-center border border-green-200">
          <div className="text-3xl font-bold text-green-700 mb-2">
            {dishes.length}
          </div>
          <div className="text-green-800 font-medium">Total Dishes</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-6 text-center border border-blue-200">
          <div className="text-3xl font-bold text-blue-700 mb-2">
            {subCategories.length}
          </div>
          <div className="text-blue-800 font-medium">Subcategories</div>
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <CategoryManager 
          restaurant={restaurant}
          categories={categories}
          subCategories={subCategories}
          activeCategory={activeCategory}
          activeSubCategory={activeSubCategory}
          onCategorySelect={setActiveCategory}
          onSubCategorySelect={setActiveSubCategory}
          onUpdate={handleCategoryUpdate}
        />
      </div>

      {/* Dish Management */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <DishManager
          restaurant={restaurant}
          categories={categories}
          subCategories={subCategories}
          dishes={filteredDishes}
          activeCategory={activeCategory}
          activeSubCategory={activeSubCategory}
          onUpdate={fetchMenuData}
        />
      </div>
    </div>
  );
}