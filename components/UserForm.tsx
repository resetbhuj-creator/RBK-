import React, { useState, useEffect, useMemo } from 'react';
import { User, UserPermissions, Role } from '../types';

interface UserFormProps {
  initialData?: User;
  availableRoles: Role[];
  onCancel: () => void;
  onSubmit: (data: Omit<User, 'id' | 'lastLogin'>) => void;
}

const PERM_LEVELS = ['none', 'read', 'write', 'all'] as const;

// Enhanced capability mapping for precise administrative context
const PERM_LEVEL_INFO = {
  none: { 
    label: 'RESTRICTED', 
    desc: 'Zero Visibility', 
    color: 'text-slate-400', 
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: '🔒',
    meterWidth: 'w-0',
    longDesc: 'Complete isolation. The module is hidden from the interface and all API interactions are strictly blocked.',
    globalCapabilities: ['No View', 'No Edit', 'No API Access']
  },
  read: { 
    label: 'ANALYST', 
    desc: 'View & Audit', 
    color: 'text-sky-600', 
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: '👁️',
    meterWidth: 'w-1/4',
    longDesc: 'Passive access. Allows browsing records, generating reports, and viewing analytics.',
    globalCapabilities: ['View Records', 'Run Reports', 'Audit Logs']
  },
  write: { 
    label: 'OPERATOR', 
    desc: 'Create & Edit', 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: '✏️',
    meterWidth: 'w-2/3',
    longDesc: 'Standard transactional capability. Can create new records and update existing masters.',
    globalCapabilities: ['Create Data', 'Edit Records', 'Sync Masters']
  },
  all: { 
    label: 'ADMINISTRATOR', 
    desc: 'Total Control', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '⭐',
    meterWidth: 'w-full',
    longDesc: 'Sovereign authority. Full CRUD privileges including record purging and system shifts.',
    globalCapabilities: ['Full CRUD', 'Purge Records', 'Config Access']
  }
};

const MODULE_CONTEXTS = {
  company: {
    label: "Company Domain",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
    coverage: "Governs corporate identity, financial years, localization, and branding.",
    none: "Cannot see company settings.",
    read: "Can view profile and FYs.",
    write: "Can update address and details.",
    all: "Can delete/split financial years."
  },
  administration: {
    label: "Infrastructure",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    coverage: "Controls ledgers, product catalogues, tax structures, and user registry.",
    none: "No access to masters/users.",
    read: "Can audit ledgers and taxes.",
    write: "Can create items and accounts.",
    all: "Full management and user IAM."
  },
  transaction: {
    label: "Transaction Core",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>,
    coverage: "Manages daily financial vouchers, inventory movements, and postings.",
    none: "Cannot enter or see vouchers.",
    read: "Can view Day Book only.",
    write: "Can enter and edit vouchers.",
    all: "Can delete and void transactions."
  },
  display: {
    label: "Display & Analytics",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    coverage: "Provides authority over balance sheets, P&L, and audit reports.",
    none: "No access to reports.",
    read: "Can view standard reports.",
    write: "Can export reports to CSV/PDF.",
    all: "Can access sensitive audit trails."
  }
};

