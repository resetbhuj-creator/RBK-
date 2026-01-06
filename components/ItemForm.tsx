import React, { useState, useEffect } from 'react';
import { Item, TaxGroup, Tax } from '../types';
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

  // Logic to auto-fill tax rate when Tax Group changes
  const handleTaxGroupChange = (groupId: string) => {
    let newRate = formData.gstRate;
    if (groupId) {
      // Find all taxes associated with this group and sum their rates
      const groupTaxes = taxes.filter(t => t.groupId === groupId);
      if (groupTaxes.length > 0) {
        newRate = groupTaxes.reduce((sum, t) => sum + (t.rate || 0), 0);
      }
    }
    setFormData(prev => ({ 
      ...prev, 
      taxGroupId: groupId, 
      gstRate: newRate 
    }));
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-w-5xl mx-auto">
      <div className="px-10 py-8 bg-slate-950 border-b border-slate-900 flex justify-between items-center text-white">
        <div className="flex items-center space-x-5">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl transform -rotate-3 border-2 border-indigo-400/20">📦</div>
           <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Catalogue Shard Entry</h3>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.4em] mt-1">Resource Provisioning Protocol</p>
           </div>
        </div>
        <button onClick={onCancel} className="p-3 bg-white/5 hover:bg-rose-500 rounded-full transition-all border border-white/10" type="button">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-10 space-y-8 bg-slate-50/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Resource Designation</label>
            <input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-black focus:ring-8 focus:ring-indigo-500/5 outline-none shadow-inner transition-all" 
              placeholder="e.g. Ultra-High Density Memory Module"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Tax Umbrella Group</label>
            <select 
              value={formData.taxGroupId} 
              onChange={e => handleTaxGroupChange(e.target.value)} 
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner appearance-none cursor-pointer text-indigo-600"
            >
              <option value="">-- No Association --</option>
              {taxGroups.map(tg => <option key={tg.id} value={tg.id}>{tg.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Default Statutory Rate (%)</label>
            <div className="relative">
              <input 
                type="number" 
                value={formData.gstRate} 
                onChange={e => setFormData({...formData, gstRate: parseFloat(e.target.value) || 0})} 
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-black outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner" 
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">HSN / SAC Identity</label>
            <input 
              value={formData.hsnCode} 
              onChange={e => setFormData({...formData, hsnCode: e.target.value})} 
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-black outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner font-mono" 
              placeholder="0000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Measurement Unit</label>
            <select 
              value={formData.unit} 
              onChange={e => setFormData({...formData, unit: e.target.value})} 
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner appearance-none cursor-pointer"
            >
              {unitMeasures.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Sale Value ($)</label>
            <input 
              type="number" 
              value={formData.salePrice} 
              onChange={e => setFormData({...formData, salePrice: parseFloat(e.target.value) || 0})} 
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-black outline-none focus:ring-8 focus:ring-emerald-500/5 shadow-inner" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Base Cost Value ($)</label>
            <input 
              type="number" 
              value={formData.costPrice} 
              onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})} 
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-black outline-none focus:ring-8 focus:ring-rose-500/5 shadow-inner" 
            />
          </div>
        </div>

        <div className="p-6 bg-slate-900 rounded-[2.5rem] flex items-center justify-between border-4 border-slate-800">
           <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">📦</div>
              <div>
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Persistence Protocol</span>
                 <p className="text-[11px] font-black text-white italic tracking-tight">Enable Serial / Batch Logic Tracking</p>
              </div>
           </div>
           <button 
             type="button"
             onClick={() => setFormData({...formData, isBatchTracked: !formData.isBatchTracked})}
             className={`w-14 h-8 rounded-full relative transition-all shadow-md ${formData.isBatchTracked ? 'bg-indigo-600' : 'bg-slate-700'}`}
           >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.isBatchTracked ? 'right-1' : 'left-1'}`}></div>
           </button>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
          <button type="button" onClick={onCancel} className="px-10 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all">Abort Shard</button>
          <button type="submit" className="px-14 py-5 bg-slate-950 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-black/40">Commit Master Node</button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;