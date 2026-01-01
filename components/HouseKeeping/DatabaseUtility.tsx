import React, { useState } from 'react';

const DatabaseUtility: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [terminal, setTerminal] = useState<string[]>(['[0.00s] SYSTEM IDLE: Waiting for administrative command...']);

  const runOptimization = () => {
    setIsOptimizing(true);
    setProgress(0);
    setTerminal(prev => [...prev, `[INIT] Booting Index Rebuilder v4.0...`]);
    
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 2;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => setIsOptimizing(false), 1000);
      }
      setProgress(current);
      
      const logs = [
        `Scanning table partition: 'VOUCHER_HEADER'...`,
        `Analyzing distribution for 'LEDGER_BALANCES'...`,
        `Rebuilding B-Tree indices... SUCCESS`,
        `Vacuuming orphaned data blocks...`,
        `Committing physical disk changes...`,
        `Integrity checksum verified for current cluster.`
      ];
      if (current % 15 === 0) {
        setTerminal(prev => [...prev.slice(-10), logs[Math.floor(Math.random() * logs.length)]]);
      }
    }, 100);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
           <h3 className="text-xl font-black italic uppercase text-slate-800 mb-8">Data Shard Manager</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center">
                 <div className="text-[10px] font-black uppercase text-slate-400 mb-2">Primary Index Health</div>
                 <div className="text-4xl font-black text-emerald-600">99.8%</div>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center">
                 <div className="text-[10px] font-black uppercase text-slate-400 mb-2">Fragmentation Level</div>
                 <div className="text-4xl font-black text-amber-600">0.4%</div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex justify-between items-end px-1">
                 <div className="text-[10px] font-black uppercase text-slate-400">Disk Serialization State</div>
                 <div className="text-lg font-black">{progress}%</div>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner p-1">
                 <div className="h-full bg-amber-600 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(217,119,6,0.5)]" style={{ width: `${progress}%` }}></div>
              </div>
           </div>

           <div className="mt-10 flex space-x-4">
              <button 
                onClick={runOptimization}
                disabled={isOptimizing}
                className={`flex-1 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all transform active:scale-95 ${isOptimizing ? 'bg-slate-100 text-slate-400' : 'bg-amber-600 text-white shadow-xl hover:bg-amber-500'}`}
              >
                {isOptimizing ? 'Recalculating Pointers...' : 'Initiate Full Re-index'}
              </button>
           </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-amber-400 font-mono text-[11px] h-64 overflow-y-auto custom-scrollbar border-4 border-slate-800 shadow-inner">
           {terminal.map((l, i) => <div key={i} className="mb-1 opacity-80"><span className="text-slate-600 mr-4">{i + 1}</span>{l}</div>)}
        </div>
      </div>

      <div className="space-y-6">
         <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Resource Thresholds</h3>
            <div className="space-y-6">
               {[
                 { label: 'Relational Buffer', val: '24%', color: 'bg-emerald-500' },
                 { label: 'JSON Store Depth', val: '62%', color: 'bg-indigo-500' },
                 { label: 'Cache Volume', val: '12%', color: 'bg-amber-500' }
               ].map((item, i) => (
                 <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                       <span>{item.label}</span>
                       <span>{item.val}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className={`h-full ${item.color} w-full`} style={{ width: item.val }}></div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-amber-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl">
            <div className="relative z-10">
               <h4 className="text-xl font-black uppercase italic mb-4">Storage Warning</h4>
               <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
                  System detected a non-optimized partition in the <span className="text-white font-bold underline">AUDIT_HIST</span> table. Run vacuum protocol to reclaim 14.5MB of storage.
               </p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
         </div>
      </div>
    </div>
  );
};

export default DatabaseUtility;