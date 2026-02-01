
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from "firebase/firestore";
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
        adminNote: adminNote || (status === 'approved' ? 'Unbanned.' : 'Denied.')
      });
      setSelectedAppeal(null);
      setAdminNote('');
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  if (loading) return <div className="text-center p-12 glass rounded-3xl">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Staff Panel</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {appeals.map((appeal) => (
            <div key={appeal.id} onClick={() => setSelectedAppeal(appeal)} className={`glass p-5 rounded-2xl cursor-pointer transition-all border-l-4 ${selectedAppeal?.id === appeal.id ? 'border-emerald-500 bg-white/10' : 'border-transparent'}`}>
              <div className="flex justify-between font-bold text-sm mb-1">
                <span>{appeal.username}</span>
                <span className="text-[10px] uppercase opacity-50">{appeal.status}</span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-1">{appeal.reason}</p>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2">
          {selectedAppeal ? (
            <div className="glass rounded-3xl p-8 border border-emerald-500/10">
              <h2 className="text-2xl font-bold text-emerald-400 mb-6">{selectedAppeal.username}</h2>
              <p className="mb-4 text-gray-300 bg-white/5 p-4 rounded-xl">"{selectedAppeal.explanation}"</p>
              {selectedAppeal.status === 'pending' && (
                <div className="space-y-4">
                  <textarea placeholder="Note..." className="w-full bg-black/20 border border-white/10 rounded-xl p-4" rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleUpdateStatus('denied')} className="py-3 bg-red-500/20 text-red-500 rounded-xl font-bold">Reject</button>
                    <button onClick={() => handleUpdateStatus('approved')} className="py-3 bg-emerald-500/20 text-emerald-500 rounded-xl font-bold">Accept</button>
                  </div>
                </div>
              )}
            </div>
          ) : <div className="glass rounded-3xl p-20 text-center opacity-50">Select an appeal</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
