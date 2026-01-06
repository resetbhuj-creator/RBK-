import React, { useState, useMemo } from 'react';
import { Voucher } from '../types';

interface HeaderProps {
  onMenuToggle?: () => void;
  title: string;
  activeCompanyName?: string;
  currentFY?: string;
  isFYLocked?: boolean;
  vouchers?: Voucher[];
  onViewVoucher?: (id: string) => void;
  onOpenPalette?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, activeCompanyName, currentFY, isFYLocked, vouchers = [], onViewVoucher, onOpenPalette }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const term = searchQuery.toLowerCase();
    return vouchers.filter(v => 
      v.id.toLowerCase().includes(term) || 
      v.party.toLowerCase().includes(term)
    ).slice(0, 5);
  }, [searchQuery, vouchers]);

  const handleSelectVoucher = (id: string) => {
    onViewVoucher?.(id);
    setSearchQuery('');
    setShowSearch(false);
  };

  return (
    <header className="h-14 bg-indigo-950 flex items-center justify-between px-6 shrink-0 z-[60] select-none border-b border-white/5 shadow-2xl relative overflow-hidden">
      {/* Background Decor Shards */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
      <div className="absolute -left-10 top-0 w-32 h-full bg-white/5 skew-x-12 blur-xl pointer-events-none"></div>
      
      {/* Left Section: Entity & Module Identity */}
      <div className="flex items-center space-x-6 relative z-10">
        <div className="flex items-center space-x-4 group cursor-pointer">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center border border-indigo-400/30 group-hover:bg-indigo-500 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300 transform group-hover:rotate-3">
             <svg className="w-5 h-5 text-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
             </svg>
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] leading-none mb-1">Active Entity</span>
             <span className="text-xs font-black uppercase text-white tracking-widest truncate max-w-[240px] italic">
              {activeCompanyName || 'Nexus Core'}
             </span>
           </div>
        </div>
        
        <div className="h-6 w-px bg-white/10"></div>
        
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse"></div>
          <h1 className="text-[11px] font-black uppercase text-indigo-100 tracking-[0.4em] italic drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            {title}
          </h1>
        </div>
      </div>

      {/* Center: Global Search Engine */}
      <div className="flex-1 max-w-md mx-10 relative z-50">
        <div className="relative group">
          <div className="absolute right-3 top-2.5 hidden md:flex items-center space-x-1 opacity-50 group-focus-within:opacity-0 transition-opacity">
             <kbd className="px-1.5 py-0.5 bg-slate-800 text-[8px] font-black text-slate-400 rounded border border-slate-700">⌘</kbd>
             <kbd className="px-1.5 py-0.5 bg-slate-800 text-[8px] font-black text-slate-400 rounded border border-slate-700">K</kbd>
          </div>
          <input 
            type="text" 
            placeholder="GLOBAL QUICK LOOKUP..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value.toUpperCase()); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            onClick={onOpenPalette}
            className="w-full h-9 bg-white/5 border border-white/10 rounded-full px-10 text-[10px] font-black text-indigo-100 tracking-[0.2em] outline-none focus:bg-white/10 focus:border-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner cursor-pointer"
          />
          <svg className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-500 group-focus-within:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-3 bg-white/5 border-b border-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest px-6">Found {searchResults.length} Match Nodes</div>
              {searchResults.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => handleSelectVoucher(v.id)}
                  className="px-6 py-3 hover:bg-indigo-600 group cursor-pointer flex justify-between items-center transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white italic group-hover:translate-x-1 transition-transform">#{v.id}</span>
                    <span className="text-[8px] font-bold text-slate-500 group-hover:text-indigo-100 uppercase mt-0.5">{v.party}</span>
                  </div>
                  <span className="text-[8px] font-black text-slate-600 bg-white/5 px-2 py-0.5 rounded group-hover:bg-white/20 group-hover:text-white uppercase">{v.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {showSearch && <div className="fixed inset-0 z-[-1]" onClick={() => setShowSearch(false)}></div>}
      </div>

      {/* Right Section: Session Telemetry & Integrity Cockpit */}
      <div className="flex items-center space-x-5 relative z-10">
        {/* Session Card */}
        <div className="hidden lg:flex items-center bg-white/5 backdrop-blur-md rounded-xl border border-white/10 px-5 py-2 transition-all hover:bg-white/10 hover:border-white/20 shadow-inner group">
          <div className="flex flex-col mr-6">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.25em] leading-none mb-1.5 group-hover:text-indigo-400 transition-colors">Session Period</span>
             <div className="flex items-center space-x-2">
                <svg className="w-3 h-3 text-indigo-500 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-xs font-mono font-black text-white tracking-tight leading-none italic">
                  {currentFY || '---- - ----'}
                </span>
             </div>
          </div>
          
          <div className="h-8 w-px bg-white/10 mx-1"></div>
          
          <div className="ml-5 flex items-center">
            {isFYLocked ? (
              <div className="flex items-center space-x-3 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500 transition-all hover:bg-rose-500/20 group/status relative">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <div className="flex flex-col">
                   <span className="text-[9px] font-black uppercase tracking-widest leading-none">Audit Lock</span>
                   <span className="text-[7px] font-bold text-rose-400/60 uppercase tracking-tighter mt-0.5">Read Only Mode</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 transition-all hover:bg-emerald-500/20 group/status">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute inset-0"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 relative shadow-[0_0_8px_#10b981]"></div>
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-black uppercase tracking-widest leading-none">Operational</span>
                   <span className="text-[7px] font-bold text-emerald-400/60 uppercase tracking-tighter mt-0.5">Read/Write Active</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Monitoring Node */}
        <div className="flex items-center space-x-4 bg-slate-950/40 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
           <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Shard Sync</span>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>
              </div>
              <span className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.3em] mt-1">v4.4 Stable</span>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;