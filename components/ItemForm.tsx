import React, { useState, useEffect, useMemo } from 'react';
import { Item, TaxGroup, Tax } from '../types';

interface ItemFormProps {
  initialData?: Item;
  unitMeasures: string[];
  taxGroups?: TaxGroup[];
  taxes?: Tax[];
  onQuickUnitAdd?: (unit: string) => void;
  onCancel: () => void;
  onSubmit: (data: Omit<Item, 'id'>) => void;
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

const ItemForm: React.FC<ItemFormProps> = ({ initialData, unitMeasures, taxGroups = [], taxes = [], onQuickUnitAdd, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<Item, 'id'> & { isTaxInclusive: boolean }>({
    name: '',
    category: 'General',
    unit: '',
    salePrice: 0,
    hsnCode: '',
    gstRate: 18, 
    taxGroupId: '',
    isTaxInclusive: false,
    isBatchTracked: false
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
        hsnCode: initialData.hsnCode || '',
        gstRate: initialData.gstRate || 0,
        taxGroupId: initialData.taxGroupId || '',
        isTaxInclusive: false,
        isBatchTracked: initialData.isBatchTracked || false
      });
    }
  }, [initialData]);

  const validate = (currentData = formData) => {
    const newErrors: Record<string, string> = {};
    if (!currentData.name.trim()) newErrors.name = 'Item name is required';
    if (!currentData.category) newErrors.category = 'Product category is required';
    if (!currentData.unit) newErrors.unit = 'Unit of Measure is mandatory';
    if (currentData.salePrice < 0) newErrors.salePrice = 'Sale price cannot be negative';
    
    // HSN/SAC Validation: Numerical 2-8 digits
    const hsn = currentData.hsnCode.trim();
    if (!hsn) {
      newErrors.hsnCode = 'HSN/SAC code is mandatory';
    } else if (!/^\d+$/.test(hsn)) {
      newErrors.hsnCode = 'Must contain only numerical digits';
    } else if (hsn.length < 2 || hsn.length > 8) {
      newErrors.hsnCode = 'Code must be between 2 and 8 digits';
    }

    if (currentData.gstRate < 0 || currentData.gstRate > 100) newErrors.gstRate = 'Invalid tax rate';
    
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

  const handleTaxGroupChange = (groupId: string) => {
    let newRate = formData.gstRate;
    if (groupId) {
      const groupTaxes = taxes.filter(t => t.groupId === groupId);
      if (groupTaxes.length > 0) {
        newRate = groupTaxes.reduce((sum, t) => sum + t.rate, 0);
      }
    }
    setFormData(prev => ({ ...prev, taxGroupId: groupId, gstRate: newRate }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = Object.keys(formData);
    const allTouched = allFields.reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);
    if (validate()) {
      const finalPrice = formData.isTaxInclusive 
        ? formData.salePrice / (1 + formData.gstRate / 100)
        : formData.salePrice;
        
      const { isTaxInclusive, ...submitData } = formData;
      onSubmit({ ...submitData, salePrice: finalPrice });
    }
  };

  const priceMetrics = useMemo(() => {
    const rate = formData.gstRate;
    const price = formData.salePrice;
    
    if (formData.isTaxInclusive) {
      const base = price / (1 + rate / 100);
      const tax = price - base;
      return { base, tax, total: price, label: 'Tax Component (Incl.)' };
    } else {
      const tax = price * (rate / 100);
      const total = price + tax;
      return { base: price, tax, total, label: 'Tax Component (Excl.)' };
    }
  }, [formData.salePrice, formData.gstRate, formData.isTaxInclusive]);

  const inputClass = (name: string) => `
    w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold
    ${touched[name] && errors[name] ? 'border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/30' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm'}
  `;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-w-4xl mx-auto">
      <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{initialData ? 'Update Master Item' : 'New Item Definition'}</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Inventory & Statutory Setup</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors" type="button">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Name Field */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Official Item Name <span className="text-rose-500">*</span></label>
            <input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Precision Engineering Gearbox X-1" 
              className={inputClass('name')}
            />
            {touched.name && errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.name}</p>}
          </div>

          {/* Category & UoM */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Category <span className="text-rose-500">*</span></label>
            <select 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})} 
              onBlur={() => handleBlur('category')}
              className={inputClass('category')}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Unit of Measure <span className="text-rose-500">*</span></label>
              <button 
                type="button" 
                onClick={() => setIsQuickUnitOpen(!isQuickUnitOpen)}
                className="text-[9px] font-black text-indigo-600 uppercase hover:underline underline-offset-2 tracking-widest"
              >
                {isQuickUnitOpen ? 'Cancel' : '+ Quick Add'}
              </button>
            </div>
            
            {!isQuickUnitOpen ? (
              <select 
                value={formData.unit} 
                onChange={e => setFormData({...formData, unit: e.target.value})} 
                onBlur={() => handleBlur('unit')}
                className={inputClass('unit')}
              >
                <option value="" disabled>-- Select UoM --</option>
                {unitMeasures.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              <div className="flex space-x-2 animate-in slide-in-from-top-1 duration-200">
                <input 
                  autoFocus
                  value={newUnitName}
                  onChange={e => setNewUnitName(e.target.value)}
                  placeholder="e.g. Dozen"
                  className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/10 text-sm font-bold shadow-inner"
                />
                <button 
                  type="button"
                  onClick={handleQuickUnitAdd}
                  className="px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100"
                >
                  Add
                </button>
              </div>
            )}
            {touched.unit && errors.unit && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.unit}</p>}
          </div>

          {/* HSN Code & GST Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">HSN/SAC Code <span className="text-rose-500">*</span></label>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${formData.hsnCode.length >= 2 && formData.hsnCode.length <= 8 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                {formData.hsnCode.length} / 8 Digits
              </span>
            </div>
            <input 
              inputMode="numeric"
              value={formData.hsnCode} 
              onChange={e => setFormData({...formData, hsnCode: e.target.value.replace(/\D/g, '').substring(0, 8)})} 
              onBlur={() => handleBlur('hsnCode')}
              placeholder="e.g. 8471" 
              className={inputClass('hsnCode')}
            />
            {touched.hsnCode && errors.hsnCode ? (
              <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.hsnCode}</p>
            ) : (
              <p className="text-[8px] text-slate-400 font-medium mt-1 ml-1 italic">Enter numerical digits (2-8).</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] ml-1">Statutory GST Rate <span className="text-rose-500">*</span></label>
            <select 
              value={formData.gstRate} 
              onChange={e => setFormData({...formData, gstRate: parseFloat(e.target.value)})} 
              onBlur={() => handleBlur('gstRate')}
              disabled={!!formData.taxGroupId}
              className={inputClass('gstRate') + (formData.taxGroupId ? ' cursor-not-allowed opacity-60' : '')}
            >
              {GST_SLABS.map(slab => (
                <option key={slab.value} value={slab.value}>{slab.label} ({slab.value}%)</option>
              ))}
            </select>
          </div>

          {/* Pricing & Batch */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Unit Price (Sale)</label>
               <label className="flex items-center space-x-2 cursor-pointer group">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">Tax Incl?</span>
                  <div 
                    onClick={() => setFormData({...formData, isTaxInclusive: !formData.isTaxInclusive})}
                    className={`w-8 h-4 rounded-full relative transition-all shadow-inner ${formData.isTaxInclusive ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${formData.isTaxInclusive ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
               </label>
            </div>
            <input 
              type="number"
              step="0.01"
              value={formData.salePrice} 
              onChange={e => setFormData({...formData, salePrice: parseFloat(e.target.value) || 0})} 
              onBlur={() => handleBlur('salePrice')}
              className={inputClass('salePrice') + " font-black text-slate-900"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] ml-1">Batch Management</label>
            <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
               <button type="button" onClick={() => setFormData({...formData, isBatchTracked: !formData.isBatchTracked})} className={`w-12 h-7 rounded-full relative transition-all ${formData.isBatchTracked ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${formData.isBatchTracked ? 'right-1' : 'left-1'}`}></div>
               </button>
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{formData.isBatchTracked ? 'Batch Tracking Enabled' : 'Serialized/Standard'}</span>
            </div>
          </div>
        </div>

        {/* Pricing Summary Visualization */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Base Price</span>
                 <span className="text-lg font-black text-white">${priceMetrics.base.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">{priceMetrics.label} ({formData.gstRate}%)</span>
                 <span className="text-lg font-black text-indigo-400">${priceMetrics.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
                 <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Grand Total</span>
                 <span className="text-lg font-black text-indigo-200">${priceMetrics.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
           </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-10 py-4 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Discard</button>
          <button type="submit" className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all transform active:scale-95">
            {initialData ? 'Update Master Record' : 'Authorize Master Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;