// app/page.js
"use client";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import HomepageHero from "../components/HomepageHero";
import FoodAnimation from "../components/FoodAnimation";

function HomeContent() {
  useEffect(() => {
    // Smooth scroll polyfill for older browsers
    if (typeof window !== "undefined") {
      require("smoothscroll-polyfill").polyfill();
    }
  }, []);

  return (
      <div className="font-['Inter']">
        <Navbar />
        <main>
          <HomepageHero />
          <FoodAnimation />
          
          {/* Order Now Section - Added new section */}
          <section id="order-now" className="min-h-screen bg-white pt-16">
            <div className="max-w-4xl mx-auto px-4 py-16">
              <h2 className="text-4xl font-bold text-center text-gray-900 mb-8">
                Order Now
              </h2>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-lg text-gray-600 text-center mb-8">
                  Place your order and enjoy our delicious meals delivered to your doorstep.
                </p>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-gray-800">Quick Order</h3>
                    <p className="text-gray-600">
                      Browse our menu and place your order in just a few clicks.
                    </p>
                    <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors">
                      View Menu
                    </button>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-gray-800">Delivery Info</h3>
                    <p className="text-gray-600">
                      Fast delivery within 30 minutes. Free delivery on orders over $25.
                    </p>
                    <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                      Order Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Placeholder sections for navigation */}
          <section id="features" className="min-h-screen bg-gray-50 pt-16"></section>
          <section id="clients" className="min-h-screen bg-white pt-16"></section>
          <section id="pricing" className="min-h-screen bg-gray-50 pt-16"></section>
          <section id="contacts" className="min-h-screen bg-white pt-16"></section>
        </main>
      </div>
  );
}

export default HomeContent;