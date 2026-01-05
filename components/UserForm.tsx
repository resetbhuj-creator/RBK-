import React, { useState, useEffect, useMemo } from 'react';
import { User, UserPermissions, Role } from '../types';

interface UserFormProps {
  initialData?: User;
  availableRoles: Role[];
  onCancel: () => void;
  onSubmit: (data: Omit<User, 'id' | 'lastLogin'>) => void;
}

const PERM_LEVELS = ['none', 'read', 'write', 'all'] as const;

const PERM_LEVEL_INFO = {
  none: { 
    label: 'RESTRICTED', 
    desc: 'Module hidden/locked', 
    color: 'text-slate-400', 
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: '🔒',
    summary: 'Total Isolation'
  },
  read: { 
    label: 'VIEW ONLY', 
    desc: 'Audit & Reporting', 
    color: 'text-sky-600', 
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: '👁️',
    summary: 'Read Access'
  },
  write: { 
    label: 'OPERATOR', 
    desc: 'Create & Update', 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: '✏️',
    summary: 'Data Input'
  },
  all: { 
    label: 'ADMINISTRATOR', 
    desc: 'Full Sovereignty', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '⭐',
    summary: 'Master Node'
  }
};

const MODULE_CONTEXTS = {
  company: {
    label: "Corporate Domain",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
    none: "Zero access to profile or FY settings.",
    read: "Can audit company profile and periods.",
    write: "Can update corporate address and details.",
    all: "Can delete entities and split financial years."
  },
  administration: {
    label: "Admin Module",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    none: "No access to masters, users or backups.",
    read: "Can browse ledgers and tax structures.",
    write: "Can create new masters and items.",
    all: "Full authority over IAM and system vaults."
  },
  transaction: {
    label: "Transaction Module",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>,
    none: "Transactional dashboard is hidden.",
    read: "Can view Day Book and history.",
    write: "Can post and update current vouchers.",
    all: "Can void postings and edit history."
  },
  display: {
    label: "Display Module",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    none: "Reporting and analytics inaccessible.",
    read: "Can generate and view standard reports.",
    write: "Can export sensitive audit statements.",
    all: "Can access raw audit trails and logs."
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

  const currentGlobalLevel = useMemo(() => {
    const { company, administration, transaction, display } = formData.permissions;
    if (company === administration && administration === transaction && transaction === display) {
      return company;
    }
    return null;
  }, [formData.permissions]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
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

  const handleGlobalApply = (level: UserPermissions[keyof UserPermissions]) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        company: level,
        administration: level,
        transaction: level,
        display: level
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true });
    if (validate()) onSubmit(formData);
  };

  const PermissionRow = ({ label, module, icon }: { label: string, module: keyof UserPermissions, icon: React.ReactNode }) => {
    const currentVal = formData.permissions[module];
    const activeInfo = (PERM_LEVEL_INFO as any)[currentVal];
    const moduleCtx = (MODULE_CONTEXTS as any)[module];

    return (
      <div className={`p-6 rounded-3xl border-2 transition-all relative bg-white ${activeInfo.border} shadow-sm group hover:shadow-md`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all">
              {icon}
            </div>
            <div>
              <h4 className="text-[12px] font-black uppercase text-slate-800 tracking-tight italic">{label}</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic">Authority Node</p>
            </div>
          </div>
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${activeInfo.bg} ${activeInfo.color} ${activeInfo.border}`}>
            {activeInfo.label}
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {PERM_LEVELS.map(level => {
            const isActive = currentVal === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => handlePermChange(module, level)}
                className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all relative group/btn ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-md border border-slate-100' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {level}
                
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-slate-900 text-white rounded-xl shadow-2xl opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all z-50 pointer-events-none border border-white/10 normal-case font-medium text-[10px]">
                  <div className="font-black uppercase tracking-widest text-indigo-400 text-[8px] mb-1">Impact:</div>
                  {(moduleCtx as any)[level]}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 max-w-6xl mx-auto">
      <div className="px-10 py-10 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl transform -rotate-3 transition-transform hover:rotate-0 border border-indigo-500/40">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Account Configuration</h3>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.4em] mt-3">Sovereign Identity & Modular Permissions</p>
          </div>
        </div>
        <button onClick={onCancel} className="relative z-10 p-3 bg-white/5 hover:bg-rose-500 rounded-full text-slate-400 hover:text-white transition-all border border-white/10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-32 -mt-32"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-12 max-h-[80vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
        {/* Core Identity Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-4">
             <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
             <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">I. Staff Identity</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Full Legal Name</label>
              <input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Vance Alexander" 
                className={`w-full px-6 py-4 rounded-2xl border outline-none transition-all text-sm font-bold ${touched.name && errors.name ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10'}`}
              />
              {touched.name && errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-2">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Corporate Email</label>
              <input 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="vance@corp.net" 
                className={`w-full px-6 py-4 rounded-2xl border outline-none transition-all text-sm font-bold ${touched.email && errors.email ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10'}`}
              />
              {touched.email && errors.email && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-2">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Assigned Primary Role</label>
              <select 
                value={formData.role} 
                onChange={e => handleRoleChange(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black text-indigo-600 outline-none shadow-sm cursor-pointer"
              >
                {availableRoles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Node Lifecycle State</label>
               <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                  {(['Active', 'Suspended'] as const).map(s => (
                    <button 
                      key={s}
                      type="button"
                      onClick={() => setFormData({...formData, status: s})}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.status === s ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}
                    >
                      {s}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* Permissions Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">II. Authority Delegation</h4>
            </div>
            {!isSyncWithRole && (
              <div className="flex items-center space-x-3 animate-in fade-in duration-500">
                <button 
                  type="button"
                  onClick={() => handleRoleChange(formData.role)}
                  className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center space-x-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  <span>Reset to {formData.role} Baseline</span>
                </button>
                <div className="flex items-center space-x-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span className="text-[9px] font-black uppercase tracking-tighter italic">Override Active</span>
                </div>
              </div>
            )}
          </div>

          {/* Global Preset Bar - The Tier Orchestrator */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-t-8 border-indigo-600 mb-12">
            <div className="relative z-10 space-y-8">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-indigo-900/40">🎯</div>
                <div>
                  <h4 className="text-xl font-black uppercase tracking-tight italic text-white">Global Authority Preset</h4>
                  <p className="text-[11px] text-indigo-300 font-medium italic leading-relaxed max-w-lg mt-1">Instantly synchronize all four core modules to a standardized access tier. This acts as a master switch for user capabilities.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PERM_LEVELS.map((level) => {
                  const isActive = currentGlobalLevel === level;
                  const info = (PERM_LEVEL_INFO as any)[level];
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleGlobalApply(level)}
                      className={`p-6 rounded-[1.8rem] border-2 transition-all flex flex-col items-center text-center group/card ${
                        isActive 
                          ? 'bg-indigo-600 border-indigo-400 shadow-[0_20px_40px_rgba(79,70,229,0.3)] scale-105 z-10' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/50'
                      }`}
                    >
                      <span className={`text-3xl mb-3 transition-transform group-hover/card:scale-110 ${isActive ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}`}>
                        {info.icon}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-indigo-400'}`}>
                        {info.label}
                      </span>
                      <p className={`text-[9px] font-bold uppercase mt-1.5 ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {info.summary}
                      </p>
                      
                      {isActive && (
                         <div className="mt-4 w-12 h-1 bg-white rounded-full animate-pulse shadow-[0_0_8px_#fff]"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[150px] opacity-20 -mr-40 -mt-40 pointer-events-none"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PermissionRow label="Corporate Domain" module="company" icon={MODULE_CONTEXTS.company.icon} />
            <PermissionRow label="Admin & Masters" module="administration" icon={MODULE_CONTEXTS.administration.icon} />
            <PermissionRow label="Financial Operations" module="transaction" icon={MODULE_CONTEXTS.transaction.icon} />
            <PermissionRow label="Analytics & Display" module="display" icon={MODULE_CONTEXTS.display.icon} />
          </div>
        </section>

        <div className="pt-10 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-6">
          <button type="button" onClick={onCancel} className="px-10 py-5 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white transition-all transform active:scale-95">Discard</button>
          <button type="submit" className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-slate-950">
            {initialData ? 'Update Profile' : 'Authorize Staff Node'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;