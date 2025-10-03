// Enhanced version with Framer Motion
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

  return (
    <div className="absolute top-0 left-0 w-80 h-80 pointer-events-none z-20">
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
            className="absolute w-80 h-80"
          >
            <Image
              src={foodImages[currentIndex]}
              alt="Food item"
              width={228}
              height={228}
              className="object-cover rounded-full "
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}