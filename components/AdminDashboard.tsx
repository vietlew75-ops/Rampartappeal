
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
  const [status, setStatus] = useState<'idle' | 'error' | 'connected'>('idle');

  useEffect(() => {
    console.log("Admin Dashboard: Initializing Registry Watch...");
    setStatus('idle');
    
    const unsubscribe = db.collection("appeals")
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appeal));
        console.log(`Admin Dashboard: ${data.length} records received from Firestore.`);
        setAppeals(data);
        setLoading(false);
        setStatus('connected');
      }, (error) => {
        console.error("Admin Dashboard Snapshot error:", error);
        setLoading(false);
        setStatus('error');
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
    <div className="flex flex-col items-center justify-center p-32 glass rounded-[2rem]">
      <div className="w-12 h-12 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Registry Loading...</span>
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
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{status === 'connected' ? 'Live Sync Active' : status === 'error' ? 'Connection Error' : 'Connecting...'}</span>
            </div>
          </div>
          <span className="text-[9px] font-mono text-white/40">{appeals.length} Cases</span>
        </div>
        
        <div className="space-y-2 max-h-[75vh] overflow-y-auto custom-scrollbar pr-3">
          {appeals.length === 0 ? (
            <div className="p-12 glass rounded-2xl border-dashed border border-white/5 text-center">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-loose">
                No appeals registered.<br/>
                <span className="text-gray-700 normal-case italic">Check console (F12) for database errors.</span>
              </p>
            </div>
          ) : (
            appeals.map((appeal) => (
              <button 
                key={appeal.id} 
                onClick={() => {
                  setSelectedAppeal(appeal);
                  setAiInsight(null);
                }} 
                className={`w-full text-left p-4 rounded-xl transition-all border flex flex-col gap-1.5 ${selectedAppeal?.id === appeal.id ? 'glass border-emerald-500/40' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-xs text-white uppercase tracking-tight">{appeal.username}</span>
                  <div className="flex gap-1.5">
                    {appeal.ai_flag === 'spam' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Flagged as Spam" />
                    )}
                    <div className={`w-1.5 h-1.5 rounded-full ${appeal.status === 'approved' ? 'bg-emerald-500' : appeal.status === 'denied' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className={`text-[8px] font-bold uppercase tracking-widest ${appeal.ai_flag === 'spam' ? 'text-red-500' : 'text-gray-500'}`}>
                    {appeal.ai_flag === 'spam' ? 'Suspected Spam' : appeal.status}
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
              
              <button 
                onClick={handleAiAnalyze}
                disabled={aiAnalyzing}
                className={`group flex items-center gap-3 px-4 py-2 border rounded-lg transition-all duration-300 ${selectedAppeal.ai_flag === 'spam' ? 'bg-red-500/5 border-red-500/20 text-red-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}
              >
                {aiAnalyzing ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z"/></svg>
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {selectedAppeal.ai_flag === 'spam' ? "Analyze Spam" : "AI Intelligence"}
                </span>
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  Violation Category
                </span>
                <p className="text-sm font-bold text-white/90">{selectedAppeal.reason}</p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  Statement
                </span>
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                  <p className="text-sm text-gray-300 italic leading-relaxed">"{selectedAppeal.explanation}"</p>
                </div>
              </div>

              {aiInsight && (
                <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                  <p className="text-[11px] text-indigo-100 font-medium italic">"{aiInsight}"</p>
                </div>
              )}

              {selectedAppeal.status === 'pending' ? (
                <div className="pt-4 space-y-4">
                  <textarea 
                    placeholder="Verdict notes..."
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
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass rounded-[2rem] h-full flex items-center justify-center opacity-30 p-24 text-center border-dashed border-2 border-white/5">
            <p className="text-xs font-black uppercase tracking-[0.4em]">Select case for review.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
