
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
    // Compat API
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
          systemInstruction: "You are an elite community moderator. Identify manipulation, lies, or genuine regret. Provide a critical, professional verdict in exactly 2 short sentences."
        }
      });
      setAiInsight(response.text || "Analysis complete.");
    } catch (error) {
      console.error("Gemini failed", error);
      setAiInsight("AI insight currently unavailable.");
    } finally {
      setAiAnalyzing(false);
    }
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
      console.error("Update failed", error);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-32 glass rounded-[2rem] border-emerald-500/20">
      <div className="w-12 h-12 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Retrieving Registry...</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Registry High-Density List */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Central Registry</h3>
          <span className="text-[9px] font-bold text-white bg-white/10 px-2 py-0.5 rounded uppercase">{appeals.length} Cases</span>
        </div>
        
        <div className="space-y-2 max-h-[75vh] overflow-y-auto custom-scrollbar pr-3">
          {appeals.length === 0 ? (
            <div className="p-8 glass rounded-2xl border-dashed border border-white/5 text-center text-gray-600 text-[10px] font-bold uppercase">No records found.</div>
          ) : (
            appeals.map((appeal) => (
              <button 
                key={appeal.id} 
                onClick={() => {
                  setSelectedAppeal(appeal);
                  setAiInsight(null);
                }} 
                className={`w-full text-left p-4 rounded-xl transition-all border flex flex-col gap-1.5 ${selectedAppeal?.id === appeal.id ? 'glass border-emerald-500/40 shadow-xl' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs text-white uppercase tracking-tight">{appeal.username}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${appeal.status === 'approved' ? 'bg-emerald-500' : appeal.status === 'denied' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{appeal.status}</span>
                  <span className="text-[8px] text-gray-600 font-mono">{new Date(appeal.timestamp).toLocaleDateString()}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Case Detailed Review */}
      <div className="lg:col-span-8 h-full">
        {selectedAppeal ? (
          <div className="glass rounded-[2rem] border border-white/10 flex flex-col shadow-3xl animate-in fade-in zoom-in-95 duration-500">
            {/* Case Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{selectedAppeal.username}</h2>
                  <span className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold text-gray-400 font-mono">{selectedAppeal.id.slice(0, 12)}</span>
                </div>
                <span className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest">{selectedAppeal.userEmail}</span>
              </div>
              <button 
                onClick={handleAiAnalyze}
                disabled={aiAnalyzing}
                className="group flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all duration-300 disabled:opacity-30"
              >
                {aiAnalyzing ? (
                  <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z"/></svg>
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">{aiAnalyzing ? "Analyzing..." : "AI Intelligence"}</span>
              </button>
            </div>

            {/* Case Body */}
            <div className="p-8 space-y-8 flex-grow">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-3 bg-gray-700 rounded-full"></div> Case Violation
                </span>
                <p className="text-sm font-bold text-white/90 px-3">{selectedAppeal.reason}</p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-3 bg-gray-700 rounded-full"></div> Statement of Defense
                </span>
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 relative">
                  <svg className="absolute top-4 left-4 w-8 h-8 text-white/[0.03]" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3H21.017V15C21.017 18.3137 18.3307 21 15.017 21H14.017ZM3.01697 21L3.01697 18C3.01697 16.8954 3.9124 16 5.01697 16H8.01697C8.56925 16 9.01697 15.5523 9.01697 15V9C9.01697 8.44772 8.56925 8 8.01697 8H5.01697C3.9124 8 3.01697 7.10457 3.01697 6V3H10.017V15C10.017 18.3137 7.3307 21 4.01697 21H3.01697Z"/></svg>
                  <p className="text-sm text-gray-300 italic leading-relaxed relative z-10 pl-6 pr-6">"{selectedAppeal.explanation}"</p>
                </div>
              </div>

              {aiInsight && (
                <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Intelligence Report</span>
                  </div>
                  <p className="text-[11px] text-indigo-100 font-medium italic leading-relaxed">"{aiInsight}"</p>
                </div>
              )}

              {/* Action Controls */}
              {selectedAppeal.status === 'pending' ? (
                <div className="pt-4 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Official Verdict Note</label>
                    <textarea 
                      placeholder="Add professional feedback or reason for the verdict..."
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-emerald-500/40 transition-all font-medium resize-none"
                      rows={2}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleUpdateStatus('denied')} 
                      className="flex-1 group py-4 border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-500 flex flex-col items-center gap-1 shadow-lg"
                    >
                      <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Reject Appeal</span>
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('approved')} 
                      className="flex-1 group py-4 border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all duration-500 flex flex-col items-center gap-1 shadow-lg"
                    >
                      <svg className="w-5 h-5 group-hover:scale-125 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Grant Redemption</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-2">
                   <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border ${selectedAppeal.status === 'approved' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' : 'text-red-500 border-red-500/30 bg-red-500/5'}`}>
                    Verdict: {selectedAppeal.status}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium italic mt-2">"{selectedAppeal.adminNote || 'No notes were logged for this case.'}"</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass rounded-[2rem] h-full flex flex-col items-center justify-center opacity-30 p-24 text-center border-dashed border-2 border-white/5">
            <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mb-6 border border-white/5">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.4em] leading-relaxed max-w-xs">Select a case from the Registry to begin judicial review.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;