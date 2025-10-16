// app/dashboard/restaurant/page.js
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import RestaurantMenuManager from '@/components/RestaurantMenuManager';
import RestaurantInfo from '@/components/RestaurantInfo';

export default function RestaurantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('menu');
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (!['admin', 'restaurant_owner'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }
    
    fetchRestaurant();
  }, [session, status, router]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch('/api/restaurants/my-restaurant');
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-amber-200 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-amber-100 rounded w-1/2 mx-auto"></div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="h-12 bg-amber-200 rounded-lg"></div>
                <div className="h-12 bg-amber-200 rounded-lg"></div>
              </div>
              <div className="h-64 bg-amber-100 rounded-lg mt-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {restaurant?.name || 'Restaurant Management'}
              </h1>
              <p className="text-amber-100 text-xl max-w-2xl mx-auto leading-relaxed">
                Craft your perfect menu and manage your restaurant with style
              </p>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/10 rounded-full"></div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8">
          <div className="flex flex-col sm:flex-row">
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 group px-8 py-6 font-semibold text-lg transition-all duration-300 relative overflow-hidden ${
                activeTab === 'menu'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">🍽️</span>
                <span>Menu Management</span>
              </div>
              {activeTab === 'menu' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/30"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 group px-8 py-6 font-semibold text-lg transition-all duration-300 relative overflow-hidden ${
                activeTab === 'info'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">ℹ️</span>
                <span>Restaurant Info</span>
              </div>
              {activeTab === 'info' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/30"></div>
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Tab Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {activeTab === 'menu' && (
            <RestaurantMenuManager restaurant={restaurant} />
          )}
          {activeTab === 'info' && (
            <RestaurantInfo restaurant={restaurant} onUpdate={fetchRestaurant} />
          )}
        </div>
      </div>
    </div>
  );
}