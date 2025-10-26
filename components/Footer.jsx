// components/Footer.jsx
import Link from 'next/link';
import Image from "next/image";

import { 
  FiMail, 
  FiPhone, 
  FiMapPin,
  FiTwitter,
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiYoutube,
  FiArrowUp
} from 'react-icons/fi';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerSections = {
    company: {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Careers', href: '/careers' },
        { name: 'Press', href: '/press' },
        { name: 'Blog', href: '/blog' },
        { name: 'Partners', href: '/partners' }
      ]
    },
    products: {
      title: 'Products',
      links: [
        { name: 'For Restaurants', href: '/restaurants' },
        { name: 'For Delivery', href: '/delivery' },
        { name: 'For Customers', href: '/customers' },
        { name: 'Pricing', href: '/#pricing' },
        { name: 'Features', href: '/#features' }
      ]
    },
    support: {
      title: 'Support',
      links: [
        { name: 'Help Center', href: '/help' },
        { name: 'Contact Us', href: '/#contacts' },
        { name: 'API Documentation', href: '/api' },
        { name: 'System Status', href: '/status' },
        { name: 'Community', href: '/community' }
      ]
    },
    legal: {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Cookie Policy', href: '/cookies' },
        { name: 'GDPR', href: '/gdpr' },
        { name: 'Security', href: '/security' }
      ]
    }
  };

  const socialLinks = [
    { icon: FiTwitter, href: 'https://twitter.com/turboessen', name: 'Twitter' },
    { icon: FiFacebook, href: 'https://facebook.com/turboessen', name: 'Facebook' },
    { icon: FiInstagram, href: 'https://instagram.com/turboessen', name: 'Instagram' },
    { icon: FiLinkedin, href: 'https://linkedin.com/company/turboessen', name: 'LinkedIn' },
    { icon: FiYoutube, href: 'https://youtube.com/turboessen', name: 'YouTube' }
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-6">
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
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                TurboEssen
              </span>
            </Link>
            
            <p className="text-gray-300 mb-6 text-lg leading-relaxed">
              Revolutionizing food delivery with cutting-edge technology and 
              unparalleled service for restaurants, delivery drivers, and food lovers.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <FiMail className="w-5 h-5 text-amber-400 mr-3" />
                <a href="mailto:info@turboessen.com" className="hover:text-amber-400 transition-colors">
                  info@turboessen.com
                </a>
              </div>
              <div className="flex items-center text-gray-300">
                <FiPhone className="w-5 h-5 text-amber-400 mr-3" />
                <a href="tel:+15551234567" className="hover:text-amber-400 transition-colors">
                  +1 (555) 123-4567
                </a>
              </div>
              <div className="flex items-center text-gray-300">
                <FiMapPin className="w-5 h-5 text-amber-400 mr-3" />
                <span>Germany, Berlin, 12345</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerSections).map(([key, section]) => (
            <div key={key}>
              <h3 className="font-semibold text-white mb-4 text-lg">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href}
                      className="text-gray-300 hover:text-amber-400 transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-gray-400">
              <p>&copy; {new Date().getFullYear()} TurboEssen. All rights reserved.</p>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 hover:bg-amber-500 hover:text-white transition-all duration-200 transform hover:scale-110"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* Back to Top */}
            <button
              onClick={scrollToTop}
              className="flex items-center space-x-2 text-gray-300 hover:text-amber-400 transition-colors group"
            >
              <span>Back to Top</span>
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                <FiArrowUp className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile App CTA */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-t border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Get the TurboEssen App
              </h3>
              <p className="text-gray-300">
                Download our mobile app for the best experience
              </p>
            </div>
            <div className="flex space-x-4">
              <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors font-semibold">
                App Store
              </button>
              <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors font-semibold">
                Google Play
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}