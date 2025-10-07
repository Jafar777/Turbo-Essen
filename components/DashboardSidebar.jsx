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
import { FaLanguage } from 'react-icons/fa6';
import { IoStatsChartSharp } from "react-icons/io5";
import { MdReport } from 'react-icons/md';
import { IoNotifications } from 'react-icons/io5';
import { MdOutlineAddBusiness } from "react-icons/md"; // Add this import
import { IoDocuments } from "react-icons/io5";

const DashboardSidebar = ({ isCollapsed, toggleSidebar }) => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const allMenuItems = [
    { href: '/dashboard', label: 'Home', icon: FaHome, roles: ['admin', 'restaurant_owner', 'chef', 'waiter', 'delivery', 'user'] },
    { href: '/dashboard/users', label: 'Users', icon: HiMiniUsers, roles: ['admin'] },
    { href: '/dashboard/account', label: 'User Settings', icon: MdManageAccounts, roles: ['admin', 'restaurant_owner', 'chef', 'waiter', 'delivery', 'user'] },
       // Add the new menu item here - visible to 'user' role only
    { href: '/dashboard/apply-restaurant', label: 'Apply as a Restaurant', icon: MdOutlineAddBusiness, roles: ['user'] },
      { href: '/dashboard/applications', label: 'Restaurant Applications', icon: IoDocuments, roles: ['admin'] },
    { href: '/dashboard/restaurants', label: 'Restaurant Management', icon: IoRestaurantSharp, roles: ['admin', 'restaurant_owner'] },
    { href: '/dashboard/cart', label: 'Cart', icon: FaCartShopping, roles: ['admin', 'restaurant_owner', 'chef', 'waiter', 'delivery', 'user'] },
    { href: '/dashboard/orders', label: 'Orders', icon: LuPackageSearch, roles: ['admin', 'restaurant_owner', 'chef', 'waiter', 'delivery'] },
    { href: '/dashboard/reviews', label: 'Reviews', icon: MdOutlineRateReview, roles: ['admin', 'restaurant_owner', 'user'] },
    { href: '/dashboard/languages', label: 'Languages', icon: FaLanguage, roles: ['admin'] },
    { href: '/dashboard/performance', label: 'Performance', icon: IoStatsChartSharp, roles: ['admin', 'restaurant_owner'] },
    { href: '/dashboard/reports', label: 'Reports', icon: MdReport, roles: ['admin'] },
    { href: '/dashboard/notifications', label: 'Notifications', icon: IoNotifications, roles: ['admin', 'restaurant_owner', 'chef', 'waiter', 'delivery', 'user'] },
  ];

  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(session?.user?.role || 'user')
  );

  // The rest of your component remains exactly the same...
  return (
    <div className={`bg-white shadow-lg fixed left-0 top-24 bottom-0 transition-all duration-300 flex flex-col z-40 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header  */}
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