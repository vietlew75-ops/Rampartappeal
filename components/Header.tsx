
import React from 'react';
import { UserState } from '../types';

interface HeaderProps {
  user: UserState | null;
  onLogin: () => void;
  onLogout: () => void;
  activeTab: 'submit' | 'admin';
  setActiveTab: (tab: 'submit' | 'admin') => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout, activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-50 w-full px-4 py-4">
      <div className="max-w-6xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight minecraft-font hidden sm:block">RAMPARTSMP</span>
        </div>

        <nav className="flex items-center gap-4">
          {user && user.isAdmin && (
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
              <button 
                onClick={() => setActiveTab('submit')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'submit' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Appeals
              </button>
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'admin' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Dashboard
              </button>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-sm font-medium leading-none">
                  {user.isGuest ? 'Guest Session' : user.displayName}
                </span>
                <span className="text-[10px] text-gray-500">
                  {user.isGuest ? 'Limited persistence' : user.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {user.isGuest && (
                  <button 
                    onClick={onLogin}
                    className="hidden sm:block text-[10px] text-emerald-400 hover:underline px-2"
                  >
                    Link Google
                  </button>
                )}
                <button 
                  onClick={onLogout}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                  title={user.isGuest ? "Exit Guest Session" : "Logout"}
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="px-5 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white text-sm font-semibold rounded-xl border border-emerald-500/20 transition-all"
            >
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
