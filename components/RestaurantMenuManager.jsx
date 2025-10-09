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
      setSubCategories(subCategoriesData.subCategories); // Make sure to set the state
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
    return <div className="animate-pulse">Loading menu...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Category Management */}
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

      {/* Dish Management */}
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
  );
}