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
      case 'Payment': return { color: 'rose', label: 'Payment (Outflow)', icon: '💸' };
      case 'Receipt': return { color: 'emerald', label: 'Receipt (Inflow)', icon: '📥' };
      case 'Contra': return { color: 'blue', label: 'Contra (Internal)', icon: '🔄' };
      case 'Journal': return { color: 'amber', label: 'Journal (Adjustment)', icon: '⚖️' };
      default: return { color: 'indigo', label: 'Voucher', icon: '📝' };
    }
  }, [vchType]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.party.trim()) newErrors.party = 'Counter-party identity required';
    if (formData.amount <= 0) newErrors.amount = 'Non-zero amount required';
    if (!formData.ledgerId) newErrors.ledgerId = 'Primary ledger mapping missing';
    if (!formData.narration.trim()) newErrors.narration = 'Business narration is mandatory';
    
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

  const inputBase = "w-full px-5 py-4 rounded-2xl border outline-none transition-all text-sm font-bold shadow-sm";
  const getInpClass = (field: string) => `${inputBase} ${errors[field] ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white focus:ring-4 focus:ring-indigo-500/10'}`;

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-4xl mx-auto">
      <div className={`px-10 py-8 bg-${typeConfig.color}-600 text-white flex justify-between items-center transition-colors duration-500`}>
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10 backdrop-blur-md">
            {typeConfig.icon}
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase italic">{typeConfig.label}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Ledger Posting Protocol v1.1</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        {/* Type Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200">
          {(['Payment', 'Receipt', 'Contra', 'Journal'] as VType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setVchType(t)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${vchType === t ? `bg-white shadow-xl text-${typeConfig.color}-600` : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Posting Date</label>
            <input 
              type="date" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className={getInpClass('date')} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Transaction Value</label>
            <div className="relative">
               <span className="absolute left-5 top-4 text-slate-400 font-black">$</span>
               <input 
                type="number" 
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                className={`${getInpClass('amount')} pl-10 text-lg text-indigo-600`} 
              />
            </div>
            {errors.amount && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Account Identity (Dr/Cr)</label>
            <select 
              value={formData.ledgerId}
              onChange={e => setFormData({...formData, ledgerId: e.target.value})}
              className={getInpClass('ledgerId')}
            >
              <option value="">-- Select Mapped Ledger --</option>
              {ledgers.map(l => <option key={l.id} value={l.id}>{l.name} ({l.group})</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Counterparty / Reference</label>
            <input 
              value={formData.party}
              onChange={e => setFormData({...formData, party: e.target.value})}
              placeholder="Enter name or reference"
              className={getInpClass('party')} 
            />
            {errors.party && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.party}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Narration</label>
          <textarea 
            value={formData.narration}
            onChange={e => setFormData({...formData, narration: e.target.value})}
            placeholder="Detailed description for audit trail..."
            className={`${getInpClass('narration')} h-32 resize-none`}
          />
          {errors.narration && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.narration}</p>}
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4">
           <button type="button" onClick={onCancel} className="px-10 py-4 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Discard Entry</button>
           <button 
            type="submit" 
            disabled={isReadOnly}
            className={`px-14 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all transform active:scale-95 flex items-center justify-center space-x-3 ${isReadOnly ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : `bg-${typeConfig.color}-600 text-white shadow-${typeConfig.color}-900/20 hover:bg-${typeConfig.color}-700`}`}
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             <span>Authorize & Post</span>
           </button>
        </div>
      </form>
    </div>
  );
};

export default VoucherEntryForm;