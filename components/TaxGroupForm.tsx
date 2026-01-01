
import React, { useState, useEffect } from 'react';
import { TaxGroup } from '../types';

interface TaxGroupFormProps {
  initialData?: TaxGroup;
  onCancel: () => void;
  onSubmit: (data: Omit<TaxGroup, 'id'>) => void;
}

const TaxGroupForm: React.FC<TaxGroupFormProps> = ({ initialData, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<TaxGroup, 'id'>>({
    name: '',
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || ''
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Group name is required';
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
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{initialData ? 'Edit Tax Umbrella' : 'Create Tax Group'}</h3>
          <p className="text-xs text-slate-500 font-medium">Group multiple tax rules under a single statutory umbrella (e.g., GST).</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Group Identity Name</label>
          <input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. GST (Goods & Services Tax)" 
            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm ${errors.name ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm'}`}
          />
          {errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Functional Description</label>
          <textarea 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            placeholder="Briefly describe the tax jurisdiction or grouping logic..." 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-sm h-24 resize-none"
          />
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95">
            {initialData ? 'Update Group' : 'Finalize Group'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaxGroupForm;
