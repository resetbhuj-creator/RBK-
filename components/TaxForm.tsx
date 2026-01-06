import React, { useState, useEffect, useMemo } from 'react';
import { Tax, TaxGroup } from '../types';
import { TAX_TYPES } from '../constants';

interface TaxFormProps {
  initialData?: Tax;
  taxGroups: TaxGroup[];
  onCancel: () => void;
  onSubmit: (data: Omit<Tax, 'id'>) => void;
}

const TaxForm: React.FC<TaxFormProps> = ({ initialData, taxGroups, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<Tax, 'id'>>({
    name: '',
    rate: 18,
    type: 'CGST',
    classification: 'Input',
    supplyType: 'Local',
    groupId: ''
  });

  const [customTypeName, setCustomTypeName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      const isStandard = ['CGST', 'SGST', 'IGST'].includes(initialData.type);
      setFormData({ 
        ...initialData,
        type: isStandard ? initialData.type : 'Other'
      });
      if (!isStandard) setCustomTypeName(initialData.type);
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Tax ledger name is required';
    if (formData.rate < 0) newErrors.rate = 'Rate cannot be negative';
    if (formData.type === 'Other' && !customTypeName.trim()) newErrors.customType = 'Custom identifier required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        type: formData.type === 'Other' ? customTypeName.trim() : formData.type
      });
    }
  };

  const inputClass = (name: string) => `w-full px-6 py-4 rounded-2xl border outline-none transition-all text-sm font-bold bg-white focus:ring-4 focus:ring-indigo-500/10 ${touched[name] && errors[name] ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 shadow-sm'}`;

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
      <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
        <h3 className="text-2xl font-black italic uppercase tracking-tight">{initialData ? 'Edit Statutory Tax' : 'Statutory Tax Master'}</h3>
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Tax Ledger Designation</label>
            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass('name')} placeholder="e.g. Output CGST @ 9%" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Statutory Tax Type</label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className={inputClass('type')}>
                {TAX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="Other">Other (Specify Below)</option>
              </select>
            </div>
            {formData.type === 'Other' && (
              <div className="space-y-2 animate-in slide-in-from-top-4">
                <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">Custom Identifier Node</label>
                <input value={customTypeName} onChange={e => setCustomTypeName(e.target.value)} placeholder="e.g. Luxury Tax, Cess" className={inputClass('customType') + " border-indigo-200"} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Statutory Rate (%)</label>
            <input type="number" step="0.01" value={formData.rate} onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })} className={inputClass('rate')} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Classification</label>
            <select value={formData.classification} onChange={e => setFormData({ ...formData, classification: e.target.value as any })} className={inputClass('classification')}>
              <option value="Input">Input Credit</option>
              <option value="Output">Output Liability</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Supply Protocol</label>
            <select value={formData.supplyType} onChange={e => setFormData({ ...formData, supplyType: e.target.value as any })} className={inputClass('supplyType')}>
              <option value="Local">Local (Intra-state)</option>
              <option value="Central">Central (Inter-state)</option>
            </select>
          </div>
        </div>

        <div className="pt-10 border-t flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
          <button type="button" onClick={onCancel} className="px-10 py-4 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Discard</button>
          <button type="submit" className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95">Commit Tax Node</button>
        </div>
      </form>
    </div>
  );
};

export default TaxForm;