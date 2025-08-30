"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  ShoppingBag,
  ArrowRight,
  UserCheck,
  Search,
  XCircle,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  getDocs,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "@/firebase/firebase.client";

// Custom Alert Modal Component
const AlertModal = ({ show, title, message, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans">
      <div className="relative p-8 bg-white text-gray-900 w-full max-w-sm rounded-xl shadow-2xl">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-center text-blue-700 mb-2 font-sans">
          {title}
        </h3>
        <p className="text-gray-600 text-center mb-6 font-sans">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-blue-700 text-white px-4 py-3 rounded-xl hover:bg-blue-800 transition-colors duration-200 font-bold font-sans"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmModal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 font-sans">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl text-center">
        <div className="flex justify-center mb-4 text-red-500">
          <AlertCircle className="h-12 w-12" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2 font-sans">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 font-sans">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ show, title, onClose, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
      <div className="relative p-8 bg-white text-gray-900 w-full max-w-lg rounded-xl transform transition-all duration-300 scale-100 shadow-2xl">
        <div className="flex justify-between items-center pb-4 border-b-2 border-gray-200 mb-4">
          <h3 className="text-3xl font-extrabold text-blue-700 font-sans">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Create Category Form
const CreateCategoryForm = ({ onClose, showAlert, db, userId }) => {
  const [categoryName, setCategoryName] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      showAlert("User not authenticated. Please try again.", "Error!");
      return;
    }
    try {
      await addDoc(collection(db, "users", userId, "categories"), {
        name: categoryName,
        createdAt: serverTimestamp(),
      });
      showAlert(`Category "${categoryName}" created!`, "Success!");
      setCategoryName("");
      onClose();
    } catch (err) {
      console.error(err);
      showAlert("Error creating category", "Error!");
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
        <input
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="Category Name"
          required
          className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-700 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-colors duration-300 flex items-center justify-center font-sans"
      >
        <PlusCircle className="mr-2" />
        Create
      </button>
    </form>
  );
};

// Add Item Form
const AddNewItemForm = ({ onClose, showAlert, categories, db, userId }) => {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      showAlert("User not authenticated. Please try again.", "Error!");
      return;
    }
    try {
      await addDoc(collection(db, "users", userId, "items"), {
        name: itemName,
        quantity: Number(quantity),
        category,
        buyingPrice: Number(buyingPrice),
        sellingPrice: Number(sellingPrice),
        createdAt: serverTimestamp(),
      });
      showAlert(`Item "${itemName}" added!`, "Success!");
      setItemName("");
      setQuantity("");
      setCategory("");
      setBuyingPrice("");
      setSellingPrice("");
      onClose();
    } catch (err) {
      console.error(err);
      showAlert("Error adding item", "Error!");
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="text"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        placeholder="Item Name"
        required
        className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans"
      />
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Quantity"
        required
        className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
        className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans bg-white"
      >
        <option value="" disabled>
          Select Category
        </option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.name}>
            {cat.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={buyingPrice}
        onChange={(e) => setBuyingPrice(e.target.value)}
        placeholder="Buying Price"
        required
        className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans"
      />
      <input
        type="number"
        value={sellingPrice}
        onChange={(e) => setSellingPrice(e.target.value)}
        placeholder="Selling Price"
        required
        className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans"
      />
      <button
        type="submit"
        className="w-full bg-blue-700 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-colors duration-300 flex items-center justify-center font-sans"
      >
        <ShoppingBag className="mr-2" />
        Add Item
      </button>
    </form>
  );
};

