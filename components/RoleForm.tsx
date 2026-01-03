import React, { useState, useEffect, useMemo } from 'react';
import { Role, UserPermissions } from '../types';

interface RoleFormProps {
  initialData?: Role;
  onCancel: () => void;
  onSubmit: (data: Omit<Role, 'id'>) => void;
}

const PERM_LEVELS = ['none', 'read', 'write', 'all'] as const;

// Standardized permission info for visual feedback
const PERM_LEVEL_INFO = {
  none: { 
    label: 'RESTRICTED', 
    desc: 'Zero Visibility', 
    color: 'text-slate-400', 
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: '🔒',
    meterWidth: 'w-0',
    risk: 'Low',
    longDesc: 'Complete isolation. The module is hidden from the interface and all API interactions are strictly blocked.',
    capabilities: ['No View', 'No Edit', 'No API Access']
  },
  read: { 
    label: 'ANALYST', 
    desc: 'Audit & Review', 
    color: 'text-sky-600', 
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: '👁️',
    meterWidth: 'w-1/4',
    risk: 'Low',
    longDesc: 'Passive access. Allows browsing records, generating reports, and viewing analytics without modification rights.',
    capabilities: ['View Records', 'Run Reports', 'Audit Logs']
  },
  write: { 
    label: 'OPERATOR', 
    desc: 'Create & Update', 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: '✏️',
    meterWidth: 'w-2/3',
    risk: 'Medium',
    longDesc: 'Standard transactional capability. Can create new records and update existing master data.',
    capabilities: ['Create Data', 'Edit Records', 'Sync Masters']
  },
  all: { 
    label: 'SOVEREIGN', 
    desc: 'Full Authority', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '⭐',
    meterWidth: 'w-full',
    risk: 'High',
    longDesc: 'Total control. Full CRUD privileges including record purging, system shifts, and sensitive configurations.',
    capabilities: ['Full CRUD', 'Purge Records', 'Config Access']
  }
};

const MODULE_CONTEXTS = {
  company: {
    label: "Corporate Domain",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
    coverage: "Governs corporate identity, financial years, localization, and branding.",
    none: "Users cannot access company profile or period settings.",
    read: "Users can view company profile and financial year history.",
    write: "Users can update corporate address, logo, and contact data.",
    all: "Users can delete entities and split financial year cycles."
  },
  administration: {
    label: "Institutional Infrastructure",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    coverage: "Controls ledgers, product catalogues, tax structures, and user registry.",
    none: "No access to masters, users, or system backups.",
    read: "Users can audit existing account ledgers and tax slabs.",
    write: "Users can create new items, ledgers, and tax groups.",
    all: "Full authority over IAM policies and system vaults."
  },
  transaction: {
    label: "Transactional Core",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>,
    coverage: "Manages daily financial vouchers, inventory movements, and postings.",
    none: "Transactional dashboard and voucher entry are hidden.",
    read: "Users can view the Day Book and transaction history only.",
    write: "Users can enter and post all voucher types in open periods.",
    all: "Users can void postings and modify historical vouchers."
  },
  display: {
    label: "Intelligence & Display",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    coverage: "Provides authority over balance sheets, P&L, and statutory audit reports.",
    none: "The reporting and analytics module is inaccessible.",
    read: "Users can generate and view standard financial statements.",
    write: "Users can export sensitive audit data to external formats.",
    all: "Users can access unmasked audit trails and raw logs."
  }
};

