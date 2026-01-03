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

  const auditStats = useMemo(() => {
    const userRoleLogs = auditLogs.filter(l => l.entityType === 'USER' || l.entityType === 'ROLE');
    return {
      total: userRoleLogs.length,
      creations: userRoleLogs.filter(l => l.action === 'CREATE').length,
      modifications: userRoleLogs.filter(l => l.action === 'UPDATE').length,
      deletions: userRoleLogs.filter(l => l.action === 'DELETE').length,
      statusChanges: userRoleLogs.filter(l => l.action === 'STATUS_CHANGE').length
    };
  }, [auditLogs]);

  const calculateDelta = (oldData: any, newData: any) => {
    const deltas: string[] = [];
    const trackableFields = ['name', 'email', 'phone', 'role', 'status', 'description'];
    
    trackableFields.forEach(field => {
      if (oldData[field] !== newData[field]) {
        const from = oldData[field] || 'EMPTY_NULL';
        const to = newData[field] || 'EMPTY_NULL';
        deltas.push(`[FIELD:${field.toUpperCase()}] ${from} → ${to}`);
      }
    });

    if (oldData.permissions && newData.permissions) {
      const oldP = oldData.permissions as UserPermissions;
      const newP = newData.permissions as UserPermissions;
      (Object.keys(newP) as Array<keyof UserPermissions>).forEach(mod => {
        if (oldP[mod] !== newP[mod]) {
          deltas.push(`[PERM:${mod.toUpperCase()}] ${oldP[mod]} → ${newP[mod]}`);
        }
      });
    }

    return deltas.length > 0 
      ? `MUTATION TRACE: ${deltas.join(' | ')}`
      : 'Structural verification performed. No attribute mutations detected.';
  };

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Target Type', 'Target Name', 'Hash ID', 'Details'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.actor,
      log.action,
      log.entityType,
      log.entityName,
      log.id,
      log.details.replace(/,/g, ';')
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexus_audit_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const jumpToTrace = (entityName: string) => {
    setSearchTerm(entityName);
    setActionFilter('ALL');
    setActiveTab('AUDIT');
  };

  const handleAddOrEditUser = (data: any) => {
    if (editingUser) {
      const delta = calculateDelta(editingUser, data);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
      addAuditLog({
        action: 'UPDATE',
        entityType: 'USER',
        entityName: data.name,
        details: delta
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
        details: `INITIAL IDENTITY PROVISIONING: Account context created for ${data.name} with ${data.role} access level.`
      });
    }
    setIsModalOpen(false);
    setEditingUser(undefined);
  };

  const handleAddOrEditRole = (data: Omit<Role, 'id'>) => {
    if (editingRole) {
      const delta = calculateDelta(editingRole, data);
      setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...data } : r));
      addAuditLog({
        action: 'UPDATE',
        entityType: 'ROLE',
        entityName: data.name,
        details: delta
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
        details: `SECURITY ARCHITECTURE SETUP: New blueprint "${data.name}" committed to registry.`
      });
    }
    setIsModalOpen(false);
    setEditingRole(undefined);
  };

  const executeStatusToggle = () => {
    if (!togglingUser) return;
    const user = togglingUser;
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';

    setUsers(prev => prev.map(u => {
      if (u.id === user.id) {
        addAuditLog({
          action: 'STATUS_CHANGE',
          entityType: 'USER',
          entityName: u.name,
          details: `LIFECYCLE TRANSITION: Account integrity status shifted from ${u.status.toUpperCase()} to ${newStatus.toUpperCase()}.`
        });
        return { ...u, status: newStatus as any };
      }
      return u;
    }));
    setTogglingUser(null);
  };

  const deleteUser = (user: User) => {
    if(confirm(`DESTRUCTIVE ACTION: Permanently purge identity context for ${user.name}? This action is irreversible.`)) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      addAuditLog({
        action: 'DELETE',
        entityType: 'USER',
        entityName: user.name,
        details: `IDENTITY DECOMMISSIONED: Identity Node [Hash: ${user.id}] removed from organizational registry.`
      });
    }
  };

  const deleteRole = (role: Role) => {
    if(confirm(`DESTRUCTIVE ACTION: Purge security blueprint "${role.name}"? Users assigned to this role may lose module access.`)) {
      setRoles(prev => prev.filter(r => r.id !== role.id));
      addAuditLog({
        action: 'DELETE',
        entityType: 'ROLE',
        entityName: role.name,
        details: `SECURITY BLUEPRINT PURGED: Access Tier [Hash: ${role.id}] decommissioned.`
      });
    }
  };

  const getUserActions = (user: User): ActionItem[] => [
    { label: 'Edit Identity', icon: '✏️', onClick: () => { setEditingUser(user); setIsModalOpen(true); }, variant: 'primary' },
    { label: 'Audit Trace', icon: '🔍', onClick: () => jumpToTrace(user.name) },
    { label: user.status === 'Active' ? 'Suspend Node' : 'Activate Node', icon: '🔒', onClick: () => setTogglingUser(user), variant: user.status === 'Active' ? 'danger' : 'success' },
    { label: 'Purge Context', icon: '🗑️', onClick: () => deleteUser(user), variant: 'danger' }
  ];

  const LogInspectorModal = ({ log }: { log: AuditLog }) => {
    const isMutation = log.details.startsWith('MUTATION TRACE:');
    const shards = isMutation 
      ? log.details.replace('MUTATION TRACE: ', '').split(' | ') 
      : [log.details];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
          <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
            <div className="relative z-10 flex items-center space-x-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transform -rotate-3 border-4 border-white/10 ${
                log.action === 'CREATE' ? 'bg-emerald-600' : 
                log.action === 'DELETE' ? 'bg-rose-600' : 
                log.action === 'UPDATE' ? 'bg-indigo-600' : 'bg-amber-600'
              }`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight italic">Forensic Inspector</h3>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em]">Hash Reference: {log.id}</p>
              </div>
            </div>
            <button onClick={() => setSelectedLog(null)} className="relative z-10 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-12 space-y-10">
             <div className="grid grid-cols-2 gap-8 border-b border-slate-100 pb-8">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Execution Timeline</label>
                  <div className="text-sm font-black text-slate-800">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Authorized Actor</label>
                  <div className="text-sm font-black text-indigo-600 uppercase italic underline underline-offset-4 decoration-indigo-100">{log.actor}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Subject Context</label>
                  <div className="text-sm font-black text-slate-800 uppercase italic">{log.entityName} <span className="text-slate-300 not-italic ml-1 font-bold">({log.entityType})</span></div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Operation Class</label>
                  <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${
                    log.action === 'DELETE' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>{log.action}</span>
                </div>
             </div>

             <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-200 shadow-inner">
                <label className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-6 block flex items-center">
                   <div className="w-1.5 h-4 bg-indigo-600 rounded-full mr-2"></div>
                   Payload Modifications
                </label>
                <div className="space-y-4">
                  {shards.map((shard, i) => (
                    <div key={i} className="flex items-start space-x-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-300 group-hover:text-indigo-600 transition-colors">{(i+1).toString().padStart(2, '0')}</div>
                      <p className="text-[12px] font-black text-slate-700 leading-relaxed italic">{shard}</p>
                    </div>
                  ))}
                </div>
             </div>

             <div className="pt-4 flex justify-end">
                <button onClick={() => setSelectedLog(null)} className="px-14 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-slate-950">Seal Inspector</button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Security Governance</h2>
          <p className="text-sm text-slate-500 font-medium mt-4">Modular Identity lifecycle and high-fidelity forensic stream.</p>
        </div>
        <div className="flex items-center space-x-4">
           {activeTab === 'AUDIT' && (
             <button onClick={exportAuditCSV} className="flex items-center space-x-3 px-8 py-4 bg-white border border-slate-200 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>Export Ledger</span>
             </button>
           )}
           <button 
            disabled={activeTab === 'AUDIT'}
            onClick={() => { setEditingUser(undefined); setEditingRole(undefined); setIsModalOpen(true); }}
            className={`flex items-center justify-center space-x-3 px-10 py-5 rounded-[1.5rem] font-black shadow-2xl transition-all transform active:scale-95 text-[10px] uppercase tracking-[0.2em] ${activeTab === 'AUDIT' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
           >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span>{activeTab === 'ROLES' ? 'Provision Blueprint' : 'Authorize Identity'}</span>
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
        {activeTab === 'AUDIT' ? (
          <div className="animate-in fade-in duration-500 flex flex-col h-full">
             <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-10 border-b border-slate-100 bg-slate-50/50">
               {[
                 { label: 'Event Points', value: auditStats.total, color: 'text-slate-800' },
                 { label: 'Provisioned', value: auditStats.creations, color: 'text-emerald-600' },
                 { label: 'Mutations', value: auditStats.modifications, color: 'text-indigo-600' },
                 { label: 'Decommissioned', value: auditStats.deletions, color: 'text-rose-600' },
                 { label: 'Risk Indices', value: auditStats.statusChanges, color: 'text-amber-600' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:-translate-y-1 transition-all">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500">{stat.label}</div>
                    <div className={`text-4xl font-black italic tracking-tighter tabular-nums ${stat.color}`}>{stat.value}</div>
                 </div>
               ))}
             </div>
             
             <div className="px-10 py-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="relative max-w-lg w-full">
                  <input 
                    type="text" 
                    placeholder="Query Forensic Matrix (Actor, Hash, Identity)..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-inner outline-none italic"
                  />
                  <svg className="w-6 h-6 text-slate-300 absolute left-5 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                   {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'].map(act => (
                     <button
                      key={act}
                      onClick={() => setActionFilter(act)}
                      className={`px-5 py-3 text-[9px] font-black uppercase tracking-tighter rounded-xl transition-all whitespace-nowrap ${actionFilter === act ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-700'}`}
                     >
                       {act === 'STATUS_CHANGE' ? 'RISK' : act}
                     </button>
                   ))}
                </div>
             </div>
             
             <div className="overflow-x-auto custom-scrollbar flex-1">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-12 py-7">Event Signature</th>
                      <th className="px-12 py-7">Authorized Actor</th>
                      <th className="px-12 py-7">Identity Subject</th>
                      <th className="px-12 py-7 text-right">Execution Moment</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-indigo-50/30 cursor-pointer transition-all group border-b border-slate-50 last:border-0 animate-in fade-in slide-in-from-left-2">
                        <td className="px-12 py-8 max-w-md">
                           <div className="flex items-center space-x-4 mb-3">
                              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black border tracking-widest ${
                                log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                log.action === 'DELETE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                log.action === 'STATUS_CHANGE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-indigo-50 text-indigo-600 border-indigo-100'
                              }`}>{log.action}</span>
                              <span className="font-mono text-[9px] text-slate-300 font-bold tracking-tighter uppercase">HASH: {log.id}</span>
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
                           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">CLASS: {log.entityType}</div>
                        </td>
                        <td className="px-12 py-8 text-right">
                           <div className="text-[11px] font-black text-slate-900 italic tabular-nums">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                           <div className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-widest">VERIFIED_BLOCK</div>
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-40 text-center">
                           <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
                             <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           </div>
                           <p className="text-sm font-black uppercase text-slate-300 tracking-[0.4em] italic">Forensic Matrix Exhausted</p>
                        </td>
                      </tr>
                    )}
                 </tbody>
               </table>
             </div>
          </div>
        ) : (
          <>
            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="relative max-w-lg w-full">
                <input 
                  type="text" 
                  placeholder={`Query ${activeTab.toLowerCase()} registry...`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 shadow-sm transition-all outline-none italic"
                />
                <svg className="w-6 h-6 text-slate-300 absolute left-5 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {activeTab === 'USERS' ? filteredUsers.length : filteredRoles.length} OBJECTS IN BUFFER
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              {activeTab === 'USERS' && (
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-12 py-7">Staff Node Identity</th>
                      <th className="px-12 py-7">Active Blueprint</th>
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
                          <span className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border-2 border-indigo-100 shadow-sm italic">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-12 py-8">
                           <button onClick={() => setTogglingUser(user)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-3 border-2 ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}>
                             <div className={`w-2.5 h-2.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
                             <span>{user.status}</span>
                           </button>
                        </td>
                        <td className="px-12 py-8 text-right">
                           <ActionMenu actions={getUserActions(user)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'ROLES' && (
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-12 py-7">Security Blueprint Profile</th>
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
                          <span className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${role.isSystem ? 'text-slate-400 bg-slate-100 border-slate-200' : 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-md animate-pulse'}`}>
                            {role.isSystem ? 'CORE-SYSTEM' : 'USER-DEFINED'}
                          </span>
                        </td>
                        <td className="px-12 py-8 text-right">
                           <ActionMenu actions={[
                             { label: 'Audit Trace', icon: '🔍', onClick: () => jumpToTrace(role.name) },
                             { label: 'Update Blueprint', icon: '✏️', onClick: () => { setEditingRole(role); setIsModalOpen(true); }, variant: 'primary' },
                             { label: 'Purge Blueprint', icon: '🗑️', onClick: () => deleteRole(role), variant: 'danger' }
                           ]} label={role.isSystem ? 'LOCKED' : 'ACTION'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal for Lifecycle Shifts */}
      {togglingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className={`px-10 py-10 ${togglingUser.status === 'Active' ? 'bg-rose-600' : 'bg-emerald-600'} text-white relative overflow-hidden`}>
              <div className="relative z-10 flex items-center space-x-5">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-lg border border-white/10 backdrop-blur-md">
                   {togglingUser.status === 'Active' ? '🔒' : '🔓'}
                </div>
                <div>
                   <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Access Guard</h3>
                   <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-80 mt-2">Integrity Confirmation</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-[80px] opacity-20 -mr-24 -mt-24"></div>
            </div>
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto mb-8 border-2 border-slate-100 shadow-inner text-3xl">
                ⚠️
              </div>
              <p className="text-base font-bold text-slate-600 leading-relaxed italic">
                Confirm {togglingUser.status === 'Active' ? 'Deactivation' : 'Activation'} of <span className="text-slate-900 font-black uppercase underline decoration-indigo-200 underline-offset-4">{togglingUser.name}</span>?
              </p>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mt-6 border-t border-slate-50 pt-6">Action will be committed to forensic ledger.</p>
              
              <div className="mt-10 flex flex-col space-y-4">
                <button 
                  onClick={executeStatusToggle}
                  className={`w-full py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] text-white shadow-2xl transition-all transform active:scale-95 border-b-8 border-black/20 ${togglingUser.status === 'Active' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  Confirm & Commit Shift
                </button>
                <button 
                  onClick={() => setTogglingUser(null)}
                  className="w-full py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Abort Protocol
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            {editingRole || (!editingUser && activeTab === 'ROLES') ? (
              <RoleForm initialData={editingRole} onCancel={() => { setIsModalOpen(false); setEditingRole(undefined); }} onSubmit={handleAddOrEditRole} />
            ) : (
              <UserForm initialData={editingUser} availableRoles={roles} onCancel={() => { setIsModalOpen(false); setEditingUser(undefined); }} onSubmit={handleAddOrEditUser} />
            )}
          </div>
        </div>
      )}

      {selectedLog && <LogInspectorModal log={selectedLog} />}
    </div>
  );
};

export default UsersModule;