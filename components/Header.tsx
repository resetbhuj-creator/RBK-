import React from 'react';

interface HeaderProps {
  onMenuToggle?: () => void;
  title: string;
  activeCompanyName?: string;
  currentFY?: string;
  isFYLocked?: boolean;
}

// Completed Header component to fix truncated file and export error
const Header: React.FC<HeaderProps> = ({ title, activeCompanyName, currentFY, isFYLocked }) => {
  return (
    <header className="h-10 bg-indigo-950 flex items-center justify-between px-4 shrink-0 z-50 select-none border-b border-white/5 shadow-lg">
      {/* Title / Entity Cluster */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
           <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
             <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
             </svg>
           </div>
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] truncate max-w-[150px]">{activeCompanyName || 'Nexus Core'}</span>
        </div>
        <div className="h-4 w-px bg-white/10"></div>
        <h1 className="text-[10px] font-black uppercase text-white tracking-[0.3em] italic">{title}</h1>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden sm:flex items-center space-x-3">
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Session:</span>
           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter italic">{currentFY || 'N/A'}</span>
           {isFYLocked && (
             <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-rose-500">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                <span className="text-[7px] font-black uppercase">Locked</span>
             </div>
           )}
        </div>
        <div className="hidden sm:block h-4 w-px bg-white/10"></div>
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]"></div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nexus Core OS v4.4</span>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;