// app/dashboard/page.js
'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaUsers, 
  FaShoppingCart, 
  FaStar, 
  FaChartLine,
  FaUtensils,
  FaBell,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaMoneyBillWave,
  FaUserCheck,
  FaExclamationTriangle,
  FaFileAlt
} from 'react-icons/fa';
import { 
  MdRestaurant, 
  MdOutlineRateReview,
  MdReport,
  MdPendingActions
} from 'react-icons/md';
import { IoStatsChart, IoDocumentText } from 'react-icons/io5';

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session, timeframe]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/stats?timeframe=${timeframe}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleBasedStats = () => {
    const baseStats = [];

    if (session?.user?.role === 'admin') {
      baseStats.push(
        {
          title: 'Total Users',
          value: stats.totalUsers || 0,
          icon: FaUsers,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          change: '+12%',
          changeType: 'increase',
          href: '/dashboard/users'
        },
        {
          title: 'Total Restaurants',
          value: stats.totalRestaurants || 0,
          icon: MdRestaurant,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          change: '+5',
          changeType: 'increase',
          href: '/dashboard/restaurants-management'
        },
        {
          title: 'Total Orders',
          value: stats.totalOrders || 0,
          icon: FaShoppingCart,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          change: '+23%',
          changeType: 'increase',
          href: '/dashboard/orders'
        },
        {
          title: 'Total Revenue',
          value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
          icon: FaMoneyBillWave,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          change: '+18%',
          changeType: 'increase'
        },
        {
          title: 'Pending Applications',
          value: stats.pendingApplications || 0,
          icon: IoDocumentText,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          change: '+3',
          changeType: 'increase',
          href: '/dashboard/applications'
        },
        {
          title: 'Pending Reports',
          value: stats.pendingReports || 0,
          icon: MdReport,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          change: '+2',
          changeType: 'increase',
          href: '/dashboard/reports'
        }
      );
    } else if (session?.user?.role === 'restaurant_owner') {
      baseStats.push(
        {
          title: 'Total Orders',
          value: stats.totalOrders || 0,
          icon: FaShoppingCart,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          change: '+15%',
          changeType: 'increase',
          href: '/dashboard/orders'
        },
        {
          title: 'Revenue',
          value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
          icon: FaMoneyBillWave,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          change: '+12%',
          changeType: 'increase'
        },
        {
          title: 'Average Rating',
          value: (stats.averageRating || 0).toFixed(1),
          icon: FaStar,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          change: '+0.2',
          changeType: 'increase',
          href: '/dashboard/reviews'
        },
        {
          title: 'Pending Orders',
          value: stats.pendingOrders || 0,
          icon: MdPendingActions,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          change: '-2',
          changeType: 'decrease',
          href: '/dashboard/orders'
        }
      );
    } else if (session?.user?.role === 'user') {
      baseStats.push(
        {
          title: 'Total Orders',
          value: stats.totalOrders || 0,
          icon: FaShoppingCart,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          change: '+3',
          changeType: 'increase',
          href: '/dashboard/orders'
        },
        {
          title: 'Pending Orders',
          value: stats.pendingOrders || 0,
          icon: MdPendingActions,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          change: '-1',
          changeType: 'decrease',
          href: '/dashboard/orders'
        },
        {
          title: 'Your Reviews',
          value: stats.totalReviews || 0,
          icon: MdOutlineRateReview,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          change: '+2',
          changeType: 'increase',
          href: '/dashboard/reviews'
        },
        {
          title: 'Cart Items',
          value: stats.cartItems || 0,
          icon: FaShoppingCart,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          change: '+1',
          changeType: 'increase',
          href: '/dashboard/cart'
        }
      );
    }

    return baseStats;
  };

  const getRoleBasedActions = () => {
    const allActions = [
      { href: '/dashboard/orders', label: 'Manage Orders', icon: FaShoppingCart, color: 'bg-blue-500' },
      { href: '/dashboard/restaurants-management', label: 'View Restaurants', icon: MdRestaurant, color: 'bg-green-500' },
      { href: '/dashboard/reviews', label: 'Check Reviews', icon: MdOutlineRateReview, color: 'bg-yellow-500' },
      { href: '/dashboard/reports', label: 'View Reports', icon: MdReport, color: 'bg-red-500' },
      { href: '/dashboard/users', label: 'User Management', icon: FaUsers, color: 'bg-purple-500' },
      { href: '/dashboard/notifications', label: 'Notifications', icon: FaBell, color: 'bg-indigo-500' },
      { href: '/dashboard/applications', label: 'Applications', icon: IoDocumentText, color: 'bg-orange-500' },
      { href: '/dashboard/restaurant', label: 'My Restaurant', icon: FaUtensils, color: 'bg-green-500' },
      { href: '/dashboard/cart', label: 'My Cart', icon: FaShoppingCart, color: 'bg-blue-500' },
      { href: '/dashboard/apply-restaurant', label: 'Apply as Restaurant', icon: IoDocumentText, color: 'bg-purple-500' }
    ];

    switch (session?.user?.role) {
      case 'admin':
        return allActions.filter(action => 
          ['/dashboard/orders', '/dashboard/restaurants-management', '/dashboard/reviews', '/dashboard/reports', '/dashboard/users', '/dashboard/notifications', '/dashboard/applications'].includes(action.href)
        );
      case 'restaurant_owner':
        return allActions.filter(action => 
          ['/dashboard/orders', '/dashboard/restaurant', '/dashboard/reviews', '/dashboard/performance', '/dashboard/notifications', '/dashboard/restaurant-workers'].includes(action.href)
        );
      case 'user':
        return allActions.filter(action => 
          ['/dashboard/orders', '/dashboard/cart', '/dashboard/reviews', '/dashboard/reports', '/dashboard/notifications', '/dashboard/apply-restaurant'].includes(action.href)
        );
      default:
        return allActions;
    }
  };

  const getRecentActivities = () => {
    if (session?.user?.role === 'admin' && stats.recentOrders) {
      return stats.recentOrders.slice(0, 4).map((order, index) => ({
        id: order._id,
        type: 'order',
        message: `New order #${order._id.slice(-6)} from ${order.userName}`,
        time: new Date(order.createdAt).toLocaleDateString(),
        icon: FaShoppingCart,
        color: 'text-green-500'
      }));
    } else if (session?.user?.role === 'restaurant_owner' && stats.recentOrders) {
      return stats.recentOrders.slice(0, 4).map((order, index) => ({
        id: order._id,
        type: 'order',
        message: `New ${order.orderType} order #${order._id.slice(-6)}`,
        time: new Date(order.createdAt).toLocaleDateString(),
        icon: FaShoppingCart,
        color: 'text-blue-500'
      }));
    }

    // Fallback activities
    return [
      { id: 1, type: 'system', message: 'Welcome to TurboEssen!', time: 'Just now', icon: FaBell, color: 'text-blue-500' }
    ];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {getGreeting()}, {session?.user?.firstName}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Welcome back to your TurboEssen dashboard. Here's what's happening today.
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm border px-4 py-2">
              <FaUserCheck className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {session?.user?.role?.replace('_', ' ') || 'User'}
              </span>
            </div>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <FaExclamationTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {getRoleBasedStats().map((stat, index) => {
          const StatComponent = stat.href ? Link : 'div';
          const statProps = stat.href ? { href: stat.href } : {};
          
          return (
            <StatComponent
              key={index}
              {...statProps}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300 ${
                stat.href ? 'cursor-pointer hover:border-amber-200' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.changeType === 'increase' ? (
                    <FaArrowUp className="w-3 h-3" />
                  ) : (
                    <FaArrowDown className="w-3 h-3" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.title}</p>
            </StatComponent>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <IoStatsChart className="w-6 h-6 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getRoleBasedActions().map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="group flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 border border-gray-200"
                >
                  <div className={`p-3 rounded-full ${action.color} text-white mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center group-hover:text-gray-700">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Performance Chart Placeholder */}
          {(session?.user?.role === 'admin' || session?.user?.role === 'restaurant_owner') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Performance Overview</h2>
                <FaChartLine className="w-6 h-6 text-gray-400" />
              </div>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <IoStatsChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Visit the performance page for detailed analytics</p>
                  <Link
                    href="/dashboard/performance"
                    className="inline-block mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    View Performance
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <FaClock className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {getRecentActivities().map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className={`p-2 rounded-full ${activity.color} bg-opacity-10`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Service</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Gateway</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Service</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Running</span>
              </div>
            </div>
          </div>

          {/* Tips & Updates */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm p-6 text-white">
            <h2 className="text-xl font-bold mb-3">Pro Tip 💡</h2>
            <p className="text-blue-100 text-sm mb-4">
              {session?.user?.role === 'admin' 
                ? 'Use the reports section to monitor platform activity and user reports.'
                : session?.user?.role === 'restaurant_owner'
                ? 'Update your menu regularly to keep customers engaged and coming back.'
                : 'Complete your profile to get personalized restaurant recommendations.'
              }
            </p>
            <Link
              href="/dashboard/performance"
              className="block w-full bg-white text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200 text-center"
            >
              View Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}