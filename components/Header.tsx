import React from 'react';

interface HeaderProps {
  onMenuToggle?: () => void;
  title: string;
  activeCompanyName?: string;
  currentFY?: string;
  isFYLocked?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, activeCompanyName, currentFY, isFYLocked }) => {
  return (
    <header className="h-12 bg-indigo-950 flex items-center justify-between px-6 shrink-0 z-[60] select-none border-b border-white/5 shadow-2xl relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none"></div>
      
      {/* Left Section: Entity & Module Identity */}
      <div className="flex items-center space-x-6 relative z-10">
        <div className="flex items-center space-x-3 group cursor-pointer">
           <div className="w-7 h-7 bg-indigo-600/20 rounded-lg flex items-center justify-center border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:border-indigo-400 transition-all duration-300">
             <svg className="w-4 h-4 text-indigo-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
             </svg>
           </div>
           <span className="text-[11px] font-black uppercase text-slate-300 tracking-[0.25em] truncate max-w-[200px] italic">
            {activeCompanyName || 'Nexus Core'}
           </span>
        </div>
        
        <div className="h-5 w-px bg-white/10"></div>
        
        <div className="flex items-center space-x-3">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <h1 className="text-[10px] font-black uppercase text-white tracking-[0.4em] italic drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {title}
          </h1>
        </div>
      </div>

      {/* Right Section: Session Telemetry & Integrity Cockpit */}
      <div className="flex items-center space-x-4 relative z-10">
        {/* Session Card */}
        <div className="hidden lg:flex items-center bg-white/5 rounded-xl border border-white/5 px-4 py-1.5 transition-all hover:bg-white/10">
          <div className="flex flex-col mr-4">
             <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Temporal Scope</span>
             <span className="text-[11px] font-mono font-black text-indigo-400 tracking-tighter leading-none italic">
               {currentFY || '---- - ----'}
             </span>
          </div>
          
          <div className="h-6 w-px bg-white/10 mx-1"></div>
          
          <div className="ml-3 flex items-center">
            {isFYLocked ? (
              <div className="flex items-center space-x-2 px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 group relative">
                <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-[8px] font-black uppercase tracking-widest">Audit Lock</span>
                
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-slate-900 text-white text-[8px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow-2xl z-50 normal-case leading-relaxed">
                  "Sovereign Lock Active: Historical data is read-only for statutory compliance."
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span className="text-[8px] font-black uppercase tracking-widest">Live Operations</span>
              </div>
            )}
          </div>
        </div>

        {/* System Health Badge */}
        <div className="flex items-center space-x-4 bg-slate-950/50 px-4 py-1.5 rounded-xl border border-white/5">
           <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sync Shard: 01</span>
              </div>
              <span className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-0.5">Verified Persistence</span>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;