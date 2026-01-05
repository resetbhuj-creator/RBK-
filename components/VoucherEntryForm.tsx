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
}

type VType = Extract<VoucherType, 'Payment' | 'Receipt' | 'Contra' | 'Journal'>;

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
  
  const [currency, setCurrency] = useState(activeCompany?.currencyConfig?.code || 'USD');
  const [exchangeRate, setExchangeRate] = useState(1);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    { id: '1', ledgerId: '', ledgerName: '', type: 'Dr', amount: 0, taxRate: 0, taxAmount: 0 },
    { id: '2', ledgerId: '', ledgerName: '', type: 'Cr', amount: 0, taxRate: 0, taxAmount: 0 }
  ]);

  const baseCurrencyCode = activeCompany?.currencyConfig?.code || 'USD';
  const isForeignCurrency = currency !== baseCurrencyCode;

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
      taxAmount: 0
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
        
        if (field === 'amount' || field === 'taxRate') {
          const amt = field === 'amount' ? value : updated.amount;
          const rate = field === 'taxRate' ? value : updated.taxRate;
          updated.taxAmount = (amt * (rate || 0)) / 100;
        }

        return updated;
      }
      return e;
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string, isLastField: boolean) => {
    if (e.key === 'Enter' && isLastField) {
      e.preventDefault();
      const currentEntry = ledgerEntries.find(ent => ent.id === id);
      if (currentEntry && currentEntry.ledgerId && (currentEntry.amount > 0 || currentEntry.taxAmount! > 0)) {
        addLedgerEntry();
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
        taxTotal: ledgerEntries.reduce((acc, e) => acc + (e.taxAmount || 0), 0)
      });
      setIsAssigning(false);
    }, 800);
  };

  const activeColor = vchType === 'Payment' ? 'rose' : vchType === 'Receipt' ? 'emerald' : vchType === 'Contra' ? 'blue' : 'amber';

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto animate-in zoom-in-95 duration-300">
      <div className={`px-10 py-12 bg-${activeColor}-600 text-white flex justify-between items-center transition-all duration-700 relative overflow-hidden`}>
        <div className="flex items-center space-x-8 relative z-10">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md shadow-2xl transform -rotate-3 transition-transform hover:rotate-0">
            {vchType === 'Payment' ? '💸' : vchType === 'Receipt' ? '📥' : vchType === 'Contra' ? '🔄' : '⚖️'}
          </div>
          <div>
            <div className="flex items-center space-x-5">
              <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{vchType} Entry</h3>
              <div className="px-5 py-1.5 bg-black/20 rounded-xl border border-white/10 flex items-center space-x-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                 <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400"># {nextIdPreview}</span>
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.4em] opacity-70 mt-3 italic flex items-center">
               Financial Integrity Node • {currency} Operations
            </p>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col items-end space-y-4">
           <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xl border border-white/10 flex items-center space-x-6">
              <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Session Currency</label>
                 <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-transparent border-none text-sm font-black text-white outline-none cursor-pointer">
                   {CURRENCIES.map(c => <option key={c.code} value={c.code} className="bg-slate-900">{c.code} ({c.symbol})</option>)}
                 </select>
              </div>
              {isForeignCurrency && (
                <div className="space-y-1 border-l border-white/10 pl-6 animate-in slide-in-from-right-2">
                   <label className="text-[8px] font-black uppercase tracking-widest text-indigo-200">1 {currency} = ? {baseCurrencyCode}</label>
                   <input type="number" step="0.0001" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || 1)} className="bg-transparent border-none text-sm font-black text-white outline-none w-20" />
                </div>
              )}
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
                <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Session Equilibrium Gauge</div>
                <div className="flex items-center space-x-3">
                   <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
                      <div 
                        className={`absolute h-full transition-all duration-700 ${totals.isBalanced ? 'bg-emerald-500 w-full' : 'bg-rose-500'}`} 
                        style={{ width: totals.isBalanced ? '100%' : `${Math.min((Math.min(totals.dr, totals.cr) / Math.max(totals.dr, totals.cr) || 0) * 100, 100)}%` }}
                      ></div>
                   </div>
                   <div className={`text-lg font-black italic tabular-nums ${totals.isBalanced ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {totals.isBalanced ? '✓ Balanced' : `${totals.diff.toLocaleString()} Delta`}
                   </div>
                </div>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white rounded-[3.5rem] border-2 border-slate-100 overflow-hidden shadow-2xl min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-7 text-center w-24">Type</th>
                    <th className="px-10 py-7">Account Ledger Node</th>
                    <th className="px-10 py-7 text-center w-28 bg-indigo-950/50">Tax %</th>
                    <th className="px-10 py-7 text-right w-40 bg-indigo-950/50">Tax Val</th>
                    <th className="px-10 py-7 text-right w-64">Net Shard Value ({currency})</th>
                    <th className="px-8 py-7 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="group hover:bg-slate-50 transition-colors animate-in fade-in">
                      <td className="px-10 py-6">
                        <button 
                          type="button" 
                          onClick={() => updateEntry(entry.id, 'type', entry.type === 'Dr' ? 'Cr' : 'Dr')}
                          className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-md ${entry.type === 'Dr' ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'}`}
                        >
                          {entry.type}
                        </button>
                      </td>
                      <td className="px-10 py-6">
                        <div className="space-y-1">
                          <select 
                            value={entry.ledgerId} 
                            onChange={e => updateEntry(entry.id, 'ledgerId', e.target.value)}
                            className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-indigo-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
                          >
                            <option value="">-- Locate Account Ledger --</option>
                            {ledgers.map(l => <option key={l.id} value={l.id}>{l.name} [{l.group}]</option>)}
                          </select>
                          {isForeignCurrency && entry.amount > 0 && (
                            <span className="text-[8px] font-black text-slate-400 uppercase ml-2">Base Eq: {baseCurrencyCode} {(entry.amount * exchangeRate).toLocaleString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-6 bg-slate-50/50">
                        <input type="number" step="0.01" value={entry.taxRate || ''} onChange={e => updateEntry(entry.id, 'taxRate', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-center text-xs font-black text-indigo-500 outline-none shadow-sm" placeholder="0%" />
                      </td>
                      <td className="px-10 py-6 bg-slate-50/50 text-right">
                        <div className="text-sm font-black text-indigo-400 tabular-nums">{entry.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="space-y-1">
                          <input 
                            type="number" 
                            step="0.01" 
                            value={entry.amount || ''} 
                            onChange={e => updateEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)}
                            onKeyDown={e => handleKeyDown(e, entry.id, true)}
                            className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-7 py-4 text-right text-lg font-black tabular-nums text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
                            placeholder="0.00"
                          />
                          <div className="text-[9px] font-black text-slate-400 uppercase">Gross: {((entry.amount || 0) + (entry.taxAmount || 0)).toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <button type="button" onClick={() => setLedgerEntries(prev => prev.filter(le => le.id !== entry.id))} className="text-slate-200 hover:text-rose-600 transition-all p-3 rounded-xl hover:bg-rose-50"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex bg-slate-900 border-t border-slate-800 divide-x divide-white/5">
                 <button type="button" onClick={addLedgerEntry} className="flex-1 py-7 text-[11px] font-black uppercase text-indigo-400 hover:bg-white/5 transition-all tracking-[0.4em]">+ Append Account Shard</button>
                 {totals.diff > 0 && (
                   <button type="button" onClick={autoBalance} className="px-14 py-7 text-[11px] font-black uppercase text-rose-500 hover:bg-rose-600 hover:text-white transition-all tracking-[0.4em] animate-pulse">Apply Delta ({totals.diff.toLocaleString()})</button>
                 )}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
           <div className="space-y-8">
              <div className="bg-slate-900 p-10 rounded-[3.5rem] border border-slate-800 shadow-inner space-y-8 relative overflow-hidden">
                 <div className="relative z-10 flex items-center justify-between">
                    <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Local Anchor Equivalence</h5>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">Anchor: {baseCurrencyCode}</span>
                 </div>
                 <div className="relative z-10 grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                       <span className="text-[9px] font-black text-slate-500 uppercase">Debit (Equiv)</span>
                       <div className="text-3xl font-black text-white italic tracking-tighter tabular-nums">{baseCurrencyCode} {baseTotals.dr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="space-y-1 text-right">
                       <span className="text-[9px] font-black text-slate-500 uppercase">Credit (Equiv)</span>
                       <div className="text-3xl font-black text-white italic tracking-tighter tabular-nums">{baseCurrencyCode} {baseTotals.cr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-10"></div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                   <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Audit Evidence Vault</label>
                   <label className="cursor-pointer text-[10px] font-black text-indigo-600 uppercase hover:underline underline-offset-4 tracking-widest">
                      + Link External Artifact
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                   </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   {attachments.map(att => (
                     <div key={att.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                        <span className="text-[10px] font-black text-slate-700 truncate max-w-[120px]">{att.name}</span>
                        <button type="button" onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-slate-300 hover:text-rose-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                     </div>
                   ))}
                </div>
              </div>
           </div>

           <div className="space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                 <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] ml-2">Session Narrative</label>
                 <textarea value={narration} onChange={e => setNarration(e.target.value)} placeholder="Provide professional context for this shard movement..." className="w-full h-44 px-8 py-8 rounded-[2.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium italic resize-none shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 leading-relaxed" />
              </div>

              <div className="pt-8 flex flex-col gap-6">
                <button 
                  type="submit" 
                  disabled={!totals.isBalanced || isReadOnly || isAssigning}
                  className={`w-full py-10 rounded-[3rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl transition-all transform active:scale-95 border-b-8 border-slate-950 ${totals.isBalanced && !isAssigning ? 'bg-slate-900 text-white hover:bg-black group' : 'bg-slate-200 text-slate-400 cursor-not-allowed border-none'}`}
                >
                   {isAssigning ? 'Serializing Shards...' : 'Commit to Global Ledger'}
                </button>
                <button type="button" onClick={onCancel} className="w-full py-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] hover:text-rose-500 transition-colors">Abort Data Transmission</button>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
};

export default VoucherEntryForm;