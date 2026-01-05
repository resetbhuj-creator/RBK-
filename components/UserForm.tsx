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
    summary: 'Total Isolation',
    weight: 0
  },
  read: { 
    label: 'ANALYST', 
    desc: 'View only access', 
    color: 'text-sky-600', 
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: '👁️',
    summary: 'Read Access',
    weight: 1
  },
  write: { 
    label: 'OPERATOR', 
    desc: 'Edit & Create', 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: '✏️',
    summary: 'Data Input',
    weight: 2
  },
  all: { 
    label: 'SOVEREIGN', 
    desc: 'Full Authority', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '⭐',
    summary: 'Master Node',
    weight: 3
  }
};

const MODULE_CONTEXTS = {
  company: {
    label: "Corporate Domain",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
    none: "Zero access to profile or FY settings.",
    read: "Can audit company profile and periods.",
    write: "Can update corporate address and details.",
    all: "Full authority including entity deletion."
  },
  administration: {
    label: "Infrastructure",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    none: "No access to masters, users or backups.",
    read: "Can browse ledgers and tax structures.",
    write: "Can create new masters and items.",
    all: "System-wide authority over IAM and vaults."
  },
  transaction: {
    label: "Operations",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>,
    none: "Operational dashboard is hidden.",
    read: "Can view Day Book and transaction history.",
    write: "Can post and update current vouchers.",
    all: "Can void postings and modify history."
  },
  display: {
    label: "Intelligence",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    none: "Reporting and analytics inaccessible.",
    read: "Can generate and view standard reports.",
    write: "Can export sensitive audit statements.",
    all: "Full access to all analytical data streams."
  }
};

