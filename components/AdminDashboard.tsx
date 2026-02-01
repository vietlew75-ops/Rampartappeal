
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { Appeal } from '../types';

const AdminDashboard: React.FC = () => {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'error' | 'connected'>('idle');
  const [refreshKey, setRefreshKey] = useState(0);
  const currentEmail = auth.currentUser?.email;

  useEffect(() => {
    console.log(`Admin Dashboard: Monitoring Registry as ${currentEmail}...`);
    setStatus('idle');
    
    const unsubscribe = db.collection("appeals")
      .onSnapshot((snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appeal));
        const sortedData = data.sort((a, b) => b.timestamp - a.timestamp);
        
        console.log(`Admin Dashboard: Sync Successful. Received ${sortedData.length} records.`);
        setAppeals(sortedData);
        setLoading(false);
        setStatus('connected');
      }, (error) => {
        console.error("FIRESTORE PERMISSION ERROR:", error);
        console.warn("Check your Firestore Security Rules! Ensure lewooon959@gmail.com has read access.");
        setLoading(false);
        setStatus('error');
      });

    return () => unsubscribe();
  }, [refreshKey, currentEmail]);

  const handleManualRefresh = () => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  const handleUpdateStatus = async (status: 'approved' | 'denied') => {
    if (!selectedAppeal) return;
    try {
      await db.collection("appeals").doc(selectedAppeal.id).update({
        status,
        adminNote: adminNote || (status === 'approved' ? 'Redemption granted.' : 'Appeal rejected.')
      });
      setSelectedAppeal(null);
      setAdminNote('');
    } catch (error) {
      console.error("Update failed:", error);
      alert("Permission Denied: Ensure your Firestore rules allow 'update' for your email.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-32 glass rounded-[2rem]">
      <div className="w-12 h-12 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Connecting to Registry...</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Registry List */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex justify-between items-center px-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Central Registry</h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-500 animate-pulse'}`}></div>
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                {status === 'connected' ? 'Live Stream' : status === 'error' ? 'Connection Blocked' : 'Connecting...'}
              </span>
            </div>
          </div>
          <button 
            onClick={handleManualRefresh}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
            title="Force Reconnect"
          >
            <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Identity Verification Bar */}
        <div className={`mx-2 p-3 border rounded-xl flex items-center justify-between transition-all ${status === 'error' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-white/5'}`}>
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Active ID:</span>
            <span className={`text-[9px] font-bold truncate max-w-[150px] ${status === 'error' ? 'text-red-400' : 'text-emerald-500'}`}>{currentEmail}</span>
        </div>

        {status === 'error' && (
          <div className="mx-2 p-4 glass border-red-500/20 rounded-xl">
            <p className="text-[10px] text-red-400 font-bold leading-relaxed">
              DATABASE BLOCKED: Your Firestore Security Rules are preventing access. Ensure you have published the rules I provided.
            </p>
          </div>
        )}
        
        <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-3">
          {appeals.length === 0 ? (
            <div className="p-12 glass rounded-2xl border-dashed border border-white/5 text-center">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-loose">
                Registry is empty.<br/>
                <span className="text-emerald-500/50 normal-case italic">Waiting for incoming transmission...</span>
              </p>
            </div>
          ) : (
            appeals.map((appeal) => (
              <button 
                key={appeal.id} 
                onClick={() => setSelectedAppeal(appeal)} 
                className={`w-full text-left p-4 rounded-xl transition-all border flex flex-col gap-1.5 ${selectedAppeal?.id === appeal.id ? 'glass border-emerald-500/40' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs text-white uppercase tracking-tight">{appeal.username}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${appeal.status === 'approved' ? 'bg-emerald-500' : appeal.status === 'denied' ? 'bg-red-500' : 'bg-amber-500'}`} />
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
                    {appeal.status}
                  </span>
                  <span className="text-[8px] text-gray-600 font-mono">{new Date(appeal.timestamp).toLocaleDateString()}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail Review */}
      <div className="lg:col-span-8 h-full">
        {selectedAppeal ? (
          <div className="glass rounded-[2rem] border border-white/10 flex flex-col shadow-3xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{selectedAppeal.username}</h2>
                <span className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest">{selectedAppeal.userEmail}</span>
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[8px] font-black uppercase tracking-widest text-gray-500">
                Active Docket
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Violation</span>
                <p className="text-sm font-bold text-white/90">{selectedAppeal.reason}</p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Plea Statement</span>
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                  <p className="text-sm text-gray-300 italic leading-relaxed">"{selectedAppeal.explanation}"</p>
                </div>
              </div>

              {selectedAppeal.status === 'pending' ? (
                <div className="pt-4 space-y-4">
                  <textarea 
                    placeholder="Verdict notes for the user..."
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-medium"
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                  <div className="flex gap-4">
                    <button onClick={() => handleUpdateStatus('denied')} className="flex-1 py-4 border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">Reject Case</button>
                    <button onClick={() => handleUpdateStatus('approved')} className="flex-1 py-4 border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">Grant Appeal</button>
                  </div>
                </div>
              ) : (
                <div className="pt-8 border-t border-white/5 text-center">
                  <div className={`px-4 py-1.5 inline-block rounded-full text-[10px] font-black uppercase tracking-[0.3em] border ${selectedAppeal.status === 'approved' ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}`}>
                    Verdict: {selectedAppeal.status}
                  </div>
                  {selectedAppeal.adminNote && (
                    <p className="mt-4 text-[10px] text-gray-500 italic">Admin Remark: "{selectedAppeal.adminNote}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass rounded-[2rem] h-full flex items-center justify-center opacity-30 p-24 text-center border-dashed border-2 border-white/5">
            <p className="text-xs font-black uppercase tracking-[0.4em]">Select case for manual audit.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
