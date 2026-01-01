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
    label: 'Restricted', 
    desc: 'No access to module.', 
    color: 'text-slate-400', 
    bg: 'bg-slate-100',
    longDesc: 'The user will not be able to see or access this module in the navigation or through direct links.'
  },
  read: { 
    label: 'Analyst', 
    desc: 'View only access.', 
    color: 'text-sky-600', 
    bg: 'bg-sky-50',
    longDesc: 'User can browse all records, view dashboards, and generate reports, but cannot add or edit any data.'
  },
  write: { 
    label: 'Operator', 
    desc: 'Standard R/W access.', 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-50',
    longDesc: 'User can create new records and modify existing ones. Administrative functions like purging data are restricted.'
  },
  all: { 
    label: 'Superuser', 
    desc: 'Full modular control.', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    longDesc: 'Unrestricted access. User can create, edit, delete, and perform advanced administrative tasks within this module.'
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

  const globalLevel = useMemo(() => {
    const vals = Object.values(formData.permissions);
    return vals.every(v => v === vals[0]) ? vals[0] : 'custom';
  }, [formData.permissions]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Staff name is mandatory';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Corporate email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid corporate email address';
    }
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (formData.phone && !e164Regex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone must be in E.164 format (e.g., +14155552671)';
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

  const handleSyncWithRole = () => {
    const selectedRole = availableRoles.find(r => r.name === formData.role);
    if (selectedRole) {
      setFormData(prev => ({ ...prev, permissions: { ...selectedRole.permissions } }));
    }
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

  const handlePermChange = (module: keyof UserPermissions, level: UserPermissions[keyof UserPermissions]) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [module]: level }
    }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true });
    if (validate()) onSubmit(formData);
  };

  const PermissionRow = ({ label, module, icon }: { label: string, module: keyof UserPermissions, icon: React.ReactNode }) => {
    const currentVal = formData.permissions[module];
    const roleBase = availableRoles.find(r => r.name === formData.role)?.permissions[module];
    const isOverridden = roleBase && currentVal !== roleBase;
    const activeInfo = PERM_LEVEL_INFO[currentVal];

    return (
      <div className={`p-6 rounded-3xl border-2 transition-all relative overflow-hidden group/row ${isOverridden ? 'bg-amber-50/50 border-amber-400 shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
        {isOverridden && (
           <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl z-10">Manual Override</div>
        )}
        <div className="flex items-center space-x-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isOverridden ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400 group-hover/row:bg-indigo-600 group-hover/row:text-white'}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">{label}</h4>
            <p className={`text-[10px] font-bold ${activeInfo.color}`}>{activeInfo.label}: {activeInfo.desc}</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          {PERM_LEVELS.map(level => (
            <button
              key={level}
              type="button"
              title={PERM_LEVEL_INFO[level].longDesc}
              onClick={() => handlePermChange(module, level)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all relative group/btn ${
                currentVal === level 
                  ? 'bg-white text-indigo-600 shadow-xl border border-slate-100 transform -translate-y-0.5' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {level}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[9px] rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                {PERM_LEVEL_INFO[level].label}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 max-w-5xl mx-auto">
      <div className="px-12 py-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-900/50 transform -rotate-3">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic">Identity Provisioning</h3>
            <p className="text-sm text-indigo-300 font-medium tracking-tight">Configure functional sovereignty for staff accounts.</p>
          </div>
        </div>
        <button onClick={onCancel} className="relative z-10 p-3 hover:bg-white/10 rounded-full text-slate-400 transition-colors border border-white/10">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-12 max-h-[75vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            {/* Core Identity Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-1">Staff Member Name</label>
                <input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  onBlur={() => handleBlur('name')}
                  placeholder="e.g. Admiral Grace Hopper" 
                  className={`w-full px-6 py-4 rounded-2xl border outline-none transition-all text-sm font-black ${touched.name && errors.name ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white'}`}
                />
                {touched.name && errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-left-1">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-1">Corporate Gateway (Email)</label>
                <input 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  onBlur={() => handleBlur('email')}
                  placeholder="g.hopper@nexus-erp.cloud" 
                  className={`w-full px-6 py-4 rounded-2xl border outline-none transition-all text-sm font-black ${touched.email && errors.email ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white'}`}
                />
                {touched.email && errors.email && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-left-1">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-1">Contact Number (E.164)</label>
                <input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  onBlur={() => handleBlur('phone')}
                  placeholder="+14155552671" 
                  className={`w-full px-6 py-4 rounded-2xl border outline-none transition-all text-sm font-black ${touched.phone && errors.phone ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-500/10 bg-white'}`}
                />
                {touched.phone && errors.phone && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-left-1">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-1">Assigned Security Profile</label>
                <select 
                  value={formData.role} 
                  onChange={e => handleRoleChange(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 bg-white text-sm font-black text-indigo-600"
                >
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.name}>
                      {role.name} {role.isSystem ? ' (System Core)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Global Presets */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="max-w-xs">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">Global Authority Preset</h4>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Instantly synchronize all functional modules to a specific access tier. Useful for rapid profile building.</p>
                </div>
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                  {PERM_LEVELS.map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleGlobalApply(level)}
                      className={`px-5 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all ${
                        globalLevel === level ? 'bg-white text-slate-900 shadow-xl scale-110 rotate-1' : 'text-indigo-200 hover:bg-white/5'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-600 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
               <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 border-b border-slate-50 pb-3">Permission Legend</h4>
               <div className="space-y-4">
                  {PERM_LEVELS.map(level => (
                    <div key={level} className="flex items-start space-x-3">
                       <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black uppercase border border-slate-100 shadow-sm ${PERM_LEVEL_INFO[level].bg} ${PERM_LEVEL_INFO[level].color}`}>
                          {level.charAt(0)}
                       </div>
                       <div>
                          <div className={`text-[10px] font-black uppercase tracking-tighter ${PERM_LEVEL_INFO[level].color}`}>{PERM_LEVEL_INFO[level].label}</div>
                          <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{PERM_LEVEL_INFO[level].desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className={`p-8 rounded-[2rem] border transition-all ${isSyncWithRole ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-200 shadow-lg'}`}>
               <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSyncWithRole ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white animate-pulse'}`}>
                     {isSyncWithRole ? '✓' : '!'}
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Contextual Integrity</h5>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed mt-1">
                      {isSyncWithRole 
                        ? `Account permissions are synchronized with the ${formData.role} blueprint.` 
                        : `This account has custom overrides deviating from the ${formData.role} profile.`
                      }
                    </p>
                    {!isSyncWithRole && (
                      <button type="button" onClick={handleSyncWithRole} className="mt-4 text-[9px] font-black uppercase text-amber-700 underline decoration-amber-300 underline-offset-4 hover:text-amber-900 transition-colors">Revert to Role Baseline</button>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="space-y-8 pt-8 border-t border-slate-200">
          <div className="flex items-center space-x-4">
             <div className="w-2 h-8 bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
             <div>
               <h4 className="text-lg font-black uppercase tracking-[0.1em] text-slate-800 italic">Modular Authorization Matrix</h4>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Toggle individual functional access levels below</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <PermissionRow 
              label="Company Domain" 
              module="company" 
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>} 
            />
            <PermissionRow 
              label="Administration" 
              module="administration" 
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} 
            />
            <PermissionRow 
              label="Financial Core" 
              module="transaction" 
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>} 
            />
            <PermissionRow 
              label="Audit & Display" 
              module="display" 
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>} 
            />
          </div>
        </div>

        <div className="pt-12 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4 sticky bottom-0 bg-slate-50/95 backdrop-blur-sm -mx-12 px-12 pb-8 pt-6 z-10">
          <button type="button" onClick={onCancel} className="px-12 py-5 rounded-[1.5rem] text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:text-rose-600 transition-all">Discard Identity Changes</button>
          <button type="submit" className="px-16 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all transform active:scale-95 border-b-4 border-slate-950">
            {initialData ? 'Commit Identity Context' : 'Authorize New Identity'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;