const UserForm: React.FC<UserFormProps> = ({ initialData, availableRoles, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<User, 'id' | 'lastLogin'>>({
    name: '',
    email: '',
    phone: '',
    role: availableRoles[0]?.name || 'Staff',
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

  const sovereigntyMetrics = useMemo(() => {
    const p = formData.permissions;
    const score = PERM_LEVEL_INFO[p.company].weight + 
                  PERM_LEVEL_INFO[p.administration].weight + 
                  PERM_LEVEL_INFO[p.transaction].weight + 
                  PERM_LEVEL_INFO[p.display].weight;
    const max = 12; // 3 points * 4 modules
    const percentage = (score / max) * 100;
    
    let label = 'Minor Staff';
    if (percentage > 90) label = 'System Sovereign';
    else if (percentage > 60) label = 'Senior Operator';
    else if (percentage > 30) label = 'Standard Analyst';

    return { score, percentage, label };
  }, [formData.permissions]);

  const currentGlobalLevel = useMemo(() => {
    const { company, administration, transaction, display } = formData.permissions;
    if (company === administration && administration === transaction && transaction === display) {
      return company;
    }
    return null;
  }, [formData.permissions]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full identity designation required';
    if (!formData.email.trim()) newErrors.email = 'Corporate communication node required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid node address format';
    
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
      <div className={`p-6 rounded-[2.5rem] border-2 transition-all relative bg-white ${activeInfo.border} shadow-sm group hover:shadow-xl`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
              {icon}
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-tight italic">{label}</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Authority Tier</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${activeInfo.bg} ${activeInfo.color} ${activeInfo.border}`}>
                {activeInfo.label}
            </span>
            <span className="text-[7px] font-bold text-slate-300 uppercase mt-1 italic">Impact: {(moduleCtx as any)[currentVal]}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          {PERM_LEVELS.map(level => {
            const isActive = currentVal === level;
            const info = PERM_LEVEL_INFO[level];
            return (
              <button
                key={level}
                type="button"
                onClick={() => handlePermChange(module, level)}
                className={`flex-1 py-3 text-[9px] font-black uppercase tracking-tighter rounded-xl transition-all relative group/btn ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-lg border border-slate-100 scale-105 z-10' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {level}
                
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-52 p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all z-50 pointer-events-none border border-white/10 normal-case font-medium text-[10px] leading-relaxed">
                  <div className="flex items-center space-x-2 mb-2 border-b border-white/10 pb-2">
                     <span className="text-xl">{info.icon}</span>
                     <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{info.label} TIER</span>
                  </div>
                  {(moduleCtx as any)[level]}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-900"></div>
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
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl transform -rotate-3 transition-transform hover:rotate-0 border-4 border-indigo-400/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Identity Workspace</h3>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.4em] mt-3">Personnel Profile & Authorization Logic</p>
          </div>
        </div>
        <button onClick={onCancel} className="relative z-10 p-3 bg-white/5 hover:bg-rose-500 rounded-full text-slate-400 hover:text-white transition-all border border-white/10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-32 -mt-32"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-12 bg-slate-50/30 overflow-y-auto max-h-[75vh] custom-scrollbar">
        
        {/* Identity Matrix */}
        <section className="space-y-6">
          <div className="flex items-center space-x-4">
             <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
             <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">I. Staff Parameters</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Legal Identity Name</label>
              <input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Vance Alexander" 
                className={`w-full px-6 py-4 rounded-2xl border outline-none transition-all text-sm font-bold ${touched.name && errors.name ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10'}`}
              />
              {touched.name && errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-2">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Corporate Node Address (Email)</label>
              <input 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="vance@nexus-core.net" 
                className={`w-full px-6 py-4 rounded-2xl border outline-none transition-all text-sm font-bold ${touched.email && errors.email ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10'}`}
              />
              {touched.email && errors.email && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-2">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Structural Role Assignment</label>
              <select 
                value={formData.role} 
                onChange={e => handleRoleChange(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black text-indigo-600 outline-none shadow-sm cursor-pointer hover:border-indigo-400 transition-colors"
              >
                {availableRoles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Availability State</label>
               <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                  {(['Active', 'Suspended'] as const).map(s => (
                    <button 
                      key={s}
                      type="button"
                      onClick={() => setFormData({...formData, status: s})}
                      className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.status === s ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {s}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* Authorization Logic */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">II. Authorization Matrix</h4>
            </div>
          </div>

          {/* Sovereignty Dashboard - Global Defaults */}
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-t-8 border-indigo-600">
            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
               <div className="space-y-6 flex-1">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-white/10 backdrop-blur-md">🎯</div>
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tight italic text-white leading-none">Sovereignty Orchestrator</h4>
                      <p className="text-[11px] text-indigo-300 font-medium italic mt-2 leading-relaxed max-w-sm">Synchronize all core modules to a standardized access tier baseline.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white/5 p-1.5 rounded-[1.8rem] border border-white/10 shadow-inner backdrop-blur-xl">
                    {PERM_LEVELS.map((level) => {
                      const isActive = currentGlobalLevel === level;
                      const info = (PERM_LEVEL_INFO as any)[level];
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleGlobalApply(level)}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center group/card ${
                            isActive 
                              ? 'bg-indigo-600 border-indigo-400 shadow-xl scale-[1.03]' 
                              : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
                          }`}
                        >
                          <span className="text-2xl mb-2">{info.icon}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-indigo-400'}`}>
                            {info.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
               </div>

               {/* Sovereignty Score Progress */}
               <div className="xl:w-72 space-y-6 shrink-0 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                  <div className="flex justify-between items-end">
                     <div>
                        <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Authorization Index</div>
                        <div className="text-3xl font-black text-white italic tracking-tighter tabular-nums">{sovereigntyMetrics.score} / 12</div>
                     </div>
                     <span className="text-[9px] font-black text-emerald-400 uppercase italic tracking-widest">{sovereigntyMetrics.label}</span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                     <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000 shadow-[0_0_15px_#10b981]" 
                        style={{ width: `${sovereigntyMetrics.percentage}%` }}
                      ></div>
                  </div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] text-center">Score reflects net nodal authority.</p>
               </div>
            </div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-40 -mt-40 pointer-events-none"></div>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PermissionRow label="Corporate Domain" module="company" icon={MODULE_CONTEXTS.company.icon} />
            <PermissionRow label="Infrastructure Master" module="administration" icon={MODULE_CONTEXTS.administration.icon} />
            <PermissionRow label="Transactional Operations" module="transaction" icon={MODULE_CONTEXTS.transaction.icon} />
            <PermissionRow label="Display Intelligence" module="display" icon={MODULE_CONTEXTS.display.icon} />
          </div>
        </section>

        <div className="pt-10 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-6">
          <button type="button" onClick={onCancel} className="px-10 py-5 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white transition-all transform active:scale-95">Discard</button>
          <button type="submit" className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-slate-950">
            {initialData ? 'Update Account Node' : 'Authorize Identity Node'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;