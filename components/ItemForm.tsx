import React, { useState, useEffect, useMemo } from 'react';
import { Item, TaxGroup, Tax, Batch } from '../types';

interface ItemFormProps {
  initialData?: Item;
  unitMeasures: string[];
  taxGroups: TaxGroup[];
  taxes: Tax[];
  onQuickUnitAdd?: (unit: string) => void;
  onCancel: () => void;
  onSubmit: (data: Omit<Item, 'id'> & { initialBatch?: Omit<Batch, 'id' | 'itemId'> }) => void;
}

const CATEGORIES = [
  'General',
  'Electronics',
  'Raw Materials',
  'Finished Goods',
  'Services',
  'Consumables',
  'Packaging',
  'Digital Assets'
];

const GST_SLABS = [
  { label: '0% (Exempt)', value: 0 },
  { label: '3% (Composition)', value: 3 },
  { label: '5% (Essential)', value: 5 },
  { label: '12% (Standard)', value: 12 },
  { label: '18% (Standard+)', value: 18 },
  { label: '28% (Luxury)', value: 28 }
];

const ItemForm: React.FC<ItemFormProps> = ({ 
  initialData, 
  unitMeasures, 
  taxGroups = [], 
  taxes = [], 
  onQuickUnitAdd, 
  onCancel, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState<Omit<Item, 'id'> & { isTaxInclusive: boolean }>({
    name: '',
    category: 'General',
    unit: '',
    salePrice: 0,
    costPrice: 0,
    hsnCode: '',
    gstRate: 18, 
    taxGroupId: '',
    isTaxInclusive: false,
    isBatchTracked: false
  });

  const [batchData, setBatchData] = useState<Omit<Batch, 'id' | 'itemId'>>({
    batchNo: '',
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    currentStock: 0
  });

  const [isQuickUnitOpen, setIsQuickUnitOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        unit: initialData.unit,
        salePrice: initialData.salePrice,
        costPrice: initialData.costPrice || 0,
        hsnCode: initialData.hsnCode || '',
        gstRate: initialData.gstRate || 0,
        taxGroupId: initialData.taxGroupId || '',
        isTaxInclusive: false,
        isBatchTracked: initialData.isBatchTracked || false
      });
    }
  }, [initialData]);

  /**
   * Statutory Logic: Selecting a group iterates through the global tax registry
   * to aggregate the effective percentage rate.
   */
  const handleTaxGroupChange = (groupId: string) => {
    let newRate = formData.gstRate;
    if (groupId) {
      const components = taxes.filter(t => t.groupId === groupId);
      if (components.length > 0) {
        // Aggregated statutory rate (e.g., 9% CGST + 9% SGST = 18%)
        newRate = components.reduce((acc, t) => acc + t.rate, 0);
      }
    }
    setFormData(prev => ({ ...prev, taxGroupId: groupId, gstRate: newRate }));
  };

  const validate = (currentData = formData) => {
    const newErrors: Record<string, string> = {};
    if (!currentData.name.trim()) newErrors.name = 'Item name is required';
    if (!currentData.category) newErrors.category = 'Product category is required';
    if (!currentData.unit) newErrors.unit = 'Unit of Measure is mandatory';
    if (currentData.salePrice <= 0) newErrors.salePrice = 'Valid sale price is required';
    
    const hsn = currentData.hsnCode.trim();
    if (!hsn) {
      newErrors.hsnCode = 'HSN/SAC code is mandatory';
    } else if (!/^\d+$/.test(hsn)) {
      newErrors.hsnCode = 'Must contain only numerical digits';
    }

    if (currentData.gstRate < 0 || currentData.gstRate > 100) newErrors.gstRate = 'Invalid tax rate';
    
    if (currentData.isBatchTracked && !initialData) {
      if (!batchData.batchNo.trim()) newErrors.batchNo = 'Initial Batch No is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  const handleQuickUnitAdd = () => {
    const cleanUnit = newUnitName.trim();
    if (!cleanUnit) return;
    if (onQuickUnitAdd) {
      onQuickUnitAdd(cleanUnit);
      setFormData(prev => ({ ...prev, unit: cleanUnit }));
      setNewUnitName('');
      setIsQuickUnitOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched as any);
    
    if (validate()) {
      const finalPrice = formData.isTaxInclusive 
        ? formData.salePrice / (1 + formData.gstRate / 100)
        : formData.salePrice;
        
      const { isTaxInclusive, ...submitData } = formData;
      
      onSubmit({ 
        ...submitData, 
        salePrice: finalPrice,
        initialBatch: formData.isBatchTracked && !initialData ? batchData : undefined
      });
    }
  };

  const priceMetrics = useMemo(() => {
    const rate = formData.gstRate;
    const price = formData.salePrice;
    const groupComponents = formData.taxGroupId ? taxes.filter(t => t.groupId === formData.taxGroupId) : [];
    
    if (formData.isTaxInclusive) {
      const base = price / (1 + rate / 100);
      const tax = price - base;
      return { base, tax, total: price, label: 'Tax Component (Incl.)', components: groupComponents };
    } else {
      const tax = price * (rate / 100);
      const total = price + tax;
      return { base: price, tax, total, label: 'Tax Component (Excl.)', components: groupComponents };
    }
  }, [formData.salePrice, formData.gstRate, formData.isTaxInclusive, formData.taxGroupId, taxes]);

  const inputClass = (name: string) => `
    w-full px-5 py-4 rounded-2xl border outline-none transition-all text-sm font-bold
    ${touched[name] && errors[name] ? 'border-rose-500 focus:ring-4 focus:ring-rose-100 bg-rose-50/30' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white shadow-sm'}
  `;

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-w-5xl mx-auto">
      <div className="px-10 py-8 bg-slate-950 border-b border-slate-900 flex justify-between items-center text-white">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl transform -rotate-3 border-4 border-indigo-400/20">
            📦
          </div>
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{initialData ? 'Update Master Node' : 'New Catalogue Definition'}</h3>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.4em] mt-2">Inventory & Statutory Architecture</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-3 bg-white/5 hover:bg-rose-500 rounded-full transition-all border border-white/10" type="button">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-12 max-h-[80vh] overflow-y-auto custom-scrollbar bg-slate-50/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Official Designation (Item Name)</label>
            <input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Precision Industrial Node v4" 
              className={inputClass('name')}
            />
            {touched.name && errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-2">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Classification Cluster</label>
            <select 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})} 
              className={inputClass('category')}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1 px-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Unit of Measure (UoM)</label>
              <button type="button" onClick={() => setIsQuickUnitOpen(!isQuickUnitOpen)} className="text-[9px] font-black text-indigo-600 uppercase hover:underline tracking-widest">{isQuickUnitOpen ? 'Cancel' : '+ Quick Add'}</button>
            </div>
            {!isQuickUnitOpen ? (
              <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} onBlur={() => handleBlur('unit')} className={inputClass('unit')}>
                <option value="" disabled>-- Select Unit --</option>
                {unitMeasures.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              <div className="flex space-x-2">
                <input autoFocus value={newUnitName} onChange={e => setNewUnitName(e.target.value)} placeholder="e.g. Metric Ton" className="flex-1 px-5 py-4 rounded-2xl border border-indigo-200 text-sm font-bold shadow-inner outline-none" />
                <button type="button" onClick={handleQuickUnitAdd} className="px-6 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100">Add</button>
              </div>
            )}
            {touched.unit && errors.unit && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-2">{errors.unit}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">HSN / SAC Code</label>
            <input inputMode="numeric" value={formData.hsnCode} onChange={e => setFormData({...formData, hsnCode: e.target.value.replace(/\D/g, '')})} onBlur={() => handleBlur('hsnCode')} placeholder="e.g. 8471" className={inputClass('hsnCode') + " font-mono tracking-widest"} />
            {touched.hsnCode && errors.hsnCode && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-2">{errors.hsnCode}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] ml-2">Statutory Tax Group</label>
            <select 
              value={formData.taxGroupId} 
              onChange={e => handleTaxGroupChange(e.target.value)} 
              className={inputClass('taxGroupId') + " border-indigo-200 bg-indigo-50/5 focus:bg-white"}
            >
              <option value="">-- Manual Slab Assignment --</option>
              {taxGroups.map(tg => <option key={tg.id} value={tg.id}>{tg.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Effective GST Rate (%)</label>
            <div className="flex space-x-3">
               <select 
                value={formData.gstRate} 
                onChange={e => setFormData({...formData, gstRate: parseFloat(e.target.value)})} 
                disabled={!!formData.taxGroupId}
                className={inputClass('gstRate') + (formData.taxGroupId ? " bg-slate-100 cursor-not-allowed opacity-80" : "")}
               >
                 {GST_SLABS.map(slab => <option key={slab.value} value={slab.value}>{slab.label} ({slab.value}%)</option>)}
               </select>
               {formData.taxGroupId && (
                 <div className="px-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Locked by Group</span>
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1 px-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Transaction Base Price</label>
               <label className="flex items-center space-x-3 cursor-pointer group">
                  <span className="text-[9px] font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-tighter">Tax Inclusive?</span>
                  <div onClick={() => setFormData({...formData, isTaxInclusive: !formData.isTaxInclusive})} className={`w-10 h-5 rounded-full relative transition-all ${formData.isTaxInclusive ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-md ${formData.isTaxInclusive ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
               </label>
            </div>
            <div className="relative">
               <input type="number" step="0.01" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: parseFloat(e.target.value) || 0})} onBlur={() => handleBlur('salePrice')} className={inputClass('salePrice') + " font-black text-lg pl-10"} />
               <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">$</span>
            </div>
          </div>
        </div>

        {/* Batch Tracking Option */}
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center space-x-4">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest italic">Lifecycle Tracking</h4>
             </div>
             <button type="button" onClick={() => setFormData({...formData, isBatchTracked: !formData.isBatchTracked})} className={`flex items-center space-x-3 px-4 py-2 rounded-xl border-2 transition-all ${formData.isBatchTracked ? 'bg-indigo-50 border-indigo-600 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
               <span className="text-[10px] font-black uppercase tracking-widest">{formData.isBatchTracked ? 'Batch Enabled' : 'Standard Tracking'}</span>
             </button>
          </div>
          
          {formData.isBatchTracked && !initialData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-50 animate-in slide-in-from-top-4">
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Initial Opening Batch</label>
                   <input value={batchData.batchNo} onChange={e => setBatchData({...batchData, batchNo: e.target.value.toUpperCase()})} className={inputClass('batchNo')} placeholder="e.g. LOT-4091-B" />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Initial Quantity</label>
                   <input type="number" value={batchData.currentStock} onChange={e => setBatchData({...batchData, currentStock: parseFloat(e.target.value) || 0})} className={inputClass('currentStock')} />
                </div>
            </div>
          )}
        </div>

        {/* Dynamic Calculation Visualization */}
        <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-l-8 border-indigo-600">
           <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="space-y-6 flex-1 w-full">
                 <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Valuation Metrics</h5>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Base Unit Value</span>
                       <span className="text-2xl font-black italic tabular-nums">${priceMetrics.base.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{priceMetrics.label} ({formData.gstRate}%)</span>
                       <span className="text-2xl font-black text-indigo-400 italic tabular-nums">${priceMetrics.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                 </div>
                 
                 {priceMetrics.components.length > 0 && (
                    <div className="pt-4 flex flex-wrap gap-3">
                       {priceMetrics.components.map(comp => (
                          <div key={comp.id} className="px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-400/20 flex items-center space-x-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>
                             <span className="text-[9px] font-black uppercase tracking-widest">{comp.name}: {comp.rate}%</span>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              <div className="text-right shrink-0">
                 <div className="text-[11px] font-black uppercase italic text-indigo-500 tracking-[0.5em] mb-3">GRAND TOTAL (MRP)</div>
                 <div className="text-7xl font-black italic tracking-tighter tabular-nums text-white">
                    ${priceMetrics.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </div>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[180px] opacity-10 -mr-64 -mt-64"></div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-6">
          <button type="button" onClick={onCancel} className="px-12 py-5 rounded-[1.5rem] text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Discard Changes</button>
          <button 
            type="submit" 
            className="w-full sm:w-[480px] py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-slate-950"
          >
            {initialData ? 'Commit Evolution' : 'Authorize Identity Node'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;