
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

// Fixed: Destructured onMenuToggle from props
const Header: React.FC<HeaderProps> = ({ onMenuToggle, title, activeCompanyName, currentFY, isFYLocked, vouchers = [], onViewVoucher, onOpenPalette }) => {
  return (
    <header className="h-16 bg-white flex items-center justify-between px-6 shrink-0 z-30 border-b border-slate-200 shadow-sm relative">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <button onClick={onMenuToggle} className="md:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xs font-black uppercase text-indigo-600 tracking-widest italic">{title}</h1>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{activeCompanyName || 'Nexus Suite'}</span>
        </div>
      </div>

      {/* Global Search & Command Palette Trigger */}
      <div className="flex-1 max-w-xl mx-8">
        <div 
          onClick={onOpenPalette}
          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-2xl flex items-center px-4 space-x-3 cursor-pointer group hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all"
        >
          <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <span className="text-[11px] font-bold text-slate-400 flex-1">Quick Search (CMD + K)</span>
          <div className="flex items-center space-x-1">
             <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-500 shadow-xs">⌘</kbd>
             <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-500 shadow-xs">K</kbd>
          </div>
        </div>
      </div>

      {/* Right Section: Session Telemetry */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Active Period</span>
            <span className="text-[11px] font-black text-slate-700 tabular-nums italic">{currentFY}</span>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          {isFYLocked ? (
            <div className="flex items-center space-x-2 text-rose-500 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              <span className="text-[9px] font-black uppercase">Locked</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black uppercase">Active</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
