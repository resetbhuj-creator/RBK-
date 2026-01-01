import React, { useState, useEffect, useMemo } from 'react';
import LogoUpload from './LogoUpload';

interface CreateCompanyFormProps {
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

const FIELD_GUIDE: Record<string, string> = {
  name: "The registered legal name of your business as it should appear on invoices and official documents.",
  address: "Complete physical address of the company's registered office or primary place of business.",
  city: "The city or municipality where the business is primarily located.",
  phone: "Business contact in E.164 format: [+] [country code] [number]. Example: +14155552671.",
  email: "Primary business email address. Must be a valid standard email format (e.g., info@company.com).",
  website: "The official corporate website URL. Must start with http:// or https://.",
  registrationNo: "Your government-issued business registration number (e.g., PAN in India, EIN in US).",
  country: "Sets regional defaults for tax laws, date formats, and address requirements.",
  state: "Select your specific operating state or province to apply regional tax variations.",
  zip: "Postal/Zip code of your primary business location.",
  currency: "The base currency for all financial reporting. Auto-populates based on country.",
  taxLaw: "The specific legal framework governing your tax obligations (e.g., UK VAT, US Sales Tax).",
  taxId: "Unique identifier assigned by your local tax authority. Critical for tax-compliant invoicing. Format varies by region (e.g., GSTIN in India, EIN in US).",
  fyStartDate: "The date your official financial accounting year begins. ERP standards usually require the 1st of a month (e.g., April 1st).",
  booksBeginDate: "The actual date you start entering transactions. Must be on or after the Accounting Year Start date.",
  dataPath: "The filesystem directory or database namespace where this company's transactional data is persisted."
};

const INDIAN_STATE_CODES: Record<string, string> = {
  "Maharashtra": "27",
  "Delhi": "07",
  "Karnataka": "29",
  "Tamil Nadu": "33",
  "Gujarat": "24",
  "Uttar Pradesh": "09",
  "West Bengal": "19"
};

const COUNTRY_DATA: Record<string, { currency: string; taxLaw: string; states: string[]; defaultFYStart: string; zipRegex: RegExp; zipHint: string; taxIdRegex: RegExp; taxIdHint: string; taxLabel: string }> = {
  "India": {
    currency: "INR (₹)",
    taxLaw: "Indian GST",
    states: Object.keys(INDIAN_STATE_CODES),
    defaultFYStart: "04-01",
    zipRegex: /^[1-9][0-9]{5}$/,
    zipHint: "6-digit Pincode (e.g. 400001)",
    taxIdRegex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    taxIdHint: "Format: 22AAAAA0000A1Z5",
    taxLabel: "GSTIN"
  },
  "United States": {
    currency: "USD ($)",
    taxLaw: "US Sales Tax",
    states: ["California", "New York", "Texas", "Florida", "Illinois", "Washington"],
    defaultFYStart: "01-01",
    zipRegex: /^\d{5}(-\d{4})?$/,
    zipHint: "5 or 9 digits (e.g. 90210)",
    taxIdRegex: /^\d{2}-\d{7}$/,
    taxIdHint: "Format: 12-3456789",
    taxLabel: "EIN"
  },
  "United Kingdom": {
    currency: "GBP (£)",
    taxLaw: "UK VAT",
    states: ["England", "Scotland", "Wales", "Northern Ireland"],
    defaultFYStart: "04-06",
    zipRegex: /^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][ABD-HJLNP-UW-Z]{2}$/i,
    zipHint: "UK Postcode (e.g. SW1A 1AA)",
    taxIdRegex: /^(GB)?\d{9}$/,
    taxIdHint: "e.g. 123456789",
    taxLabel: "VAT Reg No"
  },
  "United Arab Emirates": {
    currency: "AED (د.إ)",
    taxLaw: "UAE VAT",
    states: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Fujairah"],
    defaultFYStart: "01-01",
    zipRegex: /^[a-zA-Z0-9\s-]{3,10}$/,
    zipHint: "3-10 characters",
    taxIdRegex: /^100\d{12}$/,
    taxIdHint: "e.g. 100XXXXXXXXXXXX",
    taxLabel: "TRN"
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
    registrationNo: '', 
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (formData.country && COUNTRY_DATA[formData.country]) {
      const info = COUNTRY_DATA[formData.country];
      setIsSyncing(true);
      
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
      
      const timer = setTimeout(() => setIsSyncing(false), 800);
      return () => clearTimeout(timer);
    }
  }, [formData.country, currentYear]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const countryInfo = formData.country ? COUNTRY_DATA[formData.country] : null;

    if (!formData.name.trim()) newErrors.name = 'Company name is required';
    if (!formData.address.trim()) newErrors.address = 'Business address is required';
    if (!formData.country) newErrors.country = 'Please select a country';
    if (!formData.state) newErrors.state = 'Please select a state';
    if (!formData.dataPath.trim()) newErrors.dataPath = 'Data path is mandatory';

    // Financial Date Validation (Strict Sensibility)
    const fyDate = new Date(formData.fyStartDate);
    const booksDate = new Date(formData.booksBeginDate);
    
