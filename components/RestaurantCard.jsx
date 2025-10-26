// components/RestaurantCard.jsx
import Link from 'next/link';
import { FiStar, FiMapPin, FiPhone } from 'react-icons/fi';

export default function RestaurantCard({ restaurant }) {
  return (
    <Link href={`/restaurants/${restaurant._id}`}>
      <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-amber-200 transform hover:-translate-y-1">
        {/* Banner Image with Overlay */}
        <div className="h-48 bg-gradient-to-br from-amber-400 to-orange-500 relative">
          {restaurant.banner ? (
            <>
              <img
                src={restaurant.banner}
                alt={`${restaurant.name} banner`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className="text-xl font-bold">{restaurant.name}</h3>
                <p className="text-amber-100 text-sm mt-1">Welcome!</p>
              </div>
            </div>
          )}
          
          {/* Rating Badge */}
          {restaurant.averageRating > 0 && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
              <FiStar className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-gray-900">
                {restaurant.averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">
                ({restaurant.totalReviews || 0})
              </span>
            </div>
          )}
          
          {/* Floating Avatar */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              {restaurant.avatar ? (
                <div className="relative">
                  <img
                    src={restaurant.avatar}
                    alt={restaurant.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-xl bg-white group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-amber-300 shadow-inner"></div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-4 border-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">
                    {restaurant.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="pt-12 pb-6 px-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-amber-700 transition-colors">
            {restaurant.name}
          </h3>
          
          {restaurant.cuisineType && (
            <div className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold mb-3">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
              {restaurant.cuisineType}
            </div>
          )}
          
          {/* Rating Display */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(restaurant.averageRating)
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-sm text-gray-600 ml-1">
                ({restaurant.totalReviews || 0} reviews)
              </span>
            </div>
          </div>
          
          {restaurant.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
              {restaurant.description}
            </p>
          )}
          
          {/* Contact Info */}
          <div className="space-y-2">
            {restaurant.address && (
              <div className="flex items-center justify-center text-gray-500 text-sm">
                <FiMapPin className="w-4 h-4 mr-1.5 text-amber-500" />
                <span className="truncate">{restaurant.address}</span>
              </div>
            )}
            
            {restaurant.phone && (
              <div className="flex items-center justify-center text-gray-500 text-sm">
                <FiPhone className="w-4 h-4 mr-1.5 text-amber-500" />
                <span>{restaurant.phone}</span>
              </div>
            )}
          </div>
          
          {/* CTA Button */}
          <div className="mt-4">
            <button className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors duration-200 group-hover:shadow-lg">
              View Menu
              <svg className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}