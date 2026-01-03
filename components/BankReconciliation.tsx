import React, { useState, useMemo } from 'react';
import { Voucher, Ledger } from '../types';

interface BankReconciliationProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
  onUpdateVoucher: (v: Voucher) => void;
  onCancel: () => void;
}

const BankReconciliation: React.FC<BankReconciliationProps> = ({ vouchers, ledgers, onUpdateVoucher, onCancel }) => {
  const [selectedBankId, setSelectedBankId] = useState('');
  const [showReconciled, setShowReconciled] = useState(false);

  const banks = useMemo(() => ledgers.filter(l => l.group === 'Bank Accounts'), [ledgers]);

  const filteredVouchers = useMemo(() => {
    if (!selectedBankId) return [];
    return vouchers.filter(v => {
      const isCorrectBank = v.ledgerId === selectedBankId || 
                           v.entries?.some(e => e.ledgerId === selectedBankId);
      const matchesStatus = showReconciled ? true : !v.isReconciled;
      return isCorrectBank && matchesStatus && (v.type === 'Payment' || v.type === 'Receipt' || v.type === 'Contra');
    });
  }, [vouchers, selectedBankId, showReconciled]);

  const stats = useMemo(() => {
    if (!selectedBankId) return { books: 0, bank: 0 };
    const bankLedger = banks.find(b => b.id === selectedBankId);
    let bookBalance = bankLedger?.openingBalance || 0;
    let bankBalance = bankLedger?.openingBalance || 0;

    vouchers.forEach(v => {
      const isCorrectBank = v.ledgerId === selectedBankId || 
                           v.entries?.some(e => e.ledgerId === selectedBankId);
      if (!isCorrectBank) return;

      const amt = v.type === 'Payment' ? -v.amount : v.amount;
      bookBalance += amt;
      if (v.isReconciled) bankBalance += amt;
    });

    return { books: bookBalance, bank: bankBalance };
  }, [vouchers, selectedBankId, banks]);

  const handleDateChange = (v: Voucher, date: string) => {
    onUpdateVoucher({
      ...v,
      bankDate: date,
      isReconciled: !!date
    });
  };

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="px-10 py-12 bg-blue-600 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">Bank Reconciliation</h3>
          <p className="text-xs font-black uppercase tracking-[0.4em] opacity-70">Synchronize Book Data with Statement Reality</p>
        </div>
        <div className="relative z-10 flex space-x-4">
           <div className="bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
              <div className="text-[10px] font-black uppercase text-blue-100/60 mb-1">Reconciliation Gap</div>
              <div className="text-3xl font-black italic tabular-nums">${Math.abs(stats.books - stats.bank).toLocaleString()}</div>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-[150px] opacity-10 -mr-40 -mt-40"></div>
      </div>

      <div className="p-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target Bank Ledger</label>
              <select 
                value={selectedBankId} 
                onChange={e => setSelectedBankId(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black outline-none focus:ring-8 focus:ring-blue-500/5 shadow-inner appearance-none cursor-pointer"
              >
                <option value="">-- Choose Account --</option>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
           </div>
           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
              <div className="text-[10px] font-black uppercase text-slate-400">Balance as per Books</div>
              <div className="text-xl font-black text-slate-800 italic">${stats.books.toLocaleString()}</div>
           </div>
           <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-between">
              <div className="text-[10px] font-black uppercase text-blue-600">Balance as per Bank</div>
              <div className="text-xl font-black text-blue-900 italic">${stats.bank.toLocaleString()}</div>
           </div>
        </div>

        <div className="flex items-center justify-between">
           <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={showReconciled} 
                onChange={e => setShowReconciled(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
              />
              <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest group-hover:text-blue-600 transition-colors">Show Reconciled Transactions</span>
           </label>
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredVouchers.length} Items Pending Action</div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400">
                 <tr>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Voucher HASH</th>
                    <th className="px-8 py-5">Counterparty Node</th>
                    <th className="px-8 py-5 text-right">Value ($)</th>
                    <th className="px-8 py-5 text-center w-64">Bank Date Verification</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredVouchers.map(v => (
                   <tr key={v.id} className={`hover:bg-blue-50/30 transition-colors group ${v.isReconciled ? 'opacity-40' : ''}`}>
                      <td className="px-8 py-5 text-xs font-bold text-slate-500">{v.date}</td>
                      <td className="px-8 py-5 font-mono text-[11px] text-blue-600 font-black italic">#{v.id}</td>
                      <td className="px-8 py-5 font-black text-slate-800 text-xs uppercase italic truncate max-w-[200px]">{v.party}</td>
                      <td className="px-8 py-5 text-right font-black text-slate-900 tabular-nums">${v.amount.toLocaleString()}</td>
                      <td className="px-8 py-5 text-center">
                         <div className="relative group/input">
                            <input 
                              type="date" 
                              value={v.bankDate || ''} 
                              onChange={e => handleDateChange(v, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all shadow-inner"
                            />
                            {!v.bankDate && (
                              <div className="absolute right-3 top-2.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                            )}
                         </div>
                      </td>
                   </tr>
                 ))}
                 {filteredVouchers.length === 0 && (
                   <tr>
                      <td colSpan={5} className="py-32 text-center">
                         <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">🏛️</div>
                         <h5 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Registry in Equilibrium</h5>
                      </td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-end">
           <button onClick={onCancel} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-600 transition-all transform active:scale-95 border-b-8 border-slate-950">Seal Reconciliation Stream</button>
        </div>
      </div>
    </div>
  );
};

export default BankReconciliation;