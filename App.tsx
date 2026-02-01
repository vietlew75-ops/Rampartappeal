
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] relative overflow-x-hidden selection:bg-emerald-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[160px] rounded-full"></div>
      </div>

      <Header 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="container mx-auto px-4 mt-8 max-w-5xl flex-grow relative z-10">
        {!user ? (
          <div className="glass p-12 sm:p-24 rounded-[3rem] text-center space-y-16 shadow-2xl transition-all duration-700 border-white/5">
            <div className="relative inline-block group">
              <div className="absolute -inset-12 bg-emerald-500/20 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative animate-[float_6s_ease-in-out_infinite] flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] mb-8 transform rotate-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-4xl sm:text-6xl font-black minecraft-font tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent drop-shadow-2xl">
                  RAMPART
                </h2>
              </div>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white minecraft-font tracking-tight">
                JUDGMENT DAY
              </h1>
              <p className="text-gray-400 max-w-lg mx-auto text-sm sm:text-lg leading-relaxed font-light italic">
                "Every soul deserves a trial. Most deserve the void."
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <button 
                onClick={handleLogin} 
                className="px-12 py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
              >
                Identify Soul (Google)
              </button>
              <button 
                onClick={handleContinueAsGuest} 
                className="px-12 py-5 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 active:scale-[0.97] transition-all"
              >
                Confess as Guest
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
        RAMPART | SMP | REDEMPTION SYSTEM
      </footer>
    </div>
  );
};

export default App;
