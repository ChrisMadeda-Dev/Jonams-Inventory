"use client";

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Your Firebase configuration file.
 * This file centralizes the initialization of Firebase services to be used
 * across your entire application. It reads the configuration provided by the
 * Canvas environment for a secure and seamless connection to your project.
 */

// The global `__firebase_config` variable is automatically provided by the Canvas environment.
// It contains all the necessary credentials for your Firebase project.
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : null;

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them for use in other components.
// This is the best practice as it prevents re-initialization and keeps your code clean.
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
