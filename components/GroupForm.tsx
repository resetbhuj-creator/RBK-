import React, { useState, useEffect } from 'react';
import { AccountGroup } from '../types';

interface GroupFormProps {
  initialData?: AccountGroup;
  onCancel: () => void;
  onSubmit: (data: Omit<AccountGroup, 'id' | 'isSystem'>) => void;
}

const NATURES: AccountGroup['nature'][] = ['Assets', 'Liabilities', 'Income', 'Expenses'];

const GroupForm: React.FC<GroupFormProps> = ({ initialData, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<AccountGroup, 'id' | 'isSystem'>>({
    name: '',
    nature: 'Assets'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        nature: initialData.nature
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Group name is required';
    if (!formData.nature) newErrors.nature = 'Nature of account is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="px-10 py-10 bg-slate-950 text-white flex justify-between items-center shrink-0 border-b border-slate-900">
        <div className="flex items-center space-x-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl transform rotate-3">📁</div>
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{initialData ? 'Edit Account Cluster' : 'Define New Account Cluster'}</h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400 mt-2">Structural Mapping • Master Partition</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-3 bg-white/5 hover:bg-rose-500 rounded-full transition-all border border-white/10 group">
          <svg className="w-6 h-6 text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-12 bg-slate-50/20">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">Cluster Title (Group Name)</label>
          <input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. Fixed Assets (Tangible)" 
            className={`w-full px-6 py-4 rounded-2xl border outline-none font-black text-sm shadow-inner transition-all ${errors.name ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:ring-8 focus:ring-indigo-500/5 bg-white'}`}
          />
          {errors.name && <p className="text-[10px] text-rose-500 font-black mt-2 ml-1">{errors.name}</p>}
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">Primary Financial Nature</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-1.5 bg-slate-200 rounded-[2rem] border border-slate-200 shadow-inner">
            {NATURES.map((nature) => (
              <button
                key={nature}
                type="button"
                onClick={() => setFormData({...formData, nature})}
                className={`py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all ${
                  formData.nature === nature 
                    ? 'bg-white text-indigo-600 shadow-xl scale-105' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {nature}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-400 font-medium italic px-4 leading-relaxed">
             Note: Changing the nature fundamentally alters how linked ledgers are projected in statutory financial statements (Balance Sheet / Profit & Loss).
          </p>
        </div>

        <div className="pt-10 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-5">
          <button type="button" onClick={onCancel} className="px-10 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all">Abort Action</button>
          <button type="submit" className="px-16 py-5 bg-slate-950 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-black/40">
            {initialData ? 'Commit Blueprint Update' : 'Authorize New Cluster'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupForm;
