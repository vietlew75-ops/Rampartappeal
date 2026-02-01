
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
    <header className="w-full px-6 py-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:bg-emerald-500 group-hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tighter uppercase minecraft-font leading-none text-white">
              Rampart
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-500">
              Redemption
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {user && user.isAdmin && (
            <div className="hidden sm:flex bg-white/[0.03] border border-white/10 rounded-xl p-1">
              <button 
                onClick={() => setActiveTab('submit')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'submit' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                Appeals
              </button>
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                Moderation
              </button>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-white tracking-widest">
                  {user.isGuest ? 'Anonymous' : user.displayName?.split(' ')[0]}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${user.isAdmin ? 'bg-emerald-400' : 'bg-blue-400'} animate-pulse`}></div>
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">
                    {user.isAdmin ? 'SysAdmin' : 'Identity Verified'}
                  </span>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="w-10 h-10 flex items-center justify-center glass rounded-xl hover:bg-red-500/10 hover:border-red-500/30 text-gray-500 hover:text-red-500 transition-all duration-300 group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="px-5 py-2.5 bg-white text-black hover:bg-emerald-500 hover:text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest shadow-xl"
            >
              Auth
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
