// components/OrderNow.jsx
'use client';
import { useState, useEffect } from 'react';
import RestaurantCard from './RestaurantCard';

export default function OrderNow() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/restaurants');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRestaurants(data.restaurants);
        } else {
          setError('Failed to load restaurants');
        }
      } else {
        setError('Failed to fetch restaurants');
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('An error occurred while loading restaurants');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-bold text-gray-900 mb-8">
            Loading Restaurants...
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full -mt-8"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 text-lg font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchRestaurants}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Order Now
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Discover amazing restaurants and order your favorite food
        </p>
      </div>

      {/* Restaurants Grid */}
      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant) => (
            <RestaurantCard 
              key={restaurant._id} 
              restaurant={restaurant} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-amber-800 text-lg font-semibold mb-2">
              No Restaurants Available
            </h3>
            <p className="text-amber-600">
              There are no restaurants available at the moment. Please check back later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}