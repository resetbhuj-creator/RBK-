
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Voucher, Ledger, LedgerEntry, VoucherType, Attachment } from '../types';

interface VoucherEntryFormProps {
  isReadOnly?: boolean;
  ledgers: Ledger[];
  vouchers?: Voucher[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
  getNextId: (type: string) => string;
  activeCompany?: any;
  forcedVType?: VType;
}

type VType = Extract<VoucherType, 'Payment' | 'Receipt' | 'Contra' | 'Journal' | 'Credit Note' | 'Debit Note' | 'Sales Return' | 'Purchase Return'>;

const ADJ_REASONS = [
  'Sales Return',
  'Purchase Return',
  'Post-sale Discount',
  'Correction of Pricing',
  'Quantity Variance',
  'Defective Goods',
  'Post-purchase Rebate',
  'Other Statutory Adjustment'
];

const NARRATION_TEMPLATES: Record<string, string[]> = {
  'Payment': [
    "Being amount paid via electronic transfer for invoice settlement.",
    "Being cash payment issued towards petty expenses.",
    "Being statutory dues cleared for the current period.",
    "Being advance payment issued against purchase order."
  ],
  'Receipt': [
    "Being funds received via wire transfer against outward supply.",
    "Being cash received for miscellaneous services.",
    "Being settlement received for outstanding receivables.",
    "Being interest income realized on capital reserves."
  ],
  'Contra': [
    "Being funds transferred from Cash Vault to Bank Node.",
    "Being cash withdrawn from Bank for operational liquidity.",
    "Being internal movement of funds between bank accounts."
  ],
  'Journal': [
    "Being rectification entry passed for ledger variance.",
    "Being provision created for outstanding liabilities.",
    "Being depreciation allocated for fixed assets.",
    "Being month-end accrual adjustment committed."
  ],
  'Credit Note': [
    "Being credit allowed for sales return against invoice.",
    "Being adjustment for pricing variance in previous billing.",
    "Being discount authorized post-transaction."
  ],
  'Debit Note': [
    "Being debit charged for purchase return to supplier.",
    "Being adjustment for short-supply of inventory shards.",
    "Being escalation of pricing for revised statutory rates."
  ],
  'Sales Return': [
    "Being goods returned by counterparty node due to technical variance.",
    "Being credit authorized against historical outward supply.",
    "Being statutory reversal of sales tax liability committed."
  ],
  'Purchase Return': [
    "Being goods returned to supplier node due to quality failure.",
    "Being debit authorized against historical inward supply.",
    "Being statutory reversal of input tax credit committed."
  ]
};

const VoucherEntryForm: React.FC<VoucherEntryFormProps> = ({ isReadOnly, ledgers, onSubmit, onCancel, getNextId, activeCompany, forcedVType }) => {
  const [vchType, setVchType] = useState<VType>(forcedVType || 'Payment');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [sourceDocRef, setSourceDocRef] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [narration, setNarration] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [supplyType, setSupplyType] = useState<'Local' | 'Central'>('Local');
  const [showTemplates, setShowTemplates] = useState(false);
  
  const [currency, setCurrency] = useState(activeCompany?.currencyConfig?.code || 'USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    { id: '1', ledgerId: '', ledgerName: '', type: 'Dr', amount: 0, taxRate: 0, taxAmount: 0, cgst: 0, sgst: 0, igst: 0, currency: currency, exchangeRate: 1 },
    { id: '2', ledgerId: '', ledgerName: '', type: 'Cr', amount: 0, taxRate: 0, taxAmount: 0, cgst: 0, sgst: 0, igst: 0, currency: currency, exchangeRate: 1 }
  ]);

  const baseCurrencyCode = activeCompany?.currencyConfig?.code || 'USD';
  const nextIdPreview = useMemo(() => getNextId(vchType), [vchType, getNextId]);

  useEffect(() => {
    if (forcedVType) setVchType(forcedVType);
  }, [forcedVType]);

