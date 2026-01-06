import React, { useState, useEffect } from 'react';
import { User, UserPermissions, Role, PermissionLevel } from '../types';

interface UserFormProps {
  initialData?: User;
  availableRoles: Role[];
  onCancel: () => void;
  onSubmit: (data: Omit<User, 'id' | 'lastLogin'>) => void;
}

const PERM_LEVELS: PermissionLevel[] = ['none', 'read', 'write', 'all'];

const PERM_INFO = {
  none: { label: 'RESTRICTED', desc: 'No access permitted to this shard.', color: 'text-slate-400', bg: 'bg-slate-100', icon: '🔒' },
  read: { label: 'AUDITOR', desc: 'Passive visibility of all entries.', color: 'text-blue-600', bg: 'bg-blue-50', icon: '👁️' },
  write: { label: 'OPERATOR', desc: 'Input and update capability.', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '✏️' },
  all: { label: 'ADMINISTRATOR', desc: 'Full structural authority.', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '⭐' }
};

const UserForm: React.FC<UserFormProps> = ({ initialData, availableRoles, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<User, 'id' | 'lastLogin'>>({
    name: '',
    email: '',
    phone: '',
    role: availableRoles[0]?.name || 'Staff',
    status: 'Active',
    permissions: {
      company: 'read',
      administration: 'none',
      transaction: 'read',
      display: 'read'
    }
  });

  const [globalPermission, setGlobalPermission] = useState<PermissionLevel>('read');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleRoleChange = (roleName: string) => {
    const role = availableRoles.find(r => r.name === roleName);
    setFormData(prev => ({
      ...prev,
      role: roleName,
      permissions: role ? { ...role.permissions } : prev.permissions
    }));
  };

  const handlePermChange = (module: keyof UserPermissions, level: PermissionLevel) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [module]: level }
    }));
  };

  const applyGlobalPermission = (level: PermissionLevel) => {
    setGlobalPermission(level);
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name required';
    if (!formData.email.trim()) newErrors.email = 'Email node required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid node address';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const PermissionRow = ({ module, label }: { module: keyof UserPermissions, label: string }) => {
    const current = formData.permissions[module];
    const info = PERM_INFO[current];
    return (
      <div className="flex flex-col space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xs shadow-xs">{info.icon}</div>
             <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">{label} Shard</span>
          </div>
          <div className="relative group/tooltip">
             <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${info.bg} ${info.color} border-current opacity-70 cursor-help uppercase tracking-widest`}>
               {info.label}
             </span>
             <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:block z-10">
                <div className="bg-slate-900 text-white text-[9px] font-black uppercase py-2 px-3 rounded-xl whitespace-nowrap shadow-2xl border border-white/10">
                   {info.desc}
                </div>
             </div>
          </div>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200 shadow-inner">
           {PERM_LEVELS.map(level => (
             <button
               key={level}
               type="button"
               onClick={() => handlePermChange(module, level)}
               className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${current === level ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {level}
             </button>
           ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 max-w-5xl mx-auto">
      <div className="px-12 py-10 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center text-3xl shadow-2xl transform rotate-3 border-4 border-indigo-400/20">👤</div>
          <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{initialData ? 'Update Account Node' : 'Authorize Identity'}</h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400 mt-2">IAM Controller • System Partition</p>
          </div>
        </div>
        <button onClick={onCancel} className="relative z-10 p-3 bg-white/5 hover:bg-rose-600 rounded-full transition-all border border-white/10 group">
          <svg className="w-6 h-6 text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
        </button>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-32 -mt-32"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-12 overflow-y-auto max-h-[75vh] custom-scrollbar bg-slate-50/20">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Identity Designation (Name)</label>
             <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full px-6 py-4 rounded-2xl border outline-none font-black text-sm shadow-inner transition-all ${errors.name ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:ring-8 focus:ring-indigo-500/5 bg-white'}`} placeholder="e.g. Vance Alexander" />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Secure Node Address (Email)</label>
             <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full px-6 py-4 rounded-2xl border outline-none font-black text-sm shadow-inner transition-all ${errors.email ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:ring-8 focus:ring-indigo-500/5 bg-white'}`} placeholder="vance@nexus-erp.net" />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Structural Mapping (Role)</label>
             <select value={formData.role} onChange={e => handleRoleChange(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white font-black text-sm outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner appearance-none cursor-pointer text-indigo-600 uppercase italic">
                {availableRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Availability State</label>
             <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-inner">
               {(['Active', 'Suspended'] as const).map(s => (
                 <button key={s} type="button" onClick={() => setFormData({...formData, status: s})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${formData.status === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{s}</button>
               ))}
             </div>
           </div>
        </section>

        <section className="space-y-10 pt-10 border-t border-slate-200">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <h4 className="text-xl font-black uppercase italic text-slate-800 tracking-tighter">Modular Authorization Matrix</h4>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Define granular access nodes for system partitions</p>
              </div>
              <div className="flex items-center space-x-4 bg-indigo-50 p-1.5 rounded-2xl border border-indigo-100 shadow-sm">
                 <span className="text-[9px] font-black uppercase text-indigo-400 px-4 tracking-[0.2em]">Global Shard Preset:</span>
                 {PERM_LEVELS.map(level => (
                    <button key={level} type="button" onClick={() => applyGlobalPermission(level)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${globalPermission === level ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:bg-white'}`}>{level}</button>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PermissionRow module="company" label="Corporate Hub" />
              <PermissionRow module="administration" label="Institutional Master" />
              <PermissionRow module="transaction" label="Operational Loop" />
              <PermissionRow module="display" label="Intelligence Node" />
           </div>

           {/* Permission Legend */}
           <div className="p-8 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 relative overflow-hidden shadow-2xl">
              <div className="relative z-10 flex items-start space-x-10">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl shrink-0">🛡️</div>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 flex-1">
                    {Object.entries(PERM_INFO).map(([key, val]) => (
                      <div key={key} className="space-y-2">
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${val.color} flex items-center`}>
                           <span className="mr-2 text-xs">{val.icon}</span>
                           {val.label}
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">"{val.desc}"</p>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[120px] opacity-10 -mr-32 -mt-32"></div>
           </div>
        </section>

        <div className="pt-10 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-5">
           <button type="button" onClick={onCancel} className="px-12 py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all">Discard Changes</button>
           <button type="submit" className="px-16 py-5 bg-slate-950 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-black/40">
              {initialData ? 'Commit Identity Delta' : 'Provision Identity Shard'}
           </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
