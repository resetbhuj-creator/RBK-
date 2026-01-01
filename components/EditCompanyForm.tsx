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
  'CHF': 'Fr', 'NZD': '$', 'ZAR': 'R', 'MXN': '$', 'BRL': 'R$',
  'HKD': '$', 'KRW': '₩', 'TRY': '₺', 'RUB': '₽', 'IDR': 'Rp',
  'MYR': 'RM', 'PHP': '₱', 'THB': '฿', 'VND': '₫', 'SAR': '﷼',
  'PLN': 'zł', 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'HUF': 'Ft'
};

const EditCompanyForm: React.FC<EditCompanyFormProps> = ({ initialData, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    ...initialData,
    city: initialData.city || '',
    zip: initialData.zip || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    website: initialData.website || '',
    registrationNo: initialData.registrationNo || '',
    dataPath: initialData.dataPath || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Company name is required';
    if (!formData.address.trim()) newErrors.address = 'Business address is required';
    if (!formData.currency.trim()) newErrors.currency = 'Currency is required';
    if (!formData.dataPath.trim()) newErrors.dataPath = 'Data path is required';

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'currency') {
      const val = value.toUpperCase();
      let formattedVal = val;
      if (val.length === 3 && /^[A-Z]{3}$/.test(val)) {
        const symbol = COMMON_CURRENCIES[val];
        if (symbol) formattedVal = `${val} (${symbol})`;
      }
      setFormData(prev => ({ ...prev, currency: formattedVal }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm";
    const statusClass = (touched[fieldName] && errors[fieldName]) 
      ? "border-rose-500 bg-rose-50/30 text-rose-900" 
      : "border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white";
    return `${baseClass} ${statusClass}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-w-5xl mx-auto animate-in zoom-in-95 duration-300">
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Edit Company Identity</h3>
            <p className="text-xs text-slate-500 font-medium">Update statutory and organizational data.</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-10">
        <section className="space-y-6">
           <h4 className="text-xs font-black uppercase text-indigo-600 tracking-widest ml-1">Brand Assets</h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
              <div className="md:col-span-2">
                 <LogoUpload 
                   value={formData.logo} 
                   onChange={(val) => setFormData({...formData, logo: val})} 
                   onClear={() => setFormData({...formData, logo: ''})}
                   error={errors.logo}
                 />
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <h5 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-tight">Image Policy</h5>
                 <p className="text-[11px] text-slate-500 leading-relaxed italic">Updating this logo will reflect across all generated PDF documents, dispatch emails, and the platform navigation bar immediately upon commit.</p>
              </div>
           </div>
        </section>

        <section className="space-y-6">
           <h4 className="text-xs font-black uppercase text-indigo-600 tracking-widest ml-1">Statutory Identity</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Full Legal Name</label>
                 <input name="name" value={formData.name} onChange={handleChange} className={getInputClass('name')} />
              </div>
              <div className="md:col-span-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Registered Address</label>
                 <textarea name="address" value={formData.address} onChange={handleChange} className={getInputClass('address') + " h-24 resize-none"} />
              </div>
              <div className="md:col-span-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">System Persistence Path</label>
                 <input name="dataPath" value={formData.dataPath} onChange={handleChange} className={getInputClass('dataPath')} />
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Operating Currency</label>
                 <input name="currency" value={formData.currency} onChange={handleChange} placeholder="e.g. USD ($)" className={getInputClass('currency')} />
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Tax ID / {formData.taxLaw || 'GST'}</label>
                 <input name="taxId" value={formData.taxId} onChange={handleChange} className={getInputClass('taxId')} />
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Corporate Email</label>
                 <input name="email" value={formData.email} onChange={handleChange} className={getInputClass('email')} />
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Business Website</label>
                 <input name="website" value={formData.website} onChange={handleChange} className={getInputClass('website')} />
              </div>
           </div>
        </section>

        <div className="pt-8 border-t border-slate-100 flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-10 py-4 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Discard</button>
          <button type="submit" className="px-14 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all transform active:scale-95">Commit Identity Context</button>
        </div>
      </form>
    </div>
  );
};

export default EditCompanyForm;