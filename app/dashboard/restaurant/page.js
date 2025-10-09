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
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="animate-pulse">Loading restaurant...</div>
        </div>
      </div>
    );
  }

  if (!session || !['admin', 'restaurant_owner'].includes(session.user.role)) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ce5a46] to-[#D22E26] rounded-t-2xl p-6 text-white mb-8">
        <h1 className="text-3xl font-bold">Restaurant Management</h1>
        <p className="text-amber-100 mt-2">
          Manage your restaurant menu and information
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-t-lg shadow-sm ">
        <div className="flex ">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'menu'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🍽️ Menu Management
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 font-medium text-sm border-b-2  transition-colors ${
              activeTab === 'info'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ℹ️ Restaurant Info
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg shadow-sm  border-t-0 p-6">
        {activeTab === 'menu' && (
          <RestaurantMenuManager restaurant={restaurant} />
        )}
        {activeTab === 'info' && (
          <RestaurantInfo restaurant={restaurant} onUpdate={fetchRestaurant} />
        )}
      </div>
    </div>
  );
}