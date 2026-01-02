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
    rate: 0,
    type: 'CGST',
    classification: 'Output',
    supplyType: 'Local',
    groupId: ''
  });

  const [customTypeName, setCustomTypeName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
      // Intelligent mapping for custom or legacy types
      if (!TAX_TYPES.includes(initialData.type)) {
        setCustomTypeName(initialData.type);
        setFormData(prev => ({ ...prev, type: 'Other' }));
      }
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Tax ledger name is required';
    if (formData.rate < 0) newErrors.rate = 'Rate cannot be negative';
    if (formData.type === 'Other' && !customTypeName.trim()) newErrors.type = 'Custom tax identifier is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const finalData = {
        ...formData,
        type: formData.type === 'Other' ? customTypeName.trim() : formData.type
      };
      onSubmit(finalData);
    }
  };

  const gstMath = useMemo(() => {
    const rate = formData.rate;
    const type = formData.type === 'Other' ? customTypeName : formData.type;
    
    if (type === 'IGST') {
      return { cgst: rate / 2, sgst: rate / 2, igst: rate, formula: `${rate / 2}% + ${rate / 2}% = ${rate}%` };
    } else if (type === 'CGST' || type === 'SGST') {
      return { cgst: rate, sgst: rate, igst: rate * 2, formula: `${rate}% + ${rate}% = ${rate * 2}%` };
    }
    return null;
  }, [formData.rate, formData.type, customTypeName]);

  const inputClass = (name: string) => `w-full px-4 py-3 rounded-2xl border outline-none transition-all text-sm font-bold bg-white focus:ring-4 focus:ring-indigo-500/10 ${touched[name] && errors[name] ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 shadow-sm'}`;

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
      <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-black italic uppercase tracking-tight">{initialData ? 'Edit Statutory Tax' : 'Statutory Tax Master'}</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Master Identity Setup</p>
        </div>
        <button onClick={onCancel} className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[80px] opacity-20 -mr-24 -mt-24"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Classification */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Statutory Classification</label>
            <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
              {(['Input', 'Output'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, classification: c })}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.classification === c ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {c} Tax
                </button>
              ))}
            </div>
          </div>

          {/* Supply Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Operating Jurisdiction</label>
            <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
              {(['Local', 'Central'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({ ...formData, supplyType: s, type: s === 'Local' ? 'CGST' : 'IGST' })}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.supplyType === s ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Tax Ledger Display Name</label>
            <input 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Output CGST @ 9%"
              className={inputClass('name')} 
            />
            {touched.name && errors.name && <p className="text-[10px] text-rose-500 font-black mt-1 ml-1">{errors.name}</p>}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Tax Component Type</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className={inputClass('type')}
              >
                {TAX_TYPES.map(t => (
                  <option key={t} value={t} disabled={formData.supplyType === 'Central' && (t === 'CGST' || t === 'SGST')}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {formData.type === 'Other' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">Custom Tax Identifier</label>
                <input 
                  value={customTypeName} 
                  onChange={e => setCustomTypeName(e.target.value)} 
                  onBlur={() => handleBlur('type')}
                  placeholder="e.g. VAT, Cess, LBT"
                  className={inputClass('type') + " border-indigo-200 ring-2 ring-indigo-50"} 
                />
                {touched.type && errors.type && <p className="text-[10px] text-rose-500 font-black mt-1 ml-1">{errors.type}</p>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Statutory Rate (%)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.01"
                value={formData.rate} 
                onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                className={inputClass('rate') + " pr-10"} 
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-black text-xs">%</span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1 flex items-center">
               <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               Associate with Tax Group
            </label>
            <select 
              value={formData.groupId || ''} 
              onChange={e => setFormData({ ...formData, groupId: e.target.value })}
              className={inputClass('groupId')}
            >
              <option value="">-- Standalone (No Grouping) --</option>
              {taxGroups.map(tg => (
                <option key={tg.id} value={tg.id}>{tg.name}</option>
              ))}
            </select>
          </div>
        </div>

        {gstMath && (
          <div className="p-8 bg-slate-900 rounded-[2.5rem] border-l-8 border-indigo-500 shadow-2xl animate-in zoom-in-95 duration-500">
             <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Statutory Proofing Rule</h4>
                  <div className="text-3xl font-black text-white italic tracking-tighter">{gstMath.formula}</div>
                  <p className="text-[10px] text-slate-500 font-medium">Auto-derived components for regulatory compliance.</p>
                </div>
                <div className="hidden lg:block text-right">
                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Implied IGST</div>
                   <div className="text-4xl font-black text-indigo-500">{gstMath.igst}%</div>
                </div>
             </div>
          </div>
        )}

        <div className="pt-10 border-t border-slate-100 flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-10 py-4 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
          <button type="submit" className="px-14 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all transform active:scale-95">
            {initialData ? 'Update Master Record' : 'Authorize Tax Master'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaxForm;