
import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  signOut,
  getRedirectResult
} from "firebase/auth";
import type { User } from "firebase/auth";
// Consolidate Firestore modular imports
import { collection, getDocs, limit, query } from "firebase/firestore";
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
  const [systemError, setSystemError] = useState<{message: string, isAdblock?: boolean} | null>(null);
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
        
        if (error.message?.includes('failed-precondition') || error.code === 'unavailable' || error.message?.includes('fetch')) {
          setSystemError({
            message: "Database connection blocked. Please disable your Ad-Blocker for this site.",
            isAdblock: true
          });
        }
      }
    };

    checkFirestore();

    getRedirectResult(auth).catch((error) => {
      console.error("Redirect auth error:", error);
      setAuthError("Sign-in failed. Please ensure cookies are enabled.");
    });

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
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirError: any) {
          setAuthError("Authentication failed. Please check your browser privacy settings.");
        }
      } else {
        setAuthError(error.message || "An unexpected error occurred during login.");
      }
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
    <div className="min-h-screen flex flex-col selection:bg-emerald-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
      </div>
      
      <Header 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="container mx-auto px-4 mt-8 max-w-5xl flex-grow z-10 relative">
        {systemError && (
          <div className="mb-6 glass border-l-4 border-amber-500 p-6 rounded-2xl animate-pulse">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold text-amber-500 uppercase text-xs tracking-widest">Connection Notice</h3>
                <p className="text-gray-300 text-sm">{systemError.message}</p>
              </div>
            </div>
          </div>
        )}

        {!user ? (
          <div className="glass p-12 sm:p-20 rounded-[2.5rem] text-center space-y-12 shadow-2xl">
            <div className="relative inline-block group">
              <div className="absolute -inset-10 bg-emerald-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <img 
                src="./logo.png" 
                alt="Rampart Appeal" 
                className="relative max-w-[280px] sm:max-w-[420px] mx-auto drop-shadow-[0_20px_50px_rgba(16,185,129,0.3)] animate-[float_6s_ease-in-out_infinite]"
              />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white minecraft-font tracking-tight">
                Ban Appeal Portal
              </h1>
              <p className="text-gray-400 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                Submit your case to our staff team. We value fair play and genuine second chances.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={handleLogin} 
                className="px-10 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-2.21 5.39-7.84 5.39-4.84 0-8.79-4.01-8.79-8.97s3.95-8.97 8.79-8.97c2.75 0 4.59 1.17 5.65 2.18l2.58-2.48c-1.66-1.55-4.21-2.5-8.23-2.5-6.63 0-12 5.37-12 12s5.37 12 12 12c6.92 0 11.52-4.87 11.52-11.72 0-.78-.08-1.38-.24-1.97h-11.28z"/></svg>
                Continue with Google
              </button>
              <button 
                onClick={handleContinueAsGuest} 
                className="px-10 py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
              >
                Submit as Guest
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === 'admin' && user.isAdmin ? <AdminDashboard /> : <AppealForm user={user} />}
          </div>
        )}
      </main>

      <footer className="mt-12 py-8 text-center opacity-30 text-[10px] uppercase font-bold tracking-[0.4em] text-gray-500">
        &copy; 2025 RAMPARTSMP | STATUS: {dbStatus.toUpperCase()}
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
