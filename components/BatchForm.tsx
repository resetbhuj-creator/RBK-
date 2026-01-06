import React, { useState, useEffect, useMemo } from 'react';
import { Batch, Item } from '../types';

interface BatchFormProps {
  initialData?: Batch;
  defaultItemId?: string;
  items: Item[];
  onCancel: () => void;
  onSubmit: (data: Omit<Batch, 'id'>) => void;
}

const BatchForm: React.FC<BatchFormProps> = ({ initialData, defaultItemId, items, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<Batch, 'id'>>({
    itemId: defaultItemId || '',
    batchNo: '',
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    currentStock: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else if (defaultItemId) {
      setFormData(prev => ({ ...prev, itemId: defaultItemId }));
    }
  }, [initialData, defaultItemId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.itemId) newErrors.itemId = 'Item association is required';
    if (!formData.batchNo.trim()) newErrors.batchNo = 'Batch Number is mandatory';
    if (!formData.mfgDate) newErrors.mfgDate = 'MFG Date is required';
    
    if (formData.expiryDate && new Date(formData.expiryDate) <= new Date(formData.mfgDate)) {
      newErrors.expiryDate = 'Expiry Date must be after MFG Date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ itemId: true, batchNo: true, mfgDate: true, expiryDate: true, currentStock: true });
    if (validate()) onSubmit(formData);
  };

  const selectedItem = useMemo(() => items.find(i => i.id === formData.itemId), [formData.itemId, items]);

  const inputClass = (name: string) => `w-full px-6 py-4 rounded-2xl border outline-none transition-all text-sm font-bold bg-white focus:ring-4 focus:ring-indigo-500/10 ${touched[name] && errors[name] ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 shadow-sm'}`;

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-w-2xl mx-auto">
      <div className="px-10 py-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl transform -rotate-3 border-4 border-indigo-400/20">
             📦
          </div>
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{initialData ? 'Update Batch Shard' : 'Provision New Batch'}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mt-3">Inventory Lifecycle Registry</p>
          </div>
        </div>
        <button onClick={onCancel} className="relative z-10 p-3 bg-white/5 hover:bg-rose-500 rounded-full text-slate-400 hover:text-white transition-all border border-white/10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-slate-50/30">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Master Catalogue Item</label>
          <select 
            value={formData.itemId} 
            onChange={e => setFormData({...formData, itemId: e.target.value})} 
            disabled={!!defaultItemId && !initialData}
            onBlur={() => handleBlur('itemId')}
            className={inputClass('itemId') + (defaultItemId ? ' cursor-not-allowed bg-slate-100 opacity-80' : '')}
          >
            <option value="">-- Choose Item --</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.name} [{i.unit}]</option>)}
          </select>
          {touched.itemId && errors.itemId && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-2">{errors.itemId}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Batch Number (Serial)</label>
          <input 
            value={formData.batchNo} 
            onChange={e => setFormData({...formData, batchNo: e.target.value.toUpperCase()})} 
            onBlur={() => handleBlur('batchNo')}
            placeholder="e.g. LOT-4091-B" 
            className={inputClass('batchNo') + " font-mono uppercase tracking-widest"} 
          />
          {touched.batchNo && errors.batchNo && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-2">{errors.batchNo}</p>}
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Manufacturing Date</label>
            <input 
                type="date" 
                value={formData.mfgDate} 
                onChange={e => setFormData({...formData, mfgDate: e.target.value})} 
                onBlur={() => handleBlur('mfgDate')}
                className={inputClass('mfgDate')} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Expiry Boundary</label>
            <input 
                type="date" 
                value={formData.expiryDate} 
                onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
                onBlur={() => handleBlur('expiryDate')}
                className={inputClass('expiryDate')} 
            />
            {touched.expiryDate && errors.expiryDate && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-2">{errors.expiryDate}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Current Physical Stock</label>
          <div className="relative">
            <input 
                type="number" 
                value={formData.currentStock} 
                onChange={e => setFormData({...formData, currentStock: parseFloat(e.target.value) || 0})} 
                onBlur={() => handleBlur('currentStock')}
                className={inputClass('currentStock') + " pr-20"} 
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase italic">{selectedItem?.unit || 'Units'}</span>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
          <button type="button" onClick={onCancel} className="px-10 py-5 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white transition-all transform active:scale-95">Discard</button>
          <button type="submit" className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-slate-950">
            {initialData ? 'Update Batch Shard' : 'Register Batch Node'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BatchForm;