import React, { useState, useEffect, useMemo } from 'react';
import { Role, UserPermissions } from '../types';

interface RoleFormProps {
  initialData?: Role;
  onCancel: () => void;
  onSubmit: (data: Omit<Role, 'id'>) => void;
}

const PERM_LEVELS = ['none', 'read', 'write', 'all'] as const;

const PERM_LEVEL_INFO = {
  none: { 
    label: 'RESTRICTED', 
    desc: 'Module Hidden', 
    color: 'text-slate-400', 
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: '🔒',
    meterWidth: 'w-0',
    longDesc: 'Zero visibility. This module will be completely removed from the interface and all associated API endpoints will return access violations.'
  },
  read: { 
    label: 'ANALYST', 
    desc: 'View & Audit', 
    color: 'text-sky-600', 
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: '👁️',
    meterWidth: 'w-1/4',
    longDesc: 'Passive access. Allows generating reports, viewing master records, and auditing historical transactions without modification capability.'
  },
  write: { 
    label: 'OPERATOR', 
    desc: 'Create & Update', 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: '✏️',
    meterWidth: 'w-2/3',
    longDesc: 'Operational capacity. Can enter new transactions, update existing masters, and manage daily operational queues.'
  },
  all: { 
    label: 'SOVEREIGN', 
    desc: 'Full Authority', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '⭐',
    meterWidth: 'w-full',
    longDesc: 'Total command. Full CRUD privileges including deletion of records, year-end closing, and management of sensitive organizational configurations.'
  }
};

const MODULE_CONTEXTS = {
  company: {
    label: "Corporate Domain",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
    coverage: "Organization Profile, FY Management, Multi-Year History."
  },
  administration: {
    label: "Infrastructure",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    coverage: "Ledger Masters, Item Catalogues, Tax Groups, User Management."
  },
  transaction: {
    label: "Operations",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>,
    coverage: "Voucher Entry, Payments, Receipts, Inventory Movements."
  },
  display: {
    label: "Intelligence",
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    coverage: "Balance Sheet, P&L, GST Reports, Ledger Statements."
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

  const handlePermChange = (module: keyof UserPermissions, level: UserPermissions[keyof UserPermissions]) => {
    setRoleData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [module]: level }
    }));
  };

  const applyPreset = (preset: 'auditor' | 'clerk' | 'admin' | 'guest') => {
    const presets: Record<string, UserPermissions> = {
      admin: { company: 'all', administration: 'all', transaction: 'all', display: 'all' },
      clerk: { company: 'read', administration: 'none', transaction: 'write', display: 'all' },
      auditor: { company: 'read', administration: 'read', transaction: 'read', display: 'all' },
      guest: { company: 'none', administration: 'none', transaction: 'none', display: 'read' }
    };
    setRoleData(prev => ({ ...prev, permissions: presets[preset] }));
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

    return (
      <div className={`p-8 rounded-[3rem] border-2 transition-all group bg-white ${info.border} shadow-sm hover:shadow-xl`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
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
                  {info.label}
                </span>
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
            
            return (
              <button
                key={level}
                type="button"
                onClick={() => handlePermChange(module, level)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all relative group/btn ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-xl border border-slate-100 scale-105' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {level}
                
                {/* Tooltip on Hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-6 bg-slate-950 text-white rounded-[2rem] shadow-2xl opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all z-50 pointer-events-none border border-white/10 text-left normal-case">
                   <div className="flex items-center space-x-3 mb-4 border-b border-white/10 pb-3">
                      <span className="text-xl">{levelInfo.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{levelInfo.label} TIER</span>
                   </div>
                   <p className="text-[10px] font-medium leading-relaxed text-slate-400 italic">
                      {levelInfo.longDesc}
                   </p>
                   <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-slate-950"></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 max-w-7xl mx-auto">
      <div className="px-12 py-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
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
                  placeholder="e.g. Senior Auditor, Data Operator, Sales Manager" 
                  className={`w-full px-7 py-5 rounded-[1.5rem] border outline-none transition-all text-sm font-black shadow-sm ${error ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white'}`}
                />
                {error && <p className="text-[11px] text-rose-500 font-black mt-2 ml-1 animate-pulse">{error}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] ml-1">Functional Description</label>
                <textarea 
                  value={roleData.description} 
                  onChange={e => setRoleData({...roleData, description: e.target.value})}
                  placeholder="Describe the core scope of responsibilities..." 
                  className="w-full px-7 py-5 rounded-[1.5rem] border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 bg-white text-sm font-medium shadow-sm h-32 resize-none"
                />
              </div>
            </div>

            <div className="space-y-8 pt-8 border-t border-slate-200">
               <div className="flex items-center space-x-4">
                  <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-xl font-black uppercase tracking-tight italic text-slate-800">Modular Access Blueprints</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <PermissionRow label="Corporate Domain" module="company" icon={MODULE_CONTEXTS.company.icon} />
                  <PermissionRow label="Infrastructure" module="administration" icon={MODULE_CONTEXTS.administration.icon} />
                  <PermissionRow label="Transactional Core" module="transaction" icon={MODULE_CONTEXTS.transaction.icon} />
                  <PermissionRow label="Display & Analytics" module="display" icon={MODULE_CONTEXTS.display.icon} />
               </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
               <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-10 border-b border-slate-50 pb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Authority Presets
               </h4>
               <div className="space-y-4">
                  {[
                    { id: 'admin', label: 'Full Sovereignty', icon: '⚡', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                    { id: 'clerk', label: 'Operational Core', icon: '📝', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                    { id: 'auditor', label: 'Passive Audit', icon: '🔍', color: 'bg-sky-50 text-sky-600 border-sky-100' },
                    { id: 'guest', label: 'View Only', icon: '🔒', color: 'bg-slate-50 text-slate-600 border-slate-100' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id as any)}
                      className="w-full flex items-center space-x-5 p-5 rounded-2xl border-2 border-slate-50 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all text-left group"
                    >
                      <div className={`w-12 h-12 ${p.color} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>{p.icon}</div>
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-widest text-slate-800">{p.label}</div>
                        <div className="text-[8px] text-slate-400 font-bold tracking-widest uppercase mt-1">Standard Archetype</div>
                      </div>
                    </button>
                  ))}
               </div>
            </div>

            <div className="p-10 bg-slate-950 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border-l-8 border-indigo-500">
               <div className="relative z-10">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">Security Compliance</h4>
                  <p className="text-[11px] font-medium leading-relaxed text-slate-400 italic">
                     "Nexus roles implement <span className="text-white font-bold">Hard-Coded Isolation</span>. Once a blueprint is committed, the system core enforces modular boundaries at the process level."
                  </p>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-[80px] opacity-10"></div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-5 bg-white sticky bottom-0 -mx-12 px-12 pb-8">
          <button type="button" onClick={onCancel} className="px-12 py-5 rounded-[1.5rem] text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all">Cancel</button>
          <button 
            type="submit"
            className="px-16 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all transform active:scale-95 border-b-4 border-slate-950"
          >
            {initialData ? 'Commit Design Shift' : 'Initialize Access Blueprint'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;