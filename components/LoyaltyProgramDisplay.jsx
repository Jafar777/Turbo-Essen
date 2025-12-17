// components/LoyaltyProgramDisplay.jsx
'use client';
import { FiAward, FiCheckCircle, FiStar, FiInfo } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function LoyaltyProgramDisplay({ restaurant }) {
  const { data: session } = useSession();
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurant?._id && restaurant?.loyaltySystem?.isActive) {
      fetchUserProgress();
    } else {
      setLoading(false);
    }
  }, [restaurant, session]);

  const fetchUserProgress = async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/users/me/loyalty/${restaurant._id}`);
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data);
      }
    } catch (error) {
      console.error('Error fetching user loyalty progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // If loading or no loyalty system, don't show anything
  if (loading || !restaurant?.loyaltySystem || !restaurant.loyaltySystem.isActive) {
    return null;
  }

  const loyaltySystem = restaurant.loyaltySystem;
  const orderCount = userProgress?.orderCount || 0;
  const progressPercentage = Math.min((orderCount / loyaltySystem.ordersThreshold) * 100, 100);
  const remainingOrders = Math.max(loyaltySystem.ordersThreshold - orderCount, 0);
  const isEligibleForDiscount = orderCount >= loyaltySystem.ordersThreshold;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
            <FiAward className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Loyalty Rewards</h3>
            <p className="text-sm text-gray-600">{loyaltySystem.description}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold">
          {loyaltySystem.discountPercentage}% OFF
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>
              {session ? (
                <>
                  {orderCount}/{loyaltySystem.ordersThreshold} orders
                  {isEligibleForDiscount && (
                    <span className="ml-2 text-green-600 font-bold">✓ Eligible for discount!</span>
                  )}
                </>
              ) : (
                `Order ${loyaltySystem.ordersThreshold} times to earn ${loyaltySystem.discountPercentage}% off`
              )}
            </span>
            {session && (
              <span>{Math.round(progressPercentage)}%</span>
            )}
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          {session && remainingOrders > 0 && !isEligibleForDiscount && (
            <p className="text-sm text-gray-600 mt-2">
              {remainingOrders} more order{remainingOrders !== 1 ? 's' : ''} needed to unlock your discount!
            </p>
          )}
        </div>

        {/* User Progress Info */}
        {session ? (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your progress</p>
                <p className="text-lg font-bold text-gray-900">
                  {orderCount} order{orderCount !== 1 ? 's' : ''} completed
                </p>
              </div>
              {isEligibleForDiscount ? (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm">
                  Discount Unlocked! 🎉
                </div>
              ) : (
                <div className="text-sm text-gray-600 font-medium">
                  {remainingOrders} to go
                </div>
              )}
            </div>
            {isEligibleForDiscount && (
              <p className="text-sm text-green-700 mt-2">
                Your next order will automatically receive {loyaltySystem.discountPercentage}% off!
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-xl">
            <div className="flex items-center">
              <FiInfo className="w-5 h-5 text-blue-500 mr-2" />
              <p className="text-sm text-blue-700">
                Sign in to track your progress and earn rewards!
              </p>
            </div>
          </div>
        )}

        {/* Rewards Info */}
        <div className="bg-white rounded-xl p-4 border border-purple-100">
          <div className="flex items-center mb-2">
            <FiStar className="w-5 h-5 text-purple-500 mr-2" />
            <span className="font-semibold text-gray-900">How it works:</span>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <FiCheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Place {loyaltySystem.ordersThreshold} orders to earn {loyaltySystem.discountPercentage}% off</span>
            </li>
            <li className="flex items-start">
              <FiCheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Only completed (delivered) orders count toward your total</span>
            </li>
            <li className="flex items-start">
              <FiCheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Discount is automatically applied to your next order after reaching the threshold</span>
            </li>
            <li className="flex items-start">
              <FiCheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Progress resets after you claim your reward, so you can keep earning!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}