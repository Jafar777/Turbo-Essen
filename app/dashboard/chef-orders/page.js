// app/dashboard/chef-orders/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/lib/toast';

export default function ChefOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user?.role !== 'chef') {
      router.push('/dashboard');
      return;
    }

    fetchOrders();
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders for chef...');
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        console.log('Chef orders API response:', data);
        setOrders(data.orders || []);
      } else {
        console.error('Failed to fetch orders, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const markOrderFinished = async (orderId) => {
    setUpdating(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'on_the_way' }),
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
    showToast.success('Order marked as finished and ready for delivery!');
      } else {
        const errorData = await response.json();
    showToast.error(errorData.error || 'Failed to update order status');
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
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'on_the_way': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'accepted': return 'Ready to Prepare';
      case 'preparing': return 'Preparing';
      case 'on_the_way': return 'Ready for Delivery';
      default: return status;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-orange-200 rounded w-1/4 mb-8"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 mb-4">
                <div className="flex justify-between mb-4">
                  <div className="h-4 bg-orange-200 rounded w-1/3"></div>
                  <div className="h-6 bg-orange-200 rounded w-20"></div>
                </div>
                <div className="h-3 bg-orange-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-orange-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'chef') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Chef Orders</h1>
          <p className="text-orange-100 text-lg">
            Manage food preparation for your restaurant
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-orange-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders to prepare</h2>
              <p className="text-gray-600">
                Orders that are accepted by the restaurant owner will appear here for preparation.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-2xl shadow-xl border border-orange-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
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
                    
                    {/* Finish Button - Only show for preparing orders */}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => markOrderFinished(order._id)}
                        disabled={updating === order._id}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium"
                      >
                        {updating === order._id ? 'Marking...' : '🍳 Finished'}
                      </button>
                    )}

                    {/* Start Preparing Button - Only show for accepted orders */}
                    {order.status === 'accepted' && (
                      <button
                        onClick={() => markOrderFinished(order._id)}
                        disabled={updating === order._id}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors font-medium"
                      >
                        {updating === order._id ? 'Starting...' : '👨‍🍳 Start Preparing'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-orange-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Order Items:</h4>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-orange-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          {item.dishImage && (
                            <img
                              src={item.dishImage}
                              alt={item.dishName}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{item.dishName}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            {item.specialInstructions && (
                              <p className="text-sm text-orange-600 mt-1">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-orange-200 mt-4 pt-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Payment: {order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Credit Card'}</p>
                      {order.specialInstructions && (
                        <p className="text-sm text-orange-600 mt-1 font-medium">
                          Special Instructions: {order.specialInstructions}
                        </p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-orange-600">
                      Total: ${order.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}