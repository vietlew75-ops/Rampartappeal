
import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  User 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  collection, 
  getDocs, 
  limit, 
  query 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
            message: "Cloud Firestore API is not enabled for this project. This is a common setup step.",
            link: `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=shareyourhost`
          });
        } else {
          setSystemError({
            message: "Unable to reach database. Check your internet connection or Firebase configuration.",
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
      if (error.code === 'auth/unauthorized-domain') {
        setAuthError(`Domain "${window.location.hostname}" is not authorized. Add it to Firebase Console > Auth > Settings.`);
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
      setAuthError(null);
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
          <div className="mb-6 glass border-amber-500/50 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 shadow-xl shadow-amber-500/5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-amber-400 font-bold mb-1">Database setup required</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{systemError.message}</p>
                {systemError.link && (
                  <a 
                    href={systemError.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-500 text-black font-bold rounded-lg text-xs hover:bg-amber-400 transition-colors"
                  >
                    Enable Cloud Firestore API
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {authError && (
          <div className="mb-6 glass border-red-500/50 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-red-400 font-bold mb-1">Authentication Error</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{authError}</p>
              </div>
            </div>
          </div>
        )}

        {!user ? (
          <div className="glass p-12 rounded-3xl text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
              RampartSMP Ban Appeals
            </h1>
            <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
              Our official appeal system is currently {dbStatus === 'online' ? 'online' : 'recovering'}. Log in or continue as a guest to begin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <button 
                onClick={handleLogin}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.36-2.04 4.48-1.28 1.28-3.16 2.24-5.8 2.24-4.8 0-8.68-3.88-8.68-8.68s3.88-8.68 8.68-8.68c2.6 0 4.56 1.04 5.96 2.36l2.32-2.32C18.48 1.48 15.64 0 12.48 0 6.92 0 2.44 4.48 2.44 10s4.48 10 10.04 10c3.04 0 5.4-1 7.24-2.84 1.88-1.88 2.48-4.52 2.48-6.68 0-.64-.04-1.24-.12-1.84h-9.6z" />
                </svg>
                Sign in with Google
              </button>
              <button 
                onClick={handleContinueAsGuest}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all active:scale-95"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'admin' && user.isAdmin ? (
              <AdminDashboard />
            ) : (
              <AppealForm user={user} />
            )}
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 text-center border-t border-white/5 opacity-40">
        <div className="flex items-center justify-center gap-4 text-[10px] uppercase font-bold tracking-widest text-gray-500">
          <span>&copy; 2025 RampartSMP</span>
          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
          <span className="flex items-center gap-1.5">
            Database: 
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-emerald-500 animate-pulse' : dbStatus === 'checking' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
            {dbStatus}
          </span>
        </div>
      </footer>
      
      {/* Decorative background elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
    </div>
  );
};

export default App;
