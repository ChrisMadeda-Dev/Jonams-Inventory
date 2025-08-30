"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  Package,
  BarChart2,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Loader,
  AlertCircle,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/firebase/firebase.client";
import { onAuthStateChanged } from "firebase/auth";
import { Chart as ChartJS, registerables } from "chart.js";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import RecentTransactions from "./_components/RecentTransactions"; // Import the new component

// Register ChartJS components
ChartJS.register(...registerables);

// Get date range based on period
const getDateRange = (period, customDate = new Date()) => {
  const date = new Date(customDate);
  switch (period) {
    case "daily":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "weekly":
      return { start: startOfWeek(date), end: endOfWeek(date) };
    case "monthly":
      return { start: startOfMonth(date), end: endOfMonth(date) };
    default:
      return { start: startOfDay(date), end: endOfDay(date) };
  }
};

// Report Card Component
const ReportCard = ({
  title,
  value,
  icon,
  color,
  change,
  isCurrency = false,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transform transition-all hover:scale-105"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
        {React.cloneElement(icon, { className: "h-6 w-6" })}
      </div>
      <span
        className={`text-sm font-semibold flex items-center gap-1 ${
          change > 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {change > 0 ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        {Math.abs(change)}%
      </span>
    </div>
    <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 truncate">
      {isCurrency ? `KSh${value.toLocaleString()}` : value.toLocaleString()}
    </p>
  </motion.div>
);

// Top Items Component
const TopItems = ({ items, limit = 5 }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-bold text-gray-800 mb-4">
      Top Selling Items 🚀
    </h3>
    <div className="space-y-4">
      {items.slice(0, limit).map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between border-b pb-2 last:pb-0 last:border-b-0"
        >
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
              {index + 1}
            </span>
            <span className="text-base font-medium text-gray-800 truncate max-w-[150px]">
              {item.itemName}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">
              {item.totalQuantity} sold
            </p>
            <p className="text-sm font-medium text-green-600">
              KSh{item.totalRevenue?.toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Main Reports Page Component
export default function Reports() {
  const [userId, setUserId] = useState(null);
  const [period, setPeriod] = useState("daily");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState(() => getDateRange("daily"));
  const [salesData, setSalesData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date range for display
  const formatDateRange = () => {
    const { start, end } = dateRange;
    if (period === "daily") return format(start, "EEEE, MMMM dd, yyyy");
    if (period === "weekly")
      return `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`;
    return `${format(start, "MMMM yyyy")}`;
  };

  // Fetch user and data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setError("User not authenticated");
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchSalesData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { start, end } = dateRange;
        const salesQuery = query(
          collection(db, "users", userId, "sales"),
          where("saleDate", ">=", start),
          where("saleDate", "<=", end),
          orderBy("saleDate", "desc") // FIX: Changed to descending order
        );

        const unsubscribe = onSnapshot(salesQuery, (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            saleDate: doc.data().saleDate?.toDate(),
          }));

          // Process data
          const itemGroups = data
            .reduce((acc, sale) => {
              const existing = acc.find((i) => i.itemId === sale.itemId);
              if (existing) {
                existing.totalQuantity += sale.quantity;
                existing.totalRevenue += sale.totalRevenue || 0;
              } else {
                acc.push({
                  itemId: sale.itemId,
                  itemName: sale.itemName,
                  category: sale.itemCategory || "Uncategorized",
                  totalQuantity: sale.quantity,
                  totalRevenue: sale.totalRevenue || 0,
                });
              }
              return acc;
            }, [])
            .sort((a, b) => b.totalQuantity - a.totalQuantity);

          setSalesData(data);
          setTopItems(itemGroups);
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching sales data:", error);
        setError("Failed to load sales data");
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [userId, period, dateRange]);

  // Handle period change
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setDateRange(getDateRange(newPeriod, currentDate));
  };

  // Navigate dates
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      if (period === "daily") newDate.setDate(newDate.getDate() - 1);
      else if (period === "weekly") newDate.setDate(newDate.getDate() - 7);
      else newDate.setMonth(newDate.getMonth() - 1);
    } else {
      if (period === "daily") newDate.setDate(newDate.getDate() + 1);
      else if (period === "weekly") newDate.setDate(newDate.getDate() + 7);
      else newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setDateRange(getDateRange(period, newDate));
  };

  // Calculate metrics
  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce(
    (sum, sale) => sum + (sale.totalRevenue || 0),
    0
  );
  const totalCost = salesData.reduce(
    (sum, sale) => sum + (sale.totalCost || 0),
    0
  );
  const totalProfit = totalRevenue - totalCost;
  const totalItems = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
  const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Time",
      "Item",
      "Category",
      "Quantity",
      "Unit Price",
      "Revenue",
      "Cost",
      "Profit",
    ];
    const csvContent = [
      headers.join(","),
      ...salesData.map((item) =>
        [
          `"${format(item.saleDate || new Date(), "yyyy-MM-dd")}"`,
          `"${format(item.saleDate || new Date(), "HH:mm")}"`,
          `"${item.itemName}"`,
          `"${item.itemCategory || "N/A"}"`,
          item.quantity,
          item.itemPrice || 0,
          item.totalRevenue || 0,
          item.totalCost || 0,
          item.profit || 0,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales_report_${period}_${format(
      new Date(),
      "yyyyMMdd"
    )}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full text-center border border-gray-100">
          <Loader className="animate-spin text-blue-600 h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Loading Reports</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Please wait while we prepare your data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Sales Reports 📈
            </h1>
            <p className="text-base text-gray-600">
              A detailed look at your sales performance and trends.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Period Selector & Date Navigation */}
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <button
              onClick={() => navigateDate("prev")}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigateDate("next")}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Next period"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            <span className="text-lg font-semibold text-gray-800">
              {formatDateRange()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {["daily", "weekly", "monthly"].map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  period === p
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ReportCard
            title="Total Sales"
            value={totalSales}
            icon={<ShoppingCart />}
            color="text-blue-600"
            change={12.5}
          />
          <ReportCard
            title="Total Revenue"
            value={totalRevenue}
            icon={<DollarSign />}
            color="text-green-600"
            change={8.3}
            isCurrency={true}
          />
          <ReportCard
            title="Items Sold"
            value={totalItems}
            icon={<Package />}
            color="text-purple-600"
            change={-2.1}
          />
          <ReportCard
            title="Avg. Sale Value"
            value={avgSaleValue}
            icon={<BarChart2 />}
            color="text-orange-600"
            change={5.2}
            isCurrency={true}
          />
        </div>

        {/* Top Items and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <TopItems items={topItems} />
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Summary Details 📊
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Selected Period:</span>
                <span className="font-semibold text-gray-800">
                  {formatDateRange()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Transactions:</span>
                <span className="font-semibold text-gray-800">
                  {totalSales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Revenue:</span>
                <span className="font-bold text-green-600">
                  KSh{totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Profit:</span>
                <span className="font-bold text-blue-600">
                  KSh{totalProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <RecentTransactions salesData={salesData} />
      </div>
    </div>
  );
}
