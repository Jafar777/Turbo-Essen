// components/RestaurantCard.jsx
import Link from 'next/link';

export default function RestaurantCard({ restaurant }) {
  return (
    <Link href={`/restaurants/${restaurant._id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        {/* Banner Image */}
        <div className="h-48 bg-gray-200 relative">
          {restaurant.banner ? (
            <img
              src={restaurant.banner}
              alt={`${restaurant.name} banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-amber-100 to-amber-200 flex items-center justify-center">
              <span className="text-gray-500 text-lg">No banner image</span>
            </div>
          )}
        </div>

        {/* Restaurant Info */}
        <div className="p-4">
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {restaurant.avatar ? (
                <img
                  src={restaurant.avatar}
                  alt={restaurant.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white -mt-8 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-500 border-2 border-white -mt-8 shadow-md flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {restaurant.name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 truncate">
                {restaurant.name}
              </h3>
              {restaurant.cuisineType && (
                <p className="text-amber-600 font-medium text-sm mt-1">
                  {restaurant.cuisineType}
                </p>
              )}
              {restaurant.description && (
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                  {restaurant.description}
                </p>
              )}
              {restaurant.address && (
                <div className="flex items-center text-gray-500 text-sm mt-2">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{restaurant.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}