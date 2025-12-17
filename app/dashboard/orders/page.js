// app/dashboard/orders/page.js
'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/lib/toast';
import LiveOrderTracker from '@/components/LiveOrderTracker';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [locationSharing, setLocationSharing] = useState({});
  const [currentPosition, setCurrentPosition] = useState(null);
  const locationWatchers = useRef({});
  
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchOrders();
  }, [session, status, router]);

  useEffect(() => {
    return () => {
      Object.values(locationWatchers.current).forEach(watcherId => {
        if (watcherId) navigator.geolocation.clearWatch(watcherId);
      });
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (session.user.role !== 'restaurant_owner' && session.user.role !== 'delivery') return;
    
    setUpdating(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showToast.success(`Order status updated to ${getStatusText(newStatus)}`);
        
        if (newStatus === 'delivered') {
          stopLocationSharing(orderId);
        }
        
        fetchOrders();
      } else {
        const errorData = await response.json();
        showToast.error(errorData.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showToast.error('Error updating order status');
    } finally {
      setUpdating(null);
    }
  };

  const startLocationSharing = async (orderId) => {
    if (!('geolocation' in navigator)) {
      showToast.error('Geolocation is not supported by your browser');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        showToast.error('Please enable location permissions in your browser settings');
        return;
      }
    } catch (err) {
      console.log('Permission query not supported, continuing...');
    }

    setLocationSharing(prev => ({ ...prev, [orderId]: true }));
    showToast.success('Started sharing your location with customer');

    if (locationWatchers.current[orderId]) {
      navigator.geolocation.clearWatch(locationWatchers.current[orderId]);
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const locationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          bearing: position.coords.heading || 0,
          speed: position.coords.speed || 0,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };

        setCurrentPosition(locationData);

        try {
          const response = await fetch(`/api/delivery/${orderId}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(locationData)
          });

          if (!response.ok) {
            console.error('Failed to send location update');
          }
        } catch (error) {
          console.error('Error sending location:', error);
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        let errorMessage = 'Error getting location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        showToast.error(errorMessage);
        stopLocationSharing(orderId);
      },
      { 
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );

    locationWatchers.current[orderId] = watchId;
  };

  const stopLocationSharing = (orderId) => {
    if (locationWatchers.current[orderId]) {
      navigator.geolocation.clearWatch(locationWatchers.current[orderId]);
      delete locationWatchers.current[orderId];
    }
    
    setLocationSharing(prev => ({ ...prev, [orderId]: false }));
    showToast.info('Stopped sharing location');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'on_the_way': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'preparing': return 'Preparing';
      case 'on_the_way': return 'On the Way';
      case 'delivered': return 'Delivered';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending': return ['accepted', 'rejected'];
      case 'accepted': return ['preparing'];
      case 'preparing': return ['on_the_way'];
      case 'on_the_way': return ['delivered'];
      default: return [];
    }
  };

  const getOrderTypeBadge = (orderType) => {
    const typeStyles = {
      delivery: 'bg-blue-100 text-blue-800',
      dine_in: 'bg-green-100 text-green-800',
      takeaway: 'bg-orange-100 text-orange-800'
    };

    const typeLabels = {
      delivery: '🚚 Delivery',
      dine_in: '🍽️ Dine In',
      takeaway: '📦 Takeaway'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeStyles[orderType] || 'bg-gray-100 text-gray-800'}`}>
        {typeLabels[orderType] || orderType}
      </span>
    );
  };

  const openGoogleMaps = (coordinates, address) => {
    const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&hl=en`;
    window.open(url, '_blank');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 mb-4">
                <div className="flex justify-between mb-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isRestaurantOwner = session.user?.role === 'restaurant_owner';
  const isAdmin = session.user?.role === 'admin';
  const isUser = session.user?.role === 'user';
  const isDeliveryPerson = session.user?.role === 'delivery';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isRestaurantOwner ? 'Restaurant Orders' : 
             isAdmin ? 'All Orders' : 
             isDeliveryPerson ? 'Delivery Orders' : 
             'My Orders'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isRestaurantOwner 
              ? 'Manage and track customer orders' 
              : isAdmin
              ? 'View and manage all system orders'
              : isDeliveryPerson
              ? 'Deliver orders to customers and share your live location'
              : 'Track your orders and their status'}
          </p>
          
          {isDeliveryPerson && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Delivery Instructions</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>1. Click "Start Location Sharing" when you begin delivery</p>
                    <p>2. Customers will see your live position on their map</p>
                    <p>3. Click "Mark as Delivered" when order is delivered</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {isRestaurantOwner || isAdmin || isDeliveryPerson ? 'No orders yet' : 'No orders yet'}
              </h2>
              <p className="text-gray-600 mb-8">
                {isRestaurantOwner
                  ? 'Customer orders will appear here when they place orders from your restaurant.'
                  : isAdmin
                  ? 'Orders from all restaurants will appear here.'
                  : isDeliveryPerson
                  ? 'No delivery orders assigned to you yet.'
                  : 'You haven\'t placed any orders yet. Start exploring restaurants and place your first order!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const nextStatuses = isRestaurantOwner ? getNextStatus(order.status) : [];
              const tipAmount = order.tipAmount || 0;
              const orderTotal = order.total || 0;
              const finalTotal = order.finalTotal || (orderTotal + (order.orderType === 'delivery' ? tipAmount : 0));
              
              return (
                <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {isRestaurantOwner || isAdmin || isDeliveryPerson
                            ? `Order from ${order.userName || 'Customer'}` 
                            : `Order from ${order.restaurantName || 'Restaurant'}`}
                        </h3>
                        {getOrderTypeBadge(order.orderType)}
                      </div>
                      <p className="text-gray-600 text-sm">
                        Order # {order._id?.slice(-8).toUpperCase() || 'N/A'} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Date N/A'}
                      </p>
                      {(isRestaurantOwner || isAdmin) && (
                        <p className="text-gray-600 text-sm">
                          Customer: {order.userEmail || 'No email'}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 lg:mt-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      
                      {isRestaurantOwner && nextStatuses.length > 0 && (
                        <div className="flex gap-2">
                          {nextStatuses.map((status) => (
                            <button
                              key={status}
                              onClick={() => updateOrderStatus(order._id, status)}
                              disabled={updating === order._id}
                              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                                status === 'rejected' 
                                  ? 'bg-red-500 text-white hover:bg-red-600' 
                                  : 'bg-amber-500 text-white hover:bg-amber-600'
                              } disabled:opacity-50`}
                            >
                              {updating === order._id ? '...' : getStatusText(status)}
                            </button>
                          ))}
                        </div>
                      )}

                      {isDeliveryPerson && order.orderType === 'delivery' && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          {order.status === 'on_the_way' && (
                            <div className="flex gap-2">
                              {!locationSharing[order._id] ? (
                                <button
                                  onClick={() => startLocationSharing(order._id)}
                                  disabled={updating === order._id}
                                  className="px-3 py-1 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Start Sharing
                                </button>
                              ) : (
                                <button
                                  onClick={() => stopLocationSharing(order._id)}
                                  disabled={updating === order._id}
                                  className="px-3 py-1 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Stop Sharing
                                </button>
                              )}
                            </div>
                          )}
                          
                          {order.status === 'on_the_way' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'delivered')}
                              disabled={updating === order._id}
                              className="px-3 py-1 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              {updating === order._id ? '...' : 'Mark Delivered'}
                            </button>
                          )}
                          
                          {locationSharing[order._id] && currentPosition && (
                            <div className="mt-2 sm:mt-0 sm:ml-2 text-xs text-gray-500 flex items-center">
                              <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse mr-1"></span>
                              Sharing: {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Location Information */}
                  {(isRestaurantOwner || isAdmin || isDeliveryPerson) && 
                   order.orderType === 'delivery' && 
                   order.deliveryLocation && 
                   (isRestaurantOwner || isAdmin || order.status === 'on_the_way') && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-blue-900 flex items-center">
                          <span className="mr-2">📍</span>
                          Delivery Location
                        </h4>
                        
                        {isDeliveryPerson && order.deliveryLocation.coordinates && (
                          <button
                            onClick={() => openGoogleMaps(order.deliveryLocation.coordinates, order.deliveryLocation.address)}
                            className="px-3 py-1 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Navigate
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Address</p>
                          <p className="text-gray-900 font-medium">{order.deliveryLocation.address || 'No address'}</p>
                          
                          {order.deliveryLocation.coordinates && !isDeliveryPerson && (
                            <button
                              onClick={() => openGoogleMaps(order.deliveryLocation.coordinates, order.deliveryLocation.address)}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <span className="mr-1">🗺️</span>
                              Open in Maps
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {order.deliveryLocation.apartment && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Apartment/Unit</p>
                              <p className="text-gray-900">{order.deliveryLocation.apartment}</p>
                            </div>
                          )}
                          
                          {order.deliveryLocation.floor && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Floor</p>
                              <p className="text-gray-900">{order.deliveryLocation.floor}</p>
                            </div>
                          )}
                          
                          {order.deliveryLocation.instructions && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Instructions</p>
                              <p className="text-gray-900 bg-yellow-50 p-2 rounded">{order.deliveryLocation.instructions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live Tracking Component for Customers */}
                  {isUser && order.orderType === 'delivery' && order.status === 'on_the_way' && order.deliveryLocation?.coordinates && (
                    <LiveOrderTracker 
                      orderId={order._id}
                      destination={order.deliveryLocation.coordinates}
                    />
                  )}

                  {/* Table Information for Dine-in Orders */}
                  {(isRestaurantOwner || isAdmin) && order.orderType === 'dine_in' && order.tableNumber && (
                    <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                        <span className="mr-2">🍽️</span>
                        Dine-in Information
                      </h4>
                      <p className="text-gray-700">
                        <span className="font-medium">Table Number:</span> {order.tableNumber}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <div className="space-y-3">
                      {(order.items || []).map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            {item.dishImage && (
                              <img
                                src={item.dishImage}
                                alt={item.dishName}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{item.dishName || 'Unknown Item'}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity || 1}</p>
                            </div>
                          </div>
                          <p className="font-medium text-gray-900">
                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <div className="space-y-2">
                        {tipAmount > 0 && order.orderType === 'delivery' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Tip</span>
                            <span className="font-medium text-green-600">+${tipAmount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">
                              Payment: {order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Credit Card'}
                            </p>
                            {order.specialInstructions && (
                              <p className="text-sm text-gray-600 mt-1">
                                Instructions: {order.specialInstructions}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {tipAmount > 0 && order.orderType === 'delivery' && (
                              <p className="text-sm text-gray-600 line-through">
                                Subtotal: ${orderTotal.toFixed(2)}
                              </p>
                            )}
                            <p className="text-lg font-bold text-amber-600">
                              Total: ${finalTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}