// components/RestaurantMenu.jsx
'use client';
import { useState } from 'react';

export default function RestaurantMenu({ restaurant, dishes }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Group dishes by category
  const dishesByCategory = dishes.reduce((acc, dish) => {
    const category = dish.categoryId?.name || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(dish);
    return acc;
  }, {});

  const categories = Object.keys(dishesByCategory);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Menu Header */}
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
        <p className="text-gray-600 mt-2">
          Explore our delicious offerings
        </p>
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto px-6 -mb-px">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Items
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  selectedCategory === category
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="p-6">
        {dishes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-amber-800 text-lg font-semibold mb-2">
                Menu Coming Soon
              </h3>
              <p className="text-amber-600">
                This restaurant is currently working on their menu. Please check back later.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Show all categories */}
            {selectedCategory === 'all' && categories.map((category) => (
              <div key={category} className="mb-12 last:mb-0">
                <h3 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  {category}
                </h3>
                <div className="grid gap-6">
                  {dishesByCategory[category].map((dish) => (
                    <div key={dish._id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      {dish.image && (
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {dish.name}
                            </h4>
                            {dish.description && (
                              <p className="text-gray-600 mt-1 text-sm">
                                {dish.description}
                              </p>
                            )}
                            {dish.ingredients && dish.ingredients.length > 0 && (
                              <p className="text-gray-500 text-xs mt-1">
                                Ingredients: {dish.ingredients.join(', ')}
                              </p>
                            )}
                          </div>
                          <p className="text-lg font-bold text-amber-600 ml-4">
                            ${dish.price?.toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Dietary Info */}
                        {(dish.dietaryInfo?.isVegetarian || dish.dietaryInfo?.isVegan || dish.dietaryInfo?.isGlutenFree) && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {dish.dietaryInfo.isVegetarian && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Vegetarian
                              </span>
                            )}
                            {dish.dietaryInfo.isVegan && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Vegan
                              </span>
                            )}
                            {dish.dietaryInfo.isGlutenFree && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Gluten Free
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Show single category */}
            {selectedCategory !== 'all' && dishesByCategory[selectedCategory] && (
              <div className="grid gap-6">
                {dishesByCategory[selectedCategory].map((dish) => (
                  <div key={dish._id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    {dish.image && (
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {dish.name}
                          </h4>
                          {dish.description && (
                            <p className="text-gray-600 mt-1 text-sm">
                              {dish.description}
                            </p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-amber-600 ml-4">
                          ${dish.price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}