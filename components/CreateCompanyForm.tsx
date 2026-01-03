import React, { useState, useEffect, useMemo } from 'react';
import LogoUpload from './LogoUpload';

interface CreateCompanyFormProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const FIELD_GUIDE: Record<string, string> = {
  name: "The registered legal name of your business as it should appear on invoices and official documents.",
  address: "Complete physical address of the company's registered office or primary place of business.",
  city: "The city or municipality where the business is primarily located.",
  phone: "Business contact in E.164 format: [+] [country code] [number].",
  email: "Primary business email address for statutory correspondence.",
  website: "The official corporate website URL.",
  registrationNo: "Your government-issued business registration number (e.g., PAN in India, EIN in US).",
  country: "Sets regional defaults for tax laws, date formats, and address requirements.",
  state: "Select your specific operating state or province to apply regional tax variations.",
  zip: "Postal/Zip code of your primary business location.",
  currency: "The base currency for all financial reporting. Enter ISO code (USD) or symbol ($).",
  taxLaw: "The specific legal framework governing your tax obligations.",
  taxId: "Unique identifier assigned by your local tax authority (e.g., GSTIN, EIN, VAT).",
  fyStartDate: "The date your official financial accounting year begins. Standard is usually 1st of a month.",
  booksBeginDate: "The actual date you start entering transactions. Must be on or after the Accounting Year Start date.",
  dataPath: "The database namespace where this company's transactional data is persisted."
};

const ISO_CURRENCIES: Record<string, { symbol: string, name: string }> = {
  'USD': { symbol: '$', name: 'US Dollar' },
  'EUR': { symbol: '€', name: 'Euro' },
  'GBP': { symbol: '£', name: 'British Pound' },
  'INR': { symbol: '₹', name: 'Indian Rupee' },
  'JPY': { symbol: '¥', name: 'Japanese Yen' },
  'AUD': { symbol: '$', name: 'Australian Dollar' },
  'CAD': { symbol: '$', name: 'Canadian Dollar' },
  'CHF': { symbol: 'Fr', name: 'Swiss Franc' },
  'CNY': { symbol: '¥', name: 'Chinese Yuan' },
  'AED': { symbol: 'د.إ', name: 'UAE Dirham' },
  'SGD': { symbol: '$', name: 'Singapore Dollar' },
  'NZD': { symbol: '$', name: 'New Zealand Dollar' },
  'MXN': { symbol: '$', name: 'Mexican Peso' },
  'HKD': { symbol: '$', name: 'Hong Kong Dollar' },
  'ZAR': { symbol: 'R', name: 'South African Rand' }
};

const INDIAN_STATE_CODES: Record<string, string> = {
  "Maharashtra": "27", "Delhi": "07", "Karnataka": "29", "Tamil Nadu": "33", 
  "Gujarat": "24", "Uttar Pradesh": "09", "West Bengal": "19", "Haryana": "06"
};

const COUNTRY_DATA: Record<string, { currency: string; taxLaw: string; states: string[]; defaultFYStart: string; zipHint: string; taxLabel: string; taxHint: string }> = {
  "India": {
    currency: "INR (₹)",
    taxLaw: "Indian GST",
    states: Object.keys(INDIAN_STATE_CODES),
    defaultFYStart: "04-01",
    zipHint: "6-digit Pincode",
    taxLabel: "GSTIN",
    taxHint: "e.g. 27AAAAA0000A1Z5"
  },
  "United States": {
    currency: "USD ($)",
    taxLaw: "US Sales Tax",
    states: ["California", "New York", "Texas", "Florida", "Illinois", "Washington"],
    defaultFYStart: "01-01",
    zipHint: "5 or 9 digits",
    taxLabel: "EIN / Tax ID",
    taxHint: "e.g. 12-3456789"
  },
  "United Kingdom": {
    currency: "GBP (£)",
    taxLaw: "UK VAT",
    states: ["England", "Scotland", "Wales", "Northern Ireland"],
    defaultFYStart: "04-06",
    zipHint: "Postcode (e.g. SW1A)",
    taxLabel: "VAT Reg No",
    taxHint: "e.g. GB123456789"
  },
  "United Arab Emirates": {
    currency: "AED (د.إ)",
    taxLaw: "UAE VAT",
    states: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Fujairah"],
    defaultFYStart: "01-01",
    zipHint: "P.O. Box",
    taxLabel: "TRN",
    taxHint: "15-digit number"
  }
};

