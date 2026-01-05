import React, { useState, useEffect, useMemo } from 'react';
import LogoUpload from './LogoUpload';

interface CreateCompanyFormProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership Firm',
  'Private Limited Company',
  'Public Limited Company',
  'LLP',
  'Trust / NGO'
];

const ISO_CURRENCIES: Record<string, { symbol: string, name: string }> = {
  'USD': { symbol: '$', name: 'US Dollar' },
  'EUR': { symbol: '€', name: 'Euro' },
  'GBP': { symbol: '£', name: 'British Pound' },
  'INR': { symbol: '₹', name: 'Indian Rupee' },
  'AED': { symbol: 'د.إ', name: 'UAE Dirham' }
};

const STEPS = [
  { id: 1, label: 'Identity', icon: '🏢' },
  { id: 2, label: 'Communication', icon: '📡' },
  { id: 3, label: 'Financials', icon: '💰' },
  { id: 4, label: 'Review', icon: '🔍' }
];

const CreateCompanyForm: React.FC<CreateCompanyFormProps> = ({ onCancel, onSubmit }) => {
  const currentYear = new Date().getFullYear();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPathManuallyEdited, setIsPathManuallyEdited] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessType: 'Private Limited Company',
    address: '',
    phone: '',
    email: '',
    website: '',
    country: 'United States',
    state: 'New York',
    taxId: '',
    currency: 'USD ($)',
    fyStartDate: `${currentYear}-04-01`,
    booksBeginDate: `${currentYear}-04-01`,
    logo: '',
    dataPath: 'C:\\NexusERP\\Data\\NewCompany'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Only auto-update the path if the user hasn't manually customized it
    if (!isPathManuallyEdited) {
      const sanitizedName = formData.name.trim().replace(/[^a-z0-9]/gi, '_') || 'NewCompany';
      setFormData(prev => ({
        ...prev,
        dataPath: `C:\\NexusERP\\Data\\${sanitizedName}`
      }));
    }
  }, [formData.name, isPathManuallyEdited]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Company name is required';
    }
    if (step === 2) {
      if (!formData.email.trim()) newErrors.email = 'Official email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    }
    if (step === 3) {
      if (!formData.taxId.trim()) newErrors.taxId = 'Statutory Tax ID is required';
      if (!formData.dataPath.trim()) newErrors.dataPath = 'Data persistence path is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full px-5 py-3.5 rounded-2xl border outline-none transition-all text-sm font-bold shadow-sm";
    return (touched[fieldName] && errors[fieldName]) 
      ? `${baseClass} border-rose-500 bg-rose-50/20 text-rose-900` 
      : `${baseClass} border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white focus:border-indigo-400`;
  };

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-5xl mx-auto animate-in fade-in duration-500 flex flex-col min-h-[750px]">
      {/* Wizard Header */}
      <div className="px-12 py-10 bg-slate-950 text-white flex justify-between items-center shrink-0 border-b border-white/5">
        <div className="flex items-center space-x-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center text-3xl shadow-2xl transform -rotate-3 border-4 border-indigo-400/20">
            {STEPS[currentStep - 1].icon}
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Initialize Corporate Node</h3>
            <div className="flex items-center space-x-4 mt-3">
              <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em]">Stage {currentStep} of {STEPS.length}</span>
              <div className="w-px h-3 bg-white/10"></div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{STEPS[currentStep - 1].label}</span>
            </div>
          </div>
        </div>
        
        {/* Step Indicators */}
        <div className="hidden lg:flex items-center space-x-4 bg-white/5 p-4 rounded-[2rem] border border-white/10">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${currentStep === s.id ? 'bg-indigo-600 text-white scale-110 shadow-lg' : currentStep > s.id ? 'bg-emerald-50 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {currentStep > s.id ? '✓' : s.id}
              </div>
              {idx < STEPS.length - 1 && <div className={`w-6 h-0.5 rounded-full ${currentStep > s.id ? 'bg-emerald-50' : 'bg-slate-800'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
        {/* Step 1: Identity & Branding */}
        {currentStep === 1 && (
          <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Official Company Name</label>
                <input name="name" value={formData.name} onChange={handleChange} className={getInputClass('name')} placeholder="Nexus Global Systems Ltd." />
                {errors.name && <p className="text-[10px] text-rose-500 font-black mt-1 ml-2">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Business Nature</label>
                <select name="businessType" value={formData.businessType} onChange={handleChange} className={getInputClass('businessType')}>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-6 md:col-span-2 pt-6">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Brand Visual (Logo)</label>
                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-inner">
                  <LogoUpload value={formData.logo} onChange={val => setFormData({...formData, logo: val})} onClear={() => setFormData({...formData, logo: ''})} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact & Communication */}
        {currentStep === 2 && (
          <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Statutory Headquarters Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} className={getInputClass('address') + " h-32 resize-none italic"} placeholder="Full physical location details..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Business Email</label>
                <input name="email" value={formData.email} onChange={handleChange} className={getInputClass('email')} placeholder="hq@nexus-erp.net" />
                {errors.email && <p className="text-[10px] text-rose-500 font-black mt-1 ml-2">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Direct Contact Shard (Phone)</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className={getInputClass('phone')} placeholder="+1 / +91 ..." />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Corporate Portal (Website)</label>
                <input name="website" value={formData.website} onChange={handleChange} className={getInputClass('website')} placeholder="www.nexus-global.net" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Financials & Statutory */}
        {currentStep === 3 && (
          <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Primary Tax ID</label>
                <input name="taxId" value={formData.taxId} onChange={handleChange} className={getInputClass('taxId')} placeholder="GSTIN / VAT / EIN" />
                {errors.taxId && <p className="text-[10px] text-rose-500 font-black mt-1 ml-2">{errors.taxId}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Reporting Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange} className={getInputClass('currency')}>
                  {Object.entries(ISO_CURRENCIES).map(([code, data]) => <option key={code} value={`${code} (${data.symbol})`}>{data.name} ({code})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Accounting Year Starts From</label>
                <input type="date" name="fyStartDate" value={formData.fyStartDate} onChange={handleChange} className={getInputClass('fyStartDate')} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Books Beginning From</label>
                <input type="date" name="booksBeginDate" value={formData.booksBeginDate} onChange={handleChange} className={getInputClass('booksBeginDate')} />
              </div>
              <div className="md:col-span-2 space-y-2 pt-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center">
                  <svg className="w-3 h-3 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  Custom Database Shard Path (Persistence)
                </label>
                <input 
                  name="dataPath" 
                  value={formData.dataPath} 
                  onChange={(e) => {
                    setIsPathManuallyEdited(true);
                    handleChange(e);
                  }}
                  className={getInputClass('dataPath') + " font-mono text-xs"} 
                  placeholder="e.g. D:\Accounting\Project_Alpha"
                />
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-2">
                  {isPathManuallyEdited ? '✓ CUSTOM PATH ACTIVE' : '⚠ AUTO-GENERATED BASE ON COMPANY NAME'}
                </p>
                {errors.dataPath && <p className="text-[10px] text-rose-500 font-black mt-1 ml-2">{errors.dataPath}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-12 animate-in zoom-in-95 duration-500">
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 flex items-center space-x-10">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center p-4 shadow-xl shrink-0">
                    {formData.logo ? <img src={formData.logo} alt="Logo" className="max-w-full max-h-full object-contain" /> : <span className="text-4xl">🏢</span>}
                  </div>
                  <div>
                    <h4 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-4">{formData.name || 'Unnamed Entity'}</h4>
                    <div className="flex flex-wrap gap-4">
                       <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">{formData.businessType}</span>
                       <span className="px-3 py-1 bg-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{formData.taxId}</span>
                       <span className="px-3 py-1 bg-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{formData.currency}</span>
                    </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-20 -mr-24 -mt-24"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6 shadow-inner">
                  <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Communication Node</h5>
                  <div className="space-y-4 text-xs font-bold text-slate-600">
                    <p className="flex justify-between border-b border-slate-200 pb-2"><span>Email:</span> <span className="text-slate-900 italic">{formData.email}</span></p>
                    <p className="flex justify-between border-b border-slate-200 pb-2"><span>Phone:</span> <span className="text-slate-900">{formData.phone || 'Not set'}</span></p>
                    <p className="leading-relaxed"><span className="text-slate-400 uppercase text-[9px] block mb-1">Registered Address:</span> {formData.address}</p>
                  </div>
               </div>
               <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6 shadow-inner">
                  <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Persistence Metadata</h5>
                  <div className="space-y-4 text-xs font-bold text-slate-600">
                    <p className="flex justify-between border-b border-slate-200 pb-2"><span>FY Opening:</span> <span className="text-indigo-600">{formData.fyStartDate}</span></p>
                    <p className="flex justify-between border-b border-slate-200 pb-2"><span>Books Start:</span> <span className="text-indigo-600">{formData.booksBeginDate}</span></p>
                    <div className="pt-2">
                       <span className="text-slate-400 uppercase text-[9px] block mb-1">Database Shard URI:</span>
                       <code className="block bg-white p-3 rounded-xl border border-slate-200 text-[10px] font-mono font-black text-indigo-600 break-all">{formData.dataPath}</code>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-12 py-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 shrink-0 mt-auto">
        <button 
          type="button" 
          onClick={currentStep === 1 ? onCancel : handleBack} 
          className="px-10 py-5 rounded-[1.8rem] text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white transition-all transform active:scale-95"
        >
          {currentStep === 1 ? 'Abort Session' : 'Back to Stage ' + (currentStep - 1)}
        </button>
        
        <div className="flex space-x-4 w-full sm:w-auto">
          {currentStep < STEPS.length ? (
            <button 
              type="button"
              onClick={handleNext}
              className="w-full sm:w-[320px] py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-700 transition-all transform active:scale-95 border-b-8 border-indigo-900"
            >
              Next Stage &rarr;
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => onSubmit(formData)}
              className="w-full sm:w-[480px] py-6 bg-slate-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-black/40"
            >
              Commit Identity Node
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCompanyForm;
