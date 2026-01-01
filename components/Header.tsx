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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center">
        <button onClick={onMenuToggle} className="p-2 mr-4 text-slate-600 md:hidden hover:bg-slate-100 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-slate-800 leading-tight">{title}</h1>
          {activeCompanyName && (
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">
              Active: {activeCompanyName}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Accounting Period Display */}
        <div className="hidden lg:flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 group cursor-default">
           <div className={`w-2 h-2 rounded-full ${isFYLocked ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Accounting Cycle</span>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black text-slate-700 tracking-tight">{currentFY || 'N/A'}</span>
                {isFYLocked && (
                  <div className="bg-rose-100 text-rose-600 rounded px-1 flex items-center" title="Data Locked for Modifications">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    <span className="text-[7px] font-black uppercase ml-0.5">LOCKED</span>
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="hidden sm:flex items-center relative">
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <button className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;