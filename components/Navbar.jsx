// components/Navbar.jsx
"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { IoMenu } from "react-icons/io5";
import { AiOutlineDashboard } from "react-icons/ai";
import { FaSignOutAlt } from "react-icons/fa";
import { FaLanguage } from 'react-icons/fa6'; // Add this import
import { FaCartShopping } from 'react-icons/fa6'; // Add this import
import { useLanguage } from "@/context/LanguageContext";
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

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

  const isDashboard = pathname?.startsWith('/dashboard');

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
    { id: "order-now", label: "Order Now", href: "/#order-now" }, // New Order Now link
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
              <Image
                src="/logo.png"
                alt="TurboEssen Logo"
                fill
                className="object-contain"
              />
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
            {/* Language Selector with Icon */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-black/10 transition-colors"
              >
                <FaLanguage className="w-4 h-4" /> {/* Added language icon */}
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

                    {/* Cart Link - Added below Dashboard */}
                    <Link
                      href="/dashboard/cart"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FaCartShopping className="w-4 h-4 mr-3" />
                      Cart
                    </Link>
                    
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
        } overflow-hidden bg-white shadow-lg`}> {/* Added bg-white and shadow */}
          <div className="py-4 space-y-4">
            {/* Mobile Navigation Links with Black Text */}
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block w-full text-left capitalize font-medium text-gray-900 hover:text-red-600 hover:bg-amber-200 transition-colors py-2 px-4" // Added text-gray-900 and px-4
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Mobile Language Selector */}
            <div className="pt-4 border-t border-gray-200 px-4"> {/* Added px-4 */}
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
              <div className="px-4"> {/* Added px-4 container */}
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