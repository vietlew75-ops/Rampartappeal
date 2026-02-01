
import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  User 
} from "firebase/auth";
import { 
  collection, 
  getDocs, 
  limit, 
  query 
} from "firebase/firestore";
import { auth, googleProvider, db } from './firebase';
import { UserState } from './types';
import AppealForm from './components/AppealForm';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/Header';

const ADMIN_EMAIL = 'lewooon959@gmail.com';

const App: React.FC = () => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'submit' | 'admin'>('submit');
  const [authError, setAuthError] = useState<string | null>(null);
  const [systemError, setSystemError] = useState<{message: string, link?: string} | null>(null);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    const checkFirestore = async () => {
      try {
        const q = query(collection(db, "appeals"), limit(1));
        await getDocs(q);
        setDbStatus('online');
        setSystemError(null);
      } catch (error: any) {
        console.error("Firestore health check failed:", error);
        setDbStatus('offline');
        
        if (error.code === 'permission-denied' || error.message?.includes('API has not been used')) {
          setSystemError({
            message: "Cloud Firestore API is not enabled for this project.",
            link: `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=shareyourhost`
          });
        } else {
          setSystemError({
            message: "Unable to reach database. Check your internet connection.",
          });
        }
      }
    };

    checkFirestore();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          isAdmin: firebaseUser.email === ADMIN_EMAIL,
          isGuest: false
        });
        setAuthError(null);
      } else {
        const savedGuest = localStorage.getItem('rampart_guest_session');
        if (savedGuest) {
          setUser(JSON.parse(savedGuest));
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.removeItem('rampart_guest_session');
    } catch (error: any) {
      console.error("Login failed:", error);
      setAuthError(error.message || "An unexpected error occurred during login.");
    }
  };

  const handleContinueAsGuest = () => {
    const guestUser: UserState = {
      uid: 'guest-' + Math.random().toString(36).substr(2, 9),
      email: null,
      displayName: 'Guest User',
      isAdmin: false,
      isGuest: true
    };
    setUser(guestUser);
    localStorage.setItem('rampart_guest_session', JSON.stringify(guestUser));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('rampart_guest_session');
      setUser(null);
      setActiveTab('submit');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12 flex flex-col">
      <Header 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="container mx-auto px-4 mt-8 max-w-4xl flex-grow">
        {systemError && (
          <div className="mb-6 glass border-amber-500/50 p-6 rounded-2xl">
            <h3 className="text-amber-400 font-bold mb-1">System Notice</h3>
            <p className="text-gray-300 text-sm">{systemError.message}</p>
          </div>
        )}

        {!user ? (
          <div className="glass p-12 rounded-3xl text-center space-y-6">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              RampartSMP Appeals
            </h1>
            <div className="flex gap-4 justify-center pt-4">
              <button onClick={handleLogin} className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95">
                Sign in with Google
              </button>
              <button onClick={handleContinueAsGuest} className="px-8 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 active:scale-95">
                Continue as Guest
              </button>
            </div>
          </div>
        ) : (
          <div>
            {activeTab === 'admin' && user.isAdmin ? <AdminDashboard /> : <AppealForm user={user} />}
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 text-center opacity-40 text-[10px] uppercase font-bold tracking-widest text-gray-500">
        &copy; 2025 RampartSMP | Database: {dbStatus}
      </footer>
    </div>
  );
};

export default App;
