// app/restaurants/page.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import RestaurantCard from '@/components/RestaurantCard';
import { FiSearch, FiFilter, FiMapPin, FiStar, FiX } from 'react-icons/fi';

export default function AllRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    cuisineType: 'all',
    minRating: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState('');
  const [allRestaurants, setAllRestaurants] = useState([]); // Store all restaurants separately
  const router = useRouter();

  // Fetch restaurants and cuisine types
  useEffect(() => {
    fetchAllRestaurants();
  }, []);

  const fetchAllRestaurants = async (filterParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filterParams).toString();
      const response = await fetch(`/api/public/restaurants?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data.restaurants || []);
        setAllRestaurants(data.restaurants || []); // Store all restaurants
        setCuisineTypes(data.cuisineTypes || []);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters in real-time
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search === '' && filters.cuisineType === 'all' && filters.minRating === 0) {
        // If no filters, show all restaurants
        setRestaurants(allRestaurants);
      } else {
        // Apply filters to the full dataset
        const filtered = allRestaurants.filter(restaurant => {
          const matchesSearch = !filters.search || 
            restaurant.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            restaurant.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
            restaurant.cuisineType?.toLowerCase().includes(filters.search.toLowerCase()) ||
            restaurant.address?.toLowerCase().includes(filters.search.toLowerCase()); // Include address in search

          const matchesCuisine = filters.cuisineType === 'all' || 
            restaurant.cuisineType === filters.cuisineType;

          const matchesRating = restaurant.averageRating >= filters.minRating;

          return matchesSearch && matchesCuisine && matchesRating;
        });
        setRestaurants(filtered);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, allRestaurants]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      cuisineType: 'all',
      minRating: 0
    });
    setUserLocation(''); // Clear location input too
  };

  const handleLocationSearch = () => {
    if (userLocation.trim()) {
      // Use the location search to filter by address
      handleFilterChange('search', userLocation);
    } else {
      // If location is empty, clear the search
      handleFilterChange('search', '');
    }
  };

  const activeFilterCount = Object.values(filters).filter(
    value => value !== '' && value !== 'all' && value !== 0
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-22">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Restaurants
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find the perfect place for your next meal
          </p>
        </div>

        {/* Location Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiMapPin className="inline w-4 h-4 mr-1" />
                Search by Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your address or location..."
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <button
                  onClick={handleLocationSearch}
                  className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold"
                >
                  Search
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Search by street name, neighborhood, or full address
              </p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search Input */}
            <div className="flex-1 w-full">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search restaurants by name, cuisine, description, or address..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold"
            >
              <FiFilter className="w-5 h-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FiX className="w-5 h-5" />
                Clear
              </button>
            )}
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Cuisine Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Type
                </label>
                <select
                  value={filters.cuisineType}
                  onChange={(e) => handleFilterChange('cuisineType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="all">All Cuisines</option>
                  {cuisineTypes.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>⭐ 4.0+ Stars</option>
                  <option value={3}>⭐ 3.0+ Stars</option>
                  <option value={2}>⭐ 2.0+ Stars</option>
                  <option value={1}>⭐ 1.0+ Stars</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `Found ${restaurants.length} restaurants`}
          </p>
          
          {/* Sort Options */}
          <select 
            onChange={(e) => {
              // Simple client-side sorting
              const sorted = [...restaurants].sort((a, b) => {
                switch (e.target.value) {
                  case 'rating':
                    return b.averageRating - a.averageRating;
                  case 'name':
                    return a.name.localeCompare(b.name);
                  case 'reviews':
                    return b.totalReviews - a.totalReviews;
                  default:
                    return 0;
                }
              });
              setRestaurants(sorted);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="rating">Sort by Rating</option>
            <option value="name">Sort by Name</option>
            <option value="reviews">Sort by Reviews</option>
          </select>
        </div>

        {/* Restaurants Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full -mt-12"></div>
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
        ) : restaurants.length > 0 ? (
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
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No restaurants found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}