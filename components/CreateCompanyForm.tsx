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

const COUNTRIES = [
  'United States',
  'India',
  'United Kingdom',
  'United Arab Emirates',
  'Canada',
  'Australia',
  'Singapore',
  'Germany'
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

const INTEL_DB: Record<string, { title: string, impact: string, compliance: string, risk: 'Low' | 'Medium' | 'High' }> = {
  name: {
    title: "Entity Designation",
    impact: "This is the canonical identity node. It will be hard-coded into all encrypted voucher headers and statutory PDF headers.",
    compliance: "Must match the Certificate of Incorporation exactly to avoid reconciliation failure.",
    risk: 'Low'
  },
  country: {
    title: "Jurisdiction Shard",
    impact: "Determines the statutory logic (GST/VAT/Sales Tax) loaded by the core engine.",
    compliance: "Regulatory rulesets are locked to the selected jurisdiction at initialization.",
    risk: 'Medium'
  },
  businessType: {
    title: "Structural Classification",
    impact: "Affects the automated roll-up logic for Equity accounts and the formatting of the Statement of Financial Position.",
    compliance: "Governs the audit requirements and standard chart of accounts hierarchy.",
    risk: 'Low'
  },
  logo: {
    title: "Visual Identity Shard",
    impact: "Used for high-fidelity document rendering on invoices, receipts, and dispatch notes.",
    compliance: "Optional, but recommended for professional statutory correspondence.",
    risk: 'Low'
  },
  address: {
    title: "Statutory Location",
    impact: "Determines the primary site for location-based tax calculations and place-of-supply logic.",
    compliance: "Must be the registered headquarters for legal audit purposes.",
    risk: 'Medium'
  },
  email: {
    title: "Communication Node",
    impact: "The primary dispatch point for system alerts, automated recovery keys, and customer mailers.",
    compliance: "Requires valid SMTP relay configuration for high-volume dispatch.",
    risk: 'Low'
  },
  taxId: {
    title: "Sovereign Identifier",
    impact: "Critical for E-Invoicing and statutory portal synchronization.",
    compliance: "Invalid IDs will cause immediate rejection during government API handshakes.",
    risk: 'High'
  },
  dataPath: {
    title: "Persistence URI",
    impact: "The absolute filesystem path where organization-specific relational shards are persisted.",
    compliance: "Requires exclusive read/write access for the system process service account.",
    risk: 'High'
  },
  fyStartDate: {
    title: "Fiscal Temporal Boundary",
    impact: "Sets the starting point for the 12-month accounting session cycle.",
    compliance: "Must align with the statutory financial year of your jurisdiction.",
    risk: 'Medium'
  },
  booksBeginDate: {
    title: "Ledger Commencement",
    impact: "The exact moment transaction logging and opening balance calculation begins.",
    compliance: "Cannot precede the FY Start date. Governs the first entry serial.",
    risk: 'Medium'
  }
};

const CreateCompanyForm: React.FC<CreateCompanyFormProps> = ({ onCancel, onSubmit }) => {
  const currentYear = new Date().getFullYear();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPathManuallyEdited, setIsPathManuallyEdited] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [activeGuideField, setActiveGuideField] = useState<string>('name');
  
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
    dataPath: 'C:\\NexusERP\\Data\\United_States\\NewCompany'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isPathManuallyEdited) {
      const sanitizedName = formData.name.trim().replace(/[^a-z0-9]/gi, '_') || 'NewCompany';
      const sanitizedCountry = formData.country.replace(/[^a-z0-9]/gi, '_');
      setFormData(prev => ({
        ...prev,
        dataPath: `C:\\NexusERP\\Data\\${sanitizedCountry}\\${sanitizedName}`
      }));
    }
  }, [formData.name, formData.country, isPathManuallyEdited]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Company name is required';
      if (!formData.country) newErrors.country = 'Country selection is required';
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
    const isFocusedGuide = showGuide && activeGuideField === fieldName;
    
    return (touched[fieldName] && errors[fieldName]) 
      ? `${baseClass} border-rose-500 bg-rose-50/20 text-rose-900` 
      : `${baseClass} ${isFocusedGuide ? 'border-indigo-400 ring-4 ring-indigo-500/10' : 'border-slate-200'} focus:ring-4 focus:ring-indigo-500/10 bg-white focus:border-indigo-400`;
  };

  const handleFieldFocus = (fieldName: string) => {
    if (showGuide) setActiveGuideField(fieldName);
  };

  const IntelPanel = () => {
    const intel = INTEL_DB[activeGuideField];
    if (!intel) return null;

    return (
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white h-full sticky top-0 border-4 border-slate-800 shadow-2xl animate-in slide-in-from-right-10 duration-700">
         <div className="flex items-center space-x-4 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg animate-pulse">💡</div>
            <div>
               <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400">Mission Briefing</h4>
               <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">Architect's Guidance</p>
            </div>
         </div>

         <div className="space-y-10">
            <div>
               <div className="flex items-center justify-between mb-2">
                 <h5 className="text-xl font-black italic uppercase tracking-tighter leading-none">{intel.title}</h5>
                 <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${intel.risk === 'High' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>Risk: {intel.risk}</span>
               </div>
               <div className="h-0.5 w-12 bg-indigo-500 rounded-full"></div>
            </div>

            <div className="space-y-4">
               <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Operational Impact</label>
               <p className="text-xs font-medium text-slate-300 leading-relaxed italic">"{intel.impact}"</p>
            </div>

            <div className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/10 shadow-inner">
               <label className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Compliance Note</label>
               <p className="text-[11px] font-bold text-slate-400 leading-relaxed">{intel.compliance}</p>
            </div>

            <div className="pt-6 border-t border-white/5">
               <div className="flex items-center space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Neural Link: Active</span>
               </div>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto items-stretch h-full pb-20">
      <div className={`flex-1 bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-500 flex flex-col min-h-[750px] transition-all duration-700 ${showGuide ? 'xl:w-2/3' : 'w-full'}`}>
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
                <button 
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${showGuide ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10 text-slate-500'}`}
                >
                  Guided Intelligence: {showGuide ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
          
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
                  <div className="flex items-center space-x-3 mb-1 ml-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Official Company Name</label>
                    {showGuide && <div className={`w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping ${activeGuideField === 'name' ? 'opacity-100' : 'opacity-0'}`}></div>}
                  </div>
                  <input onFocus={() => handleFieldFocus('name')} name="name" value={formData.name} onChange={handleChange} className={getInputClass('name')} placeholder="Nexus Global Systems Ltd." />
                  {errors.name && <p className="text-[10px] text-rose-500 font-black mt-1 ml-2">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Jurisdiction (Country)</label>
                  <select onFocus={() => handleFieldFocus('country')} name="country" value={formData.country} onChange={handleChange} className={getInputClass('country')}>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Business Nature</label>
                  <select onFocus={() => handleFieldFocus('businessType')} name="businessType" value={formData.businessType} onChange={handleChange} className={getInputClass('businessType')}>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-6 md:col-span-2 pt-6">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Brand Visual (Logo)</label>
                  <div onFocus={() => handleFieldFocus('logo')} className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-inner">
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
                  <textarea onFocus={() => handleFieldFocus('address')} name="address" value={formData.address} onChange={handleChange} className={getInputClass('address') + " h-32 resize-none italic"} placeholder="Full physical location details..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Business Email</label>
                  <input onFocus={() => handleFieldFocus('email')} name="email" value={formData.email} onChange={handleChange} className={getInputClass('email')} placeholder="hq@nexus-erp.net" />
                  {errors.email && <p className="text-[10px] text-rose-500 font-black mt-1 ml-2">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Direct Contact Shard (Phone)</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className={getInputClass('phone')} placeholder="+1 / +91 ..." />
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
                  <input onFocus={() => handleFieldFocus('taxId')} name="taxId" value={formData.taxId} onChange={handleChange} className={getInputClass('taxId')} placeholder="GSTIN / VAT / EIN" />
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
                  <input onFocus={() => handleFieldFocus('fyStartDate')} type="date" name="fyStartDate" value={formData.fyStartDate} onChange={handleChange} className={getInputClass('fyStartDate')} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Books Beginning From</label>
                  <input onFocus={() => handleFieldFocus('booksBeginDate')} type="date" name="booksBeginDate" value={formData.booksBeginDate} onChange={handleChange} className={getInputClass('booksBeginDate')} />
                </div>
                <div className="md:col-span-2 space-y-2 pt-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center">
                    <svg className="w-3 h-3 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    Custom Database Shard Path (Persistence)
                  </label>
                  <div className="relative group/path">
                    <input 
                      onFocus={() => handleFieldFocus('dataPath')}
                      name="dataPath" 
                      value={formData.dataPath} 
                      onChange={(e) => {
                        setIsPathManuallyEdited(true);
                        handleChange(e);
                      }}
                      className={getInputClass('dataPath') + " font-mono text-xs pr-10"} 
                      placeholder="e.g. D:\Accounting\Project_Alpha"
                    />
                    {isPathManuallyEdited && (
                      <button 
                        type="button"
                        onClick={() => setIsPathManuallyEdited(false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 hover:bg-indigo-100 rounded-lg text-[8px] font-black text-slate-500 hover:text-indigo-600 transition-all uppercase"
                        title="Restore Suggested Path"
                      >
                        Reset
                      </button>
                    )}
                  </div>
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
                         <span className="px-3 py-1 bg-sky-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{formData.country}</span>
                      </div>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-20 -mr-24 -mt-24"></div>
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

      {/* Conditional Intel Sidebar */}
      {showGuide && (
        <div className="w-full xl:w-96 shrink-0 h-full">
           <IntelPanel />
        </div>
      )}
    </div>
  );
};

export default CreateCompanyForm;