// Enhanced version with Framer Motion - RESPONSIVE
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const foodImages = ["/burger.png", "/pizza.png", "/ramen.png", "/stake.png", "/suchi.png"];

export default function FoodAnimation() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % foodImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Responsive variants for different screen sizes
  const circularVariants = {
    enter: {
      x: 400,
      y: -300,
      scale: 0.8,
      opacity: 0.9,
    },
    center: {
      x: 150,
      y: 200,
      scale: 1,
      opacity: 1,
    },
    exit: {
      x: -200,
      y: 300,
      scale: 1,
      opacity: 1,
    }
  };

  // Mobile variants
  const mobileCircularVariants = {
    enter: {
      x: 200,
      y: -150,
      scale: 0.6,
      opacity: 0.9,
    },
    center: {
      x: 50,
      y: 100,
      scale: 0.7,
      opacity: 1,
    },
    exit: {
      x: -100,
      y: 150,
      scale: 0.7,
      opacity: 1,
    }
  };

  return (
    <div className="absolute top-0 left-0 w-40 h-40 md:w-60 md:h-60 lg:w-80 lg:h-80 pointer-events-none z-20">
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            variants={circularVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 2,
              ease: "easeInOut"
            }}
            className="absolute w-full h-full"
            // Responsive animation variants
            custom={typeof window !== "undefined" ? window.innerWidth : 0}
            // Mobile breakpoint
            {...(typeof window !== "undefined" && window.innerWidth < 768 ? {
              variants: mobileCircularVariants
            } : {})}
          >
            <Image
              src={foodImages[currentIndex]}
              alt="Food item"
              fill
              className="object-cover rounded-full"
              sizes="(max-width: 768px) 160px, (max-width: 1024px) 240px, 320px"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}