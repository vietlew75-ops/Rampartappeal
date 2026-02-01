
import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import { UserState } from './types';
import Header from './components/Header';
import AppealForm from './components/AppealForm';
import AdminDashboard from './components/AdminDashboard';

const ADMIN_EMAIL = 'lewooon959@gmail.com';

const App: React.FC = () => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'submit' | 'admin'>('submit');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          isAdmin: firebaseUser.email === ADMIN_EMAIL,
          isGuest: false
        });
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
    try {
      await auth.signInWithPopup(googleProvider);
      localStorage.removeItem('rampart_guest_session');
    } catch (error) {
      console.error("Auth failed", error);
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
    await auth.signOut();
    localStorage.removeItem('rampart_guest_session');
    setUser(null);
    setActiveTab('submit');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-emerald-500/50">Initializing Secure Session</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] relative selection:bg-emerald-500/30">
      {/* Dynamic Background Blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <Header 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="container mx-auto px-6 mt-12 max-w-6xl flex-grow relative z-10">
        {!user ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="mb-12 relative float-anim">
              <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full"></div>
              <div className="relative glass w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-2xl">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>

            <div className="space-y-6 max-w-2xl mb-12">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Justice through <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Clarity.</span>
              </h1>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed font-medium">
                The Rampart automated redemption system handles ban appeals with integrity. Start your identification to submit a plea.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button 
                onClick={handleLogin} 
                className="group relative px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-emerald-500 hover:text-white transition-all duration-300 flex items-center gap-3 shadow-xl overflow-hidden"
              >
                <span className="relative z-10">Identify with Google</span>
                <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
              <button 
                onClick={handleContinueAsGuest} 
                className="px-8 py-4 bg-white/5 text-gray-300 font-semibold rounded-2xl border border-white/10 hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
              >
                Anonymous Plea
              </button>
            </div>
            
            <div className="mt-16 grid grid-cols-3 gap-8 sm:gap-16 opacity-40">
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-white">24/7</span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Review</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-white">AI</span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Analysis</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-white">MOD</span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Registry</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {activeTab === 'admin' && user.isAdmin ? <AdminDashboard /> : <AppealForm user={user} />}
          </div>
        )}
      </main>

      <footer className="mt-24 py-12 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-6xl flex flex-col sm:flex-row justify-between items-center gap-6">
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-500">
            RAMPART REDEMPTION © 2026
          </span>
          <div className="flex gap-8 text-[10px] uppercase tracking-widest font-bold text-gray-600">
            <a href="#" className="hover:text-emerald-500 transition-colors">Server Rules</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Discord</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
