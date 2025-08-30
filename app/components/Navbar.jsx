"use client";
import React, { useState } from "react";

/**
 * A responsive Navbar component that uses an array to dynamically render navigation links.
 * This approach makes the component more scalable and easier to maintain.
 */
export default function Navbar() {
  // State to manage the visibility of the mobile menu.
  const [isOpen, setIsOpen] = useState(false);

  // Array containing all the navigation links. Each object has a name and its href.
  // This is the single source of truth for all links.
  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Sales", href: "/sales" },
    { name: "Stock Manager", href: "/stock-manager" },
    { name: "Reports", href: "/reports" },
  ];

  // Function to toggle the mobile menu's open state.
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    // The main navigation container. It uses a clean white background,
    // a subtle shadow, and the specified font-sans style.
    <nav className="bg-white border-b border-gray-300 p-4 shadow-md font-sans">
      <div className="container mx-auto flex justify-between items-center">
        {/* The brand or logo section, styled with a bold blue color. */}
        <div className="text-xl font-bold">Jonams</div>

        {/* The main navigation links, visible on medium screens and up.
            We map over the navLinks array to render the links dynamically. */}
        <div className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* The hamburger icon for mobile view. */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="text-gray-600 hover:text-blue-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* The collapsible mobile menu. It is conditionally rendered.
          We map over the same navLinks array for the mobile links. */}
      {isOpen && (
        <div className="md:hidden flex flex-col items-center mt-4 p-4 bg-gray-100 rounded-xl space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="block w-full text-center py-2 text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
