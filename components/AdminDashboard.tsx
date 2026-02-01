
import React, { useState, useEffect } from 'react';
// Combine all Firestore modular functions into a single named import line
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from '../firebase';
import { Appeal } from '../types';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const AdminDashboard: React.FC = () => {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

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

  const handleAiAnalyze = async () => {
    if (!selectedAppeal) return;
    setAiAnalyzing(true);
    setAiInsight(null);
    try {
      // Create new GoogleGenAI instance right before making the call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Explicitly type the response to GenerateContentResponse
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
      // Access .text property directly (not as a method)
      setAiInsight(response.text || "Analysis complete.");
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      setAiInsight("AI analysis is currently unavailable.");
    } finally {
      setAiAnalyzing(false);
    }
  };

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
      setAiInsight(null);
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  if (loading) return (
    <div className="text-center p-20 glass rounded-[2.5rem]">
      <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs">Accessing Database...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-2xl font-bold text-white minecraft-font">Staff Dashboard</h1>
          <p className="text-gray-500 text-xs">Managing {appeals.length} active cases</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left List */}
        <div className="lg:col-span-4 space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar pr-3">
          {appeals.length === 0 ? (
            <div className="p-10 text-center opacity-30 text-xs italic">No entries yet.</div>
          ) : (
            appeals.map((appeal) => (
              <div 
                key={appeal.id} 
                onClick={() => {
                  setSelectedAppeal(appeal);
                  setAiInsight(null);
                }} 
                className={`glass p-5 rounded-2xl cursor-pointer transition-all border-l-4 shadow-sm relative group ${selectedAppeal?.id === appeal.id ? 'border-emerald-500 bg-white/5' : 'border-transparent hover:border-white/20'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold text-sm ${selectedAppeal?.id === appeal.id ? 'text-emerald-400' : 'text-gray-300'}`}>{appeal.username}</span>
                  <div className={`w-2 h-2 rounded-full ${appeal.status === 'approved' ? 'bg-emerald-500' : appeal.status === 'denied' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">{appeal.status}</p>
                  <p className="text-[8px] text-gray-600 font-mono">{new Date(appeal.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Detail */}
        <div className="lg:col-span-8">
          {selectedAppeal ? (
            <div className="glass rounded-[2rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden h-full flex flex-col">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">{selectedAppeal.username}</h2>
                  <div className="flex gap-4 text-[10px] text-gray-500 font-mono uppercase tracking-tighter">
                    <span>Discord: {selectedAppeal.discordTag}</span>
                    <span className="opacity-40">|</span>
                    <span>Email: {selectedAppeal.userEmail || 'N/A'}</span>
                  </div>
                </div>
                <button 
                  onClick={handleAiAnalyze}
                  disabled={aiAnalyzing}
                  className="px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-xl border border-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${aiAnalyzing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {aiAnalyzing ? "ANALYZING..." : "AI INSIGHT"}
                </button>
              </div>

              <div className="flex-grow space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-bold">Case Context</label>
                  <div className="text-sm text-gray-300 bg-white/5 p-8 rounded-3xl border border-white/5 leading-relaxed font-serif italic shadow-inner">
                    "{selectedAppeal.explanation}"
                  </div>
                </div>

                {aiInsight && (
                  <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-400">
                    <h4 className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></div>
                      Staff Intelligence Verdict
                    </h4>
                    <p className="text-xs text-indigo-200/70 leading-relaxed italic">"{aiInsight}"</p>
                  </div>
                )}

                {selectedAppeal.status === 'pending' && (
                  <div className="space-y-6 pt-6 mt-auto">
                    <textarea 
                      placeholder="Enter verdict notes for the record..." 
                      className="w-full bg-black/20 border border-white/10 rounded-2xl p-5 text-sm text-gray-300 outline-none focus:border-emerald-500/30 transition-all resize-none" 
                      rows={2} 
                      value={adminNote} 
                      onChange={(e) => setAdminNote(e.target.value)} 
                    />
                    <div className="flex items-center justify-center gap-12 sm:gap-20">
                      <button 
                        onClick={() => handleUpdateStatus('denied')} 
                        className="group transition-all active:scale-95"
                        title="Deny Appeal"
                      >
                        <div className="relative">
                          <div className="absolute -inset-4 bg-red-500/0 group-hover:bg-red-500/10 rounded-full blur-xl transition-all" />
                          <img src="./deny.png" alt="Deny" className="h-16 sm:h-24 w-auto object-contain drop-shadow-2xl group-hover:scale-110 transition-transform" />
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => handleUpdateStatus('approved')} 
                        className="group transition-all active:scale-95"
                        title="Accept Appeal"
                      >
                        <div className="relative">
                          <div className="absolute -inset-4 bg-emerald-500/0 group-hover:bg-emerald-500/10 rounded-full blur-xl transition-all" />
                          <img src="./accept.png" alt="Accept" className="h-16 sm:h-24 w-auto object-contain drop-shadow-2xl group-hover:scale-110 transition-transform" />
                        </div>
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedAppeal.status !== 'pending' && (
                  <div className="p-8 bg-white/5 rounded-3xl border border-white/5 text-center flex flex-col items-center gap-6 mt-auto">
                    <img 
                      src={selectedAppeal.status === 'approved' ? './accept.png' : './deny.png'} 
                      className="h-12 opacity-40" 
                      alt="" 
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-gray-600 font-bold tracking-[0.4em]">Judgment Recorded</span>
                      <p className="text-xs text-gray-500 italic">"{selectedAppeal.adminNote}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass rounded-[2.5rem] p-24 text-center border-dashed border-2 border-white/5 bg-white/[0.01] h-full flex flex-col justify-center items-center">
              <svg className="w-12 h-12 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">Select a soul for evaluation</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
