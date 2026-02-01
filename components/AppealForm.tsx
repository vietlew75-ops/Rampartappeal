import React, { useState, useEffect } from 'react';
// Fix: Correct modular imports from firebase/firestore
import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from '../firebase';
import { UserState, Appeal } from '../types';

interface AppealFormProps {
  user: UserState;
}

const AppealForm: React.FC<AppealFormProps> = ({ user }) => {
  const [formData, setFormData] = useState({
    username: '',
    discordTag: '',
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
        discordTag: formData.discordTag.trim(),
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
      setFormData({ username: '', discordTag: '', reason: '', explanation: '', manualEmail: '' });
      fetchMyAppeals();
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error("Error adding appeal:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'denied': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-10">
      <div className="glass rounded-[2rem] p-8 sm:p-10 relative overflow-hidden border border-white/10 shadow-xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white minecraft-font">Submit Appeal</h2>
          <p className="text-gray-500 text-sm mt-1">Please provide accurate details for a faster review.</p>
        </div>
        
        {success && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 flex items-center gap-3 animate-in zoom-in-95 duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            Appeal submitted successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">MC Username</label>
            <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500/50 transition-all text-sm" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Discord Tag</label>
            <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500/50 transition-all text-sm" value={formData.discordTag} onChange={(e) => setFormData({...formData, discordTag: e.target.value})} />
          </div>
          {user.isGuest && (
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Contact Email</label>
              <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500/50 transition-all text-sm" value={formData.manualEmail} onChange={(e) => setFormData({...formData, manualEmail: e.target.value})} />
            </div>
          )}
          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Ban Reason</label>
            <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500/50 transition-all text-sm" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Detailed Explanation</label>
            <textarea required rows={5} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500/50 transition-all text-sm resize-none" value={formData.explanation} onChange={(e) => setFormData({...formData, explanation: e.target.value})} />
          </div>
          <button 
            type="submit" 
            disabled={submitting} 
            className="col-span-1 md:col-span-2 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            {submitting ? "Processing..." : "Submit Plea"}
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold px-2 text-white minecraft-font">Your Submission History</h2>
        {myAppeals.length === 0 ? (
          <div className="glass p-12 rounded-[2rem] text-center text-gray-500 italic text-sm">No appeals found for your session.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myAppeals.map((appeal) => (
              <div key={appeal.id} className="glass p-6 rounded-3xl border-l-4 border-emerald-500 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-bold text-lg text-white block">{appeal.username}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{new Date(appeal.timestamp).toLocaleString()}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(appeal.status)}`}>
                    {appeal.status}
                  </span>
                </div>
                <p className="text-gray-400 text-xs line-clamp-2">"{appeal.reason}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppealForm;