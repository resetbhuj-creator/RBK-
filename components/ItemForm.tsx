import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (initialData) setFormData({ ...initialData });
  }, [initialData]);

  const handleTaxGroupChange = (groupId: string) => {
    let newRate = formData.gstRate;
    if (groupId) {
      // Aggregate rate from taxes belonging to this group
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
        <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Catalogue Node Provisioning</h3>
        <button onClick={onCancel} className="p-3 bg-white/5 hover:bg-rose-500 rounded-full transition-all border border-white/10" type="button">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-10 space-y-8 bg-slate-50/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Designation</label>
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-black focus:ring-4 focus:ring-indigo-500/10 outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Tax Umbrella Group</label>
            <select value={formData.taxGroupId} onChange={e => handleTaxGroupChange(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10">
              <option value="">-- No Group --</option>
              {taxGroups.map(tg => <option key={tg.id} value={tg.id}>{tg.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Aggregate Tax Rate (%)</label>
            <input type="number" value={formData.gstRate} onChange={e => setFormData({...formData, gstRate: parseFloat(e.target.value) || 0})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">HSN / SAC Code</label>
            <input value={formData.hsnCode} onChange={e => setFormData({...formData, hsnCode: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Unit of Measure</label>
            <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10">
              {unitMeasures.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-8 border-t flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-10 py-4 rounded-2xl font-black text-xs uppercase text-slate-400">Abort</button>
          <button type="submit" className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-black/30">Commit Shard</button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;