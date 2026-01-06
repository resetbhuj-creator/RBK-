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
  none: { label: 'RESTRICTED', desc: 'No access to module', color: 'text-slate-400', bg: 'bg-slate-100', icon: '🔒' },
  read: { label: 'AUDITOR', desc: 'Passive visibility only', color: 'text-sky-600', bg: 'bg-sky-50', icon: '👁️' },
  write: { label: 'OPERATOR', desc: 'Input & Update capability', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '✏️' },
  all: { label: 'SOVEREIGN', desc: 'Full CRUD & Statutory authority', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '⭐' }
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

  const PermissionRow = ({ label, module }: { label: string, module: keyof UserPermissions }) => {
    const currentVal = formData.permissions[module];
    const activeInfo = (PERM_LEVEL_INFO as any)[currentVal];

    return (
      <div className="p-6 rounded-[2.5rem] border-2 border-slate-100 bg-white shadow-sm group hover:border-indigo-100 transition-all">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              {activeInfo.icon}
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-tight italic">{label}</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Modular Access</p>
            </div>
          </div>
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${activeInfo.bg} ${activeInfo.color} border-current opacity-60`}>
              {activeInfo.label}
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          {PERM_LEVELS.map(level => (
            <button
              key={level}
              type="button"
              onClick={() => handlePermChange(module, level)}
              className={`flex-1 py-3 text-[9px] font-black uppercase tracking-tighter rounded-xl transition-all ${
                currentVal === level 
                  ? 'bg-white text-indigo-600 shadow-lg border border-slate-100 scale-105 z-10' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {level}
            </button>
          ))}
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
        
        {/* Basic Identity Details */}
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

        {/* Permission Orchestrator */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">II. Authorization Matrix</h4>
            </div>
            
            <div className="flex items-center space-x-4 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
               <span className="text-[9px] font-black uppercase text-slate-400 px-4">Global Blueprint:</span>
               {PERM_LEVELS.map(level => (
                 <button
                   key={level}
                   type="button"
                   onClick={() => handleGlobalApply(level)}
                   className="px-5 py-2 text-[9px] font-black uppercase rounded-xl transition-all text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white"
                 >
                   Apply {level}
                 </button>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PermissionRow label="Corporate Domain" module="company" />
            <PermissionRow label="Infrastructure Master" module="administration" />
            <PermissionRow label="Transactional Operations" module="transaction" />
            <PermissionRow label="Display Intelligence" module="display" />
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