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
        {/* The brand or logo section, now a clickable link to the dashboard. */}
        <a href="/dashboard" className="text-xl font-bold">
          Jonams
        </a>

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
            {isOpen ? (
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
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
            )}
          </button>
        </div>
      </div>

      {/* The collapsible mobile menu. Now a full-screen overlay. */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-white p-6 z-50 flex flex-col items-center justify-center">
          {/* Close button at the top right of the full-screen menu */}
          <button
            onClick={toggleMenu}
            className="absolute top-4 right-4 text-gray-600 hover:text-blue-600"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="space-y-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block w-full text-center text-3xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
                onClick={toggleMenu} // Close menu on link click
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
