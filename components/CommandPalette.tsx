import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MainMenuType, Voucher, Ledger } from '../types';
import { MENU_ITEMS } from '../constants';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  vouchers: Voucher[];
  ledgers: Ledger[];
  onNavigate: (menu: MainMenuType) => void;
  onViewVoucher: (id: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, vouchers, ledgers, onNavigate, onViewVoucher }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query) return [];
    const term = query.toLowerCase();

    const menuMatches = MENU_ITEMS.filter(m => m.label.toLowerCase().includes(term)).map(m => ({
      type: 'NAVIGATION',
      label: m.label,
      sub: 'Module',
      id: m.id,
      icon: '🧭'
    }));

    const voucherMatches = vouchers
      .filter(v => v.id.toLowerCase().includes(term) || v.party.toLowerCase().includes(term))
      .slice(0, 10)
      .map(v => ({
        type: 'VOUCHER',
        label: v.id,
        sub: v.party,
        id: v.id,
        icon: '📄'
      }));

    const ledgerMatches = ledgers
      .filter(l => l.name.toLowerCase().includes(term))
      .slice(0, 10)
      .map(l => ({
        type: 'LEDGER',
        label: l.name,
        sub: l.group,
        id: l.id,
        icon: '📊'
      }));

    return [...menuMatches, ...voucherMatches, ...ledgerMatches];
  }, [query, vouchers, ledgers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) handleSelect(results[selectedIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (item: any) => {
    if (item.type === 'NAVIGATION') onNavigate(item.id as MainMenuType);
    if (item.type === 'VOUCHER') onViewVoucher(item.id);
    if (item.type === 'LEDGER') onNavigate(MainMenuType.DISPLAY);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex items-center space-x-6 bg-slate-50/50">
           <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
           <input 
             ref={inputRef}
             value={query}
             onChange={e => setQuery(e.target.value)}
             placeholder="Search Navigation, Vouchers, or Ledger Master..."
             className="flex-1 bg-transparent text-2xl font-black text-slate-800 placeholder:text-slate-300 outline-none uppercase italic tracking-tighter"
           />
           <div className="flex items-center space-x-2">
              <kbd className="px-3 py-1 bg-slate-200 text-slate-500 rounded-lg text-[10px] font-black border-b-2 border-slate-300">ESC</kbd>
           </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-4">
          {results.length > 0 ? (
            <div className="space-y-2">
               {results.map((item, i) => (
                 <div 
                   key={`${item.type}-${item.id}`}
                   onClick={() => handleSelect(item)}
                   onMouseEnter={() => setSelectedIndex(i)}
                   className={`p-6 rounded-[2rem] flex items-center justify-between cursor-pointer transition-all duration-300 ${i === selectedIndex ? 'bg-indigo-600 text-white shadow-2xl translate-x-2' : 'hover:bg-slate-50 text-slate-600'}`}
                 >
                    <div className="flex items-center space-x-6">
                       <span className={`text-2xl transition-transform ${i === selectedIndex ? 'scale-110' : ''}`}>{item.icon}</span>
                       <div>
                          <div className={`text-sm font-black uppercase tracking-widest leading-none mb-1.5 ${i === selectedIndex ? 'text-white' : 'text-slate-800'}`}>{item.label}</div>
                          <div className={`text-[9px] font-bold uppercase tracking-widest ${i === selectedIndex ? 'text-indigo-200' : 'text-slate-400'}`}>{item.sub}</div>
                       </div>
                    </div>
                    {i === selectedIndex && (
                      <div className="flex items-center space-x-2 animate-in slide-in-from-left-2">
                         <span className="text-[10px] font-black uppercase tracking-widest">Execute Task</span>
                         <kbd className="px-2 py-0.5 bg-white/20 rounded text-[8px] border border-white/20">ENTER</kbd>
                      </div>
                    )}
                 </div>
               ))}
            </div>
          ) : query ? (
            <div className="py-24 text-center">
               <div className="text-5xl mb-6 grayscale opacity-20">🔍</div>
               <p className="text-xs font-black uppercase text-slate-300 tracking-[0.4em] italic">No shards match your inquiry.</p>
            </div>
          ) : (
            <div className="p-10 space-y-12">
               <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-6 px-4">Dynamic Suggestions</h4>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { l: 'Open Ledger Statements', icon: '📊', m: MainMenuType.DISPLAY },
                       { l: 'New Accounting Voucher', icon: '💸', m: MainMenuType.TRANSACTION },
                       { l: 'Manage Catalogues', icon: '📦', m: MainMenuType.ADMINISTRATION },
                       { l: 'System Health Audit', icon: '🛡️', m: MainMenuType.HOUSE_KEEPING }
                     ].map((s, i) => (
                       <div key={i} onClick={() => { onNavigate(s.m); onClose(); }} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-400 hover:bg-white hover:shadow-xl transition-all cursor-pointer group">
                          <span className="text-2xl block mb-4 group-hover:scale-110 transition-transform">{s.icon}</span>
                          <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">{s.l}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}
        </div>
        
        <div className="px-8 py-4 bg-slate-900 flex justify-between items-center shrink-0">
           <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-[9px] font-black uppercase text-slate-500">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                 <span>Sync: Operational</span>
              </div>
              <div className="flex items-center space-x-2 text-[9px] font-black uppercase text-slate-500">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                 <span>Nexus Core v4.4</span>
              </div>
           </div>
           <div className="text-[9px] font-bold text-slate-600 tracking-widest uppercase">Select with arrows and enter</div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;