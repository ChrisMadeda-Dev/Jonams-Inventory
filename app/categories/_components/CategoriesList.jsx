"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Laptop, Shirt, Home, Book, Footprints, Heart } from "lucide-react";

// Sample data to simulate a fetch from an API.
const sampleCategories = [
  { name: "Electronics", itemCount: 124, icon: Laptop },
  { name: "Apparel", itemCount: 78, icon: Shirt },
  { name: "Home Goods", itemCount: 215, icon: Home },
  { name: "Books", itemCount: 301, icon: Book },
  { name: "Sporting Goods", itemCount: 56, icon: Footprints },
  { name: "Health & Wellness", itemCount: 99, icon: Heart },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function CategoriesList() {
  const handleCardClick = (categoryName) => {
    // In a real application, this would navigate to a new page.
    // Here, we'll just log the action to the console.
    console.log(`Navigating to items in ${categoryName.toLowerCase()}`);
  };

  return (
    <motion.div
      className="p-4 md:p-8 min-h-screen bg-white text-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sampleCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <motion.div
              key={category.name}
              className="bg-gray-100 p-6 rounded-xl shadow-md cursor-pointer
                         hover:scale-[1.02] hover:shadow-lg transition-all duration-300 transform
                         flex flex-col items-center justify-center text-center space-y-3"
              variants={itemVariants}
              onClick={() => handleCardClick(category.name)}
            >
              <div className="text-blue-700">
                <IconComponent className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mt-2">
                {category.name}
              </h3>
              <p className="text-sm text-gray-600">
                ({category.itemCount} items)
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
