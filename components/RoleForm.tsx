import React, { useState, useEffect } from 'react';
import { Role, UserPermissions } from '../types';

interface RoleFormProps {
  initialData?: Role;
  onCancel: () => void;
  onSubmit: (data: Omit<Role, 'id'>) => void;
}

const PERM_LEVELS = ['none', 'read', 'write', 'all'] as const;

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

  const handlePermChange = (module: keyof UserPermissions, level: UserPermissions[keyof UserPermissions]) => {
    setRoleData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [module]: level }
    }));
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 max-w-4xl mx-auto">
      <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black tracking-tight uppercase italic">Access Blueprint Configuration</h3>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.4em] mt-1">Design Organizational Tiers</p>
        </div>
        <button onClick={onCancel} className="p-3 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(roleData as Role); }} className="p-10 space-y-10">
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Blueprint Title (Role Name)</label>
            <input 
              value={roleData.name} 
              onChange={e => setRoleData({...roleData, name: e.target.value})}
              placeholder="e.g. Senior Auditor, Data Entry Specialist" 
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-8 focus:ring-indigo-500/5 text-sm font-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Description</label>
            <textarea 
              value={roleData.description} 
              onChange={e => setRoleData({...roleData, description: e.target.value})}
              placeholder="Define the functional scope for this role..." 
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-8 focus:ring-indigo-500/5 text-sm font-medium h-24 resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {(['company', 'administration', 'transaction', 'display'] as const).map(mod => (
              <div key={mod} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                 <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest mb-4 italic ml-2">{mod} domain</h4>
                 <div className="grid grid-cols-4 gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    {PERM_LEVELS.map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handlePermChange(mod, level)}
                        className={`py-3 text-[9px] font-black uppercase rounded-xl transition-all ${roleData.permissions[mod] === level ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {level}
                      </button>
                    ))}
                 </div>
              </div>
           ))}
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="px-10 py-4 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50">Cancel</button>
          <button type="submit" className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-slate-950">Initialize Blueprint</button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;