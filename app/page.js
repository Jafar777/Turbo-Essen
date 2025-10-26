// app/page.js
"use client";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import HomepageHero from "../components/HomepageHero";
import FoodAnimation from "../components/FoodAnimation";
import OrderNow from "../components/OrderNow"; // Add this import
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

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
          <section id="order-now"> 
          <  OrderNow />
          </section>
          
          {/* Placeholder sections for navigation */}

          <section id="pricing" className="min-h-screen bg-gray-50 pt-16">
            <Pricing />
          </section>
          <section id="contacts" className="min-h-screen bg-white pt-16">
            <Contact />
          </section>

        </main>
        <Footer />
      </div>
  );
}

export default HomeContent;