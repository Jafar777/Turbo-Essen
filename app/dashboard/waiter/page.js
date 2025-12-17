// app/dashboard/waiter/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/lib/toast';
import { FaChair, FaChevronDown, FaChevronUp, FaCheck, FaTimes, FaEllipsisH } from "react-icons/fa";

export default function WaiterDashboard() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [expandedTableOrders, setExpandedTableOrders] = useState(null);
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
      const response = await fetch('/api/restaurants/tables/detailed');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched tables:', data);

        // Map 'cleaning' status to 'unavailable' for display
        const mappedTables = data.tables.map(table => ({
          ...table,
          status: table.status === 'cleaning' ? 'unavailable' : table.status
        }));

        setTables(mappedTables || []);
      } else {
        console.error('Failed to fetch tables:', response.status);
        const fallbackTables = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          number: i + 1,
          chairs: 4,
          status: 'available',
          orders: []
        }));
        setTables(fallbackTables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      const mockTables = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        number: i + 1,
        chairs: 4,
        status: 'available',
        orders: []
      }));
      setTables(mockTables);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/waiter');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);

        setTables(prevTables => {
          const ordersByTable = {};
          data.orders.forEach(order => {
            if (order.tableNumber && order.status !== 'delivered') {
              if (!ordersByTable[order.tableNumber]) {
                ordersByTable[order.tableNumber] = [];
              }
              ordersByTable[order.tableNumber].push(order);
            }
          });

          return prevTables.map(table => {
            const tableOrders = ordersByTable[table.number] || [];
            const status = tableOrders.length > 0 && table.status !== 'unavailable'
              ? 'occupied'
              : table.status || 'available';

            return {
              ...table,
              orders: tableOrders,
              status: status
            };
          });
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTableChairs = async (tableId, newChairCount) => {
    try {
      const response = await fetch('/api/restaurants/tables/detailed', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId,
          chairs: newChairCount
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTables(prev => prev.map(table =>
          table.id === tableId ? { ...table, chairs: newChairCount } : table
        ));
        showToast.success(data.message || `Table ${tableId} updated to ${newChairCount} chairs`);
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Failed to update table');
      }
    } catch (error) {
      console.error('Error updating table:', error);
      showToast.error('Failed to update table');
    }
  };

  const updateTableStatus = async (tableId, newStatus) => {
    try {
      // Map 'unavailable' to 'cleaning' for the API, and 'cleaning' back to 'unavailable' for display
      const apiStatus = newStatus === 'unavailable' ? 'cleaning' : newStatus;

      const response = await fetch('/api/restaurants/tables/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId,
          status: apiStatus
        }),
      });

      console.log('Updating table status:', { tableId, newStatus, apiStatus });

      if (response.ok) {
        // Update local state with the original status
        setTables(prev => prev.map(table =>
          table.id === tableId ? { ...table, status: newStatus } : table
        ));
        showToast.success(`Table ${tableId} status updated to ${newStatus}`);
        // Don't call fetchTables() here - we already updated local state
      } else {
        const text = await response.text();
        console.error('Error response text:', text);

        try {
          const error = JSON.parse(text);
          showToast.error(error.error || 'Failed to update table status');
        } catch {
          showToast.error(`Failed to update table status: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error updating table status:', error);
      showToast.error('Failed to update table status');
    }
  };

  const updateOrderStatus = async (orderId, action) => {
    setUpdatingOrder(orderId);
    try {
      const response = await fetch('/api/orders/waiter', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, action }),
      });

      if (response.ok) {
        showToast.success('Order updated successfully!');
        fetchOrders();
        setExpandedTableOrders(null);
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showToast.error('Failed to update order');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getTableOrders = (tableNumber) => {
    return orders.filter(order =>
      order.tableNumber === tableNumber &&
      order.status !== 'delivered' &&
      order.orderType === 'dine_in'
    );
  };

  const toggleTableOrders = (tableNumber) => {
    if (expandedTableOrders === tableNumber) {
      setExpandedTableOrders(null);
    } else {
      setExpandedTableOrders(tableNumber);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'served': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'available': return 'bg-green-100 text-green-800';
      case 'unavailable': return 'bg-gray-100 text-gray-800';
      case 'reserved': return 'bg-purple-100 text-purple-800';
      case 'cleaning': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'preparing': return 'Preparing';
      case 'served': return 'Served';
      case 'occupied': return 'Occupied';
      case 'available': return 'Available';
      case 'unavailable': return 'Unavailable';
      case 'reserved': return 'Reserved';
      case 'cleaning': return 'Cleaning';
      default: return status;
    }
  };

  const renderTable = (table) => {
    const tableOrders = getTableOrders(table.number);
    const hasOrders = tableOrders.length > 0;
    const isExpanded = expandedTableOrders === table.number;
    const isAvailable = table.status === 'available';
    const isOccupied = table.status === 'occupied' || (hasOrders && table.status !== 'unavailable');
    const isUnavailable = table.status === 'unavailable';

    return (
      <div key={table.id} className="relative">
        {/* Table Container */}
        <div className={`relative group transition-all duration-300 ${isOccupied ? 'scale-105' : ''}`}>
          {/* Table Circle */}
          <div className={`
            relative w-32 h-32 mx-auto rounded-full shadow-lg flex items-center justify-center
            ${isUnavailable
              ? 'bg-gradient-to-br from-gray-400 to-gray-600 border-4 border-gray-500'
              : isOccupied
                ? 'bg-gradient-to-br from-amber-600 to-amber-800 border-4 border-amber-700'
                : 'bg-gradient-to-br from-gray-200 to-gray-300 border-4 border-gray-400'
            }
          `}>
            {/* Table Number */}
            <div className={`
              absolute w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl
              ${isUnavailable
                ? 'bg-gray-700 text-white ring-4 ring-gray-600'
                : isOccupied
                  ? 'bg-amber-900 text-white ring-4 ring-amber-700'
                  : 'bg-gray-800 text-white ring-4 ring-gray-600'
              }
            `}>
              {table.number}
            </div>

            {/* Chairs positioned around the table */}
            {Array.from({ length: table.chairs }).map((_, index) => {
              const angle = (index * 2 * Math.PI) / table.chairs;
              const radius = 60;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <FaChair
                    className={`
                      text-2xl transition-transform duration-300
                      ${isUnavailable
                        ? 'text-gray-500 hover:text-gray-600'
                        : isOccupied
                          ? 'text-amber-700 hover:text-amber-800'
                          : 'text-gray-600 hover:text-gray-800'
                      }
                      hover:scale-125
                    `}
                  />
                </div>
              );
            })}

            {/* Status Action Buttons */}
            <div className="absolute -top-2 -right-2 flex flex-col space-y-1">
              {!isOccupied && !isUnavailable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTableStatus(table.id, 'unavailable');
                  }}
                  className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                  title="Mark as unavailable"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}

              {isUnavailable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTableStatus(table.id, 'available');
                  }}
                  className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg"
                  title="Mark as available"
                >
                  <FaCheck className="w-4 h-4" />
                </button>
              )}

              {hasOrders && !isUnavailable && (
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold animate-pulse">
                  {tableOrders.length}
                </div>
              )}
            </div>
          </div>

          {/* Table Info */}
          <div className="mt-2 text-center">
            <div className="text-sm font-semibold text-gray-700">
              {table.chairs} {table.chairs === 1 ? 'Chair' : 'Chairs'}
            </div>
            <div className={`text-xs font-medium ${getStatusColor(table.status).split(' ')[0]} ${getStatusColor(table.status).split(' ')[1]}`}>
              {getStatusText(table.status)}
            </div>

            {/* Quick Actions */}
            <div className="mt-2 flex justify-center space-x-2">
              <button
                onClick={() => {
                  setSelectedTable(table);
                  setShowTableModal(true);
                }}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Configure
              </button>

              {hasOrders && (
                <button
                  onClick={() => toggleTableOrders(table.number)}
                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                >
                  {isExpanded ? 'Hide Orders' : `Orders (${tableOrders.length})`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orders Dropdown */}
        {isExpanded && hasOrders && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-900">Table {table.number} - Current Orders</h4>
                <span className="text-sm font-medium text-gray-600">{tableOrders.length} active</span>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {tableOrders.map((order, index) => (
                <div key={order._id} className={`p-4 ${index !== tableOrders.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h5 className="font-bold text-gray-900">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </h5>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Customer: {order.userName} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    {order.items.slice(0, 3).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                          {item.dishImage && (
                            <img
                              src={item.dishImage}
                              alt={item.dishName}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <span className="text-gray-800 font-medium">{item.dishName}</span>
                          <span className="text-gray-500">×{item.quantity}</span>
                        </div>
                        <span className="font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">+{order.items.length - 3} more items</p>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-600">Total: <span className="font-bold text-blue-600">${order.total.toFixed(2)}</span></p>
                      <p className="text-xs text-gray-500">Payment: {order.paymentMethod === 'cash' ? 'Cash' : 'Card'}</p>
                    </div>

                    <div className="flex space-x-2">
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'mark_served')}
                          disabled={updatingOrder === order._id}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50 font-medium"
                        >
                          {updatingOrder === order._id ? '...' : 'Mark Served'}
                        </button>
                      )}
                      {order.status === 'served' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'mark_paid')}
                          disabled={updatingOrder === order._id}
                          className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50 font-medium"
                        >
                          {updatingOrder === order._id ? '...' : 'Mark Paid'}
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'accepted') && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          Kitchen Processing
                        </span>
                      )}
                    </div>
                  </div>

                  {order.specialInstructions && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      <span className="font-medium">Note:</span> {order.specialInstructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-blue-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="h-32 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Waiter Dashboard</h1>
          <p className="text-blue-100 text-lg">
            Manage tables, view orders, and update table status in real-time
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Table Management</h2>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <div className="text-sm text-gray-600">
                Click on table circles to configure, use buttons to change status
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{tables.length}</div>
              <div className="text-blue-800 font-medium">Total Tables</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {tables.filter(t => t.status === 'available').length}
              </div>
              <div className="text-green-800 font-medium">Available</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {tables.filter(t => t.status === 'occupied' || (getTableOrders(t.number).length > 0 && t.status !== 'unavailable')).length}
              </div>
              <div className="text-red-800 font-medium">Occupied</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">
                {orders.filter(o => o.orderType === 'dine_in' && o.status !== 'delivered').length}
              </div>
              <div className="text-amber-800 font-medium">Active Orders</div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-gray-400"></div>
              <span className="text-sm text-gray-700">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-amber-700"></div>
              <span className="text-sm text-gray-700">Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-gray-500"></div>
              <span className="text-sm text-gray-700">Unavailable</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <FaTimes className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-700">Mark Unavailable</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <FaCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-700">Mark Available</span>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Tables</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {tables.map(renderTable)}
          </div>
        </div>
      </div>

      {/* Table Configuration Modal */}
      {showTableModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Table {selectedTable.number}
                </h3>
                <button
                  onClick={() => setShowTableModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="relative w-48 h-48 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full border-8 border-gray-400"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-gray-800 text-white rounded-full flex items-center justify-center text-3xl font-bold">
                      {selectedTable.number}
                    </div>
                  </div>
                  {/* Chair indicators around the table */}
                  {Array.from({ length: selectedTable.chairs }).map((_, i) => {
                    const angle = (i * 2 * Math.PI) / selectedTable.chairs;
                    const radius = 80;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                      <div
                        key={i}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`
                        }}
                      >
                        <FaChair className="text-2xl text-gray-700" />
                      </div>
                    );
                  })}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Chairs
                  </label>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => updateTableChairs(selectedTable.id, Math.max(2, selectedTable.chairs - 1))}
                      className="w-12 h-12 bg-red-500 text-white rounded-full hover:bg-red-600 text-2xl"
                    >
                      -
                    </button>
                    <span className="text-3xl font-bold text-gray-900 w-12 text-center">
                      {selectedTable.chairs}
                    </span>
                    <button
                      onClick={() => updateTableChairs(selectedTable.id, Math.min(8, selectedTable.chairs + 1))}
                      className="w-12 h-12 bg-green-500 text-white rounded-full hover:bg-green-600 text-2xl"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Chairs: 2-8 (Standard: 4)
                  </p>
                </div>

                {/* Manual Status Control */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Status
                  </label>
                  <div className="flex space-x-2 justify-center">
                    <button
                      onClick={() => updateTableStatus(selectedTable.id, 'available')}
                      className={`px-4 py-2 rounded-lg font-medium ${selectedTable.status === 'available' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      Available
                    </button>
                    <button
                      onClick={() => updateTableStatus(selectedTable.id, 'unavailable')}
                      className={`px-4 py-2 rounded-lg font-medium ${selectedTable.status === 'unavailable' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      Unavailable
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Note: Tables with orders will show as occupied
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}