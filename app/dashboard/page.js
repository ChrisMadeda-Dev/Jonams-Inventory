"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  BarChart,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

import { db, auth } from "@/firebase/firebase.client";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

/**
 * A functional component for the main dashboard page.
 * It provides a central hub for navigating the application and viewing key metrics.
 * The layout is split into two main sections for alerts and statistics.
 */
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    itemsSold: 0,
    totalProfit: 0,
  });
  const [dailySales, setDailySales] = useState([]);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    if (!auth || !db) {
      setError("Firebase client not found. Please check firebase.client.js");
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Listener for low stock items, now looking in the 'items' collection and 'quantity' field
        const lowStockQuery = query(
          collection(db, "users", currentUser.uid, "items"),
          where("quantity", "<=", 20)
        );

        const unsubscribeStock = onSnapshot(
          lowStockQuery,
          (snapshot) => {
            const items = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setLowStockItems(items);
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching low stock data:", err);
            setError("Failed to load low stock alerts.");
            setLoading(false);
          }
        );

        // Calculate the date for one month ago (for total stats)
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const startDateTimestamp = Timestamp.fromDate(oneMonthAgo);

        // Calculate the date for two days ago (for daily list)
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const dailyListDateTimestamp = Timestamp.fromDate(twoDaysAgo);

        // Listener for all sales data from the last 30 days
        const salesQuery = query(
          collection(db, "users", currentUser.uid, "sales"),
          where("saleDate", ">=", startDateTimestamp)
        );

        const unsubscribeSales = onSnapshot(
          salesQuery,
          (snapshot) => {
            let totalRevenue = 0;
            let itemsSold = 0;
            let totalProfit = 0;
            const dailySalesMap = {};

            snapshot.docs.forEach((doc) => {
              const sale = doc.data();
              totalRevenue += sale.totalRevenue || 0;
              itemsSold += sale.quantity || 0;
              totalProfit += sale.profit || 0;

              // Aggregate daily sales only for the last 2 days
              const saleDate = sale.saleDate;
              if (
                saleDate &&
                saleDate.toDate() >= dailyListDateTimestamp.toDate()
              ) {
                const dateString = saleDate
                  .toDate()
                  .toISOString()
                  .split("T")[0];
                dailySalesMap[dateString] =
                  (dailySalesMap[dateString] || 0) + (sale.totalRevenue || 0);
              }
            });

            // Sort the daily sales data by date, descending
            const sortedDailySales = Object.entries(dailySalesMap).sort(
              ([dateA], [dateB]) => new Date(dateB) - new Date(dateA)
            );

            setSalesStats({
              totalSales: totalRevenue,
              itemsSold: itemsSold,
              totalProfit: totalProfit,
            });
            // Update the state with the sorted array
            setDailySales(sortedDailySales);
          },
          (err) => {
            console.error("Error fetching sales data:", err);
            setError("Failed to load sales statistics.");
          }
        );

        // Return a cleanup function for both listeners
        return () => {
          unsubscribeStock();
          unsubscribeSales();
        };
      } else {
        console.log("No authenticated user found. Redirecting to auth page.");
        window.location.href = "/";
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(lowStockItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = lowStockItems.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full text-center border border-gray-100">
          <div className="flex justify-center mb-4 text-red-500">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 font-sans">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center p-8 bg-gray-50 md:min-h-[90svh] font-sans">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-7xl"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-sans text-gray-900 mb-12 md:p-8 sm:p-4 text-center">
          Dashboard Overview
        </h1>

        {/* Navigation Buttons Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {/* Record Sale Button */}
          <motion.a
            href="/sales"
            className="flex items-center justify-center p-6 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingCart className="w-6 h-6 mr-3" />
            <span className="font-semibold">Record Sale</span>
          </motion.a>

          {/* Manage Stock Button */}
          <motion.a
            href="/stock-manager" // Placeholder link
            className="flex items-center justify-center p-6 bg-gray-700 text-white rounded-xl shadow-lg hover:bg-gray-800 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Package className="w-6 h-6 mr-3" />
            <span className="font-semibold">Manage Stock</span>
          </motion.a>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Low Stock Alerts Section */}
          <motion.div
            // FIX 1: Add 'relative' to allow absolute positioning of children.
            // FIX 2: Adjust padding to create space for the fixed pagination.
            className="bg-white px-6 pt-6 pb-20 rounded-2xl shadow-xl border border-gray-200 relative"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="text-yellow-500 w-6 h-6 mr-2" />
              Low Stock Alerts
            </h2>
            {/* Conditional rendering for low stock items with pagination */}
            {lowStockItems.length > 0 ? (
              <>
                <ul className="space-y-4">
                  {paginatedItems.map((item) => (
                    <li
                      key={item.id}
                      className="bg-yellow-50 p-4 rounded-xl flex justify-between items-center border border-yellow-200"
                    >
                      <span className="font-medium text-gray-700">
                        {item.name}
                      </span>
                      <span className="text-sm font-semibold text-yellow-800">
                        {item.quantity || 0} in stock
                      </span>
                    </li>
                  ))}
                </ul>
                {/* Pagination Controls */}
                {lowStockItems.length > itemsPerPage && (
                  // FIX 3: Use absolute positioning to fix the div to the bottom.
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-white border-t border-gray-200">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">
                <p>All items are sufficiently stocked. 😊</p>
              </div>
            )}
          </motion.div>

          {/* Sales Statistics Section */}
          <motion.div
            className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <BarChart className="text-blue-500 w-6 h-6 mr-2" />
              Sales Statistics (Last 30 Days)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total Sales Card */}
              <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">Total Sales</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  KSh{salesStats.totalSales.toFixed(2)}
                </p>
              </div>
              {/* Items Sold Card */}
              <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">Items Sold</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {salesStats.itemsSold}
                </p>
              </div>
              {/* Total Profit Card */}
              <div className="bg-green-50 p-4 rounded-xl text-center border border-green-200">
                <p className="text-sm text-green-800 font-medium">
                  Total Profit
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  KSh{salesStats.totalProfit.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Daily Sales Chart Placeholder */}
            {dailySales.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <TrendingUp className="text-cyan-500 w-5 h-5 mr-2" /> Daily
                  Sales (Last 2 Days)
                </h3>
                <ul className="space-y-2">
                  {dailySales.map(([date, sales]) => (
                    <li
                      key={date}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-md"
                    >
                      <span className="text-sm font-medium text-gray-600">
                        {date}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        KSh{sales.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
