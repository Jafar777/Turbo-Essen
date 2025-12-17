// components/RestaurantCard.jsx
import Link from 'next/link';
import { FiStar, FiMapPin, FiClock, FiAward } from 'react-icons/fi';
import { IoTimeOutline } from "react-icons/io5";

export default function RestaurantCard({ restaurant }) {
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    if (isNaN(hour)) return '';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  console.log('Restaurant data:', {
    name: restaurant.name,
    deliveryFee: restaurant.deliveryFee,
    deliveryTime: restaurant.deliveryTime,
    loyaltySystem: restaurant.loyaltySystem
  });

  const parseTimeToMinutes = (timeString, fallback = '00:00') => {
    if (!timeString || typeof timeString !== 'string') {
      timeString = fallback;
    }
    const [hours, minutes] = timeString.split(':').map(Number);
    return isNaN(hours) || isNaN(minutes) ? 0 : (hours * 60 + minutes);
  };

  const getDeliveryFeeDisplay = () => {
    const deliveryFee = restaurant.deliveryFee !== undefined && restaurant.deliveryFee !== null 
      ? restaurant.deliveryFee 
      : 2.99;
    
    const fee = parseFloat(deliveryFee);
    
    if (isNaN(fee)) {
      return 'Delivery fee not set';
    }
    
    if (fee === 0) {
      return 'Free delivery';
    }
    
    return `$${fee.toFixed(2)} delivery`;
  };

  const getDeliveryTimeDisplay = () => {
    const min = restaurant.deliveryTime?.min || 30;
    const max = restaurant.deliveryTime?.max || 45;
    return `${min}-${max} min`;
  };

  const getTodaysHours = () => {
    const openingHours = restaurant?.openingHours;

    if (!openingHours) {
      return { status: 'closed', text: 'Hours not available' };
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    const todayKey = days[today];
    const todayHours = openingHours[todayKey];

    if (!todayHours || todayHours.closed) {
      return { status: 'closed', text: 'Closed today' };
    }

    const openTime = todayHours.open;
    const closeTime = todayHours.close;

    if (!openTime || !closeTime) {
      return { status: 'unknown', text: 'Hours not set' };
    }

    return {
      status: 'open',
      text: `${formatTime(openTime)} - ${formatTime(closeTime)}`,
      open: openTime,
      close: closeTime
    };
  };

  const isCurrentlyOpen = () => {
    if (restaurant?.isOpen === false) return false;

    const hours = getTodaysHours();
    if (!hours || hours.status !== 'open') return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const openTimeInMinutes = parseTimeToMinutes(hours.open);
    const closeTimeInMinutes = parseTimeToMinutes(hours.close);

    if (closeTimeInMinutes < openTimeInMinutes) {
      return currentTime >= openTimeInMinutes || currentTime < closeTimeInMinutes;
    }

    return currentTime >= openTimeInMinutes && currentTime <= closeTimeInMinutes;
  };

  const todaysHours = getTodaysHours();
  const isOpen = isCurrentlyOpen();
  const averageRating = restaurant?.averageRating || 0;
  const totalReviews = restaurant?.totalReviews || 0;
  
  // REMOVE THIS DUPLICATE DECLARATION:
  // const hasLoyaltyProgram = restaurant?.loyaltySystem?.isActive;

  if (!restaurant) {
    return (
      <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
      </div>
    );
  }

  // Add safety check for loyaltySystem access:
  const loyaltySystem = restaurant.loyaltySystem || {
    isActive: false,
    ordersThreshold: 5,
    discountPercentage: 10,
    description: "Get a discount after placing a certain number of orders!"
  };
  const hasLoyaltyProgram = loyaltySystem.isActive;

  return (
    <Link href={`/restaurants/${restaurant.slug}`}>
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

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm ${isOpen
                ? 'bg-green-500/90 text-white'
                : 'bg-red-500/90 text-white'
              }`}>
              {isOpen ? 'Open Now' : 'Closed'}
            </div>
          </div>

          {/* Loyalty Badge */}
          {hasLoyaltyProgram && (
            <div className="absolute top-3 left-24 bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
              <FiAward className="w-3 h-3 text-white" />
              <span className="text-xs font-semibold text-white">Loyalty</span>
            </div>
          )}

          {/* Rating Badge */}
          {averageRating > 0 && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
              <FiStar className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">
                ({totalReviews})
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

          <div className="flex flex-wrap justify-center items-center gap-2 mb-3">
            {restaurant.cuisineType && (
              <div className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                {restaurant.cuisineType}
              </div>
            )}
            
            {hasLoyaltyProgram && (
              <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-xs font-semibold">
                <FiAward className="w-3 h-3 mr-1 text-purple-600" />
                Earn {loyaltySystem.discountPercentage}% off
              </div>
            )}
          </div>

          {/* Delivery Info */}
          <div className="flex items-center justify-center gap-4 mb-3">
            {/* Delivery Time */}
            <div className="flex items-center text-gray-700 text-sm">
              <IoTimeOutline className="w-4 h-4 mr-1 text-amber-500" />
              <span className="font-medium">{getDeliveryTimeDisplay()}</span>
            </div>

            {/* Delivery Fee */}
            <div className="flex items-center text-gray-700 text-sm">
              <span className={`font-medium ${restaurant.deliveryFee === 0 ? 'text-green-600' : 'text-gray-700'
                }`}>
                {getDeliveryFeeDisplay()}
              </span>
            </div>
          </div>

          {/* Rating Display */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(averageRating)
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-gray-300'
                    }`}
                />
              ))}
              <span className="text-sm text-gray-600 ml-1">
                ({totalReviews} reviews)
              </span>
            </div>
          </div>

          {restaurant.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
              {restaurant.description}
            </p>
          )}

          {/* Opening Hours Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-center text-gray-700 text-sm font-medium">
              <FiClock className="w-4 h-4 mr-1.5 text-amber-500" />
              <span>{todaysHours.text}</span>
            </div>

            {restaurant.address && (
              <div className="flex items-center justify-center text-gray-500 text-sm">
                <FiMapPin className="w-4 h-4 mr-1.5 text-amber-500" />
                <span className="truncate">{restaurant.address}</span>
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