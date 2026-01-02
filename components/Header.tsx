import React from 'react';

interface HeaderProps {
  onMenuToggle: () => void;
  title: string;
  activeCompanyName?: string;
  currentFY?: string;
  isFYLocked?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, title, activeCompanyName, currentFY, isFYLocked }) => {
  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shrink-0 shadow-sm">
      <div className="flex items-center space-x-4">
        <button onClick={onMenuToggle} className="p-1.5 text-slate-600 md:hidden hover:bg-slate-100 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="flex flex-col">
          <h1 className="text-sm font-black text-slate-800 leading-tight uppercase tracking-tight italic">{title}</h1>
          {activeCompanyName && (
            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] leading-none mt-0.5">
              Node: {activeCompanyName}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Accounting Period Display - Compact */}
        <div className="hidden sm:flex items-center space-x-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 cursor-default hover:bg-slate-100 transition-colors">
           <div className={`w-1.5 h-1.5 rounded-full ${isFYLocked ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}></div>
           <div className="flex items-baseline space-x-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">FY</span>
              <span className="text-[10px] font-black text-slate-700 tracking-tighter">{currentFY || 'N/A'}</span>
              {isFYLocked && (
                <div className="bg-rose-100 text-rose-600 rounded-sm px-1 flex items-center h-3" title="Cycle Locked">
                  <span className="text-[7px] font-black uppercase">LOCKED</span>
                </div>
              )}
           </div>
        </div>

        <div className="hidden md:flex items-center relative group">
          <input 
            type="text" 
            placeholder="Quick search commands..." 
            className="bg-slate-100/50 border-slate-200 border rounded-lg py-1.5 pl-8 pr-3 text-[11px] font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white w-48 transition-all outline-none"
          />
          <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        
        <div className="flex items-center space-x-1">
          <button className="relative p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m12 4a2 2 0 100-4m0 4a2 2 0 110-4" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;