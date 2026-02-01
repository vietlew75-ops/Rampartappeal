
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from "firebase/firestore";
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
    <div className="space-y-8">
      <div className="glass rounded-3xl p-8 relative overflow-hidden border border-white/5">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">Submit New Appeal</h2>
        {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">Appeal sent!</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input required placeholder="Minecraft Username" className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
          <input required placeholder="Discord Tag" className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" value={formData.discordTag} onChange={(e) => setFormData({...formData, discordTag: e.target.value})} />
          {user.isGuest && <input required type="email" placeholder="Contact Email" className="col-span-1 md:col-span-2 bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" value={formData.manualEmail} onChange={(e) => setFormData({...formData, manualEmail: e.target.value})} />}
          <input required placeholder="Reason for Ban" className="col-span-1 md:col-span-2 bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
          <textarea required rows={5} placeholder="Explanation..." className="col-span-1 md:col-span-2 bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 resize-none" value={formData.explanation} onChange={(e) => setFormData({...formData, explanation: e.target.value})} />
          <button type="submit" disabled={submitting} className="col-span-1 md:col-span-2 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all">
            {submitting ? "Sending..." : "Send Appeal"}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold px-1">Your Appeals</h2>
        {myAppeals.map((appeal) => (
          <div key={appeal.id} className="glass p-6 rounded-2xl flex justify-between items-center border-l-4 border-emerald-500/50">
            <div>
              <span className="font-bold block">{appeal.username}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase border ${getStatusColor(appeal.status)}`}>{appeal.status}</span>
            </div>
            <span className="text-xs text-gray-500">{new Date(appeal.timestamp).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppealForm;
