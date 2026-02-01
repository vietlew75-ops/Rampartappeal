import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
import { Appeal } from '../types';

const AdminDashboard: React.FC = () => {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "appeals"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Appeal[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Appeal);
      });
      setAppeals(data);
      setLoading(false);
    }, (error) => {
      console.error("Admin real-time listener failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (status: 'approved' | 'denied') => {
    if (!selectedAppeal) return;

    try {
      const appealRef = doc(db, "appeals", selectedAppeal.id);
      await updateDoc(appealRef, {
        status,
        adminNote: adminNote || (status === 'approved' ? 'Unbanned. Please follow rules.' : 'Appeal rejected.')
      });
      setSelectedAppeal(null);
      setAdminNote('');
    } catch (error) {
      console.error("Error updating appeal:", error);
      alert("Failed to update appeal status. Check console for details.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'denied': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl gap-4">
      <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      <p className="text-gray-400 font-medium">Loading Dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl">
             <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          Staff Panel
        </h1>
        <div className="flex gap-4">
          <div className="glass px-4 py-2 rounded-xl text-sm font-medium">
            <span className="text-gray-500 mr-2">Total:</span> {appeals.length}
          </div>
          <div className="glass px-4 py-2 rounded-xl text-sm font-medium">
            <span className="text-yellow-500 mr-2">Pending:</span> {appeals.filter(a => a.status === 'pending').length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appeal List */}
        <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {appeals.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl text-gray-500">
              No appeals found.
            </div>
          ) : (
            appeals.map((appeal) => (
              <div 
                key={appeal.id}
                onClick={() => setSelectedAppeal(appeal)}
                className={`glass p-5 rounded-2xl cursor-pointer transition-all border-l-4 hover:translate-x-1 ${
                  selectedAppeal?.id === appeal.id ? 'border-emerald-500 bg-white/10 ring-1 ring-emerald-500/20' : 'border-transparent hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm minecraft-font uppercase tracking-wider line-clamp-1">{appeal.username}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadge(appeal.status)}`}>
                    {appeal.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-1 mb-2">{appeal.reason}</p>
                <div className="text-[10px] text-gray-500 flex justify-between">
                  <span>{new Date(appeal.timestamp).toLocaleDateString()}</span>
                  <span className="truncate ml-2">{appeal.discordTag}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Appeal View */}
        <div className="lg:col-span-2">
          {selectedAppeal ? (
            <div className="glass rounded-3xl p-8 sticky top-24 border border-emerald-500/10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold minecraft-font text-emerald-400">{selectedAppeal.username}</h2>
                  <p className="text-sm text-gray-500 truncate max-w-xs">{selectedAppeal.userEmail || "No Email Provided"} • {selectedAppeal.discordTag}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase border ${getStatusBadge(selectedAppeal.status)}`}>
                  {selectedAppeal.status}
                </span>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500/70 mb-2">Ban Reason</h3>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 italic text-gray-300">
                    "{selectedAppeal.reason}"
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500/70 mb-2">Detailed Explanation</h3>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10 leading-relaxed text-gray-300 whitespace-pre-wrap">
                    {selectedAppeal.explanation}
                  </div>
                </div>
              </div>

              {selectedAppeal.status === 'pending' ? (
                <div className="space-y-4 pt-6 border-t border-white/10">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500 ml-1">Admin Decision Note</label>
                    <textarea 
                      placeholder="Add a note to the player (optional)..."
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 transition-all resize-none"
                      rows={3}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleUpdateStatus('denied')}
                      className="py-3 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-xl font-bold transition-all"
                    >
                      Reject Appeal
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('approved')}
                      className="py-3 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl font-bold transition-all"
                    >
                      Accept Appeal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Decision Note</h3>
                  <p className="text-sm text-emerald-400/70 italic bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                    "{selectedAppeal.adminNote || "No note provided."}"
                  </p>
                  <button 
                    onClick={() => setSelectedAppeal(null)}
                    className="mt-4 text-xs text-gray-500 hover:text-white underline transition-colors"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass rounded-3xl p-20 flex flex-col items-center justify-center text-center opacity-50 border-dashed">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Review Appeals</h3>
              <p className="text-sm text-gray-500">Select an appeal from the list on the left to review details and make a decision.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;