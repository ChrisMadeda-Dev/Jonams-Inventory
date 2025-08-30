"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import {
  Loader2,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";

/**
 * A functional component for a robust email and password authentication page.
 * This version is integrated with the user's provided Firebase configuration
 * and includes fields for first name, last name, and password confirmation.
 * It also redirects to a dashboard page upon successful authentication.
 */
export default function AuthPage() {
  // State for authentication status and user data
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [error, setError] = useState(null);

  // State for form inputs and toggling between login/sign-up
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State for UI element visibility
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);

  useEffect(() => {
    try {
      // NOTE: This firebaseConfig object is a direct representation
      // of your firebase.client.js file. In your actual Next.js app,
      // you would import this from '@/firebase/firebase.client.js'.
      const firebaseConfig = {
        apiKey: "AIzaSyAlPtH62gJesPafo4Tctv_fpyA174YgaAc",
        authDomain: "joandmel-inventory.firebaseapp.com",
        projectId: "joandmel-inventory",
        storageBucket: "joandmel-inventory.firebasestorage.app",
        messagingSenderId: "710541496722",
        appId: "1:710541496722:web:82d8b0353dc6e3bdcdb14b",
      };

      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);
      setAuth(authInstance);
      setDb(dbInstance);
      setFirebaseReady(true);

      // onAuthStateChanged listens for user sign-in/sign-out events
      const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          console.log("User is authenticated with UID:", currentUser.uid);
          // Redirect the user to the dashboard if they are already logged in
          if (window.location.pathname !== "/dashboard") {
            window.location.href = "/dashboard";
          }
        } else {
          setUser(null);
          console.log("No user is currently authenticated.");
        }
        setLoading(false);
      });

      return () => unsubscribe(); // Cleanup the listener on component unmount
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      setError(
        "Failed to initialize the application. Check your Firebase config."
      );
      setLoading(false);
    }
  }, []);

  /**
   * Toggles the password visibility.
   */
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  /**
   * Handles form submission for both sign-in and sign-up.
   * It prevents the default form action and calls the appropriate Firebase auth method.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!auth || !db) {
        throw new Error("Firebase services are not initialized.");
      }

      if (isLogin) {
        // Sign in an existing user
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User signed in successfully. Redirecting to dashboard...");
      } else {
        // Validation for sign-up
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }

        // Create a new user account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const newUser = userCredential.user;

        // Set the user's display name
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        if (fullName) {
          await updateProfile(newUser, { displayName: fullName });
        }

        // Save the user's details to a Firestore document
        await setDoc(doc(db, "users", newUser.uid), {
          firstName: firstName,
          lastName: lastName,
          email: newUser.email,
          createdAt: new Date(),
        });
        console.log(
          "User account and profile created successfully. Redirecting to dashboard..."
        );
      }
      // UI will be updated by the onAuthStateChanged listener which will handle the redirection
    } catch (e) {
      console.error("Authentication error:", e.code, e.message);
      let errorMessage = "An unknown error occurred.";
      if (e.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (
        e.code === "auth/wrong-password" ||
        e.code === "auth/user-not-found"
      ) {
        errorMessage = "Incorrect email or password.";
      } else if (e.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (e.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles user sign-out.
   */
  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!auth) {
        throw new Error("Auth service not initialized.");
      }
      await signOut(auth);
    } catch (e) {
      console.error("Sign out error:", e);
      setError("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  // Main render logic based on authentication state
  return (
    <div className="flex items-center justify-center p-8 bg-gray-100 min-h-screen font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200"
      >
        <div className="flex justify-center mb-6">
          <User className="w-16 h-16 text-blue-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>

        {/* Display content based on authentication state */}
        {loading || !firebaseReady ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="mt-4 text-gray-600">{error || "Loading..."}</p>
          </div>
        ) : user ? (
          // User is authenticated, show their details and a sign-out button
          <div className="text-center">
            <h2 className="text-xl font-bold mt-4 text-gray-800">
              Welcome, {user.displayName || "User"}!
            </h2>
            <p className="text-gray-600 text-sm mt-2">{user.email}</p>
            <p className="mt-2 text-gray-700 text-sm break-all">
              Your User ID:{" "}
              <span className="font-mono text-gray-800 font-semibold">
                {user.uid}
              </span>
            </p>
            <button
              onClick={handleSignOut}
              className="mt-6 w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <LogOut className="mr-2 h-5 w-5" /> Sign Out
            </button>
          </div>
        ) : (
          // User is not authenticated, show the login/sign-up form
          <>
            <p className="text-gray-700 text-center mb-6">
              Please {isLogin ? "sign in" : "sign up"} to continue.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First and Last Name fields (only for sign-up) */}
              {!isLogin && (
                <>
                  <div>
                    <label htmlFor="firstName" className="sr-only">
                      First Name
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="First Name"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="sr-only">
                      Last Name
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Last Name"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Input Field */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Email address"
                    required
                  />
                </div>
              </div>

              {/* Password Input Field */}
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={passwordVisible ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Password"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {passwordVisible ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Password Field (only for sign-up) */}
              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    Confirm Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Confirm Password"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {passwordVisible ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Display authentication error messages */}
              {error && (
                <p className="text-red-600 text-sm text-center font-medium">
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn className="mr-2 h-5 w-5" /> Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                  </>
                )}
              </button>
            </form>

            {/* Toggle between login and sign-up */}
            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-medium text-blue-600 hover:text-blue-500 ml-1 transition-colors"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
