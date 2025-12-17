// hooks/useLoyaltySystem.js
import { useState, useEffect } from 'react';

export function useLoyaltySystem(restaurantId, userId) {
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [userLoyalty, setUserLoyalty] = useState({ orderCount: 0, progress: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      fetchLoyaltySystem();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (userId && restaurantId) {
      fetchUserLoyalty();
    }
  }, [userId, restaurantId]);

  const fetchLoyaltySystem = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/loyalty`);
      if (response.ok) {
        const data = await response.json();
        setLoyaltyInfo(data.loyaltySystem);
      }
    } catch (error) {
      console.error('Error fetching loyalty system:', error);
    }
  };

  const fetchUserLoyalty = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/loyalty?restaurantId=${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        setUserLoyalty(data);
      }
    } catch (error) {
      console.error('Error fetching user loyalty:', error);
    }
  };

  const calculateProgress = () => {
    if (!loyaltyInfo || !userLoyalty.orderCount) return 0;
    return Math.min((userLoyalty.orderCount / loyaltyInfo.ordersThreshold) * 100, 100);
  };

  const getDiscountEligibility = () => {
    if (!loyaltyInfo || !userLoyalty.orderCount) return false;
    return userLoyalty.orderCount >= loyaltyInfo.ordersThreshold;
  };

  return {
    loyaltyInfo,
    userLoyalty,
    loading,
    progress: calculateProgress(),
    isEligibleForDiscount: getDiscountEligibility(),
    refresh: () => {
      fetchLoyaltySystem();
      if (userId) fetchUserLoyalty();
    }
  };
}