"use client";

import { useState, useEffect } from "react";
// The 'next/navigation' import is causing issues in this environment.
// For self-contained code, we'll use a standard window.location.href approach
// instead of Next.js-specific routing.
// import { useRouter } from "next/navigation";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";

/**
 * The root page of the application, responsible for checking the user's
 * authentication status and redirecting them to the correct page.
 *
 * It displays a loading spinner while waiting for the authentication state to be
 * determined, ensuring a smooth user experience without a content "flicker."
 */
export default function HomePage() {
  // const router = useRouter(); // No longer needed
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    try {
      // Your Firebase configuration
      const firebaseConfig = {
        apiKey: "AIzaSyAlPtH62gJesPafo4Tctv_fpyA174YgaAc",
        authDomain: "joandmel-inventory.firebaseapp.com",
        projectId: "joandmel-inventory",
        storageBucket: "joandmel-inventory.firebasestorage.app",
        messagingSenderId: "710541496722",
        appId: "1:710541496722:web:82d8b0353dc6e3bdcdb14b",
      };

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      setFirebaseReady(true);

      // Listener to check the authentication state
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in, redirect to the dashboard
          console.log("User is authenticated. Redirecting to /dashboard.");
          // Use a standard location redirect
          window.location.href = "/dashboard";
        } else {
          // User is not signed in, redirect to the authentication page
          console.log("No user authenticated. Redirecting to /auth.");
          // Use a standard location redirect
          window.location.href = "/auth";
        }
        setLoading(false);
      });

      // Cleanup the listener when the component unmounts
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      setLoading(false);
    }
  }, []); // Removed router from dependencies, as it's no longer used

  // Display a loading indicator while the authentication check is in progress
  if (loading || !firebaseReady) {
    return (
      <main className="h-[100vh] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600 font-serif">
            Checking authentication...
          </p>
        </div>
      </main>
    );
  }

  // This part of the component will be unreachable due to the redirects in useEffect
  return null;
}
