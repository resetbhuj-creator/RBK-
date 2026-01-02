import React, { useState, useEffect, useMemo } from 'react';
import { Item } from '../types';

interface ItemFormProps {
  initialData?: Item;
  unitMeasures: string[];
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

const GST_SLABS = [0, 5, 12, 18, 28];

const ItemForm: React.FC<ItemFormProps> = ({ initialData, unitMeasures, onQuickUnitAdd, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<Item, 'id'> & { isTaxInclusive: boolean }>({
    name: '',
    category: 'General',
    unit: '',
    salePrice: 0,
    hsnCode: '',
    gstRate: 18, // Default to standard 18%
    isTaxInclusive: false
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
        hsnCode: initialData.hsnCode,
        gstRate: initialData.gstRate || 0,
        isTaxInclusive: false
      });
    }
  }, [initialData]);

  const validate = (currentData = formData) => {
    const newErrors: Record<string, string> = {};
    if (!currentData.name.trim()) newErrors.name = 'Item name is required';
    if (!currentData.category) newErrors.category = 'Product category is required';
    if (!currentData.unit) newErrors.unit = 'Unit of Measure is mandatory';
    if (currentData.salePrice < 0) newErrors.salePrice = 'Sale price cannot be negative';
    if (currentData.gstRate < 0 || currentData.gstRate > 100) newErrors.gstRate = 'Invalid tax rate (0-100%)';
    
    const hsn = currentData.hsnCode.trim();
    if (!hsn) {
      newErrors.hsnCode = 'HSN/SAC code is mandatory';
    } else if (!/^\d+$/.test(hsn)) {
      newErrors.hsnCode = 'Only digits allowed';
    } else if (hsn.length < 2 || hsn.length > 8) {
      newErrors.hsnCode = 'Must be 2-8 digits';
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

  const hsnLength = formData.hsnCode.length;
  const isSacCode = formData.hsnCode.startsWith('99');
  const isHsnValidLength = hsnLength >= 2 && hsnLength <= 8 && /^\d+$/.test(formData.hsnCode);

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
    w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm pr-10 font-bold
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

      <form onSubmit={handleSubmit} className="p-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Official Item Name</label>
            <input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Precision Engineering Gearbox X-1" 
              className={inputClass('name')}
            />
            {touched.name && errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Category</label>
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
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Unit of Measure</label>
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

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                {isSacCode ? 'SAC (Services)' : 'HSN (Goods)'} Code
              </label>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isHsnValidLength ? 'bg-indigo-50 text-indigo-600' : hsnLength > 0 ? 'bg-rose-50 text-rose-500' : 'text-slate-300'}`}>
                {hsnLength} / 8 Digits
              </span>
            </div>
            <div className="relative group">
              <input 
                inputMode="numeric"
                value={formData.hsnCode} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').substring(0, 8);
                  setFormData({...formData, hsnCode: val});
                  if (touched.hsnCode) validate({...formData, hsnCode: val});
                }} 
                onBlur={() => handleBlur('hsnCode')}
                placeholder="2 to 8 digits (e.g. 8471)" 
                className={inputClass('hsnCode') + " font-mono font-bold tracking-widest"}
              />
              <div className="absolute right-3 top-3 opacity-0 group-focus-within:opacity-100 transition-opacity">
                {isHsnValidLength ? (
                   <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : hsnLength > 0 && (
                   <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
            </div>
            {touched.hsnCode && errors.hsnCode ? (
              <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.hsnCode}</p>
            ) : (
              <p className="text-[9px] text-slate-400 font-medium italic mt-1 ml-1">Must be 2-8 numerical digits.</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Listed Price</label>
               <label className="flex items-center space-x-2 cursor-pointer group">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">Inclusive of Tax?</span>
                  <div 
                    onClick={() => setFormData({...formData, isTaxInclusive: !formData.isTaxInclusive})}
                    className={`w-8 h-4 rounded-full relative transition-all shadow-inner ${formData.isTaxInclusive ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${formData.isTaxInclusive ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
               </label>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-black text-xs">$</span>
              <input 
                type="number"
                step="0.01"
                value={formData.salePrice} 
                onChange={e => setFormData({...formData, salePrice: parseFloat(e.target.value) || 0})} 
                onBlur={() => handleBlur('salePrice')}
                className={inputClass('salePrice') + " pl-8 font-black text-slate-900"}
              />
            </div>
          </div>
        </div>

        {/* GST Rate Implementation */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
           <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                 <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">Statutory Tax Management</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-xs">Define the applicable GST slab.</p>
                 </div>
                 <div className="text-right">
                    <div className="text-5xl font-black italic tracking-tighter text-indigo-500">{formData.gstRate}%</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Sovereign Rate</div>
                 </div>
              </div>

              <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                 {GST_SLABS.map(slab => (
                   <button
                    key={slab}
                    type="button"
                    onClick={() => setFormData({...formData, gstRate: slab})}
                    className={`flex-1 py-4 text-[11px] font-black uppercase rounded-xl transition-all ${formData.gstRate === slab ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}
                   >
                     {slab}%
                   </button>
                 ))}
                 <div className="w-px bg-white/10 mx-2 self-center h-8"></div>
                 <div className="relative flex-1">
                    <input 
                      type="number" 
                      placeholder="Custom"
                      onChange={(e) => setFormData({...formData, gstRate: parseFloat(e.target.value) || 0})}
                      className="w-full h-full bg-transparent border-none text-[11px] font-black text-center text-white placeholder-slate-600 outline-none"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Derived Base Value</span>
                    <span className="text-lg font-black text-white">${priceMetrics.base.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">{priceMetrics.label}</span>
                    <span className="text-lg font-black text-indigo-400">${priceMetrics.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div className="p-5 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 group hover:bg-indigo-600/20 transition-colors">
                    <span className="text-[8px] font-black text-indigo-400 uppercase block mb-1">Derived Grand Total</span>
                    <span className="text-lg font-black text-indigo-200">${priceMetrics.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                 </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black uppercase text-slate-500">Applicable: Worldwide</div>
                  <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black uppercase text-slate-500">Reconciliation: Auto</div>
                </div>
                <div className="text-[9px] font-black uppercase text-indigo-500 tracking-widest italic opacity-60">Master Mapping Validated ✓</div>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-10 -mr-32 -mt-32"></div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-10 py-4 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Discard</button>
          <button type="submit" className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all transform active:scale-95">
            {initialData ? 'Update Master' : 'Initialize Identity'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;