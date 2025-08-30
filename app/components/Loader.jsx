// src/components/Loader.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const Loader = () => (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 font-serif"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col items-center p-8 rounded-3xl bg-white shadow-2xl">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="text-blue-600 mb-4" size={56} />
        </motion.div>
        <p className="text-gray-700 text-lg font-medium">Processing...</p>
      </div>
    </motion.div>
  </AnimatePresence>
);

export default Loader;