  useEffect(() => {
    setLedgerEntries(prev => prev.map(e => {
      const taxAmt = (e.amount * (e.taxRate || 0)) / 100;
      return {
        ...e,
        taxAmount: taxAmt,
        cgst: supplyType === 'Local' ? taxAmt / 2 : 0,
        sgst: supplyType === 'Local' ? taxAmt / 2 : 0,
        igst: supplyType === 'Central' ? taxAmt : 0
      };
    }));
  }, [supplyType]);

  const categorizedLedgers = useMemo(() => {
    const cashBank = ledgers.filter(l => l.group.toLowerCase().includes('bank') || l.group.toLowerCase().includes('cash'));
    const others = ledgers.filter(l => !l.group.toLowerCase().includes('bank') && !l.group.toLowerCase().includes('cash'));
    return { cashBank, others };
  }, [ledgers]);

  const validationViolations = useMemo(() => {
    const violations: string[] = [];
    const entriesWithLedger = ledgerEntries.filter(e => e.ledgerId);
    
    if (entriesWithLedger.length < 2) violations.push("Minimum of two ledger shards required for double-entry parity.");

    if (vchType === 'Contra') {
      const nonCashBank = entriesWithLedger.filter(e => !categorizedLedgers.cashBank.some(l => l.id === e.ledgerId));
      if (nonCashBank.length > 0) violations.push("Contra Protocol Violation: Only internal transfers between Cash/Bank nodes are permitted.");
    }

    if (vchType === 'Receipt') {
      const debits = entriesWithLedger.filter(e => e.type === 'Dr');
      const nonCashBankDebit = debits.filter(e => !categorizedLedgers.cashBank.some(l => l.id === e.ledgerId));
      if (nonCashBankDebit.length > 0) violations.push("Receipt Protocol: Incoming funds must be debited to a Cash or Bank node.");
    }

    if (vchType === 'Payment') {
      const credits = entriesWithLedger.filter(e => e.type === 'Cr');
      const nonCashBankCredit = credits.filter(e => !categorizedLedgers.cashBank.some(l => l.id === e.ledgerId));
      if (nonCashBankCredit.length > 0) violations.push("Payment Protocol: Outgoing funds must be credited from a Cash or Bank node.");
    }

    const dr = ledgerEntries.filter(e => e.type === 'Dr').reduce((acc, e) => acc + (e.amount || 0) + (e.taxAmount || 0), 0);
    const cr = ledgerEntries.filter(e => e.type === 'Cr').reduce((acc, e) => acc + (e.amount || 0) + (e.taxAmount || 0), 0);
    if (Math.abs(dr - cr) > 0.001) violations.push(`Equilibrium Failure: Variance of ${Math.abs(dr - cr).toFixed(2)} detected.`);

    return violations;
  }, [vchType, ledgerEntries, categorizedLedgers]);

  const totals = useMemo(() => {
    const dr = ledgerEntries.filter(e => e.type === 'Dr').reduce((acc, e) => acc + (e.amount || 0) + (e.taxAmount || 0), 0);
    const cr = ledgerEntries.filter(e => e.type === 'Cr').reduce((acc, e) => acc + (e.amount || 0) + (e.taxAmount || 0), 0);
    const diff = Math.abs(dr - cr);
    return { dr, cr, diff, isBalanced: diff < 0.001 && dr > 0 };
  }, [ledgerEntries]);

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

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const updateEntry = (id: string, field: keyof LedgerEntry, value: any) => {
    setLedgerEntries(prev => prev.map(e => {
      if (e.id === id) {
        let updated = { ...e, [field]: value };
        if (field === 'ledgerId') {
          const l = ledgers.find(lx => lx.id === value);
          updated.ledgerName = l?.name || '';
        }
        if (field === 'amount' || field === 'taxRate') {
          const amt = field === 'amount' ? value : updated.amount;
          const taxRate = field === 'taxRate' ? value : updated.taxRate;
          const taxAmt = (amt * (taxRate || 0)) / 100;
          updated.taxAmount = taxAmt;
          updated.cgst = supplyType === 'Local' ? taxAmt / 2 : 0;
          updated.sgst = supplyType === 'Local' ? taxAmt / 2 : 0;
          updated.igst = supplyType === 'Central' ? taxAmt : 0;
        }
        return updated;
      }
      return e;
    }));
  };