// Update Item Modal
const UpdateModal = ({ item, onClose, onUpdate, categories }) => {
  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    buyingPrice: item.buyingPrice,
    sellingPrice: item.sellingPrice,
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(item.id, formData);
    onClose();
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-sans"
              required
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-sans"
              required
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-sans"
              required
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-sans"
              step="0.01"
              required
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-sans"
              step="0.01"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-orange-700 hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors font-sans"
          >
            <CheckCircle className="mr-2" size={20} /> Update
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Component to display stock items in a table view with a search function.
const Stocks = ({ user, onUpdate, onDelete }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    const unsubscribeItems = onSnapshot(
      collection(db, "users", user.uid, "items"),
      (snapshot) => {
        const itemsData = [];
        snapshot.docs.forEach((doc) => {
          itemsData.push({ id: doc.id, ...doc.data() });
        });
        setItems(itemsData);
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
      },
      (error) => {
        console.error("Error fetching categories:", error);
      }
    );
    return () => {
      unsubscribeItems();
      unsubscribeCategories();
    };
  }, [user]);

  const filteredStocks = items.filter((stock) =>
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="relative w-full mb-6">
        <input
          type="text"
          placeholder="Search for an item..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-sans"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>
      <div className="w-full overflow-x-auto shadow-lg rounded-xl">
        <table className="min-w-full bg-white rounded-xl">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Product Name
              </th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Category
              </th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Current Stock
              </th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Buying Price
              </th>
              <th className="py-3 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Selling Price
              </th>
              <th className="py-3 px-4 text-center font-semibold text-gray-600 uppercase tracking-wider font-sans">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredStocks.map((stock) => (
                <motion.tr
                  key={stock.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <td className="py-3 px-4 text-gray-800 font-medium font-sans">
                    {stock.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-sans">
                    {stock.category}
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-sans">
                    {stock.quantity}
                  </td>
                  <td className="py-3 px-4 text-red-600 font-bold font-sans">
                    Kes: {stock.buyingPrice}
                  </td>
                  <td className="py-3 px-4 text-green-600 font-bold font-sans">
                    Kes: {stock.sellingPrice}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedItem(stock)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg shadow-sm hover:bg-orange-400 transition-colors font-sans mr-2"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => onDelete(stock.id, stock.name)}
                      className="p-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors"
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

// Main App component
const App = () => {
  const [modalState, setModalState] = useState({
    show: false,
    title: "",
    content: null,
  });
  const [alertState, setAlertState] = useState({
    show: false,
    title: "",
    message: "",
  });
  const [confirmModalState, setConfirmModalState] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [user, setUser] = useState(null);
  const [userDisplayName, setUserDisplayName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Auth listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserDisplayName(currentUser.displayName || currentUser.email);
      } else {
        setUserDisplayName(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showAlert("User signed up!", "Success!");
    } catch (err) {
      console.error(err);
      showAlert("Error signing up. Please try again.", "Error!");
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showAlert("Logged in!", "Success!");
    } catch (err) {
      console.error(err);
      showAlert("Error logging in. Please check your credentials.", "Error!");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    showAlert("Logged out successfully.", "Logout");
  };

  const openModal = (title, content) =>
    setModalState({ show: true, title, content });

  const closeModal = () =>
    setModalState({ show: false, title: "", content: null });

  const showAlert = (message, title) =>
    setAlertState({ show: true, title, message });

  const closeAlert = () =>
    setAlertState({ show: false, title: "", message: "" });

  const closeConfirmModal = () =>
    setConfirmModalState({
      show: false,
      title: "",
      message: "",
      onConfirm: () => {},
    });

  // Handlers for Firestore operations
  const handleCreateCategory = () => {
    openModal(
      "Create New Category",
      <CreateCategoryForm
        onClose={closeModal}
        showAlert={showAlert}
        db={db}
        userId={user.uid}
      />
    );
  };

  const handleAddNewItem = async () => {
    const categoriesSnapshot = await getDocs(
      collection(db, "users", user.uid, "categories")
    );
    openModal(
      "Add New Item",
      <AddNewItemForm
        onClose={closeModal}
        showAlert={showAlert}
        categories={categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))}
        db={db}
        userId={user.uid}
      />
    );
  };

  const handleUpdateItem = async (id, data) => {
    if (!user) {
      console.error("User not authenticated.");
      return;
    }
    try {
      const itemRef = doc(db, "users", user.uid, "items", id);
      await updateDoc(itemRef, {
        name: data.name,
        category: data.category,
        quantity: Number(data.quantity),
        buyingPrice: Number(data.buyingPrice),
        sellingPrice: Number(data.sellingPrice),
      });
      showAlert("Item updated successfully!", "Success!");
    } catch (error) {
      console.error("Error updating document: ", error);
      showAlert("Error updating item.", "Error!");
    }
  };

  // Delete a single item
  const handleDeleteItem = (itemId, itemName) => {
    setConfirmModalState({
      show: true,
      title: "Confirm Deletion",
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          if (user) {
            await deleteDoc(doc(db, "users", user.uid, "items", itemId));
            showAlert(`Item "${itemName}" deleted successfully.`, "Success!");
          }
        } catch (error) {
          console.error("Error deleting item: ", error);
          showAlert(`Failed to delete "${itemName}".`, "Error!");
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  // Delete all items
  const handleDeleteAllItems = () => {
    setConfirmModalState({
      show: true,
      title: "Confirm All Deletion",
      message:
        "Are you absolutely sure you want to delete ALL items? This action is permanent and cannot be undone.",
      onConfirm: async () => {
        try {
          if (user) {
            const itemsRef = collection(db, "users", user.uid, "items");
            const snapshot = await getDocs(itemsRef);
            if (snapshot.empty) {
              showAlert("No items to delete.", "Info");
              return;
            }

            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            showAlert("All items deleted successfully.", "Success!");
          }
        } catch (error) {
          console.error("Error deleting all items: ", error);
          showAlert("Failed to delete all items.", "Error!");
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <Loader className="animate-spin text-blue-700 h-16 w-16" />
        <p className="ml-4 text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  // Auth UI
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 sm:p-10 rounded-xl w-full max-w-sm transform transition-all duration-500 shadow-2xl space-y-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 text-center font-sans">
            Welcome
          </h1>
          <p className="text-center text-gray-600 font-sans">
            Sign up or log in to manage your inventory.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all font-sans"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all font-sans"
          />
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleLogin}
              className="bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center font-sans"
            >
              <ArrowRight className="mr-2" />
              Login
            </button>
            <button
              onClick={handleSignUp}
              className="bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center font-sans"
            >
              <UserCheck className="mr-2" />
              Sign Up
            </button>
          </div>
        </div>
        <AlertModal
          show={alertState.show}
          title={alertState.title}
          message={alertState.message}
          onClose={closeAlert}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-4 font-sans">
      <div className="bg-white p-6 sm:p-8 rounded-xl w-full max-w-7xl transform transition-all duration-500 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-sans">
            Inventory Manager
          </h1>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-500 font-sans hidden sm:block">
              Welcome, {userDisplayName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleAddNewItem}
            className="bg-blue-700 text-white px-4 py-3 rounded-xl hover:bg-blue-800 transition-colors duration-300 flex items-center justify-center font-sans shadow-lg transform hover:scale-105 w-full"
          >
            <ShoppingBag className="mr-2" />
            Add Item
          </button>
          <button
            onClick={handleCreateCategory}
            className="text-blue-700 bg-white border-2 border-blue-700 px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors duration-300 flex items-center justify-center font-sans shadow-lg transform hover:scale-105 w-full"
          >
            <PlusCircle className="mr-2" />
            Create Category
          </button>
          <button
            onClick={handleDeleteAllItems}
            className="bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-colors duration-300 flex items-center justify-center font-sans shadow-lg transform hover:scale-105 w-full"
          >
            <Trash2 className="mr-2" />
            Delete All Items
          </button>
        </div>

        <Stocks
          user={user}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
        />

        <Modal
          show={modalState.show}
          title={modalState.title}
          onClose={closeModal}
        >
          {modalState.content}
        </Modal>

        <AlertModal
          show={alertState.show}
          title={alertState.title}
          message={alertState.message}
          onClose={closeAlert}
        />

        <ConfirmModal
          show={confirmModalState.show}
          title={confirmModalState.title}
          message={confirmModalState.message}
          onConfirm={confirmModalState.onConfirm}
          onCancel={closeConfirmModal}
        />
      </div>
    </div>
  );
};

export default App;
