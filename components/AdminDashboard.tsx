
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { db } from '../firebase';
import { Appeal } from '../types';

// Use string paths instead of imports for static assets in an ESM browser environment
const acceptImg = './accept.png';
const denyImg = './deny.png';

const AdminDashboard: React.FC = () => {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = db.collection("appeals")
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appeal));
        setAppeals(data);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const handleAiAnalyze = async () => {
    if (!selectedAppeal) return;
    setAiAnalyzing(true);
    setAiInsight(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze this Minecraft ban appeal for honesty and remorse. Be direct.
        Username: ${selectedAppeal.username}
        Reason: ${selectedAppeal.reason}
        Explanation: ${selectedAppeal.explanation}`,
        config: {
          systemInstruction: "You are a senior community admin. Identify lies or genuine regret. Provide a 2-sentence verdict."
        }
      });
      setAiInsight(response.text || "Analysis complete.");
    } catch (error) {
      console.error("Gemini failed", error);
      setAiInsight("AI insight unavailable.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleUpdateStatus = async (status: 'approved' | 'denied') => {
    if (!selectedAppeal) return;
    try {
      await db.collection("appeals").doc(selectedAppeal.id).update({
        status,
        adminNote: adminNote || (status === 'approved' ? 'Unbanned.' : 'Denied.')
      });
      setSelectedAppeal(null);
      setAdminNote('');
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  if (loading) return (
    <div className="text-center p-20 glass rounded-[2.5rem]">
      <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Accessing Soul Registry...</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar pr-3">
        <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-4">The Registry</h3>
        {appeals.map((appeal) => (
          <div 
            key={appeal.id} 
            onClick={() => setSelectedAppeal(appeal)} 
            className={`glass p-5 rounded-2xl cursor-pointer transition-all border-l-4 ${selectedAppeal?.id === appeal.id ? 'border-emerald-500 bg-white/5' : 'border-transparent'}`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-gray-200">{appeal.username}</span>
              <div className={`w-2 h-2 rounded-full ${appeal.status === 'approved' ? 'bg-emerald-500' : appeal.status === 'denied' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            </div>
            <p className="text-[9px] text-gray-500 uppercase mt-1">{appeal.status}</p>
          </div>
        ))}
      </div>

      {/* Main Panel */}
      <div className="lg:col-span-8">
        {selectedAppeal ? (
          <div className="glass rounded-[2rem] p-8 border border-white/10 h-full flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white minecraft-font">{selectedAppeal.username}</h2>
                <p className="text-[10px] text-emerald-500/60 font-mono mt-1">Sinner ID: {selectedAppeal.id}</p>
              </div>
              <button 
                onClick={handleAiAnalyze}
                disabled={aiAnalyzing}
                className="px-4 py-2 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-xl border border-indigo-500/20"
              >
                {aiAnalyzing ? "CONSULTING..." : "AI VERDICT"}
              </button>
            </div>

            <div className="flex-grow space-y-6">
              <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-sm text-gray-300 italic leading-relaxed">"{selectedAppeal.explanation}"</p>
              </div>

              {aiInsight && (
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">AI Observation</span>
                  <p className="text-xs text-indigo-200 mt-1 italic">{aiInsight}</p>
                </div>
              )}

              {selectedAppeal.status === 'pending' && (
                <div className="mt-auto pt-6 space-y-4">
                  <textarea 
                    placeholder="Enter final judgment notes..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-emerald-500/50"
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                  <div className="flex justify-center gap-12">
                    <button onClick={() => handleUpdateStatus('denied')} className="hover:scale-110 transition-transform">
                      <img src={denyImg} alt="Deny" className="h-16" />
                    </button>
                    <button onClick={() => handleUpdateStatus('approved')} className="hover:scale-110 transition-transform">
                      <img src={acceptImg} alt="Accept" className="h-16" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass rounded-[2.5rem] h-full flex items-center justify-center opacity-30 italic text-xs">
            Select a record to begin the trial...
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
