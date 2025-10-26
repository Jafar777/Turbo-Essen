// components/OrderNow.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import RestaurantCard from './RestaurantCard';
import { MdOutlineRestaurantMenu } from "react-icons/md";

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
      // Use the public restaurants endpoint that includes review data
      const response = await fetch('/api/public/restaurants');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Get the 6 latest restaurants (most recently created)
          const latestRestaurants = data.restaurants
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6);
          setRestaurants(latestRestaurants);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(7)].map((_, i) => (
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
      {/* View All Restaurants Card - Wide card on top */}
      <Link 
        href="/restaurants" 
        className="block group mb-8"
      >
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-lg overflow-hidden h-24 flex items-center justify-between px-8 text-white hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <MdOutlineRestaurantMenu className="text-2xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold">View All Restaurants</h3>
            </div>
          </div>
          <div className="px-4 py-2 bg-white text-amber-600 rounded-full font-semibold hover:bg-amber-50 transition-colors">
            Browse All →
          </div>
        </div>
      </Link>

      {/* Restaurants Grid - 6 cards in 3 columns */}
      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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