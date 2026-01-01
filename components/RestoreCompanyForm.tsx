import React, { useState, useEffect, useRef } from 'react';

interface RestoreCompanyFormProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const RestoreCompanyForm: React.FC<RestoreCompanyFormProps> = ({ onCancel, onSubmit }) => {
  const [restorePath, setRestorePath] = useState('C:\\NexusERP\\Backups\\Q3_Vault');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [terminal, setTerminal] = useState<string[]>([]);
  const [detectedArchives, setDetectedArchives] = useState<{name: string, size: string, date: string}[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<string | null>(null);
  const [confirmSafety, setConfirmSafety] = useState(false);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminal]);

  const addLog = (msg: string) => {
    setTerminal(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const scanPath = () => {
    setIsSearching(true);
    setTerminal([]);
    setDetectedArchives([]);
    addLog(`SCANNING DIRECTORY: ${restorePath}...`);
    
    setTimeout(() => {
      const results = [
        { name: 'NEXUS_FULL_DUMP_2023_OCT.arc', size: '124 MB', date: '2023-10-15' },
        { name: 'NEXUS_DIFF_2023_NOV.arc', size: '42 MB', date: '2023-11-20' }
      ];
      setDetectedArchives(results);
      addLog(`SUCCESS: Found ${results.length} valid Nexus archives in specified path.`);
      setIsSearching(false);
    }, 1200);
  };

  const startRestore = () => {
    if (!selectedArchive || !confirmSafety) return;
    
    setIsProcessing(true);
    setProgress(0);
    setTerminal([]);
    addLog(`PROTOCOL INITIALIZED: Restoring from ${selectedArchive}...`);

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 10) + 2;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        finalizeRestore();
      }
      setProgress(current);
      
      const logs = [
        "Verifying archive checksum...",
        "Unpacking relational blob storage...",
        "Mapping schema to active core...",
        "Rebuilding B-Tree indices for recovered shards...",
        "Applying transactional journals...",
        "Syncing ledger opening balances...",
        "Running sanity check on restored tables..."
      ];
      if (current % 15 === 0) {
        addLog(logs[Math.floor(Math.random() * logs.length)]);
      }
    }, 150);
  };

  const finalizeRestore = () => {
    addLog("VERIFIED: Integrity checksum matches active system signature.");
    addLog("RESTORE SEQUENCE SUCCESSFUL. Remapping session context...");
    
    setTimeout(() => {
      const restoredData = {
        name: selectedArchive?.includes('OCT') ? 'Restored October Snapshot' : 'Restored November Delta',
        dataPath: restorePath,
        id: `RST-${Date.now()}`
      };
      onSubmit(restoredData);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
      <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-violet-50/50">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-violet-100 transform -rotate-3">
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Restore Data Vault</h3>
            <p className="text-sm text-slate-500 font-medium">Reintegrate system snapshots from a directory path.</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-10 space-y-8">
        {!isProcessing ? (
          <div className="space-y-8 animate-in slide-in-from-top-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-1">Source Directory Path</label>
                <div className="flex space-x-3">
                   <div className="relative flex-1 group">
                      <input 
                        value={restorePath}
                        onChange={e => setRestorePath(e.target.value)}
                        placeholder="e.g. C:\NexusERP\Backups"
                        className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-violet-500/10 transition-all"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                         <svg className="w-5 h-5 text-slate-300 group-focus-within:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                      </div>
                   </div>
                   <button 
                    onClick={scanPath}
                    disabled={isSearching}
                    className="px-8 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-600 transition-all transform active:scale-95 shadow-xl"
                   >
                     {isSearching ? 'Scanning...' : 'Search Path'}
                   </button>
                </div>
             </div>

             {detectedArchives.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-500">
                   <h4 className="text-[10px] font-black uppercase text-violet-600 tracking-[0.2em] ml-1">Detected Valid Archives</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {detectedArchives.map(arc => (
                         <div 
                          key={arc.name}
                          onClick={() => setSelectedArchive(arc.name)}
                          className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center space-x-5 group ${selectedArchive === arc.name ? 'bg-violet-50 border-violet-500 shadow-xl' : 'bg-white border-slate-100 hover:border-violet-200'}`}
                         >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${selectedArchive === arc.name ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-violet-100 group-hover:text-violet-500'}`}>📦</div>
                            <div className="flex-1 min-w-0">
                               <div className="text-xs font-black text-slate-800 truncate uppercase">{arc.name}</div>
                               <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">{arc.date} • {arc.size}</div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {selectedArchive && (
                <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] space-y-6 animate-in zoom-in-95">
                   <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 font-bold italic">!</div>
                      <div>
                         <h5 className="text-sm font-black text-rose-900 uppercase italic">Irreversible Restore Protocol</h5>
                         <p className="text-[11px] text-rose-700 font-medium leading-relaxed mt-1">Restoring will permanently overwrite all active ledgers, vouchers, and metadata with the contents of the archive. Ensure a current backup exists.</p>
                      </div>
                   </div>
                   <label className="flex items-center space-x-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={confirmSafety} 
                        onChange={e => setConfirmSafety(e.target.checked)}
                        className="w-5 h-5 rounded border-rose-300 text-rose-600 focus:ring-rose-500" 
                      />
                      <span className="text-[10px] font-black uppercase text-rose-900 tracking-tighter">I authorize this destructive restore operation.</span>
                   </label>
                </div>
             )}

             <div className="pt-6 border-t border-slate-50 flex justify-end space-x-4">
                <button onClick={onCancel} className="px-10 py-4 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50">Discard</button>
                <button 
                  onClick={startRestore}
                  disabled={!selectedArchive || !confirmSafety}
                  className={`px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all transform active:scale-95 ${!selectedArchive || !confirmSafety ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-violet-600 text-white shadow-violet-900/20 hover:bg-violet-700'}`}
                >
                  Execute Recovery
                </button>
             </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in zoom-in-95 duration-500">
             <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                   <h4 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">Extracting Snapshot</h4>
                   <div className="mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-violet-600 animate-ping"></div>
                      <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Active I/O Stream</span>
                   </div>
                </div>
                <div className="text-right tabular-nums">
                   <div className="text-6xl font-black text-slate-900">{progress}%</div>
                   <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Volume Alignment</p>
                </div>
             </div>

             <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner p-1">
                <div className="h-full bg-violet-600 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(124,58,237,0.5)]" style={{ width: `${progress}%` }}></div>
             </div>

             <div className="bg-slate-900 rounded-[2rem] p-8 text-violet-400 font-mono text-[11px] h-64 overflow-y-auto custom-scrollbar border-4 border-slate-800 shadow-2xl">
                {terminal.map((l, i) => <div key={i} className="mb-1 opacity-80"><span className="text-slate-700 mr-4 font-bold select-none">{i+1}</span>{l}</div>)}
                <div ref={consoleEndRef} />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestoreCompanyForm;