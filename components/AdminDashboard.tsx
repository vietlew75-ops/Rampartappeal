
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { db } from '../firebase';
import { Appeal } from '../types';

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
      }, (error) => {
        console.error("Snapshot error:", error);
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
        <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-4 px-2">The Registry</h3>
        {appeals.length === 0 ? (
          <div className="text-gray-500 text-xs italic p-6 glass rounded-2xl border-dashed border border-white/5">No records found.</div>
        ) : (
          appeals.map((appeal) => (
            <div 
              key={appeal.id} 
              onClick={() => {
                setSelectedAppeal(appeal);
                setAiInsight(null);
              }} 
              className={`glass p-5 rounded-2xl cursor-pointer transition-all border-l-4 ${selectedAppeal?.id === appeal.id ? 'border-emerald-500 bg-white/5' : 'border-transparent hover:border-white/10'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-200">{appeal.username}</span>
                <div className={`w-2 h-2 rounded-full ${appeal.status === 'approved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : appeal.status === 'denied' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-yellow-500 animate-pulse'}`} />
              </div>
              <p className="text-[9px] text-gray-500 uppercase mt-1 tracking-wider">{appeal.status}</p>
            </div>
          ))
        )}
      </div>

      {/* Main Panel */}
      <div className="lg:col-span-8">
        {selectedAppeal ? (
          <div className="glass rounded-[2rem] p-8 border border-white/10 h-full flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white minecraft-font">{selectedAppeal.username}</h2>
                <p className="text-[10px] text-emerald-500/60 font-mono mt-1 uppercase tracking-tighter">Sinner ID: {selectedAppeal.id}</p>
              </div>
              <button 
                onClick={handleAiAnalyze}
                disabled={aiAnalyzing}
                className="px-4 py-2 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
              >
                {aiAnalyzing ? "CONSULTING..." : "AI VERDICT"}
              </button>
            </div>

            <div className="flex-grow space-y-6">
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Confession</span>
                <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
                  <p className="text-sm text-gray-300 italic leading-relaxed">"{selectedAppeal.explanation}"</p>
                </div>
              </div>

              {aiInsight && (
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></div>
                    AI Observation
                  </span>
                  <p className="text-xs text-indigo-200 mt-1 italic">{aiInsight}</p>
                </div>
              )}

              {selectedAppeal.status === 'pending' && (
                <div className="mt-auto pt-6 space-y-6">
                  <textarea 
                    placeholder="Enter final judgment notes for the record..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all"
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                  <div className="flex justify-center gap-6 sm:gap-8 items-center">
                    <button 
                      onClick={() => handleUpdateStatus('denied')} 
                      className="group flex flex-col items-center gap-2 focus:outline-none"
                    >
                      <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shadow-lg group-hover:shadow-red-500/40">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest group-hover:text-red-500 transition-colors">Banish</span>
                    </button>

                    <div className="h-12 w-px bg-white/10"></div>

                    <button 
                      onClick={() => handleUpdateStatus('approved')} 
                      className="group flex flex-col items-center gap-2 focus:outline-none"
                    >
                      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg group-hover:shadow-emerald-500/40">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Redeem</span>
                    </button>
                  </div>
                </div>
              )}
              
              {selectedAppeal.status !== 'pending' && (
                <div className="mt-auto p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-gray-500 font-bold">Verdict Logged</span>
                  <p className="text-xs text-gray-400 mt-2 italic">"{selectedAppeal.adminNote || 'No notes provided.'}"</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass rounded-[2.5rem] h-full flex flex-col items-center justify-center opacity-30 p-12 text-center border-dashed border-2 border-white/5">
            <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="italic text-xs tracking-widest">Select a record to begin the trial of redemption...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
