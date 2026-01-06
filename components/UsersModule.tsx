import React, { useState, useMemo } from 'react';
import { User, Role, UserPermissions, AuditLog } from '../types';
import UserForm from './UserForm';
import RoleForm from './RoleForm';
import ActionMenu, { ActionItem } from './ActionMenu';

interface UsersModuleProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp' | 'actor'> & { actor?: string }) => void;
}

const UsersModule: React.FC<UsersModuleProps> = ({ users, setUsers, roles, setRoles, auditLogs, addAuditLog }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES' | 'AUDIT'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  const [togglingUser, setTogglingUser] = useState<User | null>(null);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = 
        log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      
      return (log.entityType === 'USER' || log.entityType === 'ROLE') && matchesSearch && matchesAction;
    });
  }, [auditLogs, searchTerm, actionFilter]);

  const handleAddOrEditUser = (data: any) => {
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
      addAuditLog({
        action: 'UPDATE',
        entityType: 'USER',
        entityName: data.name,
        details: `Identity Updated: Adjusted profile and permissions for ${data.name}.`
      });
    } else {
      const newUser: User = {
        ...data,
        id: `u-${Math.random().toString(36).substr(2, 9)}`,
        lastLogin: 'NEVER'
      };
      setUsers(prev => [...prev, newUser]);
      addAuditLog({
        action: 'CREATE',
        entityType: 'USER',
        entityName: data.name,
        details: `New Identity Provisioned: Account created for ${data.name} with ${data.role} role.`
      });
    }
    setIsModalOpen(false);
    setEditingUser(undefined);
  };

  const handleAddOrEditRole = (data: Omit<Role, 'id'>) => {
    if (editingRole) {
      setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...data } : r));
      addAuditLog({
        action: 'UPDATE',
        entityType: 'ROLE',
        entityName: data.name,
        details: `Access Blueprint Modified: Security parameters updated for role "${data.name}".`
      });
    } else {
      const newRole: Role = {
        ...data,
        id: `r-${Math.random().toString(36).substr(2, 9)}`,
        isSystem: false
      };
      setRoles(prev => [...prev, newRole]);
      addAuditLog({
        action: 'CREATE',
        entityType: 'ROLE',
        entityName: data.name,
        details: `Custom Security Blueprint Defined: New role "${data.name}" committed to registry.`
      });
    }
    setIsModalOpen(false);
    setEditingRole(undefined);
  };

  const deleteRole = (role: Role) => {
    if(role.isSystem) return;
    if(confirm(`DESTRUCTIVE ACTION: Permanent purge of security blueprint "${role.name}"? Users assigned to this role will lose module access.`)) {
      setRoles(prev => prev.filter(r => r.id !== role.id));
      addAuditLog({
        action: 'DELETE',
        entityType: 'ROLE',
        entityName: role.name,
        details: `Security Blueprint Purged: Access Tier [Hash: ${role.id}] decommissioned.`
      });
    }
  };

  const toggleUserStatus = (user: User) => {
     const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
     setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
     addAuditLog({
       action: 'STATUS_CHANGE',
       entityType: 'USER',
       entityName: user.name,
       details: `Sovereign Lock Update: Identity state shifted from ${user.status} to ${nextStatus}.`
     });
     setTogglingUser(null);
  };

  const PermissionFingerprint = ({ permissions }: { permissions: UserPermissions }) => {
    const getLevelColor = (level: string) => {
      switch (level) {
        case 'all': return 'bg-emerald-500';
        case 'write': return 'bg-indigo-500';
        case 'read': return 'bg-sky-400';
        default: return 'bg-slate-200';
      }
    };

    return (
      <div className="flex space-x-1.5">
        {(['company', 'administration', 'transaction', 'display'] as const).map(mod => (
          <div key={mod} className="group relative">
            <div className={`w-3 h-3 rounded-full ${getLevelColor(permissions[mod])} shadow-sm border border-white/20`} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
              <div className="bg-slate-900 text-white text-[8px] font-black uppercase py-1 px-2 rounded-lg whitespace-nowrap shadow-xl border border-white/10">
                {mod}: {permissions[mod]}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Identity & Access</h2>
          <p className="text-sm text-slate-500 font-medium mt-4">Manage organizational nodes and define custom security blueprints.</p>
        </div>
        <div className="flex items-center space-x-4">
           <button 
            disabled={activeTab === 'AUDIT'}
            onClick={() => { setEditingUser(undefined); setEditingRole(undefined); setIsModalOpen(true); }}
            className={`flex items-center justify-center space-x-3 px-10 py-5 rounded-[1.5rem] font-black shadow-2xl transition-all transform active:scale-95 text-[10px] uppercase tracking-[0.2em] ${activeTab === 'AUDIT' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
           >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 v6m0-6h6m-6 0H6" /></svg>
            <span>{activeTab === 'ROLES' ? 'Create Access Blueprint' : 'Authorize Identity'}</span>
           </button>
        </div>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-[2.5rem] border border-slate-200 w-full max-w-2xl mx-auto shadow-inner">
          {(['USERS', 'ROLES', 'AUDIT'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab === 'ROLES' ? 'Access Tiers' : tab === 'AUDIT' ? 'Forensic Stream' : 'Staff Registry'}
            </button>
          ))}
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {activeTab === 'ROLES' ? (
          <>
            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="relative max-w-lg w-full">
                <input 
                  type="text" 
                  placeholder="Search access blueprints..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 shadow-sm transition-all outline-none italic"
                />
                <svg className="w-6 h-6 text-slate-300 absolute left-5 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {filteredRoles.length} BLUEPRINTS CONFIGURED
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-900 sticky top-0 z-10">
                  <tr>
                    <th className="px-12 py-7">Access Blueprint Profile</th>
                    <th className="px-12 py-7">Security Fingerprint</th>
                    <th className="px-12 py-7">Classification</th>
                    <th className="px-12 py-7 text-right">Modular Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-12 py-8">
                        <div className="font-black text-slate-800 text-lg tracking-tighter italic uppercase underline decoration-transparent group-hover:decoration-indigo-200 underline-offset-8 transition-all">{role.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium mt-3 italic leading-relaxed max-w-xl">{role.description || 'Institutional security context missing descriptor.'}</div>
                      </td>
                      <td className="px-12 py-8">
                        <div className="space-y-3">
                           <PermissionFingerprint permissions={role.permissions} />
                           <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">COMP • ADMIN • TXN • DISP</div>
                        </div>
                      </td>
                      <td className="px-12 py-8">
                        <span className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${role.isSystem ? 'text-slate-400 bg-slate-100 border-slate-200' : 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-md'}`}>
                          {role.isSystem ? 'CORE-SYSTEM' : 'USER-DEFINED'}
                        </span>
                      </td>
                      <td className="px-12 py-8 text-right">
                         <ActionMenu actions={[
                           { label: 'Update Blueprint', icon: '✏️', onClick: () => { setEditingRole(role); setIsModalOpen(true); }, variant: 'primary' },
                           { label: 'Purge Blueprint', icon: '🗑️', onClick: () => deleteRole(role), variant: 'danger' }
                         ]} label={role.isSystem ? 'LOCKED' : 'ACTION'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : activeTab === 'USERS' ? (
          <>
            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="relative max-w-lg w-full">
                <input 
                  type="text" 
                  placeholder="Query staff registry..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 shadow-sm transition-all outline-none italic"
                />
                <svg className="w-6 h-6 text-slate-300 absolute left-5 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {filteredUsers.length} IDENTITIES REGISTERED
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-12 py-7">Staff Identity Node</th>
                      <th className="px-12 py-7">Authorized Blueprint</th>
                      <th className="px-12 py-7">Integrity Status</th>
                      <th className="px-12 py-7 text-right">Modular Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-12 py-8">
                          <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border-4 border-white shadow-xl group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:-rotate-6 text-2xl">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-black text-slate-800 text-lg tracking-tighter truncate uppercase italic leading-none">{user.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-widest mt-2">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-12 py-8">
                          <div className="space-y-3">
                             <span className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border-2 border-indigo-100 shadow-sm italic inline-block">
                               {user.role}
                             </span>
                             <div className="pl-1">
                               <PermissionFingerprint permissions={user.permissions} />
                             </div>
                          </div>
                        </td>
                        <td className="px-12 py-8">
                           <button onClick={() => setTogglingUser(user)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-3 border-2 ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}>
                             <div className={`w-2.5 h-2.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
                             <span>{user.status}</span>
                           </button>
                        </td>
                        <td className="px-12 py-8 text-right">
                           <ActionMenu actions={[
                             { label: 'Edit Identity', icon: '✏️', onClick: () => { setEditingUser(user); setIsModalOpen(true); }, variant: 'primary' },
                             { label: user.status === 'Active' ? 'Suspend Node' : 'Activate Node', icon: '🔒', onClick: () => setTogglingUser(user), variant: user.status === 'Active' ? 'danger' : 'success' }
                           ]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </>
        ) : (
          <div className="animate-in fade-in duration-500 flex flex-col h-full">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                   <select 
                    value={actionFilter} 
                    onChange={e => setActionFilter(e.target.value)}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm"
                   >
                      <option value="ALL">All Event Shards</option>
                      <option value="CREATE">Initialization</option>
                      <option value="UPDATE">Modifications</option>
                      <option value="DELETE">Purge Cycles</option>
                      <option value="STATUS_CHANGE">Authority Shifts</option>
                   </select>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   Auditing {filteredLogs.length} Events
                </div>
             </div>
             <div className="overflow-x-auto custom-scrollbar flex-1">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-12 py-7">Log Entry Signature</th>
                      <th className="px-12 py-7">Authorized Actor</th>
                      <th className="px-12 py-7">Identity Context</th>
                      <th className="px-12 py-7 text-right">Execution Moment</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-indigo-50/30 cursor-pointer transition-all group border-b border-slate-50 last:border-0 animate-in fade-in">
                        <td className="px-12 py-8 max-w-md">
                           <div className="flex items-center space-x-4 mb-3">
                              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black border tracking-widest ${
                                log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                log.action === 'DELETE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                log.action === 'STATUS_CHANGE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-indigo-50 text-indigo-600 border-indigo-100'
                              }`}>{log.action}</span>
                              <span className="font-mono text-[9px] text-slate-300 font-bold tracking-tighter uppercase">{log.id}</span>
                           </div>
                           <p className="text-xs font-black text-slate-600 leading-relaxed italic truncate group-hover:text-indigo-900 transition-colors">"{log.details}"</p>
                        </td>
                        <td className="px-12 py-8">
                           <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-xl group-hover:bg-indigo-600 transition-all">{log.actor.charAt(0)}</div>
                              <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight italic underline decoration-transparent group-hover:decoration-indigo-200">{log.actor}</span>
                           </div>
                        </td>
                        <td className="px-12 py-8">
                           <div className="text-[12px] font-black text-slate-900 uppercase tracking-tighter italic">{log.entityName}</div>
                           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{log.entityType} CLASS</div>
                        </td>
                        <td className="px-12 py-8 text-right">
                           <div className="text-[11px] font-black text-slate-900 italic tabular-nums">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                           <div className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </div>

      {/* Toggling Confirmation Modal */}
      {togglingUser && (
         <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center space-y-8">
               <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto text-3xl shadow-xl ${togglingUser.status === 'Active' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {togglingUser.status === 'Active' ? '🔒' : '🔓'}
               </div>
               <div>
                  <h4 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Confirm State Shift</h4>
                  <p className="text-sm text-slate-400 font-medium mt-3 leading-relaxed">
                     Authorize {togglingUser.status === 'Active' ? 'Suspension' : 'Activation'} of identity node: <br/>
                     <span className="text-indigo-600 font-black italic">{togglingUser.name}</span>
                  </p>
               </div>
               <div className="flex space-x-4">
                  <button onClick={() => setTogglingUser(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase">Abort</button>
                  <button onClick={() => toggleUserStatus(togglingUser)} className={`flex-1 py-4 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg transform active:scale-95 ${togglingUser.status === 'Active' ? 'bg-rose-600 shadow-rose-900/20' : 'bg-emerald-600 shadow-emerald-900/20'}`}>Authorize</button>
               </div>
            </div>
         </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            {editingRole || (!editingUser && activeTab === 'ROLES') ? (
              <RoleForm 
                initialData={editingRole} 
                onCancel={() => { setIsModalOpen(false); setEditingRole(undefined); }} 
                onSubmit={handleAddOrEditRole} 
              />
            ) : (
              <UserForm 
                initialData={editingUser} 
                availableRoles={roles} 
                onCancel={() => { setIsModalOpen(false); setEditingUser(undefined); }} 
                onSubmit={handleAddOrEditUser} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;
