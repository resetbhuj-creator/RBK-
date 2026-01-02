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
    desc: 'Zero Visibility', 
    color: 'text-slate-400', 
    bg: 'bg-slate-100',
    icon: '🔒',
    longDesc: 'Absolute isolation. The module is completely hidden from the user interface and API access is blocked.'
  },
  read: { 
    label: 'ANALYST', 
    desc: 'View & Audit', 
    color: 'text-sky-600', 
    bg: 'bg-sky-50',
    icon: '👁️',
    longDesc: 'Passive access. User can browse records, generate reports, and view dashboards but cannot commit any changes.'
  },
  write: { 
    label: 'OPERATOR', 
    desc: 'Create & Edit', 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-50',
    icon: '✏️',
    longDesc: 'Standard data entry. Can create new vouchers and modify existing masters. Deletion and purge rights are restricted.'
  },
  all: { 
    label: 'ADMINISTRATOR', 
    desc: 'Total Control', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    icon: '⭐',
    longDesc: 'Sovereign authority. Unrestricted CRUD operations, including record purging and system-level configuration changes.'
  }
};

const MODULE_BEHAVIOR = {
  company: "Statutory info, Financial Year cycles, and Branding.",
  administration: "Ledgers, Items, Tax Masters, and User Registry.",
  transaction: "Daily Vouchers, Invoices, and Ledger Postings.",
  display: "Balance Sheets, P&L, GST Summaries, and Audit Trails."
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

    return (
      <div className="p-6 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-indigo-100 transition-all group/row relative">
        <div className="flex items-center space-x-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/row:bg-indigo-600 group-hover/row:text-white transition-colors">
            {icon}
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">{label}</h4>
            <div className="flex items-center space-x-1.5 mt-0.5">
               <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${activeInfo.bg} ${activeInfo.color}`}>
                 {activeInfo.label}
               </span>
               <span className="text-[9px] text-slate-400 font-medium italic">— {activeInfo.desc}</span>
            </div>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          {PERM_LEVELS.map(level => {
            const info = PERM_LEVEL_INFO[level];
            const isActive = currentVal === level;
            
            return (
              <button
                key={level}
                type="button"
                onClick={() => handlePermChange(module, level)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all relative group/btn ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-xl border border-slate-100 transform -translate-y-0.5' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {level}
                
                {/* Custom Floating Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-slate-900 text-white rounded-xl shadow-2xl opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all z-50 pointer-events-none">
                  <div className="flex items-center space-x-2 mb-1.5">
                     <span className="text-sm">{info.icon}</span>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">{info.label}</span>
                  </div>
                  <p className="text-[10px] font-medium leading-relaxed normal-case text-slate-300">
                    {info.longDesc}
                  </p>
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
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 max-w-6xl mx-auto">
      <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl transform -rotate-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase italic">User Provisioning</h3>
            <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-1">Institutional Governance & Identity</p>
          </div>
        </div>
        <button onClick={onCancel} className="relative z-10 p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-12 max-h-[80vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Identity Column */}
          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Staff Legal Name</label>
                <input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. John Doe" 
                  className={`w-full px-5 py-3.5 rounded-2xl border outline-none transition-all text-sm font-bold ${touched.name && errors.name ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white'}`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Corporate Gateway (Email)</label>
                <input 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="j.doe@nexus.com" 
                  className={`w-full px-5 py-3.5 rounded-2xl border outline-none transition-all text-sm font-bold ${touched.email && errors.email ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white'}`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Security Blueprint (Role)</label>
                <select 
                  value={formData.role} 
                  onChange={e => handleRoleChange(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-black text-indigo-600 outline-none"
                >
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Account Lifespan</label>
                 <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    {(['Active', 'Suspended'] as const).map(s => (
                      <button 
                        key={s}
                        type="button"
                        onClick={() => setFormData({...formData, status: s})}
                        className={`flex-1 py-2.5 text-[9px] font-black uppercase rounded-xl transition-all ${formData.status === s ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}
                      >
                        {s}
                      </button>
                    ))}
                 </div>
              </div>
            </div>

            {/* Matrix Block */}
            <div className="space-y-6">
               <div className="flex items-center space-x-3 text-indigo-600">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-sm font-black uppercase tracking-widest italic">Modular Authority Matrix</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <PermissionRow label="Company Domain" module="company" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>} />
                 <PermissionRow label="Administration" module="administration" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
                 <PermissionRow label="Transactions" module="transaction" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>} />
                 <PermissionRow label="Display & Reports" module="display" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>} />
               </div>
            </div>
          </div>

          {/* Guide Column */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
               <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-8 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Authority Mapping Guide
               </h4>
               <div className="space-y-6">
                  {PERM_LEVELS.map(level => {
                    const info = PERM_LEVEL_INFO[level];
                    return (
                      <div key={level} className="flex items-start space-x-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm border border-slate-100 ${info.bg}`}>
                            {info.icon}
                         </div>
                         <div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${info.color}`}>{info.label}</div>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">{info.desc}: {info.longDesc.split('.')[0]}.</p>
                         </div>
                      </div>
                    );
                  })}
               </div>

               <div className="mt-10 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] text-indigo-800 font-bold leading-relaxed italic">
                    "Permissions define the functional sovereignty of a staff member. Custom overrides are logged in the organization audit trail."
                  </p>
               </div>
            </div>

            <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${isSyncWithRole ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-400 shadow-xl'}`}>
               <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSyncWithRole ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white animate-pulse'}`}>
                     {isSyncWithRole ? '✓' : '!'}
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Contextual Integrity</h5>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed mt-1">
                      {isSyncWithRole 
                        ? `Account permissions are perfectly synchronized with the ${formData.role} role blueprint.` 
                        : `This account has manual overrides. It no longer inherits baseline settings from ${formData.role}.`
                      }
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-5">
          <button type="button" onClick={onCancel} className="px-10 py-5 rounded-[1.5rem] text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-white transition-all">Discard Identity Changes</button>
          <button type="submit" className="px-16 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-4 border-slate-950">
            {initialData ? 'Update Staff Identity' : 'Authorize New Identity'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;