// app/dashboard/performance/page.js
'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  FaChartLine, 
  FaShoppingCart, 
  FaMoneyBillWave, 
  FaStar,
  FaUtensils,
  FaUsers
} from 'react-icons/fa';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PerformancePage() {
  const { data: session } = useSession();
  const [performanceData, setPerformanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    if (session) {
      fetchPerformanceData();
    }
  }, [session, timeframe]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/performance?timeframe=${timeframe}`);
      const data = await response.json();

      if (response.ok) {
        setPerformanceData(data.performanceData);
      } else {
        setError(data.error || 'Failed to fetch performance data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderAdminCharts = () => {
    if (!performanceData.ordersOverTime) return null;

    return (
      <div className="space-y-6">
        {/* Orders Over Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Orders Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData.ordersOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Over Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" fill="#00C49F" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Restaurants */}
        {performanceData.topRestaurants && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">Top Restaurants by Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData.topRestaurants} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Order Status Distribution */}
        {performanceData.orderStatusDistribution && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceData.orderStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, count }) => `${_id}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {performanceData.orderStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const renderRestaurantOwnerCharts = () => {
    if (!performanceData.ordersOverTime) return null;

    return (
      <div className="space-y-6">
        {/* Orders Over Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Orders Over Time - {performanceData.restaurantName}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData.ordersOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Over Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" fill="#00C49F" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Popular Items */}
        {performanceData.popularItems && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">Popular Menu Items</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData.popularItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="_id" width={120} />
                <Tooltip formatter={(value, name) => [name === 'count' ? value : `$${value}`, name === 'count' ? 'Quantity Sold' : 'Revenue']} />
                <Legend />
                <Bar dataKey="count" fill="#0088FE" name="Quantity Sold" />
                <Bar dataKey="revenue" fill="#00C49F" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Customer Ratings */}
        {performanceData.customerRatings && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Ratings Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceData.customerRatings}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, count }) => `${_id} stars: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {performanceData.customerRatings.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const renderUserCharts = () => {
    if (!performanceData.orderHistory) return null;

    return (
      <div className="space-y-6">
        {/* Order History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Your Order History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData.orderHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Spending Over Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Your Spending Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.spendingOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Amount Spent']} />
              <Legend />
              <Bar dataKey="totalSpent" fill="#00C49F" name="Amount Spent ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Review History */}
        {performanceData.reviewHistory && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">Your Review Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData.reviewHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#FFBB28" name="Reviews Posted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const renderNoDataMessage = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
      <FaChartLine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Performance Data Available</h3>
      <p className="text-gray-600">
        {session?.user?.role === 'restaurant_owner' 
          ? "You need to have a restaurant and orders to see performance data."
          : "Start using the platform to see your performance analytics."
        }
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 h-64">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Performance Analytics
            </h1>
            <p className="text-lg text-gray-600">
              {session?.user?.role === 'admin' 
                ? 'Platform-wide performance metrics and insights'
                : session?.user?.role === 'restaurant_owner'
                ? 'Your restaurant performance and customer insights'
                : 'Your personal ordering and review analytics'
              }
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Charts */}
      <div className="space-y-6">
        {session?.user?.role === 'admin' && renderAdminCharts()}
        {session?.user?.role === 'restaurant_owner' && renderRestaurantOwnerCharts()}
        {session?.user?.role === 'user' && renderUserCharts()}
        
        {Object.keys(performanceData).length === 0 && !loading && renderNoDataMessage()}
      </div>

      {/* Summary Cards */}
      {(performanceData.ordersOverTime || performanceData.orderHistory) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {/* Total Orders Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {performanceData.ordersOverTime?.reduce((sum, day) => sum + day.count, 0) || 
                   performanceData.orderHistory?.reduce((sum, day) => sum + day.count, 0) || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FaShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Revenue Card */}
          {(performanceData.revenueOverTime || performanceData.spendingOverTime) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total {session?.user?.role === 'user' ? 'Spent' : 'Revenue'}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${(performanceData.revenueOverTime?.reduce((sum, day) => sum + day.revenue, 0) || 
                      performanceData.spendingOverTime?.reduce((sum, day) => sum + day.totalSpent, 0) || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <FaMoneyBillWave className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          )}

          {/* Average Rating Card */}
          {performanceData.customerRatings && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {performanceData.customerRatings.reduce((sum, rating) => sum + (rating._id * rating.count), 0) / 
                     performanceData.customerRatings.reduce((sum, rating) => sum + rating.count, 0) || 0}.0
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <FaStar className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          )}

          {/* Popular Items Count */}
          {performanceData.popularItems && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Menu Items Sold</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {performanceData.popularItems.reduce((sum, item) => sum + item.count, 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <FaUtensils className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}