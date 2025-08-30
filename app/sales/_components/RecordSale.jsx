"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, XCircle } from "lucide-react";
import {
  doc,
  runTransaction,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebase.client";

const RecordSale = ({
  isOpen,
  onClose,
  userId,
  items,
  onMessage,
  onLoading,
}) => {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantitySold, setQuantitySold] = useState("");

  useEffect(() => {
    if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  const handleSale = async (e) => {
    e.preventDefault();
    if (!userId) {
      onMessage({
        message: "User not authenticated. Please wait a moment and try again.",
        type: "error",
      });
      return;
    }

    const selectedItem = items.find((item) => item.id === selectedItemId);
    const quantity = parseInt(quantitySold, 10);

    if (quantity <= 0 || !selectedItem || isNaN(quantity)) {
      onMessage({
        message: "Please select an item and enter a valid quantity.",
        type: "error",
      });
      return;
    }

    const itemRef = doc(db, "users", userId, "items", selectedItem.id);
    onLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists()) {
          throw new Error("Item does not exist!");
        }

        const currentQuantity = itemDoc.data().quantity;
        const newQuantity = currentQuantity - quantity;

        if (newQuantity < 0) {
          throw new Error(
            `Not enough stock. Only ${currentQuantity} ${selectedItem.name}(s) available.`
          );
        }

        transaction.update(itemRef, { quantity: newQuantity });

        const salesCollectionRef = collection(db, "users", userId, "sales");
        const newSaleRef = doc(salesCollectionRef);

        const itemPrice = selectedItem.sellingPrice || 0;
        const unitCost = selectedItem.buyingPrice || 0;
        const totalRevenue = quantity * itemPrice;
        const totalCost = quantity * unitCost;
        const profit = totalRevenue - totalCost;

        transaction.set(newSaleRef, {
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          quantity,
          price: itemPrice,
          totalRevenue,
          saleDate: serverTimestamp(),
          itemCategory: selectedItem.category || "Uncategorized",
          itemPrice,
          unitCost,
          totalCost,
          profit,
        });
      });

      onMessage({
        message: `Successfully recorded a sale of ${quantity} ${selectedItem.name}(s)!`,
        type: "success",
      });
      setQuantitySold("");
      onClose();
    } catch (error) {
      console.error("Transaction failed: ", error);
      onMessage({
        message: error.message.includes("Not enough stock")
          ? error.message
          : "An error occurred while recording the sale. Please try again.",
        type: "error",
      });
    } finally {
      onLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-40 font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle size={24} />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center space-x-2">
              <ShoppingCart className="text-blue-600" size={32} />
              <span>Record a New Sale</span>
            </h1>
            <form onSubmit={handleSale} className="space-y-6">
              <div>
                <label
                  htmlFor="item"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Item
                </label>
                <select
                  id="item"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="block w-full px-4 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl border-2 transition-colors"
                  required
                >
                  {items.length > 0 ? (
                    items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.quantity} in stock) - KSh
                        {item.sellingPrice}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No items available
                    </option>
                  )}
                </select>
              </div>
              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Quantity Sold
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantitySold}
                  onChange={(e) => setQuantitySold(e.target.value)}
                  className="block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-full shadow-md hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Record Sale
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RecordSale;
