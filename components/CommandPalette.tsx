import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MainMenuType, Voucher, Ledger, Company } from '../types';
import { MENU_ITEMS } from '../constants';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  vouchers: Voucher[];
  ledgers: Ledger[];
  companies: Company[];
  onNavigate: (menu: MainMenuType) => void;
  onViewVoucher: (id: string) => void;
  onSelectCompany?: (id: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, onClose, vouchers, ledgers, companies, onNavigate, onViewVoucher, onSelectCompany 
}) => {
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
      sub: 'Switch to Module',
      id: m.id,
      icon: '🧭'
    }));

    const companyMatches = companies.filter(c => c.name.toLowerCase().includes(term)).map(c => ({
      type: 'COMPANY',
      label: c.name,
      sub: `Switch Company (${c.taxId || 'No ID'})`,
      id: c.id,
      icon: '🏢'
    }));

    const voucherMatches = vouchers
      .filter(v => v.id.toLowerCase().includes(term) || v.party.toLowerCase().includes(term) || (v.narration && v.narration.toLowerCase().includes(term)))
      .slice(0, 10)
      .map(v => ({
        type: 'VOUCHER',
        label: v.id,
        sub: `${v.type} for ${v.party}`,
        id: v.id,
        icon: '📄'
      }));

    const ledgerMatches = ledgers
      .filter(l => l.name.toLowerCase().includes(term))
      .slice(0, 10)
      .map(l => ({
        type: 'LEDGER',
        label: l.name,
        sub: `Financial Ledger (${l.group})`,
        id: l.id,
        icon: '📊'
      }));

    return [...menuMatches, ...companyMatches, ...voucherMatches, ...ledgerMatches];
  }, [query, vouchers, ledgers, companies]);

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
    if (item.type === 'COMPANY') onSelectCompany && onSelectCompany(item.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[70vh]">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-4 shrink-0">
           <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           <input 
             ref={inputRef}
             value={query}
             onChange={e => setQuery(e.target.value)}
             placeholder="Search Navigation, Companies, Ledgers, or Vouchers..."
             className="flex-1 bg-transparent text-lg font-bold text-slate-700 placeholder:text-slate-300 outline-none uppercase tracking-tight italic"
           />
           <kbd className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-black border border-slate-200 shadow-xs">ESC</kbd>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-2 flex-1">
          {results.length > 0 ? (
            <div className="space-y-0.5">
               {results.map((item, i) => (
                 <div 
                   key={`${item.type}-${item.id}`}
                   onClick={() => handleSelect(item)}
                   onMouseEnter={() => setSelectedIndex(i)}
                   className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 ${i === selectedIndex ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'hover:bg-slate-50 text-slate-600'}`}
                 >
                    <div className="flex items-center space-x-4 min-w-0">
                       <span className={`text-xl transition-transform ${i === selectedIndex ? 'scale-110' : ''}`}>{item.icon}</span>
                       <div className="min-w-0 truncate">
                          <div className={`text-xs font-black uppercase tracking-widest leading-none mb-1.5 ${i === selectedIndex ? 'text-white' : 'text-slate-800'}`}>{item.label}</div>
                          <div className={`text-[9px] font-bold uppercase tracking-tight ${i === selectedIndex ? 'text-indigo-200' : 'text-slate-400'}`}>{item.sub}</div>
                       </div>
                    </div>
                    {i === selectedIndex && (
                      <kbd className="px-2 py-0.5 bg-white/20 rounded text-[8px] font-black border border-white/20">ENTER</kbd>
                    )}
                 </div>
               ))}
            </div>
          ) : query ? (
            <div className="py-20 text-center flex flex-col items-center space-y-4">
               <div className="text-4xl opacity-20">🔍</div>
               <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em] italic">No shards match your inquiry</p>
            </div>
          ) : (
            <div className="p-8 space-y-10">
               <div>
                  <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.4em] mb-6 px-2">Institutional Modules</h4>
                  <div className="grid grid-cols-2 gap-3">
                     {MENU_ITEMS.slice(0, 6).map((m, i) => (
                       <button key={i} onClick={() => { onNavigate(m.id); onClose(); }} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-400 hover:bg-white hover:shadow-xl transition-all text-left flex items-center space-x-4 group">
                          <span className="text-xl group-hover:scale-110 transition-transform">{m.icon}</span>
                          <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">{m.label}</span>
                       </button>
                     ))}
                  </div>
               </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-400 shrink-0">
           <span className="uppercase tracking-[0.2em]">Select with arrows & enter</span>
           <span className="italic uppercase">Nexus Core Index v4.4</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
