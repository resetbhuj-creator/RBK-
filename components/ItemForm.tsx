import React, { useState, useEffect, useMemo } from 'react';
import { Item, TaxGroup, Tax, Batch } from '../types';
import { CATEGORIES } from '../constants';

interface ItemFormProps {
  initialData?: Item;
  unitMeasures: string[];
  taxGroups: TaxGroup[];
  taxes: Tax[];
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ 
  initialData, 
  unitMeasures, 
  taxGroups = [], 
  taxes = [], 
  onCancel, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState<Omit<Item, 'id'>>({
    name: '',
    category: 'General',
    unit: 'Nos',
    salePrice: 0,
    costPrice: 0,
    hsnCode: '',
    gstRate: 18, 
    taxGroupId: '',
    isBatchTracked: false
  });

  const [initialBatch, setInitialBatch] = useState<Omit<Batch, 'id' | 'itemId'>>({
    batchNo: '',
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    currentStock: 0
  });

  useEffect(() => {
    if (initialData) setFormData({ ...initialData });
  }, [initialData]);

  const handleTaxGroupChange = (groupId: string) => {
    let newRate = formData.gstRate;
    if (groupId) {
      const components = taxes.filter(t => t.groupId === groupId);
      if (components.length > 0) {
        newRate = components.reduce((acc, t) => acc + t.rate, 0);
      }
    }
    setFormData(prev => ({ ...prev, taxGroupId: groupId, gstRate: newRate }));
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-w-5xl mx-auto">
      <div className="px-10 py-8 bg-slate-950 border-b border-slate-900 flex justify-between items-center text-white">
        <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Resource Initialization Node</h3>
        <button onClick={onCancel} className="p-3 bg-white/5 hover:bg-rose-500 rounded-full transition-all border border-white/10" type="button">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...formData, initialBatch: formData.isBatchTracked ? initialBatch : undefined }); }} className="p-10 space-y-8 bg-slate-50/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Designation</label>
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-black focus:ring-4 focus:ring-indigo-500/10 outline-none" />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Tax Framework Shard</label>
            <select value={formData.taxGroupId} onChange={e => handleTaxGroupChange(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10">
              <option value="">-- No Group --</option>
              {taxGroups.map(tg => <option key={tg.id} value={tg.id}>{tg.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Aggregate Tax Rate (%)</label>
            <input type="number" value={formData.gstRate} onChange={e => setFormData({...formData, gstRate: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10" />
          </div>

          <div className="md:col-span-2 p-8 bg-white border border-slate-200 rounded-[2.5rem] space-y-6 shadow-inner">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Life-Cycle Tracking</span>
                <button type="button" onClick={() => setFormData({...formData, isBatchTracked: !formData.isBatchTracked})} className={`w-12 h-6 rounded-full relative transition-all ${formData.isBatchTracked ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                   <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${formData.isBatchTracked ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
             </div>
             
             {formData.isBatchTracked && (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                  <div className="space-y-1">
                     <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Lot Serial</label>
                     <input value={initialBatch.batchNo} onChange={e => setInitialBatch({...initialBatch, batchNo: e.target.value.toUpperCase()})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-xs font-black outline-none" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[8px] font-black uppercase text-slate-400 ml-1">MFG Date</label>
                     <input type="date" value={initialBatch.mfgDate} onChange={e => setInitialBatch({...initialBatch, mfgDate: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-xs font-black outline-none" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[8px] font-black uppercase text-slate-400 ml-1">EXP Boundary</label>
                     <input type="date" value={initialBatch.expiryDate} onChange={e => setInitialBatch({...initialBatch, expiryDate: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-xs font-black outline-none" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Opening Stock</label>
                     <input type="number" value={initialBatch.currentStock} onChange={e => setInitialBatch({...initialBatch, currentStock: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-xs font-black outline-none" />
                  </div>
               </div>
             )}
          </div>
        </div>

        <div className="pt-8 border-t flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-10 py-4 rounded-2xl font-black text-xs uppercase text-slate-400">Abort</button>
          <button type="submit" className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-black/30">Commit master node</button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;