
import { initializeApp } from "firebase/app";
// Import getFirestore from the modular SDK
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAoidmhvxHmuEcy2o-jqMhITcdtT0NUmBg",
  authDomain: "shareyourhost.firebaseapp.com",
  projectId: "shareyourhost",
  storageBucket: "shareyourhost.firebasestorage.app",
  messagingSenderId: "620651572285",
  appId: "1:620651572285:web:8ada02277cc7c3c9038e54",
  measurementId: "G-L45Q2K3H4E"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore using the modular getFirestore function
export const db = getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standardize behavior across browsers for Google Auth
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
