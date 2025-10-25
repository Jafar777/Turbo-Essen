// app/dashboard/waiter/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function WaiterDashboard() {
  const [tables, setTables] = useState({ total: 0, available: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user?.role !== 'waiter') {
      router.push('/dashboard');
      return;
    }

    fetchTables();
    fetchOrders();
  }, [session, status, router]);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/restaurants/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data.tables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/waiter');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTables = async (newAvailableTables) => {
    if (newAvailableTables < 0 || newAvailableTables > tables.total) return;

    setTableLoading(true);
    try {
      const response = await fetch('/api/restaurants/tables', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availableTables: newAvailableTables }),
      });

      if (response.ok) {
        const data = await response.json();
        setTables(data.tables);
        alert('Tables updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update tables');
      }
    } catch (error) {
      console.error('Error updating tables:', error);
      alert('Failed to update tables');
    } finally {
      setTableLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, action) => {
    setUpdating(orderId);
    try {
      const response = await fetch('/api/orders/waiter', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, action }),
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
        fetchTables(); // Refresh tables if order was marked as paid
        alert('Order updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'served': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'preparing': return 'Preparing';
      case 'served': return 'Served';
      case 'delivered': return 'Completed';
      default: return status;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-blue-200 rounded w-1/4 mb-8"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 mb-4">
                <div className="flex justify-between mb-4">
                  <div className="h-4 bg-blue-200 rounded w-1/3"></div>
                  <div className="h-6 bg-blue-200 rounded w-20"></div>
                </div>
                <div className="h-3 bg-blue-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-blue-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'waiter') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Waiter Dashboard</h1>
          <p className="text-blue-100 text-lg">
            Manage tables and serve dine-in customers
          </p>
        </div>

        {/* Table Management Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Table Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Tables */}
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{tables.total}</div>
              <div className="text-blue-800 font-medium">Total Tables</div>
            </div>

            {/* Available Tables */}
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{tables.available}</div>
              <div className="text-green-800 font-medium">Available Tables</div>
            </div>

            {/* Occupied Tables */}
            <div className="bg-orange-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{tables.total - tables.available}</div>
              <div className="text-orange-800 font-medium">Occupied Tables</div>
            </div>
          </div>

          {/* Table Controls */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Update Available Tables:</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => updateTables(tables.available - 1)}
                disabled={tableLoading || tables.available <= 0}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                -1 Table
              </button>
              
              <span className="text-lg font-semibold text-gray-700">
                {tables.available} available
              </span>
              
              <button
                onClick={() => updateTables(tables.available + 1)}
                disabled={tableLoading || tables.available >= tables.total}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                +1 Table
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Update when customers are seated or leave
            </p>
          </div>
        </div>

        {/* Dine-in Orders Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dine-in Orders</h2>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No dine-in orders</h3>
              <p>Dine-in orders will appear here when customers place them.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Table #{order.tableNumber} - {order.userName}
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
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'mark_served')}
                            disabled={updating === order._id}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors text-sm"
                          >
                            {updating === order._id ? '...' : 'Mark Served'}
                          </button>
                        )}
                        
                        {order.status === 'served' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'mark_paid')}
                            disabled={updating === order._id}
                            className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors text-sm"
                          >
                            {updating === order._id ? '...' : 'Mark Paid'}
                          </button>
                        )}
                      </div>
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
                        <p className="text-sm text-gray-600">Payment: {order.paymentMethod === 'cash' ? 'Cash' : 'Credit Card'}</p>
                        {order.specialInstructions && (
                          <p className="text-sm text-gray-600 mt-1">
                            Instructions: {order.specialInstructions}
                          </p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-blue-600">
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
    </div>
  );
}