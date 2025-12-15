// /components/DashboardSidebar.jsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { TbLayoutSidebarRightCollapse, TbLayoutSidebarLeftCollapse } from 'react-icons/tb';
import { FaHome } from 'react-icons/fa';
import { MdManageAccounts } from 'react-icons/md';
import { HiMiniUsers } from 'react-icons/hi2';
import { IoRestaurantSharp } from 'react-icons/io5';
import { FaCartShopping } from 'react-icons/fa6';
import { LuPackageSearch } from 'react-icons/lu';
import { MdOutlineRateReview } from 'react-icons/md';
import { IoStatsChartSharp } from "react-icons/io5";
import { MdReport } from 'react-icons/md';
import { IoNotifications } from 'react-icons/io5';
import { MdOutlineAddBusiness } from "react-icons/md"; 
import { IoDocuments } from "react-icons/io5";
import { FaUsersBetweenLines } from "react-icons/fa6";
import { IoQrCode } from "react-icons/io5";
import { useState, useEffect, useRef } from 'react';

const DashboardSidebar = ({ isCollapsed, toggleSidebar }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const audioRef = useRef(null);
  const ordersCheckInterval = useRef(null);
  const hasPlayedSoundRef = useRef(false); // Track if sound has been played for current notification

  const allMenuItems = [
    { href: '/dashboard', label: 'Home', icon: FaHome, roles: ['admin', 'restaurant_owner', 'chef', 'waiter', 'delivery', 'user'] },
    { href: '/dashboard/users', label: 'Users', icon: HiMiniUsers, roles: ['admin'] },
    { href: '/dashboard/account', label: 'User Settings', icon: MdManageAccounts, roles: ['admin', 'restaurant_owner', 'chef', 'waiter', 'delivery', 'user'] },
    { href: '/dashboard/applications', label: 'Restaurant Applications', icon: IoDocuments, roles: ['admin'] },
    { href: '/dashboard/restaurant', label: 'Restaurant Management', icon: IoRestaurantSharp, roles: ['restaurant_owner'] },
    { href: '/dashboard/restaurants-management', label: 'Restaurants Management', icon: IoRestaurantSharp, roles: ['admin'] },
    { href: '/dashboard/cart', label: 'Cart', icon: FaCartShopping, roles: [ 'user'] },
    { href: '/dashboard/orders', label: 'Orders', icon: LuPackageSearch, roles: ['admin', 'user', 'restaurant_owner', 'chef', 'waiter', 'delivery'] },
    { href: '/dashboard/reviews', label: 'Reviews', icon: MdOutlineRateReview, roles: [ 'restaurant_owner', 'user'] },
    { href: '/dashboard/performance', label: 'Performance', icon: IoStatsChartSharp, roles: ['admin', 'restaurant_owner'] },
    { href: '/dashboard/reports', label: 'Reports', icon: MdReport, roles: ['user','admin'] },
    { href: '/dashboard/notifications', label: 'Notifications', icon: IoNotifications, roles: ['admin', 'restaurant_owner', 'chef', 'waiter', 'delivery', 'user'] },
    { href: '/dashboard/restaurant-workers', label: 'Restaurant Workers', icon: FaUsersBetweenLines, roles: ['restaurant_owner'] },
    { href: '/dashboard/chef-orders', label: 'Chef Orders', icon: IoRestaurantSharp, roles: ['chef'] },
    { href: '/dashboard/waiter', label: 'Waiter Dashboard', icon: FaUsersBetweenLines, roles: ['waiter'] },
    { href: '/dashboard/apply-restaurant', label: 'Apply as a Restaurant', icon: MdOutlineAddBusiness, roles: ['user'] },
    { href: '/dashboard/restaurant-qr', label: 'QR Code', icon: IoQrCode, roles: ['restaurant_owner'] },
  ];

  // Initialize audio on component mount
  useEffect(() => {
    // Create audio element
    const audio = new Audio('/new-order.mp3'); // Fixed path - from root of public folder
    audio.preload = 'auto';
    audio.volume = 0.5;
    audioRef.current = audio;

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current && typeof window !== 'undefined') {
      try {
        // Reset and play
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          console.log('Audio play error (may be due to autoplay restrictions):', error);
          // Try to play on user interaction
          document.addEventListener('click', playOnUserInteraction, { once: true });
        });
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  };

  // Play sound on user interaction (for browsers that block autoplay)
  const playOnUserInteraction = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  };

  // Check for new orders
  const checkForNewOrders = async () => {
    if (session?.user?.role === 'restaurant_owner') {
      try {
        const response = await fetch('/api/orders/check-new');
        if (response.ok) {
          const data = await response.json();
          
          // If there are new orders
          if (data.hasNewOrders && data.newOrderCount > 0) {
            // Check if this is a new notification
            const previousCount = localStorage.getItem('lastOrderCount') || 0;
            
            if (data.newOrderCount > previousCount) {
              // New order arrived
              setHasNewOrders(true);
              setUnreadOrderCount(data.newOrderCount);
              
              // Only play sound if not on orders page and sound hasn't been played for this batch
              if (pathname !== '/dashboard/orders' && !hasPlayedSoundRef.current) {
                playNotificationSound();
                hasPlayedSoundRef.current = true;
              }
            }
            
            // Update stored count
            localStorage.setItem('lastOrderCount', data.newOrderCount);
          } else {
            // No new orders
            setHasNewOrders(false);
            setUnreadOrderCount(0);
            hasPlayedSoundRef.current = false;
            localStorage.setItem('lastOrderCount', 0);
          }
        }
      } catch (error) {
        console.error('Error checking new orders:', error);
      }
    }
  };

  // Clear new orders flag when visiting orders page
  const markOrdersAsRead = async () => {
    if (session?.user?.role === 'restaurant_owner' && pathname === '/dashboard/orders') {
      try {
        await fetch('/api/orders/mark-read', { method: 'POST' });
        setHasNewOrders(false);
        setUnreadOrderCount(0);
        hasPlayedSoundRef.current = false;
        localStorage.setItem('lastOrderCount', 0);
      } catch (error) {
        console.error('Error marking orders as read:', error);
      }
    }
  };

  // Set up interval for checking new orders
  useEffect(() => {
    if (session?.user?.role === 'restaurant_owner') {
      // Check immediately
      checkForNewOrders();
      
      // Set up interval for checking every 10 seconds (more frequent)
      ordersCheckInterval.current = setInterval(checkForNewOrders, 10000);
      
      return () => {
        if (ordersCheckInterval.current) {
          clearInterval(ordersCheckInterval.current);
        }
      };
    }
  }, [session]);

  // Mark orders as read when on orders page
  useEffect(() => {
    if (pathname === '/dashboard/orders') {
      markOrdersAsRead();
    }
  }, [pathname]);

  // Also mark as read when component unmounts while on orders page
  useEffect(() => {
    return () => {
      if (pathname === '/dashboard/orders') {
        markOrdersAsRead();
      }
    };
  }, [pathname]);

  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(session?.user?.role || 'user')
  );

  // Add red dot indicator to Orders menu item if restaurant owner has new orders
  const renderOrdersMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    const isOrdersItem = item.href === '/dashboard/orders';
    const showRedDot = isOrdersItem && hasNewOrders && !isActive;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`relative flex items-center p-3 rounded-lg transition-colors group ${
          isActive
            ? 'bg-blue-50 text-blue-600 border border-blue-200'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        title={isCollapsed ? item.label : ''}
      >
        <div className="relative">
          <Icon
            className={`flex-shrink-0 ${
              isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
            }`}
          />
          {showRedDot && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
        {!isCollapsed && (
          <span className="font-medium flex items-center">
            {item.label}
            {showRedDot && (
              <div className="ml-2 flex items-center">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                {unreadOrderCount > 0 && (
                  <span className="ml-1 text-xs font-bold text-red-600">
                    ({unreadOrderCount})
                  </span>
                )}
              </div>
            )}
          </span>
        )}

        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            {item.label}
            {showRedDot && (
              <span className="ml-1 text-red-400">
                ● {unreadOrderCount > 0 ? `(${unreadOrderCount})` : ''}
              </span>
            )}
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className={`bg-white shadow-lg fixed left-0 top-24 bottom-0 transition-all duration-300 flex flex-col z-40 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b h-16">
        {!isCollapsed && (
          <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <TbLayoutSidebarLeftCollapse className="w-5 h-5 text-gray-600" />
          ) : (
            <TbLayoutSidebarRightCollapse className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      <nav
        className="flex-1 overflow-y-auto p-4 space-y-2 sidebar-scroll"
        tabIndex={0}
      >
        {menuItems.map((item) => {
          if (item.href === '/dashboard/orders') {
            return renderOrdersMenuItem(item);
          }
          
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center p-3 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon
                className={`flex-shrink-0 ${
                  isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                }`}
              />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardSidebar;