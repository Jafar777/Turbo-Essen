// app/restaurants/page.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import RestaurantCard from '@/components/RestaurantCard';
import { FiSearch, FiFilter, FiMapPin, FiStar, FiX, FiClock, FiDollarSign, FiCheck, FiUsers } from 'react-icons/fi';
import { IoTimeOutline } from "react-icons/io5";

export default function AllRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    cuisineType: 'all',
    minRating: 0,
    deliveryFee: 'all',
    maxDeliveryTime: 60,
    openNow: false,
    status: 'all',
    minReviews: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState('');
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  // Update current time every minute for open/closed status
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

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
        setAllRestaurants(data.restaurants || []);
        setCuisineTypes(data.cuisineTypes || []);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if restaurant is currently open
  const isRestaurantOpen = (restaurant) => {
    // First check manual override (isOpen field)
    if (restaurant?.isOpen === false) return false;

    const getTodaysHours = () => {
      const openingHours = restaurant?.openingHours;
      if (!openingHours) return null;

      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = currentTime.getDay();
      const todayKey = days[today];
      return openingHours[todayKey];
    };

    const parseTimeToMinutes = (timeString) => {
      if (!timeString || typeof timeString !== 'string') return 0;
      const [hours, minutes] = timeString.split(':').map(Number);
      return isNaN(hours) || isNaN(minutes) ? 0 : (hours * 60 + minutes);
    };

    const hours = getTodaysHours();
    if (!hours || hours.closed) return false;

    const currentTimeInMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const openTimeInMinutes = parseTimeToMinutes(hours.open);
    const closeTimeInMinutes = parseTimeToMinutes(hours.close);

    if (closeTimeInMinutes < openTimeInMinutes) {
      // Closing time is after midnight
      return currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes < closeTimeInMinutes;
    }

    return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes;
  };

