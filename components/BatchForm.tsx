import React, { useState, useEffect } from 'react';
import { Batch, Item } from '../types';

interface BatchFormProps {
  initialData?: Batch;
  items: Item[];
  onCancel: () => void;
  onSubmit: (data: Omit<Batch, 'id'>) => void;
}

const BatchForm: React.FC<BatchFormProps> = ({ initialData, items, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<Batch, 'id'>>({
    itemId: '',
    batchNo: '',
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    currentStock: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.itemId) newErrors.itemId = 'Required';
    if (!formData.batchNo.trim()) newErrors.batchNo = 'Required';
    if (!formData.mfgDate) newErrors.mfgDate = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const inputClass = (name: string) => `w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm font-bold ${errors[name] ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10'}`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-w-2xl mx-auto">
      <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase italic">{initialData ? 'Edit Batch' : 'New Batch Creation'}</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Inventory Lifespan Tracking</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Target Resource</label>
          <select value={formData.itemId} onChange={e => setFormData({...formData, itemId: e.target.value})} className={inputClass('itemId')}>
            <option value="">-- Choose Item --</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Batch Serial Number</label>
          <input value={formData.batchNo} onChange={e => setFormData({...formData, batchNo: e.target.value})} placeholder="e.g. BATCH-2023-XY" className={inputClass('batchNo')} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">MFG Date</label>
            <input type="date" value={formData.mfgDate} onChange={e => setFormData({...formData, mfgDate: e.target.value})} className={inputClass('mfgDate')} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Expiry Date</label>
            <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className={inputClass('expiryDate')} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Opening Stock In Batch</label>
          <input type="number" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: parseFloat(e.target.value) || 0})} className={inputClass('currentStock')} />
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-slate-400 font-black text-xs uppercase tracking-widest">Cancel</button>
          <button type="submit" className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transform active:scale-95 transition-all">Commit Batch</button>
        </div>
      </form>
    </div>
  );
};

export default BatchForm;