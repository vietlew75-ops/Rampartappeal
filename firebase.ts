// Ensure imports are from the correct modular SDK paths
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAoidmhvxHmuEcy2o-jqMhITcdtT0NUmBg",
  authDomain: "shareyourhost.firebaseapp.com",
  projectId: "shareyourhost",
  storageBucket: "shareyourhost.firebasestorage.app",
  messagingSenderId: "620651572285",
  appId: "1:620651572285:web:833ebb225c43d155038e54",
  measurementId: "G-8QRKTW2LJ6"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore using the modular getFirestore function
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});