import React, { useState, useMemo } from 'react';
import { Voucher, Ledger } from '../types';

interface VoucherEntryFormProps {
  isReadOnly?: boolean;
  ledgers: Ledger[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
}

type VType = 'Payment' | 'Receipt' | 'Contra' | 'Journal';

const VoucherEntryForm: React.FC<VoucherEntryFormProps> = ({ isReadOnly, ledgers, onSubmit, onCancel }) => {
  const [vchType, setVchType] = useState<VType>('Payment');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    party: '',
    amount: 0,
    narration: '',
    ledgerId: '',
    secondaryLedgerId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeConfig = useMemo(() => {
    switch (vchType) {
      case 'Payment': return { color: 'rose', label: 'Payment', icon: '💸' };
      case 'Receipt': return { color: 'emerald', label: 'Receipt', icon: '📥' };
      case 'Contra': return { color: 'blue', label: 'Contra', icon: '🔄' };
      case 'Journal': return { color: 'amber', label: 'Journal', icon: '⚖️' };
      default: return { color: 'indigo', label: 'Voucher', icon: '📝' };
    }
  }, [vchType]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.party.trim()) newErrors.party = 'Party required';
    if (formData.amount <= 0) newErrors.amount = 'Amount > 0';
    if (!formData.ledgerId) newErrors.ledgerId = 'Ledger missing';
    if (!formData.narration.trim()) newErrors.narration = 'Narration mandatory';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (validate()) {
      onSubmit({
        ...formData,
        type: vchType as any
      });
    }
  };

  const inputBase = "w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-[13px] font-bold shadow-sm bg-white";
  const getInpClass = (field: string) => `${inputBase} ${errors[field] ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/10'}`;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden max-w-4xl mx-auto animate-in zoom-in-95 duration-200">
      <div className={`px-6 py-4 bg-${typeConfig.color}-600 text-white flex justify-between items-center shrink-0`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl border border-white/10 shadow-inner backdrop-blur-sm">
            {typeConfig.icon}
          </div>
          <div>
            <h3 className="text-sm font-black uppercase italic tracking-wider">{typeConfig.label} Entry</h3>
            <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60">Financial Transaction Registry</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200">
          {(['Payment', 'Receipt', 'Contra', 'Journal'] as VType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setVchType(t)}
              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${vchType === t ? `bg-white shadow-sm text-${typeConfig.color}-600` : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Posting Date</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={getInpClass('date')} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Value (USD)</label>
            <div className="relative">
               <span className="absolute left-3.5 top-2.5 text-slate-300 font-black text-xs">$</span>
               <input 
                type="number" 
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                className={`${getInpClass('amount')} pl-8 text-indigo-600`} 
              />
            </div>
            {errors.amount && <p className="text-[8px] text-rose-500 font-black ml-1">{errors.amount}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Account</label>
            <select value={formData.ledgerId} onChange={e => setFormData({...formData, ledgerId: e.target.value})} className={getInpClass('ledgerId')}>
              <option value="">-- Choose Account --</option>
              {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Party / Narrative Ref</label>
            <input value={formData.party} onChange={e => setFormData({...formData, party: e.target.value})} placeholder="Entity identifier" className={getInpClass('party')} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Narration</label>
          <textarea 
            value={formData.narration}
            onChange={e => setFormData({...formData, narration: e.target.value})}
            placeholder="Specify context for auditing..."
            className={`${getInpClass('narration')} h-24 resize-none italic`}
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
           <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
           <button 
            type="submit" 
            disabled={isReadOnly}
            className={`px-10 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all transform active:scale-95 flex items-center justify-center space-x-2 ${isReadOnly ? 'bg-slate-100 text-slate-300' : `bg-slate-900 text-white hover:bg-black`}`}
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             <span>Authorize Post</span>
           </button>
        </div>
      </form>
    </div>
  );
};

export default VoucherEntryForm;