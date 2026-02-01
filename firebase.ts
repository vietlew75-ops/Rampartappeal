import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

// Using initializeFirestore with experimentalForceLongPolling to mitigate reachability errors
// and adding local cache support for better responsiveness.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();