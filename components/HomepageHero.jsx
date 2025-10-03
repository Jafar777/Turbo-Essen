// components/HomepageHero.jsx
"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HomepageHero() {
  const router = useRouter();

  const handleSignUp = () => {
    router.push("/signup");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/homepagehero.png"
          alt="Turbo Essen Background"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay for better text readability */}
      
      </div>

 

     

      {/* Hero content */}
      <div className="text-center z-20 px-4 relative">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 font-['Inter']">
          Turbo Essen
        </h1>
        <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
          Discover the best restaurants and enjoy delicious food delivered to your doorstep
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Add your restaurant button */}
          <button
            onClick={handleSignUp}
            className="px-8 py-4 rounded-full font-roboto font-semibold text-lg transition-all duration-300 hover:scale-105 bg-[#ff6200] text-white hover:shadow-lg hover:shadow-[#FDFBD4]/20 border-2 border-[#FDFBD4]"
          >
            Add your restaurant
          </button>
          
          {/* Order Food button */}
          <button
            onClick={handleSignUp}
            className="px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 bg-white text-gray-800 hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20 border-2 border-white"
          >
            Order Food Now
          </button>
        </div>
      </div>
    </section>
  );
}