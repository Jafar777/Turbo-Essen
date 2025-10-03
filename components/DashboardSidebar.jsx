// components/DashboardSidebar.jsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TbLayoutSidebarRightCollapse, TbLayoutSidebarLeftCollapse } from 'react-icons/tb';
import { FaHome } from 'react-icons/fa';
import { MdManageAccounts } from 'react-icons/md';
import { HiMiniUsers } from 'react-icons/hi2';
import { IoRestaurantSharp } from 'react-icons/io5';
import { FaCartShopping } from 'react-icons/fa6';
import { LuPackageSearch } from 'react-icons/lu';
import { MdOutlineRateReview } from 'react-icons/md';
import { FaLanguage } from 'react-icons/fa6';
import { FcSalesPerformance } from 'react-icons/fc';
import { MdReport } from 'react-icons/md';
import { IoNotifications } from 'react-icons/io5';

const DashboardSidebar = ({ isCollapsed, toggleSidebar }) => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Home', icon: FaHome },
    { href: '/dashboard/users', label: 'Users', icon: HiMiniUsers },
    { href: '/dashboard/account', label: 'User Settings', icon: MdManageAccounts },
    { href: '/dashboard/restaurants', label: 'Restaurant Management', icon: IoRestaurantSharp },
    { href: '/dashboard/cart', label: 'Cart', icon: FaCartShopping },
    { href: '/dashboard/orders', label: 'Orders', icon: LuPackageSearch },
    { href: '/dashboard/reviews', label: 'Reviews', icon: MdOutlineRateReview },
    { href: '/dashboard/languages', label: 'Languages', icon: FaLanguage },
    { href: '/dashboard/performance', label: 'Performance', icon: FcSalesPerformance },
    { href: '/dashboard/reports', label: 'Reports', icon: MdReport },
    { href: '/dashboard/notifications', label: 'Notifications', icon: IoNotifications },
  ];

  return (
    <div className={`bg-white shadow-lg fixed h-full transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b">
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

      {/* Navigation Menu with Scroll */}
      <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center p-3 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon 
                className={`flex-shrink-0 ${
                  isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                } ${item.label === 'Performance' ? '' : ''}`}
              />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
              
              {/* Tooltip for collapsed state */}
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