// Apply filters in real-time
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (Object.keys(filters).every(key => 
      filters[key] === '' || 
      filters[key] === 'all' || 
      filters[key] === 0 || 
      filters[key] === false
    )) {
      setRestaurants(allRestaurants);
    } else {
      const filtered = allRestaurants.filter(restaurant => {
        // Search filter
        const matchesSearch = !filters.search || 
          restaurant.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          restaurant.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
          restaurant.cuisineType?.toLowerCase().includes(filters.search.toLowerCase()) ||
          restaurant.address?.toLowerCase().includes(filters.search.toLowerCase());

        // Cuisine type filter
        const matchesCuisine = filters.cuisineType === 'all' || 
          restaurant.cuisineType === filters.cuisineType;

        // Rating filter
        const matchesRating = (restaurant.averageRating || 0) >= filters.minRating;

        // Delivery fee filter - FIXED: Check for null/undefined specifically
        const deliveryFee = restaurant.deliveryFee !== undefined && restaurant.deliveryFee !== null 
          ? restaurant.deliveryFee 
          : 2.99;
        const fee = parseFloat(deliveryFee);
        const matchesDeliveryFee = 
          filters.deliveryFee === 'all' ||
          (filters.deliveryFee === 'free' && fee === 0) ||
          (filters.deliveryFee === 'paid' && fee > 0);

        // Delivery time filter
        const maxDeliveryTime = restaurant.deliveryTime?.max || 45;
        const matchesDeliveryTime = maxDeliveryTime <= filters.maxDeliveryTime;

        // Open now filter
        const matchesOpenNow = !filters.openNow || isRestaurantOpen(restaurant);

        // Status filter
        const isOpen = isRestaurantOpen(restaurant);
        const matchesStatus = 
          filters.status === 'all' ||
          (filters.status === 'open' && isOpen) ||
          (filters.status === 'closed' && !isOpen);

        // Reviews filter
        const totalReviews = restaurant.totalReviews || 0;
        const matchesReviews = totalReviews >= filters.minReviews;

        return matchesSearch && matchesCuisine && matchesRating && 
               matchesDeliveryFee && matchesDeliveryTime && matchesOpenNow && 
               matchesStatus && matchesReviews;
      });
      setRestaurants(filtered);
    }
  }, 300);

  return () => clearTimeout(timeoutId);
}, [filters, allRestaurants, currentTime]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      cuisineType: 'all',
      minRating: 0,
      deliveryFee: 'all',
      maxDeliveryTime: 60,
      openNow: false,
      status: 'all',
      minReviews: 0
    });
    setUserLocation('');
  };

  const handleLocationSearch = () => {
    if (userLocation.trim()) {
      handleFilterChange('search', userLocation);
    } else {
      handleFilterChange('search', '');
    }
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => {
      if (key === 'search') return value !== '';
      if (key === 'cuisineType') return value !== 'all';
      if (key === 'minRating') return value !== 0;
      if (key === 'deliveryFee') return value !== 'all';
      if (key === 'maxDeliveryTime') return value !== 60;
      if (key === 'openNow') return value !== false;
      if (key === 'status') return value !== 'all';
      if (key === 'minReviews') return value !== 0;
      return false;
    }
  ).length;

  // Get unique delivery time ranges for display
  const deliveryTimeOptions = useMemo(() => {
    const times = new Set();
    allRestaurants.forEach(restaurant => {
      const maxTime = restaurant.deliveryTime?.max || 45;
      if (maxTime <= 30) times.add('30');
      else if (maxTime <= 45) times.add('45');
      else if (maxTime <= 60) times.add('60');
      else times.add('60+');
    });
    return Array.from(times).sort((a, b) => parseInt(a) - parseInt(b));
  }, [allRestaurants]);

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

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <div className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-lg">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 font-semibold"
            >
              <FiFilter className="w-5 h-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <FiX className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              {/* Search Input in Sidebar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiSearch className="inline w-4 h-4 mr-1" />
                  Search Restaurants
                </label>
                <input
                  type="text"
                  placeholder="Name, cuisine, or description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Cuisine Type Filter */}
              <div className="mb-6">
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiStar className="inline w-4 h-4 mr-1" />
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>⭐ 4.0+ Stars</option>
                  <option value={3.5}>⭐ 3.5+ Stars</option>
                  <option value={3}>⭐ 3.0+ Stars</option>
                  <option value={2}>⭐ 2.0+ Stars</option>
                </select>
              </div>

              {/* Reviews Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiUsers className="inline w-4 h-4 mr-1" />
                  Minimum Reviews
                </label>
                <select
                  value={filters.minReviews}
                  onChange={(e) => handleFilterChange('minReviews', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value={0}>Any Reviews</option>
                  <option value={10}>10+ Reviews</option>
                  <option value={25}>25+ Reviews</option>
                  <option value={50}>50+ Reviews</option>
                  <option value={100}>100+ Reviews</option>
                </select>
              </div>

              {/* Delivery Fee Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiDollarSign className="inline w-4 h-4 mr-1" />
                  Delivery Fee
                </label>
                <div className="space-y-2">
                  {['all', 'free', 'paid'].map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="deliveryFee"
                        value={option}
                        checked={filters.deliveryFee === option}
                        onChange={(e) => handleFilterChange('deliveryFee', e.target.value)}
                        className="mr-2 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-gray-700 capitalize">
                        {option === 'all' ? 'All Fees' : 
                         option === 'free' ? 'Free Delivery' : 'Paid Delivery'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Delivery Time Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <IoTimeOutline className="inline w-4 h-4 mr-1" />
                  Max Delivery Time: {filters.maxDeliveryTime} min
                </label>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="15"
                  value={filters.maxDeliveryTime}
                  onChange={(e) => handleFilterChange('maxDeliveryTime', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>15min</span>
                  <span>45min</span>
                  <span>90min</span>
                </div>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open Now</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Open Now Checkbox */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.openNow}
                    onChange={(e) => handleFilterChange('openNow', e.target.checked)}
                    className="mr-2 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-gray-700 font-medium">
                    <FiCheck className="inline w-4 h-4 mr-1" />
                    Open Now Only
                  </span>
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Current time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Clear Filters Button */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <FiX className="w-4 h-4" />
                  Clear All Filters ({activeFilterCount})
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Results Summary and Sort */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {loading ? 'Loading...' : `Found ${restaurants.length} restaurants`}
                  </h2>
                  {activeFilterCount > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''} applied
                    </p>
                  )}
                </div>
                
                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 font-medium">Sort by:</span>
                  <select 
                    onChange={(e) => {
                      const sorted = [...restaurants].sort((a, b) => {
                        switch (e.target.value) {
                          case 'rating':
                            return b.averageRating - a.averageRating;
                          case 'name':
                            return a.name.localeCompare(b.name);
                          case 'reviews':
                            return b.totalReviews - a.totalReviews;
                          case 'deliveryTime':
                            return (a.deliveryTime?.min || 30) - (b.deliveryTime?.min || 30);
                          case 'deliveryFee':
                            return (a.deliveryFee || 2.99) - (b.deliveryFee || 2.99);
                          default:
                            return 0;
                        }
                      });
                      setRestaurants(sorted);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="rating">Rating</option>
                    <option value="name">Name</option>
                    <option value="reviews">Most Reviews</option>
                    <option value="deliveryTime">Fastest Delivery</option>
                    <option value="deliveryFee">Lowest Delivery Fee</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Restaurants Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
}