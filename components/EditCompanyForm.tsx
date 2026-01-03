import React, { useState, useMemo } from 'react';
import LogoUpload from './LogoUpload';

interface EditCompanyFormProps {
  initialData: any;
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

type SettingsTab = 'IDENTITY' | 'CONTACT' | 'STATUTORY' | 'FINANCIALS' | 'SYSTEM';

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
  const [activeTab, setActiveTab] = useState<SettingsTab>('IDENTITY');
  const [formData, setFormData] = useState({
    ...initialData,
    businessType: initialData.businessType || 'Private Limited Company',
    incorporationDate: initialData.incorporationDate || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    website: initialData.website || '',
    taxId: initialData.taxId || '',
    panNumber: initialData.panNumber || '', // Added PAN for statutory
    currencyConfig: initialData.currencyConfig || {
      symbol: '$',
      code: 'USD',
      decimalPlaces: 2,
      showSymbolAsPrefix: true,
      useIndianGrouping: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Company name is mandatory';
    if (!formData.email?.trim()) newErrors.email = 'Primary contact email is required';
    if (!formData.dataPath?.trim()) newErrors.dataPath = 'Data persistence path is missing';
    
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
    let formattedNumber = amount.toFixed(config.decimalPlaces);
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
      : `${baseClass} border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white focus:border-indigo-400`;
  };

  const TabButton = ({ id, label, icon }: { id: SettingsTab, label: string, icon: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all ${
        activeTab === id 
          ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-[1.02] border-l-4 border-indigo-500' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto animate-in zoom-in-95 duration-500 flex flex-col md:flex-row min-h-[700px]">
      {/* Settings Navigation Sidebar */}
      <aside className="w-full md:w-72 bg-slate-50 p-8 border-r border-slate-100 space-y-10 shrink-0">
        <div className="space-y-6">
          <div className="flex items-center space-x-4 px-2">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
             </div>
             <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">Settings</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Institutional Console</p>
             </div>
          </div>

          <nav className="space-y-1.5">
            <TabButton id="IDENTITY" label="Corporate Identity" icon="🏢" />
            <TabButton id="CONTACT" label="Communication" icon="📡" />
            <TabButton id="STATUTORY" label="Statutory Data" icon="⚖️" />
            <TabButton id="FINANCIALS" label="Financial Prefs" icon="💰" />
            <TabButton id="SYSTEM" label="System & Logic" icon="⚙️" />
          </nav>
        </div>

        <div className="bg-indigo-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl border border-indigo-800">
           <div className="relative z-10">
              <h4 className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-4">Quick Status</h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-medium text-indigo-100/60">FY State</span>
                    <span className="text-[10px] font-black text-emerald-400">OPEN</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-medium text-indigo-100/60">Compliance</span>
                    <span className="text-[10px] font-black text-white">94%</span>
                 </div>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-10 -mr-16 -mt-16"></div>
        </div>
      </aside>

      {/* Main Settings Content Area */}
      <form onSubmit={(e) => { e.preventDefault(); if (validate()) onSubmit(formData); }} className="flex-1 flex flex-col min-h-0">
        <div className="p-10 flex-1 overflow-y-auto custom-scrollbar space-y-12">
          
          {activeTab === 'IDENTITY' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <header>
                <h4 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter mb-2">Legal Identity Node</h4>
                <p className="text-sm text-slate-400 font-medium">Core organizational details and brand visual representation.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registered Entity Name</label>
                  <input name="name" value={formData.name} onChange={handleChange} className={getInputClass('name')} placeholder="e.g. Nexus Global Systems Ltd." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Nature</label>
                  <select name="businessType" value={formData.businessType} onChange={handleChange} className={getInputClass('businessType')}>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Incorporation Date</label>
                  <input type="date" name="incorporationDate" value={formData.incorporationDate} onChange={handleChange} className={getInputClass('incorporationDate')} />
                </div>
                <div className="md:col-span-2 space-y-6">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Brand Visual (Logo)</label>
                  <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                    <LogoUpload 
                      value={formData.logo} 
                      onChange={(val) => setFormData({...formData, logo: val})} 
                      onClear={() => setFormData({...formData, logo: ''})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CONTACT' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <header>
                <h4 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter mb-2">Communication Gateway</h4>
                <p className="text-sm text-slate-400 font-medium">Configure contact endpoints and statutory office location.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Statutory Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} className={getInputClass('address') + " h-32 resize-none italic"} placeholder="Complete physical office location..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Mobile / Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className={getInputClass('phone')} placeholder="+1 / +91 ..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Official Support Email</label>
                  <input name="email" value={formData.email} onChange={handleChange} className={getInputClass('email')} placeholder="accounts@corp-nexus.com" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Corporate Portal (Website)</label>
                  <input name="website" value={formData.website} onChange={handleChange} className={getInputClass('website')} placeholder="www.nexus-global.net" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'STATUTORY' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <header>
                <h4 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter mb-2">Statutory Reconciliation</h4>
                <p className="text-sm text-slate-400 font-medium">Manage sovereign tax IDs and legal framework associations.</p>
              </header>

              <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border-l-8 border-indigo-600">
                 <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Primary Tax ID (GSTIN/VAT/EIN)</label>
                       <input name="taxId" value={formData.taxId} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner italic" placeholder="e.g. 27AAAAA0000A1Z5" />
                       <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Required for statutory compliant invoicing.</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Institutional PAN / Tax Code</label>
                       <input name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner italic" placeholder="e.g. ABCDE1234F" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Tax Jurisdiction Regime</label>
                       <select name="taxLaw" value={formData.taxLaw} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none cursor-pointer">
                          <option value="Indian GST" className="bg-slate-900">Indian GST Framework</option>
                          <option value="US Sales Tax" className="bg-slate-900">US Sales Tax Protocol</option>
                          <option value="UK VAT" className="bg-slate-900">UK VAT Scheme</option>
                          <option value="UAE VAT" className="bg-slate-900">UAE VAT Statutory</option>
                       </select>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
              </div>
            </div>
          )}

          {activeTab === 'FINANCIALS' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <header>
                <h4 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter mb-2">Financial Architecture</h4>
                <p className="text-sm text-slate-400 font-medium">Control currency formatting logic and fiscal cycle parameters.</p>
              </header>

              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Base Symbol</label>
                    <input 
                      value={formData.currencyConfig.symbol} 
                      onChange={e => handleCurrencyChange('symbol', e.target.value)} 
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-center text-xl font-black text-indigo-600 shadow-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Decimal Precision</label>
                    <select 
                      value={formData.currencyConfig.decimalPlaces} 
                      onChange={e => handleCurrencyChange('decimalPlaces', parseInt(e.target.value))}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm"
                    >
                      {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Points</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Display Node</label>
                    <div className="flex p-1.5 bg-slate-200 rounded-2xl border border-slate-300">
                      <button 
                        type="button" 
                        onClick={() => handleCurrencyChange('showSymbolAsPrefix', true)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${formData.currencyConfig.showSymbolAsPrefix ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-500'}`}
                      >Prefix</button>
                      <button 
                        type="button" 
                        onClick={() => handleCurrencyChange('showSymbolAsPrefix', false)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${!formData.currencyConfig.showSymbolAsPrefix ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-500'}`}
                      >Suffix</button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl group border-4 border-slate-800">
                   <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">Currency Serialization Preview</h5>
                        <div className="text-5xl font-black italic tracking-tighter tabular-nums group-hover:scale-105 transition-transform origin-left duration-500">{currencyPreview}</div>
                      </div>
                      <div className="text-right">
                         <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Digit Grouping</div>
                         <button 
                            type="button"
                            onClick={() => handleCurrencyChange('useIndianGrouping', !formData.currencyConfig.useIndianGrouping)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${formData.currencyConfig.useIndianGrouping ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10 text-slate-400'}`}
                          >
                            {formData.currencyConfig.useIndianGrouping ? 'Indian Standard' : 'International'}
                          </button>
                      </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Initial Accounting Year Start</label>
                  <input type="date" name="fyStartDate" value={formData.fyStartDate} onChange={handleChange} className={getInputClass('fyStartDate')} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Actual Books Commencement</label>
                  <input type="date" name="booksBeginDate" value={formData.booksBeginDate} onChange={handleChange} className={getInputClass('booksBeginDate')} />
                </div>
                <div className="md:col-span-2 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-4">
                   <div className="text-xl">⚠️</div>
                   <p className="text-[10px] text-amber-800 font-medium leading-relaxed italic">
                      "Modification of historical fiscal parameters after transaction posting can lead to structural ledger variance. Execute with caution under audit supervision."
                   </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SYSTEM' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <header>
                <h4 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter mb-2">System Architecture</h4>
                <p className="text-sm text-slate-400 font-medium">Configure database persistence and automated operational logic.</p>
              </header>

              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Database Shard Context (Data Path)</label>
                    <input name="dataPath" value={formData.dataPath} onChange={handleChange} className={getInputClass('dataPath') + " font-mono text-xs"} />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-2 ml-1">Absolute filesystem URI for organizational relational storage.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                       <div>
                          <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-widest">Auto-Voucher Hashing</h5>
                          <p className="text-[9px] text-slate-400 font-medium italic mt-1">Generate sequential cryptographic IDs</p>
                       </div>
                       <button type="button" className="w-12 h-7 rounded-full bg-indigo-600 relative"><div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow-md"></div></button>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                       <div>
                          <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-widest">Cloud Sync Mirror</h5>
                          <p className="text-[9px] text-slate-400 font-medium italic mt-1">Real-time backup to secondary cluster</p>
                       </div>
                       <button type="button" className="w-12 h-7 rounded-full bg-slate-200 relative"><div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"></div></button>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Action Footer */}
        <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-5 shrink-0">
          <button type="button" onClick={onCancel} className="px-10 py-5 rounded-[1.5rem] text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all transform active:scale-95">Discard Delta</button>
          <button type="submit" className="px-16 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-slate-950">
            Apply Institutional Updates
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCompanyForm;