// app/dashboard/restaurant-orders/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function RestaurantOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user?.role !== 'restaurant_owner') {
      router.push('/dashboard');
      return;
    }

    fetchOrders();
  }, [session, status, router]);

// Add this console log in the fetchOrders function
const fetchOrders = async () => {
  try {
    console.log('Fetching orders for restaurant owner...');
    const response = await fetch('/api/orders');
    if (response.ok) {
      const data = await response.json();
      console.log('Orders API response:', data);
      setOrders(data.orders || []);
    } else {
      console.error('Failed to fetch orders, status:', response.status);
      const errorData = await response.json();
      console.error('Error details:', errorData);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
  } finally {
    setLoading(false);
  }
};

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error updating order status');
    } finally {
      setUpdating(null);
    }
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

  if (!session || session.user?.role !== 'restaurant_owner') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Orders</h1>
          <p className="text-gray-600 mt-2">
            Manage and track customer orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
              <p className="text-gray-600">
                Customer orders will appear here when they place orders from your restaurant.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const nextStatuses = getNextStatus(order.status);
              
              return (
                <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order from {order.userName}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Order # {order._id.slice(-8).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600 text-sm">
                        Customer: {order.userEmail}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 lg:mt-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      
                      {/* Status Update Buttons */}
                      {nextStatuses.length > 0 && (
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
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
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
                              <p className="font-medium text-gray-900">{item.dishName}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Payment: {order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Credit Card'}</p>
                        {order.specialInstructions && (
                          <p className="text-sm text-gray-600 mt-1">
                            Instructions: {order.specialInstructions}
                          </p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-amber-600">
                        Total: ${order.total.toFixed(2)}
                      </p>
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