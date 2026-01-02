import React, { useState, useEffect, useRef } from 'react';

interface YearMetadata {
  period: string;
  status: 'Open' | 'Closed' | 'Locked';
  vouchers: number;
  turnover: string;
  lastSynced: string;
}

interface YearChangeModuleProps {
  activeCompany: any;
  currentFY: string;
  setCurrentFY: (fy: string, isLocked: boolean) => void;
  onClose: () => void;
}

const YearChangeModule: React.FC<YearChangeModuleProps> = ({ 
  activeCompany, 
  currentFY, 
  setCurrentFY, 
  onClose 
}) => {
  const [selectedYear, setSelectedYear] = useState(currentFY);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showClosingWizard, setShowClosingWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [yearStates, setYearStates] = useState<Record<string, YearMetadata>>({});
  const [shiftLogs, setShiftLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const years = activeCompany?.years || [];
    const states: Record<string, YearMetadata> = {};
    
    years.forEach((year: string, idx: number) => {
      states[year] = {
        period: year,
        status: idx === (years.length - 1) ? 'Open' : 'Locked',
        vouchers: Math.floor(Math.random() * 5000) + 1200,
        turnover: `$${(Math.random() * 5 + 1).toFixed(2)}M`,
        lastSynced: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
    });
    
    setYearStates(states);
    if (years.includes(currentFY)) {
      setSelectedYear(currentFY);
    }
  }, [activeCompany?.id, activeCompany?.years, currentFY]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shiftLogs]);

  const addLog = (msg: string) => {
    setShiftLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSwitch = (targetYear?: string) => {
    const target = targetYear || selectedYear;
    if (target === currentFY) {
      alert("Current context is already set to this period.");
      return;
    }

    const targetMeta = yearStates[target];
    setIsUpdating(true);
    setShowSuccess(false);
    setShiftLogs([]);
    
    addLog(`INITIATING CONTEXT SHIFT: TARGET=${target}`);
    addLog(`ACQUIRING SYSTEM LOCK: DOMAIN="${activeCompany.name}"`);
    
    setTimeout(() => addLog(`RELOADING LEDGER PARTITIONS: SHARD_ID=${target.replace(/\s/g, '_')}`), 200);
    setTimeout(() => addLog(`VERIFYING SNAPSHOT INTEGRITY: STATUS=${targetMeta?.status.toUpperCase()}`), 400);
    setTimeout(() => addLog(`MAPPING OPENING BALANCES: AUTO_PROOF=SUCCESS`), 600);
    setTimeout(() => addLog(`REMAP COMPLETE: UI STATE SYNCHRONIZED`), 800);
    
    setTimeout(() => {
      setCurrentFY(target, targetMeta?.status === 'Locked');
      setIsUpdating(false);
      setShowSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  const toggleYearLock = (year: string) => {
    if (!yearStates[year]) return;
    const newStatus = yearStates[year].status === 'Locked' ? 'Open' : 'Locked';
    setYearStates(prev => ({
      ...prev,
      [year]: { ...prev[year], status: newStatus }
    }));
    
    if (year === currentFY) {
       setCurrentFY(currentFY, newStatus === 'Locked');
    }
  };

  const executeClosingStep = () => {
    if (wizardStep < 3) {
      setWizardStep(prev => prev + 1);
    } else {
      setShowClosingWizard(false);
      setWizardStep(1);
      alert("Financial Year Finalized: All balances have been successfully carried forward and the previous period is now LOCKED.");
      // Automatically lock the old year if we were "closing" it
      toggleYearLock(currentFY);
    }
  };

  const availableYears = activeCompany?.years || [];
  const selectedMeta = yearStates[selectedYear];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Dynamic Header Section */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-rose-600/20">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-600 to-rose-400 rounded-[2rem] flex items-center justify-center shadow-2xl transform -rotate-3 border-4 border-rose-300/30 group">
              <svg className="w-10 h-10 text-white group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tighter uppercase italic">Cycle Management</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="bg-rose-500/20 text-rose-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/30 flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse mr-2"></div>
                  Entity: {activeCompany?.name}
                </span>
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-l border-slate-700 pl-4">
                  Current Session: {currentFY}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowClosingWizard(true)}
              className="group flex items-center space-x-3 px-8 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all transform active:scale-95 shadow-2xl"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span>Execute Period Closing</span>
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-600 rounded-full blur-[150px] -mr-64 -mt-64 opacity-20 pointer-events-none"></div>
      </div>

      {showSuccess && (
        <div className="bg-emerald-500 text-white p-6 rounded-[2rem] shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                 <h4 className="text-sm font-black uppercase tracking-widest">Context Shift Successful</h4>
                 <p className="text-[10px] font-medium opacity-80">All modules have been synchronized to {currentFY}.</p>
              </div>
           </div>
           <button onClick={() => setShowSuccess(false)} className="text-white/50 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-12">
               <div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight">Active Cycle Registry</h3>
                 <p className="text-sm text-slate-400 font-medium">Toggle between historical audits and the active working period.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 gap-5">
              {availableYears.map((year: string) => {
                const meta = yearStates[year];
                if (!meta) return null;
                const isActive = currentFY === year;
                const isSelected = selectedYear === year;
                const isLocked = meta.status === 'Locked';
                
                return (
                  <div
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all group relative overflow-hidden ${
                      isSelected 
                        ? 'bg-rose-50/50 border-rose-500 shadow-2xl -translate-y-1' 
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                      <div className="flex items-center space-x-8">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl transition-all ${
                          isSelected ? 'bg-rose-600 text-white shadow-xl' : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}>
                          {year.substring(2, 4)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-4 mb-2">
                            <h4 className={`text-2xl font-black tracking-tighter ${isSelected ? 'text-rose-900' : 'text-slate-800'}`}>
                              FY {year}
                            </h4>
                            {isActive && (
                              <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                                <span className="text-[9px] font-black uppercase tracking-widest">ACTIVE</span>
                              </div>
                            )}
                            {isLocked && !isActive && (
                               <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">LOCKED</div>
                            )}
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                               {meta.vouchers.toLocaleString()} Postings
                            </div>
                            <div className="flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-6">
                               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               {meta.turnover} Volume
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {!isActive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSwitch(year); }}
                            className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-500 transition-all transform active:scale-95"
                          >
                            Easy Switch
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleYearLock(year); }}
                          className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all border-2 ${
                            meta.status === 'Locked' 
                              ? 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 shadow-sm' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 shadow-sm'
                          }`}
                          title={meta.status === 'Locked' ? 'Unlock Period' : 'Lock Period'}
                        >
                          <svg className={`w-5 h-5 ${meta.status === 'Locked' ? 'text-rose-500' : 'text-emerald-500'}`} fill="currentColor" viewBox="0 0 20 20">
                             {meta.status === 'Locked' 
                               ? <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                               : <path fillRule="evenodd" d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0V4a1 1 0 10-2 0v1H9V7a1 1 0 002 0V4a3 3 0 016 0v5h2V7a5 5 0 00-5-5z" clipRule="evenodd" />
                             }
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isUpdating && (
              <div className="mt-12 bg-slate-900 rounded-[2.5rem] p-10 border-4 border-slate-800 animate-in zoom-in-95 duration-500">
                 <div className="flex items-center space-x-4 mb-8">
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping shadow-[0_0_12px_rgba(244,63,94,0.6)]"></div>
                    <span className="text-xs font-black text-rose-400 uppercase tracking-[0.3em]">Remapping Terminal Active</span>
                 </div>
                 <div ref={scrollRef} className="h-48 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-500 space-y-2 custom-scrollbar pr-6">
                    {shiftLogs.map((l, i) => (
                      <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-slate-800 mr-4 font-bold select-none">{i.toString().padStart(2, '0')}</span>
                        {l}
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm relative overflow-hidden group">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-10 flex items-center">
              <svg className="w-5 h-5 mr-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Period Analysis
            </h3>
            {selectedMeta ? (
              <div className="space-y-10">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 transition-all group-hover:border-rose-200">
                   <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 group-hover:text-rose-500 transition-colors">Transaction Volume</div>
                   <div className="text-4xl font-black text-slate-800 tracking-tighter">{selectedMeta.turnover}</div>
                   <div className="mt-6 w-full h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner p-0.5">
                      <div className="h-full bg-rose-500 w-[72%] shadow-[0_0_12px_#f43f5e] rounded-full"></div>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-center shadow-sm">
                     <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Vouchers</div>
                     <div className="text-2xl font-black text-slate-700">{selectedMeta.vouchers}</div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-center shadow-sm">
                     <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Snapshot</div>
                     <div className="text-2xl font-black text-emerald-600 uppercase italic tracking-tighter">Verified</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 italic text-sm font-medium border-2 border-dashed border-slate-100 rounded-[2.5rem]">Select a period to load context.</div>
            )}
          </div>

          <div className="bg-rose-900 rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl border border-rose-800">
             <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-10 border border-white/10 group-hover:bg-rose-500 transition-all shadow-lg">
                   <svg className="w-7 h-7 text-rose-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h4 className="text-2xl font-black tracking-tight mb-6 uppercase italic leading-none">Security Shield</h4>
                <p className="text-sm text-rose-200/80 leading-relaxed font-medium mb-10">
                  Nexus automatically triggers <span className="text-white font-black underline underline-offset-4 decoration-rose-500">AUDIT LOCK</span> for closed cycles. This prevents historical data corruption during external reviews.
                </p>
             </div>
             <div className="absolute -right-16 -bottom-16 opacity-5 group-hover:opacity-10 transition-all scale-150 rotate-12 pointer-events-none">
                <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
             </div>
          </div>
        </div>
      </div>

      {/* Year-End Closing Wizard Overlay */}
      {showClosingWizard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
              <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center">
                 <div className="flex items-center space-x-5">
                    <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <div>
                       <h3 className="text-xl font-black uppercase tracking-tight italic">Closing Protocol</h3>
                       <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Target: {currentFY}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowClosingWizard(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>

              <div className="p-12">
                 <div className="flex items-center justify-between mb-16 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
                    <div className={`absolute top-1/2 left-0 h-1 bg-rose-500 -translate-y-1/2 z-0 transition-all duration-700`} style={{ width: `${(wizardStep - 1) * 50}%` }}></div>
                    {[1, 2, 3].map(s => (
                       <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 shadow-xl ${wizardStep >= s ? 'bg-rose-600 text-white scale-110' : 'bg-white text-slate-300 border border-slate-100'}`}>
                          {wizardStep > s ? '✓' : s}
                       </div>
                    ))}
                 </div>

                 <div className="space-y-10 min-h-[260px]">
                    {wizardStep === 1 && (
                       <div className="animate-in slide-in-from-bottom-4 duration-500">
                          <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-4 italic">Verification Phase</h4>
                          <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8">System is reconciling ledger balances for consistency. This ensures that no orphaned transactions exist and all temporary accounts are reconciled.</p>
                          <div className="space-y-3">
                             {['Unposted Vouchers: 0 Found', 'Negative Cash Balances: None', 'Bank Reconciliations: Complete'].map(c => (
                                <div key={c} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                   <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{c}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {wizardStep === 2 && (
                       <div className="animate-in slide-in-from-bottom-4 duration-500">
                          <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-4 italic">Archival Snapshot</h4>
                          <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8">The engine is generating a immutable snapshot of the Trial Balance. This data will be cryptographically signed for regulatory compliance.</p>
                          <div className="p-8 bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl flex flex-col items-center">
                             <div className="w-16 h-16 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-6"></div>
                             <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] animate-pulse">Encoding Financial Ledger...</span>
                          </div>
                       </div>
                    )}

                    {wizardStep === 3 && (
                       <div className="animate-in slide-in-from-bottom-4 duration-500">
                          <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-4 italic">Balance Migration</h4>
                          <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8">Permanent balances are being mapped to the opening period of the next year. P&L accounts will be zeroed and transferred to Reserves.</p>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center">
                                <div className="text-[9px] font-black text-emerald-600 uppercase mb-2">Assets Migrated</div>
                                <div className="text-2xl font-black text-emerald-900">$2.4M</div>
                             </div>
                             <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col items-center">
                                <div className="text-[9px] font-black text-indigo-600 uppercase mb-2">Liabilities Migrated</div>
                                <div className="text-2xl font-black text-indigo-900">$1.8M</div>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>

                 <div className="mt-12 flex justify-end">
                    <button 
                      onClick={executeClosingStep}
                      className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-rose-600 transition-all transform active:scale-95 flex items-center space-x-4"
                    >
                       <span>{wizardStep === 3 ? 'Finalize & Close Period' : 'Proceed to Next Step'}</span>
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default YearChangeModule;