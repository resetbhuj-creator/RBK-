import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Voucher, Ledger, LedgerEntry, VoucherType, Attachment, VoucherItem } from '../types';
import { UNIT_MEASURES } from '../constants';

interface VoucherEntryFormProps {
  isReadOnly?: boolean;
  ledgers: Ledger[];
  vouchers?: Voucher[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
  getNextId: (type: string) => string;
  activeCompany?: any;
}

type VType = Extract<VoucherType, 'Payment' | 'Receipt' | 'Contra' | 'Journal' | 'Credit Note' | 'Debit Note'>;

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
];

const VoucherEntryForm: React.FC<VoucherEntryFormProps> = ({ isReadOnly, ledgers, vouchers = [], onSubmit, onCancel, getNextId, activeCompany }) => {
  const [vchType, setVchType] = useState<VType>('Payment');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [narration, setNarration] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [supplyType, setSupplyType] = useState<'Local' | 'Central'>('Local');
  
  const [currency, setCurrency] = useState(activeCompany?.currencyConfig?.code || 'USD');
  const [exchangeRate, setExchangeRate] = useState(1);

  // Advanced Line-Item State
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    { id: '1', ledgerId: '', ledgerName: '', type: 'Dr', amount: 0, taxRate: 0, taxAmount: 0, cgst: 0, sgst: 0, igst: 0, currency: currency, exchangeRate: 1 },
    { id: '2', ledgerId: '', ledgerName: '', type: 'Cr', amount: 0, taxRate: 0, taxAmount: 0, cgst: 0, sgst: 0, igst: 0, currency: currency, exchangeRate: 1 }
  ]);

  const baseCurrencyCode = activeCompany?.currencyConfig?.code || 'USD';

  const nextIdPreview = useMemo(() => getNextId(vchType), [vchType, getNextId]);

  const totals = useMemo(() => {
    const dr = ledgerEntries.filter(e => e.type === 'Dr').reduce((acc, e) => acc + (e.amount || 0) + (e.taxAmount || 0), 0);
    const cr = ledgerEntries.filter(e => e.type === 'Cr').reduce((acc, e) => acc + (e.amount || 0) + (e.taxAmount || 0), 0);
    
    const diff = Math.abs(dr - cr);
    return { dr, cr, diff, isBalanced: diff < 0.001 && dr > 0 };
  }, [ledgerEntries]);

  const baseTotals = useMemo(() => ({
    dr: totals.dr * exchangeRate,
    cr: totals.cr * exchangeRate,
  }), [totals.dr, totals.cr, exchangeRate]);

  const needsApproval = useMemo(() => {
    const threshold = activeCompany?.approvalThreshold || 10000;
    return baseTotals.dr >= threshold;
  }, [baseTotals.dr, activeCompany]);

  const addLedgerEntry = () => {
    const lastType = ledgerEntries[ledgerEntries.length - 1]?.type || 'Dr';
    const nextType = lastType === 'Dr' ? 'Cr' : 'Dr';
    
    setLedgerEntries(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      ledgerId: '', 
      ledgerName: '', 
      type: nextType, 
      amount: totals.diff > 0 ? totals.diff : 0,
      taxRate: 0,
      taxAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      currency: currency,
      exchangeRate: 1
    }]);
  };

  const updateEntry = (id: string, field: keyof LedgerEntry, value: any) => {
    setLedgerEntries(prev => prev.map(e => {
      if (e.id === id) {
        let updated = { ...e, [field]: value };
        if (field === 'ledgerId') {
          const l = ledgers.find(lx => lx.id === value);
          updated.ledgerName = l?.name || '';
        }
        
        if (field === 'amount' || field === 'taxRate' || field === 'igst' || field === 'cgst' || field === 'sgst') {
          const amt = field === 'amount' ? value : updated.amount;
          
          if (supplyType === 'Local') {
            const taxRate = field === 'taxRate' ? value : updated.taxRate;
            updated.taxAmount = (amt * (taxRate || 0)) / 100;
            updated.cgst = updated.taxAmount / 2;
            updated.sgst = updated.taxAmount / 2;
            updated.igst = 0;
            updated.taxRate = taxRate;
          } else {
            const taxRate = field === 'taxRate' ? value : updated.taxRate;
            updated.taxAmount = (amt * (taxRate || 0)) / 100;
            updated.igst = updated.taxAmount;
            updated.cgst = 0;
            updated.sgst = 0;
            updated.taxRate = taxRate;
          }
        }

        return updated;
      }
      return e;
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string, isAmountField: boolean) => {
    if (e.key === 'Enter' && isAmountField) {
      e.preventDefault();
      const isLastEntry = ledgerEntries[ledgerEntries.length - 1].id === id;
      if (isLastEntry) {
        if (!totals.isBalanced && totals.diff > 0) {
          autoBalance();
        } else if (totals.isBalanced) {
          addLedgerEntry();
        }
      }
    }
  };

  const autoBalance = () => {
    if (totals.diff === 0) return;
    const lastIdx = ledgerEntries.length - 1;
    const lastEntry = ledgerEntries[lastIdx];
    const currentLineTotal = lastEntry.amount + (lastEntry.taxAmount || 0);
    const gap = lastEntry.type === 'Dr' ? (totals.cr - totals.dr) : (totals.dr - totals.cr);
    const targetLineTotal = currentLineTotal + gap;
    
    if (targetLineTotal >= 0) {
      const taxFactor = 1 + (lastEntry.taxRate || 0) / 100;
      const newPrincipal = targetLineTotal / taxFactor;
      updateEntry(lastEntry.id, 'amount', newPrincipal);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAttachment: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result as string
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totals.isBalanced || isReadOnly || isAssigning) {
      alert("Structural Integrity Error: Voucher must be balanced before transmission.");
      return;
    }
    
    setIsAssigning(true);
    setTimeout(() => {
      const primaryEntry = ledgerEntries.find(e => e.type === (vchType === 'Payment' ? 'Cr' : 'Dr')) || ledgerEntries[0];
      onSubmit({
        type: vchType,
        date,
        party: primaryEntry.ledgerName,
        amount: totals.dr,
        currency,
        exchangeRate,
        reference,
        narration,
        entries: ledgerEntries,
        status: needsApproval ? 'Pending Approval' : 'Posted',
        attachments,
        supplyType,
        taxTotal: ledgerEntries.reduce((acc, e) => acc + (e.taxAmount || 0), 0)
      });
      setIsAssigning(false);
    }, 800);
  };

  const activeColor = vchType === 'Payment' ? 'rose' : vchType === 'Receipt' ? 'emerald' : vchType === 'Contra' ? 'blue' : vchType === 'Journal' ? 'amber' : 'indigo';

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto animate-in zoom-in-95 duration-300 pb-10">
      <div className={`px-10 py-12 bg-${activeColor}-600 text-white flex justify-between items-center transition-all duration-700 relative overflow-hidden`}>
        <div className="flex items-center space-x-8 relative z-10">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md shadow-2xl transform -rotate-3 transition-transform hover:rotate-0">
            {vchType === 'Payment' ? '💸' : vchType === 'Receipt' ? '📥' : vchType === 'Contra' ? '🔄' : vchType === 'Journal' ? '⚖️' : '📋'}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-5">
              <select 
                value={vchType} 
                onChange={e => setVchType(e.target.value as VType)}
                className="bg-transparent border-none text-4xl font-black uppercase italic tracking-tighter leading-none outline-none cursor-pointer"
              >
                {['Payment', 'Receipt', 'Contra', 'Journal', 'Credit Note', 'Debit Note'].map(v => <option key={v} value={v} className="bg-slate-900 text-base">{v} Entry</option>)}
              </select>
              <div className="px-5 py-1.5 bg-black/20 rounded-xl border border-white/10 flex items-center space-x-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                 <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400"># {nextIdPreview}</span>
              </div>
            </div>
            <div className="flex items-center space-x-6 mt-3">
               <p className="text-xs font-black uppercase tracking-[0.4em] opacity-70 italic">
                  Financial Integrity Node • Global Ledger Sync
               </p>
               <div className="flex items-center bg-black/20 px-4 py-1 rounded-full border border-white/5 space-x-4">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Jurisdiction:</span>
                  <button type="button" onClick={() => setSupplyType(supplyType === 'Local' ? 'Central' : 'Local')} className="text-[9px] font-black uppercase tracking-widest hover:text-indigo-300 transition-colors">{supplyType}</button>
               </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col items-end space-y-4">
           <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xl border border-white/10 flex items-center space-x-6 text-white">
              <div className="space-y-1 text-right">
                 <label className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Base Currency</label>
                 <div className="text-sm font-black text-white">{currency} ({activeCompany?.currencyConfig?.symbol || '$'})</div>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Global Exchange Rate</label>
                 <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold opacity-60">1 {currency} =</span>
                    <input type="number" step="0.0001" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || 1)} className="bg-black/20 border border-white/10 rounded-lg px-2 py-0.5 text-xs font-black text-white outline-none w-20 text-center" />
                    <span className="text-[10px] font-bold opacity-60">{baseCurrencyCode}</span>
                 </div>
              </div>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[180px] opacity-10 -mr-64 -mt-64"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 shadow-inner">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Execution Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-8 py-5 rounded-2xl border border-slate-200 bg-white text-sm font-black outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Reference ID</label>
              <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Instrument / Document #" className="w-full px-8 py-5 rounded-2xl border border-slate-200 bg-white text-sm font-black outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm" />
           </div>
           <div className="md:col-span-2 flex items-center justify-end space-x-10">
              <div className="text-right">
                <div className="text-[9px] font-black uppercase text-slate-400 mb-2 italic">Equilibrium Gauge</div>
                <div className="flex items-center space-x-5">
                   <div className="w-64 h-3 bg-slate-200 rounded-full overflow-hidden relative border border-slate-300 p-0.5 shadow-inner">
                      <div 
                        className={`absolute h-full transition-all duration-1000 rounded-full ${totals.isBalanced ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'}`} 
                        style={{ left: totals.isBalanced ? '0' : (totals.dr > totals.cr ? '50%' : '0'), width: totals.isBalanced ? '100%' : '50%' }}
                      ></div>
                   </div>
                   <div className={`text-xl font-black italic tracking-tighter tabular-nums ${totals.isBalanced ? 'text-emerald-600 underline decoration-emerald-200 underline-offset-8' : 'text-rose-600'}`}>
                      {totals.isBalanced ? '✓ Synchronized' : `Δ ${totals.diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                   </div>
                </div>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center space-x-4 px-4">
              <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
              <h4 className="text-sm font-black uppercase italic tracking-tighter text-slate-800">Accounting Ledger Allocations</h4>
           </div>
           
           <div className="bg-white rounded-[3.5rem] border-2 border-slate-100 overflow-hidden shadow-2xl min-h-[200px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-7 text-center w-28">Protocol</th>
                    <th className="px-10 py-7">Account Ledger Node</th>
                    <th className="px-10 py-7 text-center w-32 bg-indigo-950/20">Tax Slab</th>
                    <th className="px-10 py-7 text-right w-44 bg-indigo-950/20">Tax Yield</th>
                    <th className="px-10 py-7 text-right w-72">Line Value ({currency})</th>
                    <th className="px-8 py-7 w-20 text-center">Detail</th>
                    <th className="px-8 py-7 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerEntries.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <tr className={`group transition-all ${expandedEntryId === entry.id ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                        <td className="px-10 py-6">
                          <button 
                            type="button" 
                            onClick={() => updateEntry(entry.id, 'type', entry.type === 'Dr' ? 'Cr' : 'Dr')}
                            className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase transition-all shadow-md transform active:scale-90 border-b-4 ${entry.type === 'Dr' ? 'bg-indigo-600 text-white border-indigo-900/40' : 'bg-rose-600 text-white border-rose-900/40'}`}
                          >
                            {entry.type}
                          </button>
                        </td>
                        <td className="px-10 py-6">
                          <div className="space-y-1">
                            <select 
                              value={entry.ledgerId} 
                              onChange={e => updateEntry(entry.id, 'ledgerId', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-indigo-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-inner appearance-none cursor-pointer"
                            >
                              <option value="">-- Search Registry --</option>
                              {ledgers.map(l => <option key={l.id} value={l.id}>{l.name} [{l.group}]</option>)}
                            </select>
                            <div className="flex items-center space-x-3 ml-2">
                               <span className="text-[8px] font-black text-slate-400 uppercase">State Sync: VERIFIED</span>
                               <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 bg-slate-50/30">
                          <div className="relative group/slab">
                            <input 
                              type="number" 
                              step="0.01" 
                              value={entry.taxRate || ''} 
                              onChange={e => updateEntry(entry.id, 'taxRate', parseFloat(e.target.value) || 0)} 
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-center text-xs font-black text-indigo-500 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20" 
                              placeholder="0%" 
                            />
                            <div className="absolute right-3 top-3 text-[9px] font-bold text-slate-300">%</div>
                          </div>
                        </td>
                        <td className="px-10 py-6 bg-slate-50/30 text-right">
                          <div className="text-sm font-black text-indigo-400 tabular-nums">${entry.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          <div className="text-[8px] font-black text-slate-300 uppercase tracking-tighter mt-1 italic">Statutory Component</div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="space-y-1">
                            <input 
                              type="number" 
                              step="0.01" 
                              value={entry.amount || ''} 
                              onChange={e => updateEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)}
                              onKeyDown={e => handleKeyDown(e, entry.id, true)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-7 py-4 text-right text-lg font-black tabular-nums text-slate-900 outline-none focus:bg-white focus:ring-8 focus:ring-indigo-500/5 shadow-inner"
                              placeholder="0.00"
                            />
                            <div className="flex justify-between items-center px-2">
                               <span className="text-[8px] font-black text-slate-400 uppercase italic">Base: {(entry.amount || 0).toLocaleString()}</span>
                               <span className="text-[9px] font-black text-indigo-500 uppercase">Gross: {((entry.amount || 0) + (entry.taxAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <button 
                            type="button" 
                            onClick={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                            className={`p-3 rounded-xl transition-all ${expandedEntryId === entry.id ? 'bg-indigo-600 text-white shadow-lg rotate-180' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                           >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                           </button>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <button type="button" onClick={() => setLedgerEntries(prev => prev.filter(le => le.id !== entry.id))} className="text-slate-200 hover:text-rose-500 transition-all p-3 rounded-xl hover:bg-rose-50 active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </td>
                      </tr>

                      {/* Line Item Advanced Detail Drawer */}
                      {expandedEntryId === entry.id && (
                        <tr className="bg-indigo-50/20 animate-in slide-in-from-top-4 duration-300">
                          <td colSpan={7} className="px-20 py-8 border-b-2 border-indigo-100 shadow-inner">
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div className="space-y-6">
                                   <div className="flex items-center space-x-3 mb-4">
                                      <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                                      <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Statutory Tax Forensics</h5>
                                   </div>
                                   <div className="grid grid-cols-3 gap-6 bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm relative overflow-hidden">
                                      <div className="space-y-2">
                                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CGST ({supplyType === 'Local' ? (entry.taxRate || 0)/2 : 0}%)</label>
                                         <div className="text-sm font-black text-slate-900 tabular-nums">${entry.cgst?.toLocaleString()}</div>
                                      </div>
                                      <div className="space-y-2">
                                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SGST ({supplyType === 'Local' ? (entry.taxRate || 0)/2 : 0}%)</label>
                                         <div className="text-sm font-black text-slate-900 tabular-nums">${entry.sgst?.toLocaleString()}</div>
                                      </div>
                                      <div className="space-y-2">
                                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IGST ({supplyType === 'Central' ? (entry.taxRate || 0) : 0}%)</label>
                                         <div className="text-sm font-black text-indigo-600 tabular-nums">${entry.igst?.toLocaleString()}</div>
                                      </div>
                                      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-50 rounded-full opacity-40"></div>
                                   </div>
                                </div>
                                
                                <div className="space-y-6">
                                   <div className="flex items-center space-x-3 mb-4">
                                      <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
                                      <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Multi-Currency Override</h5>
                                   </div>
                                   <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm flex items-center justify-between gap-10">
                                      <div className="flex-1 space-y-4">
                                         <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Line Currency</label>
                                            <select 
                                              value={entry.currency || currency} 
                                              onChange={e => updateEntry(entry.id, 'currency', e.target.value)}
                                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-indigo-600 outline-none"
                                            >
                                               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                            </select>
                                         </div>
                                      </div>
                                      <div className="flex-1 space-y-4">
                                         <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Row Exch. Rate</label>
                                            <input 
                                              type="number" 
                                              step="0.0001" 
                                              value={entry.exchangeRate || 1} 
                                              onChange={e => updateEntry(entry.id, 'exchangeRate', parseFloat(e.target.value) || 1)}
                                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-emerald-600 outline-none" 
                                            />
                                         </div>
                                      </div>
                                      <div className="shrink-0 text-right">
                                         <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Row Base Eq.</div>
                                         <div className="text-lg font-black text-emerald-900 tabular-nums">{(entry.amount * (entry.exchangeRate || 1)).toLocaleString()}</div>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              <div className="flex bg-slate-900 border-t border-slate-800 divide-x divide-white/5">
                 <button type="button" onClick={addLedgerEntry} className="flex-1 py-10 text-[12px] font-black uppercase text-indigo-400 hover:bg-white/5 transition-all tracking-[0.5em] group">
                   <span className="group-hover:translate-x-2 transition-transform inline-block">+ Append Identity Shard</span>
                 </button>
                 {totals.diff > 0 && (
                   <button type="button" onClick={autoBalance} className="px-16 py-10 text-[12px] font-black uppercase text-rose-500 hover:bg-rose-600 hover:text-white transition-all tracking-[0.5em] animate-pulse">
                     Finalize Balanced State ({totals.diff.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                   </button>
                 )}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-10">
           <div className="space-y-8">
              <div className="bg-slate-950 p-12 rounded-[4rem] border-4 border-slate-900 shadow-inner relative overflow-hidden group">
                 <div className="relative z-10 flex items-center justify-between mb-12">
                    <div>
                       <h5 className="text-[11px] font-black uppercase text-indigo-500 tracking-[0.4em] mb-2">Anchor Context Balance</h5>
                       <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest italic">All values normalized to {baseCurrencyCode}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform shadow-xl">
                       <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                 </div>
                 <div className="relative z-10 grid grid-cols-2 gap-12">
                    <div className="space-y-3">
                       <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregate Debit</span>
                       </div>
                       <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{baseCurrencyCode} {baseTotals.dr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="space-y-3 text-right">
                       <div className="flex items-center justify-end space-x-3">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregate Credit</span>
                          <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]"></div>
                       </div>
                       <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{baseCurrencyCode} {baseTotals.cr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-32 -mt-32 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                   <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Audit Artifacts</label>
                   <label className="cursor-pointer text-[10px] font-black text-indigo-600 uppercase hover:underline underline-offset-8 decoration-indigo-200 tracking-[0.2em] transition-all">
                      + Link Evidence
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                   </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {attachments.length > 0 ? attachments.map(att => (
                     <div key={att.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200 group hover:border-indigo-400 transition-all shadow-sm">
                        <div className="flex items-center space-x-3 truncate">
                           <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-inner text-xs">📄</div>
                           <span className="text-[11px] font-black text-slate-700 truncate uppercase italic">{att.name}</span>
                        </div>
                        <button type="button" onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-slate-300 hover:text-rose-600 transform transition-all group-hover:scale-110 active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                     </div>
                   )) : (
                     <div className="col-span-2 py-10 text-center opacity-30 italic font-black uppercase text-[10px] tracking-[0.5em] border-2 border-dashed border-slate-100 rounded-[2rem]">No Artifacts Linked</div>
                   )}
                </div>
              </div>
           </div>

           <div className="space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-6">
                 <div className="flex items-center space-x-3 mb-2 ml-2">
                    <div className="w-1.5 h-4 bg-slate-900 rounded-full"></div>
                    <label className="text-[11px] font-black uppercase text-slate-800 tracking-[0.4em]">Audit Trail Narrative</label>
                 </div>
                 <textarea value={narration} onChange={e => setNarration(e.target.value)} placeholder="Provide forensic context for this ledger movement. State the business rationale and relevant statutory references..." className="w-full h-56 px-8 py-8 rounded-[2.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium italic resize-none shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all leading-relaxed" />
              </div>

              <div className="pt-8 flex flex-col gap-6">
                <button 
                  type="submit" 
                  disabled={!totals.isBalanced || isReadOnly || isAssigning}
                  className={`w-full py-12 rounded-[3.5rem] font-black text-sm uppercase tracking-[0.6em] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all transform active:scale-95 border-b-[12px] border-slate-950 group relative overflow-hidden ${totals.isBalanced && !isAssigning ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed border-none'}`}
                >
                   <span className="relative z-10">{isAssigning ? 'Synchronizing Shards...' : 'Commit Transaction Node'}</span>
                   {totals.isBalanced && !isAssigning && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                   )}
                </button>
                <button type="button" onClick={onCancel} className="w-full py-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] hover:text-rose-600 transition-all flex items-center justify-center space-x-4">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                   <span>Abort Sequence</span>
                </button>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
};

export default VoucherEntryForm;