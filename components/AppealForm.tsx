
import React, { useState, useEffect } from 'react';
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
  const [success, setSuccess] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState('https://minotar.net/helm/Steve/128.png');

  // Debounced avatar update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username.trim().length > 2) {
        setAvatarUrl(`https://minotar.net/helm/${formData.username.trim()}/128.png`);
      } else {
        setAvatarUrl('https://minotar.net/helm/Steve/128.png');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  useEffect(() => {
    const identifier = user.isGuest ? user.uid : user.email;
    const field = user.isGuest ? "uid" : "userEmail";

    if (!identifier) return;

    const unsubscribe = db.collection("appeals")
      .where(field, "==", identifier)
      .onSnapshot((snapshot) => {
        const appealsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Appeal));
        
        const sorted = appealsData.sort((a, b) => b.timestamp - a.timestamp);
        setMyAppeals(sorted);
      }, (error) => {
        console.error("User Appeals Watch Error:", error);
      });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    setSuccess(false);

    const emailToStore = user.isGuest ? formData.manualEmail : user.email;

    const newAppealData = {
      username: formData.username.trim(),
      reason: formData.reason.trim(),
      explanation: formData.explanation.trim(),
      userEmail: emailToStore || 'anonymous',
      timestamp: Date.now(),
      status: 'pending',
      uid: user.uid,
      isGuestAppeal: user.isGuest,
      authType: user.isGuest ? 'guest' : 'google'
    };

    try {
      await db.collection("appeals").add(newAppealData);
      setSuccess(true);
      setFormData({ username: '', reason: '', explanation: '', manualEmail: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      alert("Submission Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'In Queue', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
      case 'approved': return { label: 'Redeemed', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
      case 'denied': return { label: 'Rejected', color: 'text-red-400 bg-red-400/10 border-red-400/20' };
      default: return { label: 'Unknown', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-7 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Case Submission</h2>
          <p className="text-gray-500 text-sm font-medium">Your plea will be logged in the central registry for review.</p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            Transmission Complete.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 glass rounded-[2rem] p-3 border border-white/10 shadow-2xl overflow-hidden bg-black/40">
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-contain pixelated drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  onError={(e) => (e.currentTarget.src = 'https://minotar.net/helm/Steve/128.png')}
                />
              </div>
              <div className="mt-2 text-center">
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Linked Identity</span>
              </div>
            </div>

            <div className="flex-grow space-y-6 w-full">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Minecraft Alias</label>
                <input required disabled={submitting} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-sm font-medium" placeholder="Minecraft Username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
              </div>

              {user.isGuest && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Contact Email</label>
                  <input required type="email" disabled={submitting} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-sm font-medium" placeholder="email@example.com" value={formData.manualEmail} onChange={(e) => setFormData({...formData, manualEmail: e.target.value})} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Violation</label>
            <input required disabled={submitting} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-sm font-medium" placeholder="What happened?" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">The Defense</label>
            <textarea required rows={5} disabled={submitting} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-sm font-medium resize-none leading-relaxed" placeholder="Tell us your side of the story..." value={formData.explanation} onChange={(e) => setFormData({...formData, explanation: e.target.value})} />
          </div>

          <button type="submit" disabled={submitting} className="w-full py-4 font-black rounded-xl transition-all duration-300 uppercase tracking-[0.2em] text-[11px] shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] bg-white text-black hover:bg-emerald-500 hover:text-white disabled:opacity-20">
            {submitting ? "Transmitting Plea..." : "Log Appeal Entry"}
          </button>
        </form>
      </div>

      <div className="lg:col-span-5 space-y-8">
        <h2 className="text-xl font-black text-white uppercase tracking-wider minecraft-font">Registry History</h2>
        {myAppeals.length === 0 ? (
          <div className="glass p-16 rounded-[2rem] text-center border-dashed border-2 border-white/5 opacity-50">
            <p className="text-[10px] font-bold uppercase tracking-widest">No previous cases found.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {myAppeals.map((appeal) => {
              const status = getStatusDisplay(appeal.status);
              return (
                <div key={appeal.id} className="glass p-6 rounded-2xl border-l-2 border-white/10 hover:border-emerald-500/50 transition-all flex gap-4">
                  <div className="w-10 h-10 glass rounded-lg border border-white/10 overflow-hidden flex-shrink-0">
                    <img src={`https://minotar.net/helm/${appeal.username}/64.png`} alt="" className="w-full h-full pixelated" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="font-black text-sm text-white uppercase tracking-tight">{appeal.username}</span>
                        <span className="text-[9px] text-gray-500 font-bold font-mono mt-0.5">{new Date(appeal.timestamp).toLocaleDateString()}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-gray-400 text-[10px] font-medium italic leading-relaxed line-clamp-1">"{appeal.reason}"</p>
                  </div>
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
