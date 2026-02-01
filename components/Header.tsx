
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
    <header className="sticky top-0 z-50 w-full px-4 py-6">
      <div className="max-w-6xl mx-auto glass rounded-[1.5rem] px-6 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight minecraft-font hidden sm:block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            RAMPARTSMP
          </span>
        </div>

        <nav className="flex items-center gap-4">
          {user && user.isAdmin && (
            <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
              <button 
                onClick={() => setActiveTab('submit')}
                className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'submit' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
              >
                Users
              </button>
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
              >
                Panel
              </button>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-4 pl-2 border-l border-white/10 ml-2">
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-xs font-bold leading-none text-white">
                  {user.isGuest ? 'GUEST' : user.displayName?.toUpperCase()}
                </span>
                <span className="text-[9px] text-emerald-500/60 font-mono">
                  {user.isAdmin ? 'SYSTEM_ADMIN' : 'IDENTIFIED'}
                </span>
              </div>
              <button 
                onClick={onLogout}
                className="p-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all group border border-white/5"
                title="Disconnect Session"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="px-6 py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold rounded-xl border border-emerald-500/20 transition-all uppercase tracking-widest"
            >
              Authorize
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