    if (isNaN(fyDate.getTime())) {
      newErrors.fyStartDate = 'Invalid date format';
    } else {
      const day = fyDate.getDate();
      const year = fyDate.getFullYear();
      if (day !== 1) {
        newErrors.fyStartDate = 'Accounting years must begin on the 1st of a month';
      }
      if (year < 2000 || year > 2100) {
        newErrors.fyStartDate = 'Year must be between 2000 and 2100';
      }
    }

    if (isNaN(booksDate.getTime())) {
      newErrors.booksBeginDate = 'Invalid date format';
    } else if (booksDate < fyDate) {
      newErrors.booksBeginDate = 'Entry cannot start before the accounting year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validate();
  };

  const fiscalWindow = useMemo(() => {
    const start = new Date(formData.fyStartDate);
    if (isNaN(start.getTime()) || start.getFullYear() < 2000 || start.getFullYear() > 2100) {
      return { label: 'Invalid Date Range', value: 'Select a valid 1st-of-month date', error: true };
    }
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);
    const opt: any = { month: 'short', year: 'numeric', day: 'numeric' };
    return { 
      label: 'Financial Period (12 Months)', 
      value: `${start.toLocaleDateString('en-US', opt)} – ${end.toLocaleDateString('en-US', opt)}`,
      error: start.getDate() !== 1 
    };
  }, [formData.fyStartDate]);

  const LabelWithHelp = ({ id, label, required = false }: { id: string, label: string, required?: boolean }) => (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center">
          {label} {required && <span className="text-rose-500 ml-1">*</span>}
          <div className="group relative ml-2">
            <svg className="w-3.5 h-3.5 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {FIELD_GUIDE[id] || "Complete this field for compliance."}
            </div>
          </div>
        </label>
      </div>
    </div>
  );

  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm";
    return (touched[fieldName] && errors[fieldName]) 
      ? `${baseClass} border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/30` 
      : `${baseClass} border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 transform -rotate-3">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Setup Corporate Profile</h3>
            <p className="text-sm text-slate-500 font-medium">Define your statutory identity and financial period.</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (validate()) onSubmit(formData); }} className="p-8 space-y-10">
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1 md:col-span-2">
              <LabelWithHelp id="name" label="Legal Company Name" required />
              <input name="name" value={formData.name} onChange={handleChange} onBlur={() => handleBlur('name')} placeholder="e.g. Nexus Global Technologies Ltd." className={getInputClass('name')} />
              {touched.name && errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.name}</p>}
            </div>
            
            <div className="space-y-1">
              <LabelWithHelp id="country" label="Primary Region" required />
              <select name="country" value={formData.country} onChange={handleChange} onBlur={() => handleBlur('country')} className={getInputClass('country')}>
                <option value="">Select Region</option>
                {Object.keys(COUNTRY_DATA).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {touched.country && errors.country && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.country}</p>}
            </div>

            <div className="space-y-1">
              <LabelWithHelp id="state" label="State/Jurisdiction" required />
              <select name="state" value={formData.state} onChange={handleChange} onBlur={() => handleBlur('state')} className={getInputClass('state')}>
                <option value="">Select State</option>
                {formData.country && COUNTRY_DATA[formData.country].states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Fiscal Configuration Block */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 text-indigo-600">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest">Financial Period Setup</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 shadow-inner">
            <div className="space-y-1">
              <LabelWithHelp id="fyStartDate" label="Accounting Year Starts From" required />
              <input type="date" name="fyStartDate" value={formData.fyStartDate} onChange={handleChange} onBlur={() => handleBlur('fyStartDate')} className={getInputClass('fyStartDate')} />
              {touched.fyStartDate && errors.fyStartDate && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.fyStartDate}</p>}
              <p className="text-[10px] text-slate-400 mt-1 italic">The first day of your financial calendar.</p>
            </div>
            <div className="space-y-1">
              <LabelWithHelp id="booksBeginDate" label="Books Beginning From" required />
              <input type="date" name="booksBeginDate" value={formData.booksBeginDate} onChange={handleChange} onBlur={() => handleBlur('booksBeginDate')} className={getInputClass('booksBeginDate')} />
              {touched.booksBeginDate && errors.booksBeginDate && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.booksBeginDate}</p>}
              <p className="text-[10px] text-slate-400 mt-1 italic">Date of first transaction in this system.</p>
            </div>

            <div className={`md:col-span-2 mt-4 p-5 rounded-2xl border flex items-center space-x-4 transition-all ${fiscalWindow.error ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-200 shadow-sm'}`}>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fiscalWindow.error ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <div>
                  <h5 className={`text-[10px] font-black uppercase tracking-widest ${fiscalWindow.error ? 'text-rose-500' : 'text-indigo-400'}`}>{fiscalWindow.label}</h5>
                  <p className={`text-sm font-black ${fiscalWindow.error ? 'text-rose-900' : 'text-slate-800'}`}>{fiscalWindow.value}</p>
               </div>
            </div>
          </div>
        </section>

        <div className="pt-10 border-t border-slate-100 flex justify-end space-x-5">
          <button type="button" onClick={onCancel} className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50 transition-all uppercase tracking-widest">Cancel</button>
          <button type="submit" className="px-12 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95 uppercase tracking-widest">Finalize Creation</button>
        </div>
      </form>
    </div>
  );
};

export default CreateCompanyForm;