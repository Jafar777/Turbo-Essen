// app/restaurants/[id]/page.js
import { notFound } from 'next/navigation';
import RestaurantMenu from '@/components/RestaurantMenu';

async function getRestaurant(id) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/restaurants/${id}`, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.restaurant;
    }
    return null;
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return null;
  }
}

async function getRestaurantDishes(restaurantId) {
  try {
    // You'll need to create a public API endpoint for dishes
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/public/restaurants/${restaurantId}/dishes`,
      { next: { revalidate: 60 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.dishes || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching dishes:', error);
    return [];
  }
}

export default async function RestaurantPage({ params }) {
  const { id } = await params;
  const restaurant = await getRestaurant(id);
  const dishes = await getRestaurantDishes(id);

  if (!restaurant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="bg-white shadow-sm">
        {restaurant.banner ? (
          <div className="h-64 md:h-80 relative">
            <img
              src={restaurant.banner}
              alt={`${restaurant.name} banner`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-r from-amber-500 to-amber-600"></div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start space-x-6">
            {restaurant.avatar ? (
              <img
                src={restaurant.avatar}
                alt={restaurant.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg -mt-16 bg-white"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-amber-500 border-4 border-white shadow-lg -mt-16 flex items-center justify-center">
                <span className="text-white font-bold text-2xl md:text-4xl">
                  {restaurant.name?.charAt(0)}
                </span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {restaurant.name}
              </h1>
              {restaurant.cuisineType && (
                <p className="text-amber-600 font-semibold text-lg mb-3">
                  {restaurant.cuisineType}
                </p>
              )}
              {restaurant.description && (
                <p className="text-gray-600 text-lg max-w-3xl">
                  {restaurant.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-4 mt-4">
                {restaurant.address && (
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{restaurant.address}</span>
                  </div>
                )}
                
                {restaurant.phone && (
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{restaurant.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Menu */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <RestaurantMenu 
          restaurant={restaurant} 
          dishes={dishes} 
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const restaurant = await getRestaurant(id);
  
  return {
    title: restaurant ? `${restaurant.name} - Order Now` : 'Restaurant Not Found',
    description: restaurant?.description || 'Discover amazing food from local restaurants',
  };
}