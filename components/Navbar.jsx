// components/Navbar.jsx
"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { IoMenu } from "react-icons/io5";
import { AiOutlineDashboard } from "react-icons/ai";
import { FaSignOutAlt, FaBell } from "react-icons/fa";
import { FaLanguage } from 'react-icons/fa6'; 
import { FaCartShopping } from 'react-icons/fa6'; 
import { useLanguage } from "@/context/LanguageContext";
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(res => res.json());

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { currentLanguage, setLanguage } = useLanguage();
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const notificationRef = useRef(null);
  const cartRef = useRef(null);

  // Fetch notifications using SWR
  const { data: notificationData, mutate: mutateNotifications } = useSWR(
    session ? '/api/notifications' : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch cart data for users only
const { data: cartData, mutate: mutateCart } = useSWR(
  session && session.user?.role === 'user' ? '/api/cart' : null,
  fetcher,
  { 
    refreshInterval: 5000,
    // Add error handling and revalidation on focus
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  }
);


  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;
const cartItems = cartData?.items || [];
const cartTotal = cartData?.total || 0;
const cartItemCount = cartData?.itemCount || cartItems.reduce((total, item) => total + item.quantity, 0);

  
  const isDashboard = pathname?.startsWith('/dashboard');
  const isUser = session?.user?.role === 'user';

  useEffect(() => {
    // Only add scroll effect if not on dashboard
    if (!isDashboard) {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 50);
      };

      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    } else {
      // Static background for dashboard
      setIsScrolled(true);
    }
  }, [isDashboard]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
      mutateNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      });
      mutateNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity })
      });
      mutateCart();
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      mutateCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      await fetch('/api/cart', {
        method: 'DELETE'
      });
      mutateCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application_submitted':
        return '📋';
      case 'application_accepted':
        return '✅';
      case 'application_rejected':
        return '❌';
      case 'new_order':
        return '🛒';
      default:
        return '🔔';
    }
  };

  const getNotificationTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInHours = (now - created) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const languages = [
    { code: "en", name: "English", native: "English" },
    { code: "es", name: "Spanish", native: "Español" },
    { code: "fr", name: "French", native: "Français" },
    { code: "de", name: "German", native: "Deutsch" },
    { code: "ar", name: "Arabic", native: "العربية" }
  ];

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setIsLanguageOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Updated navItems with Order Now
  const navItems = [
    { id: "home", label: "Home", href: "/" },
    { id: "features", label: "Features", href: "/#features" },
    { id: "order-now", label: "Order Now", href: "/#order-now" },
    { id: "clients", label: "Our Clients", href: "/#clients" },
    { id: "pricing", label: "Pricing", href: "/#pricing" },
    { id: "contacts", label: "Contacts", href: "/#contacts" }
  ];

  // Determine navbar background and text colors
  const navbarBackground = isDashboard 
    ? "bg-white shadow-lg text-gray-800" 
    : isScrolled 
      ? "bg-white shadow-lg text-gray-800" 
      : "bg-transparent text-white";

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${navbarBackground}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <button
            onClick={scrollToTop}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-24 h-24 relative">
              <Link href="/">
              <Image
                src="/logo.png"
                alt="TurboEssen Logo"
                fill
                className="object-contain"
              />
              </Link>
            </div>
          </button>

          {/* Desktop Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="capitalize font-medium hover:text-red-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Cart Dropdown - Only for users */}
            {isUser && (
              <div className="relative" ref={cartRef}>
                <Menu>
                  <MenuButton className="relative p-2 rounded-lg hover:bg-black/10 transition-colors">
                    <FaCartShopping className="w-5 h-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemCount > 9 ? '9+' : cartItemCount}
                      </span>
                    )}
                  </MenuButton>
                  
                  <MenuItems 
                    anchor="bottom" 
                    className="w-96 bg-white rounded-lg shadow-xl border py-2 z-50 max-h-96 overflow-y-auto"
                  >
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Your Cart</h3>
                        {cartItemCount > 0 && (
                          <button 
                            onClick={clearCart}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {cartItemCount === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <FaCartShopping className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</p>
                        <p className="text-sm text-gray-600">Add some delicious items to get started!</p>
                        <Link 
                          href="/order-now"
                          className="inline-block mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          Browse Restaurants
                        </Link>
                      </div>
                    ) : (
                      <>
                        {/* Cart Items */}
                        <div className="max-h-64 overflow-y-auto">
                          {cartItems.map((item) => (
                            <MenuItem key={item._id}>
                              <div className="flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors">
                                {item.dishImage && (
                                  <img
                                    src={item.dishImage}
                                    alt={item.dishName}
                                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {item.dishName}
                                  </h4>
                                  <p className="text-sm text-gray-600">${item.price?.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">{item.restaurantName}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => updateCartItem(item._id, Math.max(0, item.quantity - 1))}
                                    className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                  >
                                    <span className="text-xs">-</span>
                                  </button>
                                  <span className="text-sm font-medium w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateCartItem(item._id, item.quantity + 1)}
                                    className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                  >
                                    <span className="text-xs">+</span>
                                  </button>
                                  <button
                                    onClick={() => removeFromCart(item._id)}
                                    className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </MenuItem>
                          ))}
                        </div>

                        {/* Cart Summary */}
                        <div className="border-t border-gray-200 p-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold text-gray-900">Total:</span>
                            <span className="text-lg font-bold text-amber-600">${cartTotal?.toFixed(2)}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              href="/dashboard/cart"
                              className="flex-1 bg-amber-500 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-amber-600 transition-colors"
                            >
                              View Cart
                            </Link>

                          </div>
                        </div>
                      </>
                    )}
                  </MenuItems>
                </Menu>
              </div>
            )}

            {/* Notifications Dropdown */}
            {session && (
              <div className="relative" ref={notificationRef}>
                <Menu>
                  <MenuButton className="relative p-2 rounded-lg hover:bg-black/10 transition-colors">
                    <FaBell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </MenuButton>
                  
                  <MenuItems 
                    anchor="bottom" 
                    className="w-80 bg-white rounded-lg shadow-lg border py-2 z-50 max-h-96 overflow-y-auto"
                  >
                    <div className="px-4 py-2 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <MenuItem key={notification._id}>
                          <div 
                            className={`block w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => markAsRead(notification._id)}
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {getNotificationTime(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </MenuItem>
                      ))
                    )}
                    
                    <div className="px-4 py-2 border-t border-gray-200">
                      <Link 
                        href="/dashboard/notifications"
                        className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View all notifications
                      </Link>
                    </div>
                  </MenuItems>
                </Menu>
              </div>
            )}

            {/* Language Selector with Icon */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-black/10 transition-colors"
              >
                <FaLanguage className="w-4 h-4" />
                <span className="text-sm">
                  {languages.find(lang => lang.code === currentLanguage)?.native}
                </span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span>{lang.native}</span>
                        <span className="text-xs text-gray-400">{lang.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile or Login Button */}
            {session ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-black/10 transition-colors"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {session.user?.firstName?.[0]}{session.user?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium">
                      {session.user?.firstName} {session.user?.lastName}
                    </p>
                    <p className="text-xs opacity-75">{session.user?.email}</p>
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-50">
                    {/* Dashboard Link */}
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <AiOutlineDashboard className="w-4 h-4 mr-3" />
                      Dashboard
                    </Link>

                    {/* Cart Link - Only for users */}
                    {isUser && (
                      <Link
                        href="/dashboard/cart"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <FaCartShopping className="w-4 h-4 mr-3" />
                        Cart ({cartItemCount})
                      </Link>
                    )}
                    
                    {/* Sign Out Button */}
                    <button
                      onClick={() => {
                        signOut();
                        setIsProfileOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FaSignOutAlt className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Login Button - Hidden on mobile */
              <button 
                onClick={() => router.push('/auth/signin')}
                className="hidden sm:block px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Login
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-black/10 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <IoMenu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu with White Background and Black Text */}
        <div className={`md:hidden transition-all duration-300 ease-in-out rounded-b-2xl ${
          isMobileMenuOpen ? " opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden bg-white shadow-lg`}>
          <div className="py-4 space-y-4">
            {/* Mobile Navigation Links with Black Text */}
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block w-full text-left capitalize font-medium text-gray-900 hover:text-red-600 hover:bg-amber-200 transition-colors py-2 px-4"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Mobile Language Selector */}
            <div className="pt-4 border-t border-gray-200 px-4">
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      currentLanguage === lang.code
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {lang.code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Login Button - Only show if not logged in */}
            {!session && (
              <div className="px-4">
                <button 
                  onClick={() => {
                    router.push('/auth/signin');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-red-600 font-medium hover:text-red-700 transition-colors"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}