const CreateCompanyForm: React.FC<CreateCompanyFormProps> = ({ onCancel, onSubmit }) => {
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    country: '',
    state: '',
    city: '',
    zip: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',          
    currency: '',
    taxLaw: '',
    fyStartDate: `${currentYear}-04-01`,
    booksBeginDate: `${currentYear}-04-01`,
    logo: '' as string,
    dataPath: 'C:\\NexusERP\\Data\\NewCompany'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (formData.country && COUNTRY_DATA[formData.country]) {
      const info = COUNTRY_DATA[formData.country];
      const fyStart = `${currentYear}-${info.defaultFYStart}`;
      setFormData(prev => ({
        ...prev,
        currency: info.currency,
        taxLaw: info.taxLaw,
        state: '',
        taxId: '', 
        fyStartDate: fyStart,
        booksBeginDate: fyStart
      }));
    }
  }, [formData.country, currentYear]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Required';
    if (!formData.country) newErrors.country = 'Required';
    if (!formData.state) newErrors.state = 'Required';
    if (!formData.currency) newErrors.currency = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCurrencyValue = (val: string): string => {
    const clean = val.trim().toUpperCase();
    
    // Check if it's a known ISO code
    if (ISO_CURRENCIES[clean]) {
      return `${clean} (${ISO_CURRENCIES[clean].symbol})`;
    }
    
    // Check if it matches a symbol
    const matchBySymbol = Object.entries(ISO_CURRENCIES).find(([_, data]) => data.symbol === val.trim());
    if (matchBySymbol) {
      return `${matchBySymbol[0]} (${matchBySymbol[1].symbol})`;
    }

    // Attempt to parse format like "USD ($)" and keep it if it looks valid
    if (/^[A-Z]{3}\s\(.+\)$/.test(clean)) {
      return clean;
    }

    return val; // Degrade gracefully to literal input
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'currency') {
      const clean = value.trim().toUpperCase();
      // Auto-append if exactly matches a known ISO key as user types
      if (clean.length === 3 && ISO_CURRENCIES[clean]) {
        setFormData(prev => ({ ...prev, currency: `${clean} (${ISO_CURRENCIES[clean].symbol})` }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyBlur = () => {
    setFormData(prev => ({
      ...prev,
      currency: formatCurrencyValue(prev.currency)
    }));
    handleBlur('currency');
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const LabelWithHelp = ({ id, label, required = false }: { id: string, label: string, required?: boolean }) => (
    <div className="flex items-center justify-between mb-1">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
        {label} {required && <span className="text-rose-500 ml-1">*</span>}
        <div className="group relative ml-2">
          <svg className="w-3 h-3 text-slate-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-slate-900 text-white text-[9px] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 normal-case font-medium leading-relaxed">
            {FIELD_GUIDE[id] || "Institutional data field."}
          </div>
        </div>
      </label>
    </div>
  );

  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full px-5 py-3 rounded-2xl border outline-none transition-all text-sm font-bold shadow-sm";
    return (touched[fieldName] && errors[fieldName]) 
      ? `${baseClass} border-rose-500 bg-rose-50/20 text-rose-900` 
      : `${baseClass} border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white`;
  };

  const currentCountryInfo = formData.country ? COUNTRY_DATA[formData.country] : null;

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-6xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center space-x-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 transform -rotate-3 transition-transform hover:rotate-0">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic leading-none">Initialize Identity Node</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Provisioning Corporate Master & Statutory Rules</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-3 hover:bg-slate-100 rounded-full text-slate-300 hover:text-rose-500 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (validate()) onSubmit(formData); }} className="p-10 space-y-12">
        
        {/* Section 1: Core Identity */}
        <section className="space-y-8">
           <div className="flex items-center space-x-4">
              <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-[0.2em]">I. Legal Identity & Localization</h4>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-1">
                 <LabelWithHelp id="name" label="Full Registered Name" required />
                 <input name="name" value={formData.name} onChange={handleChange} onBlur={() => handleBlur('name')} placeholder="e.g. Nexus Global Systems Ltd." className={getInputClass('name')} />
              </div>
              
              <div className="space-y-1">
                 <LabelWithHelp id="country" label="Tax Jurisdiction" required />
                 <select name="country" value={formData.country} onChange={handleChange} onBlur={() => handleBlur('country')} className={getInputClass('country')}>
                   <option value="">-- Choose Country --</option>
                   {Object.keys(COUNTRY_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                 <LabelWithHelp id="address" label="Statutory Address" />
                 <input name="address" value={formData.address} onChange={handleChange} placeholder="Physical corporate office location" className={getInputClass('address')} />
              </div>

              <div className="space-y-1">
                 <LabelWithHelp id="state" label="State / Province" required />
                 <select name="state" value={formData.state} onChange={handleChange} onBlur={() => handleBlur('state')} className={getInputClass('state')}>
                    <option value="">-- Select State --</option>
                    {formData.country && COUNTRY_DATA[formData.country].states.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>

              <div className="space-y-1">
                 <LabelWithHelp id="city" label="City" />
                 <input name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Mumbai" className={getInputClass('city')} />
              </div>

              <div className="space-y-1">
                 <LabelWithHelp id="zip" label="Postal / ZIP Code" />
                 <input name="zip" value={formData.zip} onChange={handleChange} placeholder={currentCountryInfo?.zipHint || 'Code'} className={getInputClass('zip')} />
              </div>
           </div>
        </section>

        {/* Section 2: Contact Gateway */}
        <section className="space-y-8">
           <div className="flex items-center space-x-4">
              <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-[0.2em]">II. Contact Gateway</h4>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                 <LabelWithHelp id="phone" label="Business Contact" />
                 <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 / +91..." className={getInputClass('phone')} />
              </div>
              <div className="space-y-1">
                 <LabelWithHelp id="email" label="Official Email" required />
                 <input name="email" value={formData.email} onChange={handleChange} onBlur={() => handleBlur('email')} placeholder="accounts@corp.net" className={getInputClass('email')} />
              </div>
              <div className="space-y-1">
                 <LabelWithHelp id="website" label="Corporate Portal" />
                 <input name="website" value={formData.website} onChange={handleChange} placeholder="www.nexus-corp.net" className={getInputClass('website')} />
              </div>
           </div>
        </section>

        {/* Section 3: Statutory Config */}
        <section className="space-y-8">
           <div className="flex items-center space-x-4">
              <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-[0.2em]">III. Statutory & Financial Logic</h4>
           </div>

           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-t-8 border-indigo-600">
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Master Currency</label>
                    <div className="relative group/currency">
                      <input 
                        name="currency" 
                        list="currency-suggestions"
                        value={formData.currency} 
                        onChange={handleChange} 
                        onBlur={handleCurrencyBlur}
                        placeholder="USD, INR, £, etc."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner placeholder-slate-600" 
                      />
                      <datalist id="currency-suggestions">
                        {Object.entries(ISO_CURRENCIES).map(([code, data]) => (
                          <option key={code} value={`${code} (${data.symbol})`}>{data.name}</option>
                        ))}
                      </datalist>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/currency:opacity-100 transition-opacity">
                         <span className="text-[8px] font-black uppercase text-slate-500">ISO Matcher Active</span>
                      </div>
                    </div>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter ml-1">Detected: <span className="text-indigo-400 italic">{formatCurrencyValue(formData.currency)}</span></p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Statutory Tax Regime</label>
                    <input name="taxLaw" value={formData.taxLaw} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" />
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter ml-1">Applied for statutory report calculations.</p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">{currentCountryInfo?.taxLabel || 'Tax ID'}</label>
                    <input name="taxId" value={formData.taxId} onChange={handleChange} placeholder={currentCountryInfo?.taxHint || 'ID Number'} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner italic" />
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter ml-1">Required for statutory compliant invoicing.</p>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
           </div>
        </section>

        {/* Section 4: Corporate Branding */}
        <section className="space-y-8">
           <div className="flex items-center space-x-4">
              <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-[0.2em]">IV. Corporate Branding</h4>
           </div>

           <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200">
              <LogoUpload 
                value={formData.logo} 
                onChange={(val) => setFormData(prev => ({...prev, logo: val}))} 
                onClear={() => setFormData(prev => ({...prev, logo: ''}))}
                error={errors.logo}
              />
              <p className="mt-4 text-[10px] text-slate-400 font-medium italic text-center">"This logo will appear on all statutory invoices, reports, and emails."</p>
           </div>
        </section>

        {/* Section 5: Fiscal Period */}
        <section className="space-y-8">
           <div className="flex items-center space-x-4">
              <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-[0.2em]">V. Working Session & Persistence</h4>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200">
              <div className="space-y-1">
                 <LabelWithHelp id="fyStartDate" label="Accounting Year Starts From" required />
                 <input type="date" name="fyStartDate" value={formData.fyStartDate} onChange={handleChange} onBlur={() => handleBlur('fyStartDate')} className={getInputClass('fyStartDate')} />
              </div>
              <div className="space-y-1">
                 <LabelWithHelp id="booksBeginDate" label="Books Beginning From" required />
                 <input type="date" name="booksBeginDate" value={formData.booksBeginDate} onChange={handleChange} onBlur={() => handleBlur('booksBeginDate')} className={getInputClass('booksBeginDate')} />
              </div>
              <div className="md:col-span-2 space-y-1 pt-4">
                 <LabelWithHelp id="dataPath" label="System Persistence Path" required />
                 <input name="dataPath" value={formData.dataPath} onChange={handleChange} className={getInputClass('dataPath') + " font-mono text-[11px]"} />
              </div>
           </div>
        </section>

        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-6">
           <button type="button" onClick={onCancel} className="px-12 py-5 rounded-[1.5rem] text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Discard Data</button>
           <button type="submit" className="px-16 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-slate-950">Initialize Corporate Node</button>
        </div>
      </form>
    </div>
  );
};

export default CreateCompanyForm;