const RoleForm: React.FC<RoleFormProps> = ({ initialData, onCancel, onSubmit }) => {
  const [roleData, setRoleData] = useState<Omit<Role, 'id' | 'isSystem'>>({
    name: '',
    description: '',
    permissions: {
      company: 'read',
      administration: 'none',
      transaction: 'read',
      display: 'read'
    }
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setRoleData({
        name: initialData.name,
        description: initialData.description || '',
        permissions: { ...initialData.permissions }
      });
    }
  }, [initialData]);

  const globalLevel = useMemo(() => {
    const vals = Object.values(roleData.permissions);
    return vals.every(v => v === vals[0]) ? vals[0] : 'custom';
  }, [roleData.permissions]);

  const handlePermChange = (module: keyof UserPermissions, level: UserPermissions[keyof UserPermissions]) => {
    setRoleData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [module]: level }
    }));
  };

  const handleGlobalApply = (level: UserPermissions[keyof UserPermissions]) => {
    setRoleData(prev => ({
      ...prev,
      permissions: {
        company: level,
        administration: level,
        transaction: level,
        display: level
      }
    }));
  };

  const applyPreset = (preset: 'auditor' | 'clerk' | 'admin') => {
    const map: Record<string, UserPermissions> = {
      admin: { company: 'all', administration: 'all', transaction: 'all', display: 'all' },
      clerk: { company: 'read', administration: 'none', transaction: 'write', display: 'all' },
      auditor: { company: 'read', administration: 'none', transaction: 'none', display: 'all' }
    };
    setRoleData(prev => ({ ...prev, permissions: map[preset] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleData.name.trim()) {
      setError("Role Designation is required.");
      return;
    }
    onSubmit(roleData as Role);
  };

  const PermissionRow = ({ label, module, icon }: { label: string, module: keyof UserPermissions, icon: React.ReactNode }) => {
    const currentVal = roleData.permissions[module];
    const info = (PERM_LEVEL_INFO as any)[currentVal];
    const moduleCtx = (MODULE_CONTEXTS as any)[module];

    return (
      <div className={`p-8 rounded-[3.5rem] border-2 transition-all group/row relative bg-white ${info.border} shadow-sm hover:shadow-xl`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/row:bg-slate-900 group-hover/row:text-white transition-all shadow-sm">
              {icon}
            </div>
            <div>
              <h4 className="text-[14px] font-black uppercase tracking-[0.1em] text-slate-800 italic">{label}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">Modular Scope Node</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex flex-col items-end">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm ${info.bg} ${info.color} ${info.border}`}>
                  Authority: {info.label}
                </span>
                <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-tighter italic">Risk Index: {info.risk}</span>
             </div>
             <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className={`h-full ${info.color.replace('text', 'bg')} ${info.meterWidth} transition-all duration-700 shadow-[0_0_8px_currentColor]`}></div>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-[1.8rem] border border-slate-200 shadow-inner">
          {PERM_LEVELS.map(level => {
            const levelInfo = (PERM_LEVEL_INFO as any)[level];
            const isActive = currentVal === level;
            const contextText = moduleCtx[level];
            
            return (
              <button
                key={level}
                type="button"
                onClick={() => handlePermChange(module, level)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all relative group/btn ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-xl border border-slate-100 transform -translate-y-0.5' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {level}
                
                {/* Visual Level Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 w-72 p-6 bg-slate-900 text-white rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all z-50 pointer-events-none border border-white/10">
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                     <div className="flex items-center space-x-3">
                        <span className="text-xl">{levelInfo.icon}</span>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block leading-none">{levelInfo.label} TIER</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">Policy Definition</span>
                        </div>
                     </div>
                     <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${levelInfo.risk === 'High' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'}`}>RISK: {levelInfo.risk}</span>
                  </div>
                  
                  <div className="text-[12px] font-black text-white italic mb-4 leading-relaxed">
                    " {contextText} "
                  </div>
                  
                  <p className="text-[10px] font-medium leading-relaxed normal-case text-slate-400 mb-5">
                    {levelInfo.longDesc}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                     {levelInfo.capabilities.map((cap: string) => (
                        <span key={cap} className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-tighter text-indigo-200/80 border border-white/5">
                          {cap}
                        </span>
                     ))}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-slate-900"></div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Static Capability Indicator */}
        <div className={`mt-5 px-6 py-5 rounded-[1.5rem] border-2 flex items-start space-x-5 transition-all duration-500 ${info.bg} ${info.border} shadow-sm`}>
           <div className="text-3xl shrink-0 mt-0.5 drop-shadow-sm">{info.icon}</div>
           <div>
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${info.color}`}>Functional Policy Mapping</div>
              <p className="text-[13px] font-black text-slate-800 italic mt-1 leading-snug">
                This role <span className="underline decoration-indigo-200 underline-offset-4">{ moduleCtx[currentVal].toLowerCase() }</span>
              </p>
              <div className="flex items-center space-x-3 mt-2">
                 <div className="flex space-x-1">
                    {[1,2,3,4].map(b => (
                      <div key={b} className={`w-3 h-1 rounded-full ${b <= PERM_LEVELS.indexOf(currentVal) + 1 ? info.color.replace('text', 'bg') : 'bg-slate-200'}`}></div>
                    ))}
                 </div>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sovereignty Score: {PERM_LEVELS.indexOf(currentVal) + 1}/4</p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 max-w-7xl mx-auto">
      <div className="px-12 py-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-900/50 transform -rotate-3 hover:rotate-0 transition-transform">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight uppercase italic">Access Blueprint Configuration</h3>
            <p className="text-sm text-indigo-300 font-medium tracking-tight mt-1">Define functional authority baselines for organizational roles.</p>
          </div>
        </div>
        <button onClick={onCancel} className="relative z-10 p-3 hover:bg-white/10 rounded-full text-slate-400 transition-colors border border-white/10">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-20 -mr-40 -mt-40"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-12 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] ml-1">Business Designation (Role Name)</label>
                <input 
                  value={roleData.name} 
                  onChange={e => { setRoleData({...roleData, name: e.target.value}); setError(null); }}
                  placeholder="e.g. Senior Regional Auditor" 
                  className={`w-full px-7 py-5 rounded-[1.5rem] border outline-none transition-all text-sm font-black shadow-sm ${error ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white'}`}
                />
                {error && <p className="text-[11px] text-rose-500 font-black mt-2 ml-1 animate-pulse">{error}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] ml-1">Functional Description</label>
                <textarea 
                  value={roleData.description} 
                  onChange={e => setRoleData({...roleData, description: e.target.value})}
                  placeholder="Summarize the core responsibilities associated with this security profile..." 
                  className="w-full px-7 py-5 rounded-[1.5rem] border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 bg-white text-sm font-medium shadow-sm h-32 resize-none"
                />
              </div>
            </div>

            {/* Global Authority Policy Presets */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-4 border-slate-800">
               <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10">
                    <div className="flex items-center space-x-6">
                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-indigo-900/40 transform rotate-3">🎯</div>
                      <div>
                        <h4 className="text-[12px] font-black uppercase tracking-widest text-indigo-400 mb-2">Global Authority Policy</h4>
                        <p className="text-[11px] text-slate-400 font-medium max-w-sm leading-relaxed italic">Instantly synchronize all modules to a standardized access tier.</p>
                      </div>
                    </div>
                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                      {PERM_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleGlobalApply(level)}
                          className={`px-5 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all ${globalLevel === level ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-indigo-200 hover:bg-white/5'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-20 -mr-40 -mt-40 pointer-events-none"></div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 border-b border-slate-50 pb-4 flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Inheritance Presets
              </h4>
              <div className="space-y-4">
                {[
                  { id: 'admin', label: 'Admin Tier', icon: '⚡', desc: 'Full platform sovereignty' },
                  { id: 'clerk', label: 'Operations', icon: '📝', desc: 'Read/Write business data' },
                  { id: 'auditor', label: 'Audit Only', icon: '🔍', desc: 'Read-only visibility' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id as any)}
                    className="w-full flex items-center space-x-5 p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all text-left group"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">{p.icon}</div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-800">{p.label}</div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-tight uppercase mt-0.5">{p.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Legend for Permissions */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group/guide">
               <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 border-b border-slate-50 pb-4">Authority Hierarchy</h4>
               <div className="space-y-6">
                  {PERM_LEVELS.map(level => {
                    const info = (PERM_LEVEL_INFO as any)[level];
                    return (
                      <div key={level} className="flex items-start space-x-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm border ${info.bg} ${info.border}`}>
                            {info.icon}
                         </div>
                         <div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${info.color}`}>{info.label}</div>
                            <p className="text-[9px] text-slate-500 font-medium leading-relaxed mt-0.5">{info.desc}</p>
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 pt-8 border-t border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Modular Access Blueprints</h4>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Hover on levels for specific module impact</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PermissionRow label="Corporate Domain" module="company" icon={MODULE_CONTEXTS.company.icon} />
            <PermissionRow label="Infrastructure" module="administration" icon={MODULE_CONTEXTS.administration.icon} />
            <PermissionRow label="Transactional Core" module="transaction" icon={MODULE_CONTEXTS.transaction.icon} />
            <PermissionRow label="Analytics & Display" module="display" icon={MODULE_CONTEXTS.display.icon} />
          </div>
        </div>

        <div className="pt-12 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-5 bg-white sticky bottom-0 -mx-12 px-12 pb-8">
          <button type="button" onClick={onCancel} className="px-12 py-5 rounded-[1.5rem] text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all">Cancel</button>
          <button 
            type="submit"
            className="px-16 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all transform active:scale-95 border-b-4 border-slate-950"
          >
            {initialData ? 'Commit Design Shift' : 'Initialize Access Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;