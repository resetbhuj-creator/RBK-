import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Voucher, Ledger } from '../types';

interface AIAssistantProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
  activeCompany: any;
  onViewVoucher: (id: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ vouchers, ledgers, activeCompany, onViewVoucher }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const generateInsight = async () => {
    setLoading(true);
    setInsight("");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = {
        company: activeCompany.name,
        voucherCount: vouchers.length,
        totalRevenue: vouchers.filter(v => v.type === 'Sales').reduce((acc, v) => acc + v.amount, 0),
        totalExpenses: vouchers.filter(v => v.type === 'Purchase' || v.type === 'Payment').reduce((acc, v) => acc + v.amount, 0),
        recentParties: Array.from(new Set(vouchers.slice(0, 5).map(v => v.party)))
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this ERP data for ${context.company}. 
        Rev: $${context.totalRevenue}, Exp: $${context.totalExpenses}. 
        Provide 3 bullet points: 1. Financial Health, 2. Potential Risk, 3. Efficiency Tip. 
        Keep it professional and concise. Use Markdown.`,
      });

      setInsight(response.text || "Unable to generate insights at this time.");
    } catch (err) {
      setInsight("ERR: AI Connection Interrupted. Verify API Key in environment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !insight && !loading) {
      generateInsight();
    }
  }, [isOpen]);

  return (
    <>
      {/* FAB */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-8 w-16 h-16 bg-indigo-950 text-indigo-400 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all transform border-2 border-indigo-500/30 z-[150] group"
      >
        <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-10"></div>
        <svg className="w-8 h-8 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {/* Sidebar Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-slate-950/95 backdrop-blur-2xl z-[200] border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500 flex flex-col">
          <div className="p-10 border-b border-white/5 flex justify-between items-center bg-indigo-600/10">
            <div>
              <div className="flex items-center space-x-3">
                 <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Nexus iAssistant</h3>
                 <span className="px-2 py-0.5 bg-indigo-500 text-[8px] font-black rounded text-white tracking-widest">GEMINI 3.0</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Financial Intelligence Stream</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6 opacity-50">
                 <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">Scanning Organizational Ledger...</p>
              </div>
            ) : (
              <div className="space-y-8">
                 <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
                    <div className="relative z-10">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Strategic Summary</h4>
                      <div className="prose prose-invert prose-sm max-w-none text-slate-300 font-medium leading-relaxed italic">
                        {insight}
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-10 -mr-16 -mt-16"></div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={generateInsight} className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all">Refresh Audit</button>
                    <button className="py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/40">Export Insights</button>
                 </div>

                 <div className="pt-8 border-t border-white/5">
                    <h5 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Anomaly Detection Logs</h5>
                    <div className="space-y-3">
                       {vouchers.filter(v => v.amount > 5000).slice(0, 5).map(v => (
                         <div 
                           key={v.id} 
                           onClick={() => onViewVoucher(v.id)}
                           className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/50 hover:bg-white/10 cursor-pointer group transition-all"
                         >
                            <div className="flex flex-col">
                               <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-400">HIGH VALUE: {v.id}</span>
                               <span className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">{v.party}</span>
                            </div>
                            <span className="text-[10px] font-black text-rose-400 group-hover:scale-110 transition-transform">${v.amount.toLocaleString()}</span>
                         </div>
                       ))}
                       {vouchers.filter(v => v.amount > 5000).length === 0 && (
                          <div className="py-10 text-center opacity-20 italic text-[10px] font-black uppercase tracking-widest">No anomalies detected</div>
                       )}
                    </div>
                 </div>
              </div>
            )}
          </div>

          <div className="p-8 bg-slate-900 border-t border-white/5">
             <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl">💡</div>
                <p className="text-[9px] text-slate-500 leading-relaxed">AI analysis is based on available ledger data and should be verified by a certified professional auditor.</p>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;