// app/page.js
"use client";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import HomepageHero from "../components/HomepageHero";
import FoodAnimation from "../components/FoodAnimation";
import OrderNow from "../components/OrderNow"; // Add this import

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
          
          {/* Use the new OrderNow component */}
          <OrderNow />
          
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