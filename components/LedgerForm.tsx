import React, { useState, useEffect } from 'react';
import { AccountGroup } from '../types';

interface Ledger {
  id: string;
  name: string;
  group: string;
  openingBalance: number;
  type: 'Debit' | 'Credit';
}

interface LedgerFormProps {
  initialData?: Ledger;
  accountGroups: AccountGroup[];
  onCancel: () => void;
  onSubmit: (data: any) => void;
  onQuickGroupAdd?: (groupData: Omit<AccountGroup, 'id' | 'isSystem'>) => void;
}

const LedgerForm: React.FC<LedgerFormProps> = ({ initialData, accountGroups, onCancel, onSubmit, onQuickGroupAdd }) => {
  const [formData, setFormData] = useState<Omit<Ledger, 'id'>>({
    name: '',
    group: '',
    openingBalance: 0,
    type: 'Debit'
  });

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickGroupName, setQuickGroupName] = useState('');
  const [quickGroupNature, setQuickGroupNature] = useState<AccountGroup['nature']>('Assets');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        group: initialData.group,
        openingBalance: initialData.openingBalance,
        type: initialData.type
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Ledger name is required';
    if (!formData.group) newErrors.group = 'Account group is required';
    if (formData.openingBalance < 0) newErrors.openingBalance = 'Balance cannot be negative';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleQuickAddSubmit = () => {
    if (!quickGroupName.trim()) return;
    if (onQuickGroupAdd) {
      onQuickGroupAdd({ name: quickGroupName, nature: quickGroupNature });
      setFormData({ ...formData, group: quickGroupName });
      setQuickGroupName('');
      setIsQuickAddOpen(false);
    }
  };

  const inputClass = (name: string) => `
    w-full px-4 py-3 rounded-2xl border outline-none transition-all text-sm font-bold
    ${errors[name] ? 'border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/30' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm'}
  `;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center space-x-5">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{initialData ? 'Modify Ledger' : 'Create Financial Ledger'}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Master Identity Mapping</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Legal Ledger Title</label>
          <input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. Citibank Global Settlement A/c" 
            className={inputClass('name')}
          />
          {errors.name && <p className="text-[10px] text-rose-500 font-bold mt-2">{errors.name}</p>}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Account Grouping</label>
            <button 
              type="button" 
              onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {isQuickAddOpen ? 'Close Utility' : '+ Quick Add Group'}
            </button>
          </div>

          {!isQuickAddOpen ? (
            <select 
              value={formData.group} 
              onChange={e => setFormData({...formData, group: e.target.value})} 
              className={inputClass('group')}
            >
              <option value="" disabled>-- Select Grouping --</option>
              {accountGroups.map(group => (
                <option key={group.id} value={group.name}>{group.name} ({group.nature})</option>
              ))}
            </select>
          ) : (
            <div className="bg-indigo-50/50 p-6 rounded-2xl border-2 border-indigo-100 space-y-4 animate-in zoom-in-95">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Group Name</label>
                  <input 
                    value={quickGroupName}
                    onChange={e => setQuickGroupName(e.target.value)}
                    placeholder="e.g. Digital Subscriptions"
                    className="w-full px-4 py-2 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Nature</label>
                  <select 
                    value={quickGroupNature}
                    onChange={e => setQuickGroupNature(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-xl border border-indigo-200 outline-none text-sm font-bold"
                  >
                    {['Assets', 'Liabilities', 'Income', 'Expenses'].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleQuickAddSubmit}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
              >
                Provision Group & Select
              </button>
            </div>
          )}
          {errors.group && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.group}</p>}
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Opening Position</label>
            <input 
              type="number"
              value={formData.openingBalance} 
              onChange={e => setFormData({...formData, openingBalance: parseFloat(e.target.value) || 0})} 
              className={inputClass('openingBalance')}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Balance Polarity</label>
            <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'Debit'})}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.type === 'Debit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                Debit
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'Credit'})}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.type === 'Credit' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}
              >
                Credit
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-8 py-3 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform active:scale-95">
            {initialData ? 'Commit Modifications' : 'Initialize Ledger'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LedgerForm;