
import React, { useState, useEffect } from 'react';
import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from '../firebase';
import { UserState, Appeal } from '../types';

interface AppealFormProps {
  user: UserState;
}

const AppealForm: React.FC<AppealFormProps> = ({ user }) => {
  const [formData, setFormData] = useState({
    username: '',
    reason: '',
    explanation: '',
    manualEmail: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [myAppeals, setMyAppeals] = useState<Appeal[]>([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchMyAppeals();
  }, [user]);

  const fetchMyAppeals = async () => {
    try {
      const identifier = user.isGuest ? user.uid : user.email;
      const field = user.isGuest ? "uid" : "userEmail";

      const q = query(
        collection(db, "appeals"),
        where(field, "==", identifier),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const appealsData: Appeal[] = [];
      querySnapshot.forEach((doc) => {
        appealsData.push({ id: doc.id, ...doc.data() } as Appeal);
      });
      setMyAppeals(appealsData);
    } catch (error) {
      console.error("Error fetching appeals:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const emailToStore = user.isGuest ? formData.manualEmail : user.email;

    try {
      await addDoc(collection(db, "appeals"), {
        username: formData.username.trim(),
        reason: formData.reason.trim(),
        explanation: formData.explanation.trim(),
        userEmail: emailToStore,
        timestamp: Date.now(),
        status: 'pending',
        uid: user.uid,
        isGuestAppeal: user.isGuest,
        authType: user.isGuest ? 'guest' : 'google'
      });
      setSuccess(true);
      setFormData({ username: '', reason: '', explanation: '', manualEmail: '' });
      fetchMyAppeals();
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error("Error adding appeal:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pending Review', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
      case 'approved': return { label: 'Redeemed', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
      case 'denied': return { label: 'Judgment Final', color: 'text-red-400 bg-red-400/10 border-red-400/20' };
      default: return { label: 'Unknown', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Submission Form Section */}
      <div className="lg:col-span-7 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Case Submission</h2>
          <p className="text-gray-500 text-sm font-medium">Please provide an honest account of the events leading to your restriction.</p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            Case logged successfully. Await moderation.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Minecraft Alias</label>
            <input 
              required 
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-sm font-medium" 
              placeholder="Minecraft Username"
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
            />
          </div>

          {user.isGuest && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Notification Email</label>
              <input 
                required 
                type="email" 
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-sm font-medium" 
                placeholder="email@example.com"
                value={formData.manualEmail} 
                onChange={(e) => setFormData({...formData, manualEmail: e.target.value})} 
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Violation Category</label>
            <input 
              required 
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-sm font-medium" 
              placeholder="e.g. Unfair Advantage / Harassment"
              value={formData.reason} 
              onChange={(e) => setFormData({...formData, reason: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">The Defense</label>
            <textarea 
              required 
              rows={6} 
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-sm font-medium resize-none leading-relaxed" 
              placeholder="Provide a detailed, professional account of the incident..."
              value={formData.explanation} 
              onChange={(e) => setFormData({...formData, explanation: e.target.value})} 
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full py-4 bg-white text-black hover:bg-emerald-500 hover:text-white disabled:opacity-20 font-black rounded-xl transition-all duration-300 uppercase tracking-[0.2em] text-[11px] shadow-2xl flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
            ) : "Log Appeal Entry"}
          </button>
        </form>
      </div>

      {/* History Section Section */}
      <div className="lg:col-span-5 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-black text-white uppercase tracking-wider minecraft-font">Registry History</h2>
          <div className="h-1 w-12 bg-emerald-500 rounded-full"></div>
        </div>

        {myAppeals.length === 0 ? (
          <div className="glass p-16 rounded-[2rem] text-center border-dashed border-2 border-white/5 flex flex-col items-center gap-4">
            <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">No active cases found<br/>for your current session.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {myAppeals.map((appeal) => {
              const status = getStatusDisplay(appeal.status);
              return (
                <div key={appeal.id} className="glass p-6 rounded-2xl border-l-2 border-white/10 hover:border-emerald-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-white uppercase tracking-tight">{appeal.username}</span>
                      <span className="text-[9px] text-gray-500 font-bold font-mono mt-0.5">{new Date(appeal.timestamp).toLocaleDateString()} · {appeal.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11px] font-medium italic leading-relaxed line-clamp-2">"{appeal.reason}"</p>
                  {appeal.adminNote && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Admin Note:</span>
                      <p className="text-gray-500 text-[10px] mt-1 italic">"{appeal.adminNote}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppealForm;