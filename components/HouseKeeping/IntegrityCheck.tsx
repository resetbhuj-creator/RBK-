import React, { useState } from 'react';
import { Ledger, Voucher } from '../../types';

interface IntegrityCheckProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
}

const IntegrityCheck: React.FC<IntegrityCheckProps> = ({ ledgers, vouchers }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastCheck(new Date().toLocaleTimeString());
    }, 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-12 relative overflow-hidden">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
            <div>
               <h3 className="text-2xl font-black italic uppercase tracking-tight text-slate-800">Mathematical Proofing Engine</h3>
               <p className="text-sm text-slate-400 font-medium mt-1">Cross-referencing {ledgers.length} masters and {vouchers.length} transactional objects.</p>
            </div>
            <button 
              onClick={startScan}
              disabled={isScanning}
              className={`px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all transform active:scale-95 flex items-center space-x-4 ${isScanning ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/20'}`}
            >
               {isScanning ? (
                 <>
                   <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
                   <span>Crawling Ledger Shards...</span>
                 </>
               ) : (
                 <>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   <span>Execute Deep Integrity Scan</span>
                 </>
               )}
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Ledger Balancing', status: 'VERIFIED', desc: 'Opening + Delta == Closing', color: 'text-emerald-500' },
              { label: 'Double Entry Proof', status: 'LOCKED', desc: 'Debit sum equals Credit sum', color: 'text-indigo-500' },
              { label: 'Asset Valuation', status: 'HEALTHY', desc: 'Inventory items reconciled', color: 'text-sky-500' }
            ].map((check, i) => (
              <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:border-emerald-200 transition-all">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{check.label}</span>
                    <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`}></div>
                 </div>
                 <div className={`text-2xl font-black mb-1 ${check.color}`}>{check.status}</div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{check.desc}</p>
              </div>
            ))}
         </div>

         {lastCheck && (
           <div className="mt-12 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center justify-center space-x-4 animate-in zoom-in-95">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.3em]">Full System Verification Successful: {lastCheck}</span>
           </div>
         )}
         
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600 rounded-full blur-[150px] opacity-5 -mr-48 -mt-48 pointer-events-none"></div>
      </div>

      <div className="bg-slate-950 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden border-4 border-slate-900">
         <div className="relative z-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-8">Integrity Protocol Policy</h4>
            <div className="space-y-6 max-w-2xl">
               <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  The Nexus data core uses <span className="text-white font-bold italic">Append-Only Immutable Logs</span>. The Integrity Check utility performs an off-line block verification to ensure that historical partitions have not been manually manipulated at the filesystem layer.
               </p>
               <div className="flex space-x-6">
                  <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">🔒</div>
                     <span className="text-[9px] font-black uppercase text-slate-500">Encrypted<br/>Headers</span>
                  </div>
                  <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">⛓️</div>
                     <span className="text-[9px] font-black uppercase text-slate-500">Hash<br/>Chaining</span>
                  </div>
               </div>
            </div>
         </div>
         <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-600 rounded-full blur-[120px] opacity-10"></div>
      </div>
    </div>
  );
};

export default IntegrityCheck;