const UserForm: React.FC<UserFormProps> = ({ initialData, availableRoles, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<User, 'id' | 'lastLogin'>>({
    name: '',
    email: '',
    phone: '',
    role: availableRoles[0]?.name || 'Accountant',
    status: 'Active',
    permissions: availableRoles[0]?.permissions || {
      company: 'read',
      administration: 'none',
      transaction: 'read',
      display: 'read'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone || '',
        role: initialData.role,
        status: initialData.status,
        permissions: { ...initialData.permissions }
      });
    }
  }, [initialData]);

  const isSyncWithRole = useMemo(() => {
    const selectedRole = availableRoles.find(r => r.name === formData.role);
    if (!selectedRole) return true;
    return JSON.stringify(selectedRole.permissions) === JSON.stringify(formData.permissions);
  }, [formData.role, formData.permissions, availableRoles]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Staff name is mandatory';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Corporate email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRoleChange = (roleName: string) => {
    const selectedRole = availableRoles.find(r => r.name === roleName);
    setFormData(prev => ({
      ...prev,
      role: roleName,
      permissions: selectedRole ? { ...selectedRole.permissions } : prev.permissions
    }));
  };

  const handlePermChange = (module: keyof UserPermissions, level: UserPermissions[keyof UserPermissions]) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [module]: level }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true });
    if (validate()) onSubmit(formData);
  };

  const PermissionRow = ({ label, module, icon }: { label: string, module: keyof UserPermissions, icon: React.ReactNode }) => {
    const currentVal = formData.permissions[module];
    const activeInfo = PERM_LEVEL_INFO[currentVal];
    const moduleCtx = MODULE_CONTEXTS[module];

    return (
      <div className={`p-8 rounded-[3rem] border-2 transition-all group/row relative bg-white ${activeInfo.border} shadow-sm hover:shadow-md`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/row:bg-slate-900 group-hover/row:text-white transition-all relative group/module-info border border-slate-100 shadow-sm">
              {icon}
              {/* Module Scope Tooltip */}
              <div className="absolute bottom-full left-0 mb-4 w-72 p-5 bg-slate-900 text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover/module-info:opacity-100 group-hover/module-info:visible transition-all z-50 pointer-events-none text-[11px] font-medium leading-relaxed normal-case">
                <div className="flex items-center space-x-2 mb-3">
                   <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                   <span className="font-black text-indigo-400 uppercase tracking-widest text-[9px]">Module Scope Index</span>
                </div>
                {moduleCtx.coverage}
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                   {PERM_LEVELS.map(lv => (
                     <div key={lv} className="flex justify-between items-center opacity-70">
                        <span className="text-[8px] font-black uppercase text-indigo-300">{lv}</span>
                        <span className="text-[10px] text-slate-400">{(moduleCtx as any)[lv]}</span>
                     </div>
                   ))}
                </div>
                <div className="absolute top-full left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-900"></div>
              </div>
            </div>
            <div>
              <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800">{label}</h4>
              <div className="flex items-center space-x-3 mt-1.5">
                 <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${activeInfo.bg} ${activeInfo.color} ${activeInfo.border}`}>
                   {activeInfo.label}
                 </span>
                 <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${activeInfo.bg.replace('bg-', 'bg-')} ${activeInfo.meterWidth} transition-all duration-500`}></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-[1.8rem] border border-slate-200 shadow-inner">
          {PERM_LEVELS.map(level => {
            const info = PERM_LEVEL_INFO[level];
            const isActive = currentVal === level;
            const contextText = (moduleCtx as any)[level];
            
            return (
              <button
                key={level}
                type="button"
                onClick={() => handlePermChange(module, level)}
                className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all relative group/btn ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-xl border border-slate-100 transform -translate-y-0.5' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {level}
                
                {/* Level Detail Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 w-64 p-5 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all z-50 pointer-events-none">
                  <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center space-x-2">
                        <span className="text-sm">{info.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">{info.label}</span>
                     </div>
                  </div>
                  <div className="text-[11px] font-black text-white italic mb-3 leading-tight">
                    " {contextText} "
                  </div>
                  <p className="text-[10px] font-medium leading-relaxed normal-case text-slate-400 mb-4 border-b border-white/10 pb-4">
                    {info.longDesc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                     {info.globalCapabilities.map(cap => (
                        <span key={cap} className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-tighter text-indigo-200/80 border border-white/5">
                          {cap}
                        </span>
                     ))}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-slate-900"></div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Functional definition block */}
        <div className={`mt-5 px-6 py-5 rounded-[1.5rem] border flex items-start space-x-5 transition-all duration-500 ${activeInfo.bg} ${activeInfo.border}`}>
           <div className="text-2xl shrink-0 mt-1 drop-shadow-sm">{activeInfo.icon}</div>
           <div>
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeInfo.color}`}>Functional Authority</div>
              <p className="text-[12px] font-black text-slate-800 italic mt-1 leading-snug">
                This account <span className="underline decoration-indigo-200">{ (moduleCtx as any)[currentVal].toLowerCase() }</span>
              </p>
              <p className="text-[10px] font-medium text-slate-500 normal-case mt-1.5 opacity-80">{activeInfo.longDesc}</p>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 max-w-7xl mx-auto">
      <div className="px-12 py-12 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transform -rotate-3 transition-transform hover:rotate-0 border-4 border-indigo-400/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Identity Provisioning</h3>
            <p className="text-xs text-indigo-300 font-bold uppercase tracking-[0.4em] mt-3">Staff Governance & Security Engineering</p>
          </div>
        </div>
        <button onClick={onCancel} className="relative z-10 p-4 bg-white/5 hover:bg-rose-500 rounded-full text-slate-400 hover:text-white transition-all border border-white/10 shadow-xl group">
          <svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[200px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-16 max-h-[85vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Identity & Matrix Main Column */}
          <div className="lg:col-span-3 space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="space-y-1 relative z-10">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Staff Identity (Legal)</label>
                <input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Alexander Vance" 
                  className={`w-full px-7 py-5 rounded-[1.8rem] border outline-none transition-all text-sm font-black italic ${touched.name && errors.name ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-8 focus:ring-indigo-500/5 bg-white shadow-inner'}`}
                />
              </div>
              <div className="space-y-1 relative z-10">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Corporate Gateway (Email)</label>
                <input 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="vance.a@nexus-corp.net" 
                  className={`w-full px-7 py-5 rounded-[1.8rem] border outline-none transition-all text-sm font-bold ${touched.email && errors.email ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-8 focus:ring-indigo-500/5 bg-white shadow-inner'}`}
                />
              </div>
              <div className="space-y-1 relative z-10">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Security Blueprint (Role)</label>
                <select 
                  value={formData.role} 
                  onChange={e => handleRoleChange(e.target.value)}
                  className="w-full px-7 py-5 rounded-[1.8rem] border border-slate-200 bg-white text-sm font-black text-indigo-600 outline-none shadow-inner cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 relative z-10">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Lifecycle State</label>
                 <div className="flex bg-slate-100 p-1.5 rounded-[1.8rem] border border-slate-200 shadow-inner">
                    {(['Active', 'Suspended'] as const).map(s => (
                      <button 
                        key={s}
                        type="button"
                        onClick={() => setFormData({...formData, status: s})}
                        className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${formData.status === s ? 'bg-white text-slate-900 shadow-lg border border-slate-100' : 'text-slate-400'}`}
                      >
                        {s}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[120px] opacity-5 -mr-24 -mt-24 pointer-events-none"></div>
            </div>

            {/* Matrix Block */}
            <div className="space-y-10">
               <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-slate-200 pb-10 px-6">
                  <div className="flex items-center space-x-5">
                    <div className="w-12 h-12 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl rotate-3">
                       <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <div>
                       <h4 className="text-2xl font-black uppercase tracking-tight italic text-slate-800">Authority Matrix</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Modular Permission Allocation</p>
                    </div>
                  </div>
                  
                  {/* Inline Legend Helper */}
                  <div className="flex items-center space-x-8 bg-white p-3 rounded-[2rem] border border-slate-200 shadow-sm px-8">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Key:</span>
                    {PERM_LEVELS.map(level => {
                       const info = PERM_LEVEL_INFO[level];
                       return (
                         <div key={level} className="flex items-center space-x-2 group/key cursor-help relative">
                            <div className={`w-3 h-3 rounded-full border shadow-sm transition-transform group-hover/key:scale-150 ${info.bg} ${info.border}`}></div>
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${info.color}`}>{level}</span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover/key:opacity-100 group-hover/key:visible transition-all z-50 text-[10px] normal-case font-medium">
                               {info.desc}
                               <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
                            </div>
                         </div>
                       );
                    })}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <PermissionRow label="Corporate Domain" module="company" icon={MODULE_CONTEXTS.company.icon} />
                 <PermissionRow label="Institutional Infrastructure" module="administration" icon={MODULE_CONTEXTS.administration.icon} />
                 <PermissionRow label="Transactional Core" module="transaction" icon={MODULE_CONTEXTS.transaction.icon} />
                 <PermissionRow label="Analytics & Display" module="display" icon={MODULE_CONTEXTS.display.icon} />
               </div>
            </div>
          </div>

          {/* Persistent Authority Key Sidebar */}
          <div className="space-y-10">
            <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group/guide sticky top-4">
               <div className="flex items-center space-x-4 mb-10 border-b border-slate-50 pb-8">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner group-hover/guide:scale-110 transition-transform">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black uppercase text-indigo-600 tracking-[0.2em]">Authority Key</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Policy Definitions</p>
                  </div>
               </div>
               
               <div className="space-y-10">
                  {PERM_LEVELS.map(level => {
                    const info = PERM_LEVEL_INFO[level];
                    return (
                      <div key={level} className="flex items-start space-x-5 group/item">
                         <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-3xl shrink-0 shadow-sm border transition-all group-hover/item:scale-110 group-hover/item:-rotate-6 ${info.bg} ${info.border}`}>
                            {info.icon}
                         </div>
                         <div>
                            <div className={`text-[12px] font-black uppercase tracking-widest ${info.color}`}>{info.label}</div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5">{info.desc}</p>
                            <div className="flex flex-wrap gap-1.5 mt-4">
                               {info.globalCapabilities.map(c => <span key={c} className="text-[8px] font-bold bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-tighter text-slate-400 border border-slate-200/50">{c}</span>)}
                            </div>
                         </div>
                      </div>
                    );
                  })}
               </div>

               <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                  <p className="text-[11px] text-indigo-300 font-black leading-relaxed italic relative z-10">
                    "Authorization settings directly impact statutory audit trails. Use standard role inheritance whenever possible."
                  </p>
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-[80px] opacity-20"></div>
               </div>
            </div>

            <div className={`p-10 rounded-[3.5rem] border-2 transition-all duration-700 ${isSyncWithRole ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-400 shadow-2xl'}`}>
               <div className="flex items-start space-x-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${isSyncWithRole ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white animate-pulse'}`}>
                     {isSyncWithRole ? <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                  </div>
                  <div>
                    <h5 className="text-[13px] font-black uppercase tracking-widest text-slate-800">Policy Sync Check</h5>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed mt-2 italic">
                      {isSyncWithRole 
                        ? `Account is fully synchronized with the ${formData.role} security profile.` 
                        : `Manual overrides detected. This account has departed from organizational baseline ${formData.role}.`
                      }
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="pt-16 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-6 sm:space-y-0 sm:space-x-8">
          <button type="button" onClick={onCancel} className="px-14 py-6 rounded-[2.2rem] text-slate-500 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white transition-all transform active:scale-95">Discard Changes</button>
          <button type="submit" className="px-20 py-6 bg-slate-900 text-white rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-slate-950">
            {initialData ? 'Update Identity Context' : 'Authorize Identity Node'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;