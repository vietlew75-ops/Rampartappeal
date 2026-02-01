
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
    manualEmail: '' // For guests
  });
  const [submitting, setSubmitting] = useState(false);
  const [myAppeals, setMyAppeals] = useState<Appeal[]>([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchMyAppeals();
  }, [user]);

  const fetchMyAppeals = async () => {
    try {
      // Use authenticated email or guest UID for tracking
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
        username: formData.username,
        discordTag: formData.discordTag,
        reason: formData.reason,
        explanation: formData.explanation,
        userEmail: emailToStore,
        timestamp: Date.now(),
        status: 'pending',
        uid: user.uid,
        isGuestAppeal: user.isGuest
      });
      setSuccess(true);
      setFormData({ username: '', discordTag: '', reason: '', explanation: '', manualEmail: '' });
      fetchMyAppeals();
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error("Error adding appeal:", error);
      alert("Something went wrong. Please try again.");
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="glass rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {user.isGuest && (
          <div className="absolute top-0 right-0 px-4 py-1 bg-white/10 text-[10px] uppercase font-bold tracking-widest text-gray-400 rounded-bl-xl border-l border-b border-white/10">
            Guest Session
          </div>
        )}
        
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Submit New Appeal
        </h2>

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-3 animate-in bounce-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Appeal submitted successfully! Our staff will review it soon.
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1">Minecraft Username</label>
            <input 
              required
              placeholder="e.g. Dream"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1">Discord Tag</label>
            <input 
              required
              placeholder="e.g. user#1234"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              value={formData.discordTag}
              onChange={(e) => setFormData({...formData, discordTag: e.target.value})}
            />
          </div>

          {user.isGuest && (
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-gray-400 ml-1">Contact Email (Required for Guest)</label>
              <input 
                required
                type="email"
                placeholder="Where can we reach you?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                value={formData.manualEmail}
                onChange={(e) => setFormData({...formData, manualEmail: e.target.value})}
              />
            </div>
          )}

          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1">Reason for Ban</label>
            <input 
              required
              placeholder="What were you banned for?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-gray-400 ml-1">Why should you be unbanned?</label>
            <textarea 
              required
              rows={5}
              placeholder="Please provide an honest and detailed explanation..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
              value={formData.explanation}
              onChange={(e) => setFormData({...formData, explanation: e.target.value})}
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : "Send Appeal"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold px-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Your Recent Appeals
        </h2>
        {myAppeals.length === 0 ? (
          <div className="glass p-8 rounded-2xl text-center text-gray-500 border-dashed">
            {user.isGuest ? "No appeals found for this guest session." : "You haven't submitted any appeals yet."}
          </div>
        ) : (
          <div className="grid gap-4">
            {myAppeals.map((appeal) => (
              <div key={appeal.id} className="glass p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-emerald-500/50 relative overflow-hidden">
                {appeal.isGuestAppeal && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-white/5 text-[8px] text-gray-600 uppercase font-bold rounded-bl">Guest</div>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-lg minecraft-font uppercase tracking-wider">{appeal.username}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(appeal.status)}`}>
                      {appeal.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-1">Reason: {appeal.reason}</p>
                </div>
                <div className="text-right flex flex-col items-start md:items-end">
                  <span className="text-xs text-gray-500 font-medium">
                    {new Date(appeal.timestamp).toLocaleDateString()}
                  </span>
                  {appeal.adminNote && (
                    <span className="text-xs text-emerald-400/80 mt-1 italic">Note: {appeal.adminNote}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppealForm;
