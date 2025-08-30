"use client";

import React from "react";
import { motion } from "framer-motion";
import { Edit, Trash2 } from "lucide-react";

// Date formatting helpers
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const date =
    timestamp instanceof Date ? timestamp : new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (timestamp) => {
  if (!timestamp) return "N/A";
  const date =
    timestamp instanceof Date ? timestamp : new Date(timestamp.seconds * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SalesTable = ({ salesRecords, onEdit, onDelete }) => {
  if (salesRecords.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-center py-10 text-gray-500 text-lg font-medium"
      >
        No sales records found for today.
      </motion.div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 font-sans rounded-3xl shadow-xl border border-gray-200 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Item
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Revenue
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              Profit
            </th>
            <th className="relative px-3 sm:px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {salesRecords.map((sale, index) => {
            return (
              <motion.tr
                key={sale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <p>{formatDate(sale.saleDate)}</p>
                  <p className="text-xs text-gray-400">
                    {formatTime(sale.saleDate)}
                  </p>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {sale.itemName}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sale.quantity}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  KSh {sale.price.toFixed(2)}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                  KSh {sale.totalRevenue.toFixed(2)}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                  KSh {sale.profit.toFixed(2)}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => onEdit(sale)}
                    className="text-purple-600 hover:text-purple-900 transition-colors"
                    title="Edit sale"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(sale)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title="Delete sale"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SalesTable;
