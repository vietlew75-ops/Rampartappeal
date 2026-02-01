import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  signOut,
  getRedirectResult
} from "firebase/auth";
import type { User } from "firebase/auth";
// Fix: Ensure modular Firestore functions are correctly imported
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
            message: "Connection failed. Please disable your Ad-Blocker or check your internet.",
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
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/5 blur-[160px] rounded-full"></div>
      </div>
      
      <Header 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="container mx-auto px-4 mt-8 max-w-5xl flex-grow relative z-10">
        {systemError && (
          <div className="mb-6 glass border-l-4 border-emerald-500 p-6 rounded-3xl animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-emerald-400 uppercase text-xs tracking-widest">Network Alert</h3>
                <p className="text-gray-400 text-sm">{systemError.message}</p>
              </div>
            </div>
          </div>
        )}

        {authError && (
          <div className="mb-6 glass border-l-4 border-red-500 p-6 rounded-3xl animate-in fade-in zoom-in-95 duration-500">
             <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-300 text-sm">{authError}</p>
            </div>
          </div>
        )}

        {!user ? (
          <div className="glass p-12 sm:p-24 rounded-[3rem] text-center space-y-16 shadow-2xl transition-all duration-700 hover:bg-white/[0.04] border-white/5">
            <div className="relative inline-block group">
              <div className="absolute -inset-12 bg-emerald-500/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <img 
                src="./logo.png" 
                alt="Rampart Appeal" 
                className="relative max-w-[280px] sm:max-w-[480px] mx-auto drop-shadow-[0_25px_60px_rgba(16,185,129,0.25)] animate-[float_6s_ease-in-out_infinite]"
              />
            </div>
            
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white minecraft-font tracking-tight">
                Ban Appeal Portal
              </h1>
              <p className="text-gray-400 max-w-lg mx-auto text-sm sm:text-lg leading-relaxed font-light">
                Submit your case for review. We value integrity and genuine second chances on our community server.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <button 
                onClick={handleLogin} 
                className="group px-12 py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.97] transition-all flex items-center justify-center gap-3 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-2.21 5.39-7.84 5.39-4.84 0-8.79-4.01-8.79-8.97s3.95-8.97 8.79-8.97c2.75 0 4.59 1.17 5.65 2.18l2.58-2.48c-1.66-1.55-4.21-2.5-8.23-2.5-6.63 0-12 5.37-12 12s5.37 12 12 12c6.92 0 11.52-4.87 11.52-11.72 0-.78-.08-1.38-.24-1.97h-11.28z"/></svg>
                Continue with Google
              </button>
              <button 
                onClick={handleContinueAsGuest} 
                className="px-12 py-5 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 active:scale-[0.97] transition-all"
              >
                Enter as Guest
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === 'admin' && user.isAdmin ? <AdminDashboard /> : <AppealForm user={user} />}
          </div>
        )}
      </main>

      <footer className="mt-16 py-12 text-center opacity-40 text-[10px] uppercase font-bold tracking-[0.6em] text-gray-500 border-t border-white/5">
        RAMPART | SMP | REDEMPTION
      </footer>
    </div>
  );
};

export default App;