  const autoBalance = () => {
    if (totals.diff === 0) return;
    const lastIdx = ledgerEntries.length - 1;
    const lastEntry = ledgerEntries[lastIdx];
    const currentVal = lastEntry.amount + (lastEntry.taxAmount || 0);
    const gap = lastEntry.type === 'Dr' ? (totals.cr - totals.dr) : (totals.dr - totals.cr);
    const target = currentVal + gap;
    if (target >= 0) updateEntry(lastEntry.id, 'amount', target / (1 + (lastEntry.taxRate || 0) / 100));
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationViolations.length > 0 || isReadOnly || isAssigning) return;
    
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
        sourceDocRef,
        returnReason,
        entries: ledgerEntries,
        attachments,
        supplyType,
        taxTotal: ledgerEntries.reduce((acc, e) => acc + (e.taxAmount || 0), 0),
        gstClassification: vchType === 'Receipt' || vchType === 'Purchase Return' || vchType === 'Debit Note' ? 'Input' : (vchType === 'Payment' || vchType === 'Sales Return' || vchType === 'Credit Note' ? 'Output' : 'Input')
      });
      setIsAssigning(false);
    }, 1200);
  };

  const activeColor = vchType === 'Payment' || vchType === 'Credit Note' || vchType === 'Sales Return' ? 'rose' : vchType === 'Receipt' || vchType === 'Purchase Return' || vchType === 'Debit Note' ? 'emerald' : vchType === 'Contra' ? 'blue' : vchType === 'Journal' ? 'amber' : 'indigo';

  const isNote = vchType === 'Credit Note' || vchType === 'Debit Note' || vchType === 'Sales Return' || vchType === 'Purchase Return';

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto animate-in zoom-in-95 duration-300 pb-10">
      <div className={`px-10 py-12 bg-${activeColor}-600 text-white flex justify-between items-center transition-all duration-700 relative overflow-hidden`}>
        <div className="flex items-center space-x-8 relative z-10">
          <div className="w-20 h-20 bg-white/20 rounded-[2.2rem] flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform">
             {vchType === 'Contra' ? '🔄' : vchType === 'Receipt' ? '📥' : vchType === 'Journal' ? '⚖️' : vchType === 'Credit Note' || vchType === 'Sales Return' ? '📉' : vchType === 'Debit Note' || vchType === 'Purchase Return' ? '📈' : '💸'}
          </div>
          <div>
            <div className="flex items-center space-x-6">
              <select 
                value={vchType} 
                onChange={e => setVchType(e.target.value as VType)}
                disabled={!!forcedVType}
                className={`bg-transparent border-none text-4xl font-black uppercase italic tracking-tighter outline-none p-0 ${forcedVType ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {['Payment', 'Receipt', 'Contra', 'Journal', 'Credit Note', 'Debit Note', 'Sales Return', 'Purchase Return'].map(v => <option key={v} value={v} className="bg-slate-900 text-base">{v} Shard</option>)}
              </select>
              <div className="px-5 py-2 bg-black/20 rounded-2xl border border-white/10 font-mono text-sm font-black tracking-widest text-white/90 shadow-inner">
                # {nextIdPreview}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mt-3 italic flex items-center">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-3"></span>
              Synchronized Financial Nucleus • Multi-Ledger Logic
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-[200px] opacity-10 -mr-64 -mt-64"></div>
      </div>

      <form onSubmit={handlePost} className="p-12 space-y-12 bg-slate-50/20">
        {/* Validation Cockpit */}
        {validationViolations.length > 0 && (
          <div className="bg-rose-50 border-l-8 border-rose-500 rounded-[2rem] p-8 shadow-inner animate-in slide-in-from-top-4">
             <h4 className="text-[10px] font-black uppercase text-rose-600 tracking-[0.3em] mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Integrity Violations Found
             </h4>
             <ul className="space-y-2">
                {validationViolations.map((v, i) => (
                  <li key={i} className="text-xs font-black text-rose-900 italic flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-3 shrink-0"></div>
                    {v}
                  </li>
                ))}
             </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Posting Moment</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-8 py-5 rounded-[1.8rem] border border-slate-200 bg-white text-sm font-black shadow-sm outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Internal Reference</label>
              <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Chq / Ref / Doc ID" className="w-full px-8 py-5 rounded-[1.8rem] border border-slate-200 bg-white text-sm font-black shadow-sm outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Operating Protocol</label>
             <div className="flex bg-white border border-slate-200 p-1 rounded-[1.5rem] shadow-sm">
                {(['Local', 'Central'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setSupplyType(s)} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-2xl transition-all ${supplyType === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{s}</button>
                ))}
             </div>
           </div>
           <div className="p-8 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl flex items-center justify-between">
              <div>
                <div className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Shard Balance</div>
                <div className={`text-4xl font-black italic tracking-tighter tabular-nums ${totals.isBalanced ? 'text-white' : 'text-rose-400'}`}>
                  ${totals.dr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border-2 ${totals.isBalanced ? 'bg-emerald-50/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-50/20 text-rose-400 border-rose-500/30'}`}>
                  {totals.isBalanced ? 'EQUILIBRIUM' : 'VARIANCE'}
                </span>
              </div>
           </div>
        </div>

        {/* Note Specific Linking Metadata */}
        {isNote && (
          <div className="bg-indigo-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-l-8 border-indigo-500 animate-in slide-in-from-left-4">
             <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 mb-8 flex items-center">
                   <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                   Linking & Adjustment Protocol
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Original Document Hash (Source Reference)</label>
                      <input 
                        value={sourceDocRef} 
                        onChange={e => setSourceDocRef(e.target.value)} 
                        placeholder="e.g. SL/23-24/00045"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner italic" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Statutory Adjustment Reason</label>
                      <select 
                        value={returnReason} 
                        onChange={e => setReturnReason(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none cursor-pointer hover:bg-white/10 transition-all"
                      >
                         <option value="" className="bg-slate-900">-- Choose Reason --</option>
                         {ADJ_REASONS.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                      </select>
                   </div>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
          </div>
        )}

        <div className="space-y-6">
           <div className="flex items-center space-x-4 px-4">
              <div className="w-1.5 h-4 bg-slate-900 rounded-full"></div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Double-Entry Decomposition</h4>
           </div>

           <div className="bg-white rounded-[3.5rem] border-2 border-slate-100 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                 <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-400">
                    <tr>
                       <th className="px-10 py-7 text-center w-32">Polarity</th>
                       <th className="px-10 py-7">Ledger Identity Node</th>
                       <th className="px-10 py-7 text-right w-64">Resolved Shard ($)</th>
                       <th className="px-10 py-7 text-center w-24">Tax Config</th>
                       <th className="px-10 py-7 w-16"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {ledgerEntries.map((entry, idx) => {
                      const isExpanded = expandedEntryId === entry.id;
                      return (
                        <React.Fragment key={entry.id}>
                          <tr className={`hover:bg-indigo-50/20 transition-all group ${isExpanded ? 'bg-indigo-50/10' : ''}`}>
                            <td className="px-10 py-6">
                               <button 
                                 type="button" 
                                 onClick={() => updateEntry(entry.id, 'type', entry.type === 'Dr' ? 'Cr' : 'Dr')}
                                 className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase shadow-lg transition-transform active:scale-90 border-b-4 ${entry.type === 'Dr' ? 'bg-indigo-600 text-white border-indigo-900/40' : 'bg-rose-600 text-white border-rose-900/40'}`}
                               >
                                  {entry.type}
                               </button>
                            </td>
                            <td className="px-10 py-6">
                               <select 
                                 value={entry.ledgerId} 
                                 onChange={e => updateEntry(entry.id, 'ledgerId', e.target.value)}
                                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner appearance-none cursor-pointer"
                               >
                                  <option value="">-- Choose Account --</option>
                                  {(vchType === 'Payment' || vchType === 'Receipt' || vchType === 'Contra') ? (
                                    <optgroup label="Cash & Bank Shards">
                                       {categorizedLedgers.cashBank.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </optgroup>
                                  ) : null}
                                  <optgroup label="General Ledger Matrix">
                                     {categorizedLedgers.others.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                  </optgroup>
                               </select>
                            </td>
                            <td className="px-10 py-6">
                               <input 
                                 type="number" step="0.01" 
                                 value={entry.amount || ''} 
                                 onChange={e => updateEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)} 
                                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-right text-lg font-black text-slate-900 shadow-inner outline-none focus:bg-white transition-all"
                                 placeholder="0.00"
                               />
                            </td>
                            <td className="px-10 py-6 text-center">
                               <button 
                                 type="button" 
                                 onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                                 className={`p-4 rounded-2xl transition-all shadow-md ${isExpanded ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-100 text-slate-400 hover:text-indigo-600'}`}
                               >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
                               </button>
                            </td>
                            <td className="px-10 py-6 text-center">
                               <button type="button" onClick={() => setLedgerEntries(prev => prev.filter(e => e.id !== entry.id))} className="text-slate-200 hover:text-rose-500 transition-all p-3 hover:bg-rose-50 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </td>
                          </tr>
                          
                          {isExpanded && (
                            <tr className="bg-indigo-50/20 animate-in slide-in-from-top-2 duration-300">
                              <td colSpan={5} className="px-20 py-8 border-b border-indigo-100">
                                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
                                    <div className="space-y-2">
                                       <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Statutory Tax Rate (%)</label>
                                       <input type="number" step="0.1" value={entry.taxRate || ''} onChange={e => updateEntry(entry.id, 'taxRate', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm font-black outline-none shadow-sm" placeholder="0.0%" />
                                    </div>
                                    <div className="md:col-span-3">
                                       <div className="grid grid-cols-3 gap-4 bg-white/50 p-6 rounded-[2rem] border border-indigo-100">
                                          <div className="text-center">
                                             <div className="text-[8px] font-black text-slate-400 uppercase mb-1">CGST ({supplyType === 'Local' ? (entry.taxRate || 0)/2 : 0}%)</div>
                                             <div className="text-sm font-black text-slate-800">${((entry.taxAmount || 0)/2).toLocaleString()}</div>
                                          </div>
                                          <div className="text-center">
                                             <div className="text-[8px] font-black text-slate-400 uppercase mb-1">SGST ({supplyType === 'Local' ? (entry.taxRate || 0)/2 : 0}%)</div>
                                             <div className="text-sm font-black text-slate-800">${((entry.taxAmount || 0)/2).toLocaleString()}</div>
                                          </div>
                                          <div className="text-center">
                                             <div className="text-[8px] font-black text-indigo-400 uppercase mb-1">IGST ({supplyType === 'Central' ? (entry.taxRate || 0) : 0}%)</div>
                                             <div className="text-sm font-black text-indigo-600">${(entry.igst || 0).toLocaleString()}</div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                 </tbody>
              </table>
              <div className="flex bg-slate-950 border-t border-white/5 divide-x divide-white/5">
                 <button type="button" onClick={() => setLedgerEntries(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ledgerId: '', ledgerName: '', type: ledgerEntries[ledgerEntries.length-1].type === 'Dr' ? 'Cr' : 'Dr', amount: totals.diff || 0, taxRate: 0, taxAmount: 0, cgst: 0, sgst: 0, igst: 0, currency, exchangeRate: 1 }])} className="flex-1 py-8 text-[11px] font-black uppercase text-indigo-400 hover:bg-white/5 transition-all tracking-[0.4em]">+ Add Identity Shard</button>
                 {totals.diff > 0 && (
                   <button type="button" onClick={autoBalance} className="px-16 py-8 text-[11px] font-black uppercase text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all tracking-[0.4em] animate-pulse">Sync Equilibrium</button>
                 )}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                 <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Forensic Narrative</label>
                 <button 
                  type="button" 
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                 >
                   {showTemplates ? 'Hide Blueprints' : 'Narrative Blueprints'}
                 </button>
              </div>
              
              {showTemplates && (
                <div className="grid grid-cols-1 gap-2 p-4 bg-white rounded-[2rem] border border-slate-200 shadow-inner animate-in slide-in-from-top-2">
                   {NARRATION_TEMPLATES[vchType]?.map((temp, i) => (
                     <button 
                      key={i} 
                      type="button" 
                      onClick={() => { setNarration(temp); setShowTemplates(false); }}
                      className="text-left p-3 hover:bg-indigo-50 rounded-xl text-[10px] font-bold text-slate-600 transition-colors border border-transparent hover:border-indigo-100"
                     >
                       "{temp}"
                     </button>
                   ))}
                </div>
              )}

              <textarea 
                value={narration} 
                onChange={e => setNarration(e.target.value)} 
                placeholder="Provide institutional context for this ledger shift..." 
                className="w-full h-48 px-10 py-10 rounded-[3rem] border border-slate-200 bg-slate-50/50 text-sm font-medium italic outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white shadow-inner resize-none leading-relaxed transition-all" 
              />
           </div>
           
           <div className="space-y-6">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-[0.4em]">Document Vault (Attachments)</label>
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-8 flex flex-col items-center justify-center space-y-4 group hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                 <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📎</div>
                 <div className="text-center">
                    <p className="text-[11px] font-black text-slate-700 uppercase">Attach Statutory Evidence</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Images, PDFs or XML Shards (Max 5MB)</p>
                 </div>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                   {attachments.map(att => (
                     <div key={att.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in zoom-in-95">
                        <div className="flex items-center space-x-3 overflow-hidden">
                           <span className="text-lg">📄</span>
                           <div className="min-w-0">
                              <p className="text-[10px] font-black text-slate-800 truncate uppercase">{att.name}</p>
                              <p className="text-[8px] text-slate-400 font-bold">{(att.size / 1024).toFixed(1)} KB</p>
                           </div>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeAttachment(att.id); }} className="text-slate-300 hover:text-rose-500 p-1">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>

        <div className="flex flex-col justify-end space-y-6 pt-10 border-t border-slate-100">
           <div className="p-10 bg-indigo-950 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group max-w-xl ml-auto">
              <div className="relative z-10 flex justify-between items-center space-x-12">
                 <div>
                    <h5 className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-2">Aggregate Value</h5>
                    <div className="text-5xl font-black italic tracking-tighter text-white tabular-nums">${totals.dr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                 </div>
                 <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-2xl border border-indigo-400/20 shadow-lg group-hover:rotate-12 transition-transform">💎</div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-10"></div>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-6 justify-end">
              <button type="button" onClick={onCancel} className="px-12 py-10 text-[11px] font-black uppercase text-slate-400 hover:text-rose-600 transition-all tracking-[0.4em]">Abort</button>
              <button 
               type="submit" 
               disabled={validationViolations.length > 0 || isReadOnly || isAssigning}
               className={`w-full sm:w-[480px] py-10 rounded-[3rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl transition-all transform active:scale-95 border-b-[10px] border-slate-950 ${validationViolations.length > 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-none' : 'bg-slate-900 text-white hover:bg-black'}`}
              >
                {isAssigning ? 'Syncing Vault...' : 'Commit Transaction Node'}
              </button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default VoucherEntryForm;
