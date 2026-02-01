
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { Appeal } from '../types';

const AdminDashboard: React.FC = () => {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'error' | 'connected'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentEmail = auth.currentUser?.email;

  useEffect(() => {
    let isMounted = true;
    console.log("Admin: Establishing Realtime Sync...");

    const unsubscribe = db.collection("appeals")
      .onSnapshot((snapshot) => {
        if (!isMounted) return;
        
        const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Appeal));
        
        const sortedData = data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        console.log(`Admin: Received ${sortedData.length} records.`);
        setAppeals(sortedData);
        setLoading(false);
        setStatus('connected');
        setErrorMessage(null);
      }, (error) => {
        if (!isMounted) return;
        console.error("Firestore Registry Error:", error);
        setErrorMessage(error.message);
        setLoading(false);
        setStatus('error');
      });

    return () => { isMounted = false; unsubscribe(); };
  }, [currentEmail]);

  const handleUpdateStatus = async (status: 'approved' | 'denied') => {
    if (!selectedAppeal) return;
    try {
      await db.collection("appeals").doc(selectedAppeal.id).update({
        status,
        adminNote: adminNote || (status === 'approved' ? 'Redemption granted.' : 'Appeal rejected.')
      });
      setSelectedAppeal(null);
      setAdminNote('');
    } catch (error: any) {
      alert("Permission Error: " + error.message);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-32 glass rounded-[2rem]">
      <div className="w-12 h-12 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Syncing Registry...</span>
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
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                {status === 'connected' ? 'Link Live' : 'Blocked'}
              </span>
            </div>
          </div>
          <span className="text-[9px] font-mono text-white/40">{appeals.length} Entries</span>
        </div>

        <div className={`mx-2 p-3 border rounded-xl flex flex-col gap-1 transition-all ${status === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/[0.02] border-white/5'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Operator:</span>
              <span className="text-[9px] font-bold text-emerald-500 truncate">{currentEmail}</span>
            </div>
            {errorMessage && (
              <span className="text-[7px] text-red-400 font-mono mt-1">ERR: Permission Blocked</span>
            )}
        </div>
        
        <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-3">
          {appeals.length === 0 ? (
            <div className="p-12 glass rounded-2xl border-dashed border border-white/5 text-center">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-loose">
                Empty Registry.<br/>
              </p>
            </div>
          ) : (
            appeals.map((appeal) => (
              <button 
                key={appeal.id} 
                onClick={() => setSelectedAppeal(appeal)} 
                className={`w-full text-left p-4 rounded-xl transition-all border flex items-center gap-4 ${selectedAppeal?.id === appeal.id ? 'glass border-emerald-500/40' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}
              >
                <div className="w-10 h-10 glass rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                  <img src={`https://minotar.net/helm/${appeal.username}/64.png`} alt="" className="w-full h-full pixelated" />
                </div>
                <div className="flex-grow flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-xs text-white uppercase tracking-tight">{appeal.username}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${appeal.status === 'approved' ? 'bg-emerald-500' : appeal.status === 'denied' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">{appeal.status}</span>
                    <span className="text-[8px] text-gray-600 font-mono">{new Date(appeal.timestamp).toLocaleDateString()}</span>
                  </div>
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
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 glass rounded-2xl border border-white/10 overflow-hidden flex-shrink-0">
                  <img src={`https://minotar.net/helm/${selectedAppeal.username}/128.png`} alt="" className="w-full h-full pixelated" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{selectedAppeal.username}</h2>
                  <span className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest">{selectedAppeal.userEmail}</span>
                </div>
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[8px] font-black uppercase tracking-widest text-gray-500">
                Active Audit
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Violation</span>
                <p className="text-sm font-bold text-white/90">{selectedAppeal.reason}</p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Plea details</span>
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                  <p className="text-sm text-gray-300 italic leading-relaxed">"{selectedAppeal.explanation}"</p>
                </div>
              </div>

              {selectedAppeal.status === 'pending' ? (
                <div className="pt-4 space-y-4">
                  <textarea 
                    placeholder="Official verdict notes..."
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-medium"
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                  <div className="flex gap-4">
                    <button onClick={() => handleUpdateStatus('denied')} className="flex-1 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">Reject Case</button>
                    <button onClick={() => handleUpdateStatus('approved')} className="flex-1 py-4 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">Approve Appeal</button>
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
            <p className="text-xs font-black uppercase tracking-[0.4em]">Audit queue empty.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
