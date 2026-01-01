
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

  const inputClass = (name: string) => `
    w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm
    ${errors[name] ? 'border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/30' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm'}
  `;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{initialData ? 'Edit Account Group' : 'New Account Group'}</h3>
          <p className="text-xs text-slate-500">Classify ledgers under statutory financial categories.</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Group Name</label>
          <input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. Fixed Assets (Tangible)" 
            className={inputClass('name')}
            disabled={initialData?.isSystem}
          />
          {errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.name}</p>}
          {initialData?.isSystem && <p className="text-[9px] text-amber-500 font-bold mt-1 italic">System names are locked for structural integrity.</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Account Nature</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-100 rounded-2xl">
            {NATURES.map((nature) => (
              <button
                key={nature}
                type="button"
                onClick={() => setFormData({...formData, nature})}
                className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  formData.nature === nature 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {nature}
              </button>
            ))}
          </div>
          {errors.nature && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.nature}</p>}
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-start space-x-3 text-slate-600">
            <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-[11px] font-medium leading-relaxed">
              Account groups define how linked ledgers are rolled up into the Balance Sheet and Profit & Loss statement. Changing the 'Nature' will fundamentally alter financial reporting.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95">
            {initialData ? 'Commit Changes' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupForm;
