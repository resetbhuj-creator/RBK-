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
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp' | 'actor'>) => void;
}

const UsersModule: React.FC<UsersModuleProps> = ({ users, setUsers, roles, setRoles, auditLogs, addAuditLog }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES' | 'AUDIT'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = useMemo(() => 
    auditLogs.filter(log => log.entityType === 'USER' || log.entityType === 'ROLE').sort((a,b) => b.timestamp.localeCompare(a.timestamp)),
  [auditLogs]);

  const handleAddOrEditUser = (data: any) => {
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
      addAuditLog({
        action: 'UPDATE',
        entityType: 'USER',
        entityName: data.name,
        details: `Identity modifications committed for node: ${data.name}. Authorization matrix synchronized.`
      });
    } else {
      const newUser: User = {
        ...data,
        id: `u-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        lastLogin: 'NEVER'
      };
      setUsers(prev => [...prev, newUser]);
      addAuditLog({
        action: 'CREATE',
        entityType: 'USER',
        entityName: data.name,
        details: `New identity shard provisioned under ${data.role} blueprint.`
      });
    }
    setIsModalOpen(false);
    setEditingUser(undefined);
  };

  const PermissionMarkers = ({ permissions }: { permissions: UserPermissions }) => {
     const getC = (l: string) => l === 'all' ? 'bg-emerald-500' : l === 'write' ? 'bg-indigo-500' : l === 'read' ? 'bg-blue-400' : 'bg-slate-200';
     return (
       <div className="flex space-x-1">
         <div className={`w-1.5 h-1.5 rounded-full ${getC(permissions.company)}`} title="Company" />
         <div className={`w-1.5 h-1.5 rounded-full ${getC(permissions.administration)}`} title="Admin" />
         <div className={`w-1.5 h-1.5 rounded-full ${getC(permissions.transaction)}`} title="Transaction" />
         <div className={`w-1.5 h-1.5 rounded-full ${getC(permissions.display)}`} title="Display" />
       </div>
     );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Identity Hub</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 italic">Organizational Personnel Registry & Authorization Matrix</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-200/50 p-1.5 rounded-[2rem] border border-slate-200 shadow-inner">
           {(['USERS', 'ROLES', 'AUDIT'] as const).map(tab => (
             <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800'}`}
             >
               {tab === 'AUDIT' ? 'Activity Log' : tab}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'USERS' && (
        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
           <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Query identity registry..." className="w-full max-w-xl pl-12 pr-6 py-4 rounded-3xl border border-slate-200 text-sm font-black shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all italic bg-white" />
              <button onClick={() => { setEditingUser(undefined); setIsModalOpen(true); }} className="px-8 py-4 bg-slate-950 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-black/40">Register Account</button>
           </div>
           <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left">
                 <thead className="bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-900">
                    <tr>
                       <th className="px-10 py-7">Personnel Identity</th>
                       <th className="px-10 py-7">Authorization Shard</th>
                       <th className="px-10 py-7 text-center">Perm Matrix</th>
                       <th className="px-10 py-7 text-center">Integrity</th>
                       <th className="px-10 py-7 text-right">Operations</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-indigo-50/20 transition-all group">
                         <td className="px-10 py-6">
                            <div className="flex items-center space-x-5">
                               <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border-2 border-white shadow-xl transform transition-transform group-hover:scale-110 group-hover:-rotate-6">{user.name.charAt(0)}</div>
                               <div>
                                  <div className="text-sm font-black text-slate-800 uppercase italic tracking-tighter group-hover:text-indigo-600 transition-colors">{user.name}</div>
                                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-1 underline decoration-slate-100">{user.email}</div>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border-2 bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm">{user.role}</span>
                         </td>
                         <td className="px-10 py-6">
                            <div className="flex flex-col items-center space-y-1.5">
                               <PermissionMarkers permissions={user.permissions} />
                               <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">C • A • T • D</span>
                            </div>
                         </td>
                         <td className="px-10 py-6 text-center">
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{user.status}</span>
                         </td>
                         <td className="px-10 py-6 text-right">
                            <ActionMenu label="SECURE" actions={[
                               { label: 'Update Matrix', icon: '✏️', onClick: () => { setEditingUser(user); setIsModalOpen(true); }, variant: 'primary' },
                               { label: 'Revoke Node', icon: '🔒', onClick: () => {}, variant: 'danger' }
                            ]} />
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="bg-slate-950 rounded-[4rem] border border-slate-800 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
           <div className="p-10 border-b border-slate-900 bg-black/20 flex justify-between items-center">
              <h4 className="text-xl font-black italic text-indigo-400 uppercase tracking-tighter leading-none">Security activity stream</h4>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Forensic Trace Protocol Active</div>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                 <thead className="bg-black/40 text-[9px] font-black uppercase tracking-widest text-slate-600 sticky top-0 z-10 shadow-lg">
                    <tr>
                       <th className="px-10 py-6">Trace Moment</th>
                       <th className="px-10 py-6">Authorized Actor</th>
                       <th className="px-10 py-6">Target Identity</th>
                       <th className="px-10 py-6">Protocol Action</th>
                       <th className="px-10 py-6 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {filteredLogs.map(log => (
                       <tr key={log.id} className="hover:bg-white/5 transition-colors group border-b border-white/2">
                          <td className="px-10 py-5">
                             <div className="text-[10px] font-black text-slate-400 tabular-nums italic">{new Date(log.timestamp).toLocaleTimeString()}</div>
                             <div className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">{new Date(log.timestamp).toLocaleDateString()}</div>
                          </td>
                          <td className="px-10 py-5">
                             <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black text-[10px] border border-indigo-600/20">{log.actor.charAt(0)}</div>
                                <span className="text-[11px] font-black text-slate-300 uppercase tracking-tight">{log.actor}</span>
                             </div>
                          </td>
                          <td className="px-10 py-5">
                             <div className="text-[11px] font-black text-white italic tracking-tighter uppercase">{log.entityName}</div>
                             <div className="text-[8px] font-bold text-slate-500 uppercase mt-1">{log.entityType} SHARD</div>
                          </td>
                          <td className="px-10 py-5">
                             <span className={`text-[9px] font-black uppercase tracking-widest ${log.action === 'CREATE' ? 'text-emerald-400' : 'text-amber-400'}`}>{log.action}</span>
                             <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic mt-1.5 max-w-sm truncate group-hover:whitespace-normal group-hover:text-slate-300 transition-all">"{log.details}"</p>
                          </td>
                          <td className="px-10 py-5 text-right">
                             <span className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase border border-white/5 text-emerald-500 tracking-widest">VERIFIED</span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl rounded-[3.5rem]">
              <UserForm 
                initialData={editingUser} 
                availableRoles={roles} 
                onCancel={() => { setIsModalOpen(false); setEditingUser(undefined); }} 
                onSubmit={handleAddOrEditUser} 
              />
           </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;
