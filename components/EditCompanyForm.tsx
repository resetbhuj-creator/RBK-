import React, { useState, useEffect, useMemo } from 'react';
import LogoUpload from './LogoUpload';

interface EditCompanyFormProps {
  initialData: any;
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const COMMON_CURRENCIES: Record<string, string> = {
  'USD': '$', 'INR': '₹', 'GBP': '£', 'EUR': '€', 'JPY': '¥', 
  'CAD': '$', 'AUD': '$', 'AED': 'د.إ', 'CNY': '¥', 'SGD': '$',
  'CHF': 'Fr'
};

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership Firm',
  'Private Limited Company',
  'Public Limited Company',
  'LLP (Limited Liability Partnership)',
  'Trust / NGO',
  'Government Entity'
];

const EditCompanyForm: React.FC<EditCompanyFormProps> = ({ initialData, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    ...initialData,
    businessType: initialData.businessType || 'Private Limited Company',
    incorporationDate: initialData.incorporationDate || '',
    currencyConfig: initialData.currencyConfig || {
      symbol: '$',
      code: 'USD',
      decimalPlaces: 2,
      showSymbolAsPrefix: true,
      useIndianGrouping: false // Standard: 1,234,567 vs Indian: 12,34,567
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Company name is required';
    if (!formData.address?.trim()) newErrors.address = 'Business address is required';
    if (!formData.dataPath?.trim()) newErrors.dataPath = 'Data path is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      currencyConfig: { ...prev.currencyConfig, [field]: value }
    }));
  };

  const currencyPreview = useMemo(() => {
    const config = formData.currencyConfig;
    const amount = 1234567.8912;
    
    // Format number
    let formattedNumber = amount.toFixed(config.decimalPlaces);
    
    // Grouping
    const parts = formattedNumber.split('.');
    if (config.useIndianGrouping) {
      let x = parts[0];
      let lastThree = x.substring(x.length - 3);
      let otherNumbers = x.substring(0, x.length - 3);
      if (otherNumbers !== '') lastThree = ',' + lastThree;
      parts[0] = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    } else {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    formattedNumber = parts.join('.');

    return config.showSymbolAsPrefix 
      ? `${config.symbol} ${formattedNumber}` 
      : `${formattedNumber} ${config.symbol}`;
  }, [formData.currencyConfig]);

  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full px-5 py-3.5 rounded-2xl border outline-none transition-all text-sm font-bold shadow-sm";
    return (touched[fieldName] && errors[fieldName]) 
      ? `${baseClass} border-rose-500 bg-rose-50/30 text-rose-900` 
      : `${baseClass} border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white`;
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-6xl mx-auto animate-in zoom-in-95 duration-300">
      <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 transform -rotate-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Corporate Configuration</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Institutional Profile & Statutory Preferences</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-3 hover:bg-white/50 rounded-full text-slate-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (validate()) onSubmit(formData); }} className="p-10 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Identity Column */}
          <div className="lg:col-span-2 space-y-10">
            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.3em] flex items-center">
                <span className="w-6 h-px bg-indigo-200 mr-3"></span>
                Legal Identity
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Company Registered Name</label>
                  <input name="name" value={formData.name} onChange={handleChange} className={getInputClass('name')} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Classification</label>
                  <select name="businessType" value={formData.businessType} onChange={handleChange} className={getInputClass('businessType')}>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Incorporation Date</label>
                  <input type="date" name="incorporationDate" value={formData.incorporationDate} onChange={handleChange} className={getInputClass('incorporationDate')} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Statutory Office Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} className={getInputClass('address') + " h-24 resize-none"} />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.3em] flex items-center">
                <span className="w-6 h-px bg-indigo-200 mr-3"></span>
                Currency Formatting Engine
              </h4>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Base Symbol</label>
                    <input 
                      value={formData.currencyConfig.symbol} 
                      onChange={e => handleCurrencyChange('symbol', e.target.value)} 
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white text-center text-lg font-black text-indigo-600" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Decimal Places</label>
                    <select 
                      value={formData.currencyConfig.decimalPlaces} 
                      onChange={e => handleCurrencyChange('decimalPlaces', parseInt(e.target.value))}
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold"
                    >
                      {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Places</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Positioning</label>
                    <div className="flex p-1 bg-slate-200 rounded-xl border border-slate-300">
                      <button 
                        type="button" 
                        onClick={() => handleCurrencyChange('showSymbolAsPrefix', true)}
                        className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${formData.currencyConfig.showSymbolAsPrefix ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                      >Prefix</button>
                      <button 
                        type="button" 
                        onClick={() => handleCurrencyChange('showSymbolAsPrefix', false)}
                        className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${!formData.currencyConfig.showSymbolAsPrefix ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                      >Suffix</button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100">
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-tight">Regional Digit Grouping</h5>
                    <p className="text-[10px] text-slate-400 font-medium italic">Indian Lakhs/Crores vs International Millions</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleCurrencyChange('useIndianGrouping', !formData.currencyConfig.useIndianGrouping)}
                    className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${formData.currencyConfig.useIndianGrouping ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.currencyConfig.useIndianGrouping ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl border-t-8 border-indigo-600">
                   <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-3">Live Formatting Preview</h5>
                        <div className="text-4xl font-black italic tracking-tighter tabular-nums">{currencyPreview}</div>
                      </div>
                      <div className="hidden md:block text-right opacity-40">
                         <div className="text-[8px] font-black uppercase tracking-widest">Standard Sample</div>
                         <div className="text-xs font-mono">ID: 1,234,567.8912</div>
                      </div>
                   </div>
                   <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[100px] opacity-10"></div>
                </div>
              </div>
            </section>
          </div>

          {/* Asset Column */}
          <div className="space-y-8">
            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.3em] flex items-center">
                <span className="w-6 h-px bg-indigo-200 mr-3"></span>
                Brand Visuals
              </h4>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                 <LogoUpload 
                   value={formData.logo} 
                   onChange={(val) => setFormData({...formData, logo: val})} 
                   onClear={() => setFormData({...formData, logo: ''})}
                   error={errors.logo}
                 />
                 <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">"Updating institutional visuals will automatically synchronize across all PDF reporting clusters."</p>
                 </div>
              </div>
            </section>

            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.3em] flex items-center">
                <span className="w-6 h-px bg-indigo-200 mr-3"></span>
                System Node
              </h4>
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-slate-800">
                <div className="relative z-10 space-y-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Persistence Context</label>
                    <div className="text-xs font-mono text-indigo-400 break-all">{formData.dataPath}</div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-[10px] font-black uppercase text-slate-400">Node Synchronized</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-5">
           <button type="button" onClick={onCancel} className="px-10 py-5 rounded-[1.5rem] text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Discard Changes</button>
           <button type="submit" className="px-16 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-4 border-slate-950">Commit Global Configuration</button>
        </div>
      </form>
    </div>
  );
};

export default EditCompanyForm;