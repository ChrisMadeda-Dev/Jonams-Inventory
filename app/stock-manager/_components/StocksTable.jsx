"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  XCircle,
  CheckCircle,
  Edit,
  Loader2,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebase.client";

// UpdateModal component defined inside Stocks.jsx
const UpdateModal = ({ item, onClose, onUpdate, categories }) => {
  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    buyingPrice: item.buyingPrice,
    sellingPrice: item.sellingPrice,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdate(item.id, formData);
      onClose();
    } catch (error) {
      console.error("Failed to update item:", error);
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 font-sans">
            Update Item
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle size={28} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 font-sans">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-50 font-sans"
              required
              disabled={isUpdating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-sans">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-50 font-sans"
              required
              disabled={isUpdating}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-sans">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-50 font-sans"
              required
              disabled={isUpdating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-sans">
              Buying Price
            </label>
            <input
              type="number"
              name="buyingPrice"
              value={formData.buyingPrice}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-50 font-sans"
              step="0.01"
              required
              disabled={isUpdating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 font-sans">
              Selling Price
            </label>
            <input
              type="number"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-50 font-sans"
              step="0.01"
              required
              disabled={isUpdating}
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-orange-700 hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors font-sans"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Updating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2" size={20} /> Update
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const Stockstable = ({ user, onUpdate, onDelete }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribes = [];
    let itemsLoaded = false;
    let categoriesLoaded = false;

    const checkLoadingStatus = () => {
      if (itemsLoaded && categoriesLoaded) {
        setIsLoading(false);
      }
    };

    const unsubscribeItems = onSnapshot(
      collection(db, "users", user.uid, "items"),
      (snapshot) => {
        const itemsData = [];
        snapshot.docs.forEach((doc) => {
          itemsData.push({ id: doc.id, ...doc.data() });
        });
        setItems(itemsData);
        itemsLoaded = true;
        checkLoadingStatus();
      },
      (error) => {
        console.error("Error fetching items:", error);
      }
    );

    const unsubscribeCategories = onSnapshot(
      collection(db, "users", user.uid, "categories"),
      (snapshot) => {
        const cats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(cats);
        categoriesLoaded = true;
        checkLoadingStatus();
      },
      (error) => {
        console.error("Error fetching categories:", error);
      }
    );

    unsubscribes.push(unsubscribeItems, unsubscribeCategories);

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  // Sort and filter logic
  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const filteredStocks = sortedItems.filter(
    (stock) =>
      (selectedCategory === "All" || stock.category === selectedCategory) &&
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStocks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 font-sans">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search for an item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-sans"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto py-3 px-4 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-sans"
        >
          <option value="All">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full overflow-x-auto shadow-lg rounded-xl font-sans">
        <table className="min-w-full bg-white rounded-xl">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="py-3 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                Product Name
              </th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                Category
              </th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                Buying Price
              </th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                Selling Price
              </th>
              <th className="py-3 px-4 text-center font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {currentItems.map((stock) => (
                <motion.tr
                  key={stock.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <td className="py-3 px-4 text-gray-800 font-medium">
                    {stock.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{stock.category}</td>
                  <td className="py-3 px-4 text-gray-600">{stock.quantity}</td>
                  <td className="py-3 px-4 text-orange-600 font-bold">
                    KSh: {stock.buyingPrice}
                  </td>
                  <td className="py-3 px-4 text-green-600 font-bold">
                    KSh: {stock.sellingPrice}
                  </td>
                  <td className="py-3 px-4 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setSelectedItem(stock)}
                      className="p-2 bg-orange-500 text-white rounded-full shadow-sm hover:bg-orange-600 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(stock.id, stock.name)}
                      className="p-2 bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="flex justify-center items-center space-x-2 mt-6 font-sans">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="py-2 px-4 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`py-2 px-4 rounded-full font-medium transition-colors ${
                currentPage === index + 1
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="py-2 px-4 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </nav>
      )}
      <AnimatePresence>
        {selectedItem && (
          <UpdateModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onUpdate={onUpdate}
            categories={categories}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Stockstable;
