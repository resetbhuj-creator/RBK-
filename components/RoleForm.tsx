import React, { useState, useEffect } from 'react';
import { Role, UserPermissions, PermissionLevel } from '../types';

interface RoleFormProps {
  initialData?: Role;
  onCancel: () => void;
  onSubmit: (data: Omit<Role, 'id'>) => void;
}

const PERM_LEVELS: PermissionLevel[] = ['none', 'read', 'write', 'all'];

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

  useEffect(() => {
    if (initialData) {
      setRoleData({
        name: initialData.name,
        description: initialData.description || '',
        permissions: { ...initialData.permissions }
      });
    }
  }, [initialData]);

  const handlePermChange = (module: keyof UserPermissions, level: PermissionLevel) => {
    setRoleData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [module]: level }
    }));
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 max-w-4xl mx-auto">
      <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
        <div className="flex items-center space-x-6">
           <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl transform rotate-3">🛡️</div>
           <div>
              <h3 className="text-2xl font-black tracking-tight uppercase italic leading-none">Access Blueprint Configuration</h3>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.4em] mt-2">Define Structural Authorization Shards</p>
           </div>
        </div>
        <button onClick={onCancel} className="p-3 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(roleData as Role); }} className="p-10 space-y-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Blueprint Title (Role Name)</label>
            <input 
              value={roleData.name} 
              onChange={e => setRoleData({...roleData, name: e.target.value})}
              placeholder="e.g. Senior Auditor, Data Entry Specialist" 
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-8 focus:ring-indigo-500/5 text-sm font-black shadow-inner"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Contextual Rationale</label>
            <textarea 
              value={roleData.description} 
              onChange={e => setRoleData({...roleData, description: e.target.value})}
              placeholder="Define the functional scope for this role..." 
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-8 focus:ring-indigo-500/5 text-sm font-medium h-24 resize-none italic bg-slate-50/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {(['company', 'administration', 'transaction', 'display'] as const).map(mod => (
              <div key={mod} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 group hover:border-indigo-200 transition-all">
                 <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest mb-4 italic ml-2">{mod} domain</h4>
                 <div className="grid grid-cols-4 gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    {PERM_LEVELS.map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handlePermChange(mod, level)}
                        className={`py-3 text-[9px] font-black uppercase rounded-xl transition-all ${roleData.permissions[mod] === level ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {level}
                      </button>
                    ))}
                 </div>
              </div>
           ))}
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4">
          <button type="button" onClick={onCancel} className="px-10 py-4 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Discard</button>
          <button type="submit" className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-slate-950">Synchronize Blueprint</button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;
