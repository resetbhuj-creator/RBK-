import React, { useState, useEffect, useMemo } from 'react';
import { TaxGroup, Tax } from '../types';

interface TaxGroupFormProps {
  initialData?: TaxGroup;
  taxes?: Tax[];
  onCancel: () => void;
  onSubmit: (data: Omit<TaxGroup, 'id'>) => void;
}

const TaxGroupForm: React.FC<TaxGroupFormProps> = ({ initialData, taxes = [], onCancel, onSubmit }) => {
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

  const associatedTaxes = useMemo(() => {
    if (!initialData) return [];
    return taxes.filter(t => t.groupId === initialData.id);
  }, [initialData, taxes]);

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
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-w-2xl mx-auto">
      <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-black italic uppercase tracking-tight">{initialData ? 'Modify Tax Umbrella' : 'Provision Tax Group'}</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Statutory Aggregator Node</p>
        </div>
        <button onClick={onCancel} className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[80px] opacity-20 -mr-24 -mt-24"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Umbrella Identity Name</label>
          <input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. Standard GST Framework" 
            className={`w-full px-6 py-4 rounded-2xl border outline-none transition-all text-sm font-bold ${errors.name ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white shadow-sm'}`}
          />
          {errors.name && <p className="text-[10px] text-rose-500 font-black mt-2 ml-1">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Contextual Description</label>
          <textarea 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            placeholder="Specify regulatory purpose..." 
            className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 bg-white shadow-sm text-sm h-24 resize-none italic"
          />
        </div>

        {initialData && (
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">Associated Components</h4>
             <div className="grid grid-cols-1 gap-2">
                {associatedTaxes.length > 0 ? associatedTaxes.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                    <span className="text-xs font-black text-slate-800 uppercase italic">{t.name}</span>
                    <span className="text-[10px] font-black text-indigo-600 tabular-nums">{t.rate}%</span>
                  </div>
                )) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Zero child components associated.</p>
                  </div>
                )}
             </div>
          </div>
        )}

        <div className="pt-8 border-t border-slate-100 flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-10 py-4 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
          <button type="submit" className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95">
            {initialData ? 'Update Umbrella' : 'Finalize Identity'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaxGroupForm;