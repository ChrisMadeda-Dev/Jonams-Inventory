"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  PlusCircle,
  DollarSign,
  Package,
  Edit,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  serverTimestamp,
  runTransaction,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, db } from "@/firebase/firebase.client";
import SalesTable from "./_components/SalesTable";
import RecordSale from "./_components/RecordSale";

// Simple Loader component to display while content is loading
const Loader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

// EditSalesForm component
const EditSalesForm = ({
  isOpen,
  onClose,
  userId,
  items,
  editingSale,
  onMessage,
  onLoading,
}) => {
  const [selectedItemId, setSelectedItemId] = useState(
    editingSale?.itemId || ""
  );
  const [quantitySold, setQuantitySold] = useState(editingSale?.quantity || "");

  useEffect(() => {
    if (editingSale) {
      setSelectedItemId(editingSale.itemId);
      setQuantitySold(editingSale.quantity);
    }
  }, [editingSale]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!userId) {
      onMessage({
        message: "User not authenticated. Please wait a moment and try again.",
        type: "error",
      });
      return;
    }

    const newSelectedItem = items.find((item) => item.id === selectedItemId);
    const newQuantity = parseInt(quantitySold, 10);

    if (newQuantity <= 0 || !newSelectedItem || isNaN(newQuantity)) {
      onMessage({
        message: "Please select an item and enter a valid quantity.",
        type: "error",
      });
      return;
    }

    onLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const salesRef = doc(db, "users", userId, "sales", editingSale.id);
        const oldItemRef = doc(
          db,
          "users",
          userId,
          "items",
          editingSale.itemId
        );
        const newItemRef = doc(db, "users", userId, "items", selectedItemId);

        const oldItemDoc = await transaction.get(oldItemRef);
        if (!oldItemDoc.exists()) {
          throw new Error("Original item not found in inventory.");
        }

        const oldItemData = oldItemDoc.data();
        let newItemDoc, newItemData;

        if (editingSale.itemId !== selectedItemId) {
          newItemDoc = await transaction.get(newItemRef);
          if (!newItemDoc.exists()) {
            throw new Error("New item not found in inventory.");
          }
          newItemData = newItemDoc.data();
        } else {
          newItemDoc = oldItemDoc;
          newItemData = oldItemDoc.data();
        }

        const revertedQuantity = oldItemData.quantity + editingSale.quantity;
        transaction.update(oldItemRef, { quantity: revertedQuantity });

        const updatedQuantity = newItemData.quantity - newQuantity;
        if (updatedQuantity < 0) {
          throw new Error(
            `Cannot update. Not enough stock for the new quantity.`
          );
        }
        transaction.update(newItemRef, { quantity: updatedQuantity });

        const itemPrice = newSelectedItem.sellingPrice || 0;
        const unitCost = newSelectedItem.buyingPrice || 0;
        const totalRevenue = newQuantity * itemPrice;
        const totalCost = newQuantity * unitCost;
        const profit = totalRevenue - totalCost;

        transaction.update(salesRef, {
          itemId: newSelectedItem.id,
          itemName: newSelectedItem.name,
          quantity: newQuantity,
          price: itemPrice,
          totalRevenue,
          itemCategory: newSelectedItem.category || "Uncategorized",
          itemPrice,
          unitCost,
          totalCost,
          profit,
        });
      });

      onMessage({
        message: `Successfully updated the sale for ${newSelectedItem.name}!`,
        type: "success",
      });
      onClose();
    } catch (error) {
      console.error("Update transaction failed: ", error);
      onMessage({
        message: error.message.includes("Not enough stock")
          ? error.message
          : "An error occurred while updating the sale. Please try again.",
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
          className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-40 font-serif"
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
              <Edit className="text-purple-600" size={32} />
              <span>Edit Sale</span>
            </h1>
            <form onSubmit={handleUpdate} className="space-y-6">
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
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-full shadow-md hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Update Sale
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// MessageBox component
const MessageBox = ({ message, onClose, type, onConfirm, onCancel, title }) => {
  const isSuccess = type === "success";
  const isError = type === "error";
  const isConfirmation = type === "confirm";
  let icon;
  let iconColorClass;
  if (isSuccess) {
    icon = <CheckCircle size={48} />;
    iconColorClass = "text-green-500";
  } else if (isError) {
    icon = <AlertCircle size={48} />;
    iconColorClass = "text-red-500";
  } else if (isConfirmation) {
    icon = <AlertCircle size={48} />;
    iconColorClass = "text-orange-500";
  }
  return (
    <motion.div
      className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 font-serif"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center border border-gray-200"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex justify-center mb-4 ${iconColorClass}`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-800">
          {title || (isSuccess ? "Success!" : isError ? "Error" : "Confirm")}
        </h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          {isConfirmation && (
            <button
              onClick={onCancel}
              className="w-full py-2 px-4 rounded-full font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
            >
              Cancel
            </button>
          )}
          <button
            onClick={isConfirmation ? onConfirm : onClose}
            className={`w-full py-2 px-4 rounded-full font-semibold text-white ${
              isConfirmation
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            } transition-all duration-300 transform hover:scale-105`}
          >
            {isConfirmation ? "Delete" : "Close"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main App component
export default function Sales() {
  const [items, setItems] = useState([]);
  const [salesRecords, setSalesRecords] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [userId, setUserId] = useState(null);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [isDeleteAllConfirmationOpen, setIsDeleteAllConfirmationOpen] =
    useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  // Changed isLoading to false initially
  const [isLoading, setIsLoading] = useState(true);
  // Ref to track which data is loaded initially
  const loadedRefs = useRef({ items: false, sales: false });

  const showMessage = (msg) => {
    setStatusMessage(msg);
    setIsModalOpen(true);
  };

  const handleEditClick = (sale) => {
    setEditingSale({
      id: sale.id,
      itemId: sale.itemId,
      itemName: sale.itemName,
      quantity: sale.quantity,
      price: sale.price,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (sale) => {
    setSaleToDelete(sale);
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!saleToDelete || !userId) return;
    setIsLoading(true);
    const saleRef = doc(db, "users", userId, "sales", saleToDelete.id);
    const itemRef = doc(db, "users", userId, "items", saleToDelete.itemId);
    try {
      await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists()) {
          throw new Error("Item document does not exist!");
        }
        const newQuantity = itemDoc.data().quantity + saleToDelete.quantity;
        transaction.update(itemRef, { quantity: newQuantity });
        transaction.delete(saleRef);
      });
      showMessage({
        message: "Sale record deleted successfully.",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to delete sales record:", error);
      showMessage({
        message: "An error occurred while deleting the sale. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsConfirmationModalOpen(false);
      setSaleToDelete(null);
    }
  };

  const handleDeleteAllRecords = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const salesQuery = query(
        collection(db, "users", userId, "sales"),
        where("saleDate", ">=", startOfDay),
        where("saleDate", "<=", endOfDay)
      );
      const salesSnapshot = await getDocs(salesQuery);
      salesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      showMessage({
        message: "All sales records for today deleted successfully.",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to delete all sales records:", error);
      showMessage({
        message:
          "An error occurred while deleting all sales. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteAllConfirmationOpen(false);
    }
  };

  // Auth listener
  useEffect(() => {
    // Set loading to true as soon as we start the auth process
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        signInAnonymously(auth)
          .then((res) => setUserId(res.user.uid))
          .catch((error) => {
            console.error("Failed to sign in anonymously:", error);
            showMessage({
              message: "Failed to authenticate. Please try again later.",
              type: "error",
            });
            setIsLoading(false); // Stop loading on auth error
          });
      }
    });
    return () => unsubscribe();
  }, []);

  const checkInitialLoadComplete = () => {
    if (loadedRefs.current.items && loadedRefs.current.sales) {
      setIsLoading(false);
    }
  };

  // Listen to items
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = onSnapshot(
      collection(db, "users", userId, "items"),
      (snapshot) => {
        const itemsData = snapshot.docs
          .filter((doc) => doc.id)
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }));
        setItems(itemsData);
        loadedRefs.current.items = true;
        checkInitialLoadComplete();
      },
      (error) => {
        console.error("Failed to fetch items:", error);
        showMessage({
          message: "Failed to fetch item data.",
          type: "error",
        });
        loadedRefs.current.items = true;
        checkInitialLoadComplete();
      }
    );
    return () => unsubscribe();
  }, [userId]);

  // Listen to today's sales
  useEffect(() => {
    if (!userId) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const salesQuery = query(
      collection(db, "users", userId, "sales"),
      where("saleDate", ">=", startOfDay),
      where("saleDate", "<=", endOfDay)
    );
    const unsubscribe = onSnapshot(
      salesQuery,
      (snapshot) => {
        let newTotalRevenue = 0;
        let newTotalItemsSold = 0;
        let newTotalSales = 0;
        let newTotalProfit = 0;
        const salesData = snapshot.docs
          .filter((doc) => doc.id)
          .map((d) => {
            const sale = d.data();
            newTotalRevenue += sale.totalRevenue || 0;
            newTotalItemsSold += sale.quantity || 0;
            newTotalSales += 1;
            newTotalProfit += sale.profit || 0;
            return {
              id: d.id,
              ...sale,
              saleDate: sale.saleDate
                ? {
                    seconds: sale.saleDate.seconds,
                    nanoseconds: sale.saleDate.nanoseconds,
                  }
                : null,
            };
          });
        salesData.sort((a, b) => {
          const dateA = a.saleDate
            ? new Date(a.saleDate.seconds * 1000)
            : new Date(0);
          const dateB = b.saleDate
            ? new Date(b.saleDate.seconds * 1000)
            : new Date(0);
          return dateB - dateA;
        });
        setSalesRecords(salesData);
        setTotalSales(newTotalSales);
        setTotalRevenue(newTotalRevenue);
        setTotalItemsSold(newTotalItemsSold);
        setTotalProfit(newTotalProfit);
        loadedRefs.current.sales = true;
        checkInitialLoadComplete();
      },
      (error) => {
        console.error("Failed to fetch sales records:", error);
        showMessage({
          message: "Failed to fetch sales data.",
          type: "error",
        });
        loadedRefs.current.sales = true;
        checkInitialLoadComplete();
      }
    );
    return () => unsubscribe();
  }, [userId, currentDate]);

  // Reset sales data at midnight
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== currentDate.getDate()) {
        setCurrentDate(now);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);

  return (
    <div className="flex flex-col items-center justify-start p-4 sm:p-8 bg-gray-100 min-h-screen font-sans">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {isModalOpen && (
            <MessageBox
              message={statusMessage.message}
              type={statusMessage.type}
              onClose={() => setIsModalOpen(false)}
            />
          )}
          {isConfirmationModalOpen && (
            <MessageBox
              message="Are you sure you want to delete this sales record? This action cannot be undone."
              type="confirm"
              onConfirm={handleConfirmDelete}
              onCancel={() => setIsConfirmationModalOpen(false)}
            />
          )}
          {isDeleteAllConfirmationOpen && (
            <MessageBox
              message="Are you sure you want to delete ALL sales records for today? This action cannot be undone."
              type="confirm"
              onConfirm={handleDeleteAllRecords}
              onCancel={() => setIsDeleteAllConfirmationOpen(false)}
              title="Delete All Sales"
            />
          )}
          <RecordSale
            isOpen={isSalesModalOpen}
            onClose={() => setIsSalesModalOpen(false)}
            userId={userId}
            items={items}
            onMessage={showMessage}
            onLoading={setIsLoading}
          />
          {editingSale && (
            <EditSalesForm
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              userId={userId}
              items={items}
              editingSale={editingSale}
              onMessage={showMessage}
              onLoading={setIsLoading}
            />
          )}

          <div className="w-full max-w-5xl text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
              Jonams Sales Dashboard
            </h1>
            <p className="text-gray-600 mb-6 text-lg">
              A quick look at your sales performance for today.
            </p>
            <button
              onClick={() => setIsSalesModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto"
            >
              <PlusCircle size={20} />
              <span>Record a New Sale</span>
            </button>
          </div>

          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300"
            >
              <div className="text-blue-600 mb-3">
                <ShoppingCart size={40} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Total Sales
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalSales}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300"
            >
              <div className="text-green-600 mb-3">
                <DollarSign size={40} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Total Revenue
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                KSh {totalRevenue.toFixed(2)}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300"
            >
              <div className="text-purple-600 mb-3">
                <TrendingUp size={40} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Total Profit
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                KSh {totalProfit.toFixed(2)}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300"
            >
              <div className="text-orange-600 mb-3">
                <Package size={40} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Total Items Sold
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalItemsSold}
              </p>
            </motion.div>
          </div>

          <div className="w-full max-w-5xl">
            <div className="border-t border-gray-300 my-6"></div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Individual Daily Sales Records
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsDeleteAllConfirmationOpen(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition-colors flex items-center space-x-1"
                >
                  <Trash2 size={16} />
                  <span>Clear All Today&apos;s Sales</span>
                </button>
              </div>
            </div>
            {salesRecords.length > 0 ? (
              <SalesTable
                salesRecords={salesRecords}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 text-center"
              >
                <p className="text-gray-500 text-lg">
                  No sales recorded for today. Start by adding a new sale!
                </p>
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
