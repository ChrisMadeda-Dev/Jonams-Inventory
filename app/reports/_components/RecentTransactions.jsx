"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Edit,
  Trash2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/firebase/firebase.client";
import { onAuthStateChanged } from "firebase/auth";

// Date formatting helpers
const formatDate = (date) => {
  if (!date) return "N/A";
  return format(new Date(date), "MMM dd, yyyy");
};

const formatTime = (date) => {
  if (!date) return "N/A";
  return format(new Date(date), "HH:mm");
};

const RecentTransactions = ({ salesData }) => {
  const [editingSale, setEditingSale] = useState(null);
  const [editingSaleForm, setEditingSaleForm] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModal] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Update form state when a sale is selected for editing
  useEffect(() => {
    if (editingSale) {
      // Check if saleDate is a Firestore Timestamp before converting
      const saleDate =
        editingSale.saleDate &&
        typeof editingSale.saleDate.toDate === "function"
          ? editingSale.saleDate.toDate()
          : editingSale.saleDate;

      setEditingSaleForm({
        ...editingSale,
        saleDate: saleDate || new Date(),
        // Calculate itemCost if not already present, for new dynamic calculation
        itemCost:
          editingSale.totalCost && editingSale.quantity
            ? editingSale.totalCost / editingSale.quantity
            : 0,
      });
    }
  }, [editingSale]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;

    // Convert string inputs to numbers for quantity, price, and cost
    if (name === "quantity" || name === "itemPrice" || name === "itemCost") {
      newValue = parseFloat(value) || 0;
    }

    setEditingSaleForm((prev) => ({ ...prev, [name]: newValue }));
  };

  // Calculate new total revenue, total cost, and profit based on form changes
  useEffect(() => {
    if (
      editingSaleForm.quantity !== undefined &&
      editingSaleForm.itemPrice !== undefined &&
      editingSaleForm.itemCost !== undefined
    ) {
      const newRevenue = editingSaleForm.quantity * editingSaleForm.itemPrice;
      const newCost = editingSaleForm.quantity * editingSaleForm.itemCost;
      const newProfit = newRevenue - newCost;

      setEditingSaleForm((prev) => ({
        ...prev,
        totalRevenue: newRevenue,
        totalCost: newCost,
        profit: newProfit,
      }));
    }
  }, [
    editingSaleForm.quantity,
    editingSaleForm.itemPrice,
    editingSaleForm.itemCost,
  ]);

  // Handle edit click
  const handleEditClick = (sale) => {
    setEditingSale(sale);
    setIsEditModalOpen(true);
  };

  // Handle update action
  const handleUpdate = async () => {
    if (!userId || !editingSale || !editingSaleForm.id) {
      console.error("User or sale data missing for update.");
      return;
    }
    const saleRef = doc(db, "users", userId, "sales", editingSaleForm.id);
    try {
      await updateDoc(saleRef, {
        itemName: editingSaleForm.itemName,
        itemCategory: editingSaleForm.itemCategory,
        quantity: editingSaleForm.quantity,
        itemPrice: editingSaleForm.itemPrice,
        totalRevenue: editingSaleForm.totalRevenue,
        totalCost: editingSaleForm.totalCost,
        profit: editingSaleForm.profit,
        itemCost: editingSaleForm.itemCost, // Save the new itemCost to Firestore
      });
      setIsEditModalOpen(false);
      setEditingSale(null);
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  // Handle delete confirmation click
  const handleDeleteClick = (sale) => {
    setSaleToDelete(sale);
    setIsDeleteModal(true);
  };

  // Handle delete action
  const confirmDelete = async () => {
    if (!userId || !saleToDelete) {
      console.error("User or sale data missing for delete.");
      return;
    }
    const saleRef = doc(db, "users", userId, "sales", saleToDelete.id);
    try {
      await deleteDoc(saleRef);
      setIsDeleteModal(false);
      setSaleToDelete(null);
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  // Sort the sales data by date in descending order
  const sortedSales = [...salesData].sort((a, b) => {
    const dateA =
      a.saleDate && typeof a.saleDate.toDate === "function"
        ? a.saleDate.toDate()
        : new Date(0);
    const dateB =
      b.saleDate && typeof b.saleDate.toDate === "function"
        ? b.saleDate.toDate()
        : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSales = sortedSales.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">
          Recent Transactions 🛒
        </h2>
        <span className="text-sm text-gray-500">
          {salesData.length.toLocaleString()} total transactions
        </span>
      </div>
      {currentSales.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">
                  Time
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">
                  Item
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-500">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-500">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-500">
                  Cost
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-500">
                  Profit
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-gray-800">
                    {sale.saleDate ? formatDate(sale.saleDate) : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {sale.saleDate ? formatTime(sale.saleDate) : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-[150px]">
                    {sale.itemName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {sale.itemCategory || "Uncategorized"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{sale.quantity}</td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    KSh{sale.itemPrice?.toFixed(2) || "0.00"}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-green-600">
                    KSh{(sale.totalRevenue || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    KSh{(sale.totalCost || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-blue-600">
                    KSh{(sale.profit || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEditClick(sale)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(sale)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 text-lg">
          <FileText className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          <p>No sales data available for this period.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 flex justify-end items-center space-x-2 border-t border-gray-100">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingSaleForm && (
          <motion.div
            className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Edit Sale Record
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate();
                }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="itemName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Item Name
                  </label>
                  <input
                    type="text"
                    id="itemName"
                    name="itemName"
                    value={editingSaleForm.itemName || ""}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="itemCategory"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category
                  </label>
                  <input
                    type="text"
                    id="itemCategory"
                    name="itemCategory"
                    value={editingSaleForm.itemCategory || ""}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={editingSaleForm.quantity || ""}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="itemPrice"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Unit Price
                  </label>
                  <input
                    type="number"
                    id="itemPrice"
                    name="itemPrice"
                    value={editingSaleForm.itemPrice || ""}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="itemCost"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Unit Cost
                  </label>
                  <input
                    type="number"
                    id="itemCost"
                    name="itemCost"
                    value={editingSaleForm.itemCost || ""}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium">
                    Calculated Revenue:
                  </span>
                  <span className="font-bold text-green-600">
                    KSh{(editingSaleForm.totalRevenue || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium">
                    Calculated Cost:
                  </span>
                  <span className="font-bold text-gray-600">
                    KSh{(editingSaleForm.totalCost || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium">
                    Calculated Profit:
                  </span>
                  <span className="font-bold text-blue-600">
                    KSh{(editingSaleForm.profit || 0).toFixed(2)}
                  </span>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && saleToDelete && (
          <motion.div
            className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDeleteModal(false)}
          >
            <motion.div
              className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <Info size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Confirm Deletion
                </h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete the sale of "
                  {saleToDelete.itemName}"? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4 w-full">
                  <button
                    onClick={() => setIsDeleteModal(false)}
                    className="w-1/2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="w-1/2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecentTransactions;
