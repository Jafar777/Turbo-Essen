// /Users/jafar/Desktop/turboessen/app/restaurants/[id]/page.js
import { notFound } from 'next/navigation';
import RestaurantMenu from '@/components/RestaurantMenu';
import Navbar from '@/components/Navbar';
import RestaurantReviews from '@/components/RestaurantReviews';
import ReportButton from '@/components/ReportButton';

async function getRestaurant(id) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/restaurants/${id}`, {
      next: { revalidate: 60 }
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

async function getRestaurantReviews(restaurantId) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/public/restaurants/${restaurantId}/reviews`,
      { next: { revalidate: 60 } }
    );

    if (response.ok) {
      const data = await response.json();
      return data.reviews || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export default async function RestaurantPage({ params }) {
  const { id } = await params;
  const restaurant = await getRestaurant(id);
  const dishes = await getRestaurantDishes(id);
  const reviews = await getRestaurantReviews(id);

  if (!restaurant) {
    notFound();
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50">

        {/* Enhanced Restaurant Header */}
        <div className="relative bg-white shadow-xl mt-22">
          {/* Banner Section */}
          <div className="relative h-64 md:h-80 overflow-hidden">
            {restaurant.banner ? (
              <>
                <img
                  src={restaurant.banner}
                  alt={`${restaurant.name} banner`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 flex items-center justify-center">
                <div className="text-center text-white">
                  <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
                  <p className="text-amber-100">Delicious food awaits you</p>
                </div>
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {restaurant.avatar ? (
                  <div className="relative">
                    <img
                      src={restaurant.avatar}
                      alt={restaurant.name}
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-2xl bg-white"
                    />
                    <div className="absolute inset-0 rounded-full border-2 border-amber-200 shadow-inner"></div>
                  </div>
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-4 border-white shadow-2xl flex items-center justify-center relative">
                    <span className="text-white font-bold text-3xl md:text-4xl">
                      {restaurant.name?.charAt(0).toUpperCase()}
                    </span>
                    <div className="absolute inset-0 rounded-full border-2 border-amber-200 shadow-inner"></div>
                  </div>
                )}
              </div>

              {/* Restaurant Details */}
              <div className="flex-1 text-center md:text-left pb-6 md:pb-8">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-100 relative">
                  
                  {/* Report Button - Positioned in top right corner */}
                  <div className="absolute top-4 right-4">
                    <ReportButton 
                      targetType="restaurant"
                      targetId={restaurant._id}
                      targetName={restaurant.name}
                      size="sm"
                    />
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 pr-16">
                    {restaurant.name}
                  </h1>

                  {restaurant.cuisineType && (
                    <div className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold mb-4">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                      {restaurant.cuisineType}
                    </div>
                  )}

                  {restaurant.description && (
                    <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mb-6">
                      {restaurant.description}
                    </p>
                  )}

                  {/* Contact Info */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    {restaurant.address && (
                      <div className="flex items-center text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                        <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{restaurant.address}</span>
                      </div>
                    )}

                    {restaurant.phone && (
                      <div className="flex items-center text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                        <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="font-medium">{restaurant.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <RestaurantMenu
            restaurant={restaurant}
            dishes={dishes}
          />
        </div>

        {/* Restaurant Reviews */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <RestaurantReviews
            restaurant={restaurant}
            reviews={reviews}
          />
        </div>
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