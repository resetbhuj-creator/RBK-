import React, { useState, useMemo } from 'react';
import { User, Role, UserPermissions, AuditLog } from '../types';
import UserForm from './UserForm';
import RoleForm from './RoleForm';
import ImportExportModule from './ImportExportModule';
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
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES' | 'MATRIX' | 'AUDIT'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

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
        log.actor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      
      return matchesSearch && matchesAction;
    });
  }, [auditLogs, searchTerm, actionFilter]);

  const auditTrends = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = auditLogs.filter(l => new Date(l.timestamp).toDateString() === today);
    return {
      total: auditLogs.length,
      today: todayLogs.length,
      creations: auditLogs.filter(l => l.action === 'CREATE').length,
      security: auditLogs.filter(l => l.action === 'STATUS_CHANGE').length
    };
  }, [auditLogs]);

  const getChangeSummary = (oldData: any, newData: any) => {
    const changes: string[] = [];
    Object.keys(newData).forEach(key => {
      if (key === 'permissions') {
        const oldPerms = oldData[key] as UserPermissions;
        const newPerms = newData[key] as UserPermissions;
        Object.keys(newPerms).forEach(pKey => {
          const modKey = pKey as keyof UserPermissions;
          if (oldPerms[modKey] !== newPerms[modKey]) {
            changes.push(`${modKey} perm: ${oldPerms[modKey]} -> ${newPerms[modKey]}`);
          }
        });
      } else if (key !== 'id' && key !== 'lastLogin' && oldData[key] !== newData[key]) {
        changes.push(`${key}: "${oldData[key]}" -> "${newData[key]}"`);
      }
    });
    return changes.length > 0 ? `Modified: ${changes.join(', ')}` : 'No attribute changes detected.';
  };

  const handleAddOrEditUser = (data: any) => {
    if (editingUser) {
      const changeLog = getChangeSummary(editingUser, data);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
      addAuditLog({
        action: 'UPDATE',
        entityType: 'USER',
        entityName: data.name,
        details: changeLog
      });
    } else {
      const newUser: User = {
        ...data,
        id: `u-${Math.random().toString(36).substr(2, 9)}`,
        lastLogin: 'Never'
      };
      setUsers(prev => [...prev, newUser]);
      addAuditLog({
        action: 'CREATE',
        entityType: 'USER',
        entityName: data.name,
        details: `Initial identity provisioning for ${data.name} as ${data.role}`
      });
    }
    setIsModalOpen(false);
    setEditingUser(undefined);
  };

  const handleAddOrEditRole = (data: Omit<Role, 'id'>) => {
    if (editingRole) {
      const changeLog = getChangeSummary(editingRole, data);
      setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...data } : r));
      addAuditLog({
        action: 'UPDATE',
        entityType: 'ROLE',
        entityName: data.name,
        details: changeLog
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
        details: `Defined new security profile: ${data.name}`
      });
    }
    setIsModalOpen(false);
    setEditingRole(undefined);
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        addAuditLog({
          action: 'STATUS_CHANGE',
          entityType: 'USER',
          entityName: u.name,
          details: `Lifecycle transition: ${u.status} -> ${newStatus}`
        });
        return { ...u, status: newStatus as any };
      }
      return u;
    }));
  };

  const deleteRole = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role?.isSystem) {
      alert("System Lock: Core profiles are immutable.");
      return;
    }
    if (confirm('Permanently remove this custom security blueprint?')) {
      setRoles(prev => prev.filter(r => r.id !== id));
      if (role) {
        addAuditLog({
          action: 'DELETE',
          entityType: 'ROLE',
          entityName: role.name,
          details: `Purged custom access role: ${role.name}`
        });
      }
    }
  };

  const getUserActions = (user: User): ActionItem[] => [
    { 
      label: 'Edit Profile', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
      onClick: () => { setEditingUser(user); setIsModalOpen(true); },
      variant: 'primary'
    },
    { 
      label: user.status === 'Active' ? 'Suspend Account' : 'Reactivate Account', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
      onClick: () => toggleUserStatus(user.id),
      variant: user.status === 'Active' ? 'danger' : 'success'
    },
    { 
      label: 'Purge Identity', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
      onClick: () => {
        if (confirm('Suspend staff account?')) {
          setUsers(prev => prev.filter(u => u.id !== user.id));
          addAuditLog({
            action: 'DELETE',
            entityType: 'USER',
            entityName: user.name,
            details: `Removed staff member identity: ${user.name}`
          });
        }
      },
      variant: 'danger'
    }
  ];

  const getRoleActions = (role: Role): ActionItem[] => {
    const actions: ActionItem[] = [
      { 
        label: 'View Blueprint', 
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
        onClick: () => { setEditingRole(role); setIsModalOpen(true); }
      }
    ];

    if (!role.isSystem) {
      actions.push({ 
        label: 'Modify Access', 
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
        onClick: () => { setEditingRole(role); setIsModalOpen(true); },
        variant: 'primary'
      });
      actions.push({ 
        label: 'Delete Role', 
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
        onClick: () => deleteRole(role.id),
        variant: 'danger'
      });
    }

    return actions;
  };

  const getPermColor = (level: string) => {
    switch(level) {
      case 'all': return 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
      case 'write': return 'bg-indigo-500 shadow-[0_0_8px_#6366f1]';
      case 'read': return 'bg-sky-400 shadow-[0_0_8px_#38bdf8]';
      default: return 'bg-slate-200';
    }
  };

  const getPermLabel = (level: string) => {
    if (level === 'all') return 'A';
    if (level === 'write') return 'W';
    if (level === 'read') return 'R';
    return '-';
  };

  if (isImporting) {
    return (
      <div className="animate-in fade-in duration-500">
        <ImportExportModule 
          forcedEntity="Users" 
          initialTab="IMPORT"
          initialFormat="CSV"
          onClose={() => setIsImporting(false)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Identity Governance</h2>
          <p className="text-sm text-slate-500 font-medium">Provision staff credentials and manage organizational security profiles.</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'USERS' && (
            <button 
              onClick={() => setIsImporting(true)}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-black shadow-xl hover:bg-slate-700 transition-all transform active:scale-95 text-[10px] uppercase tracking-widest border border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
              <span>Bulk Ingest</span>
            </button>
          )}
          <button 
            disabled={activeTab === 'AUDIT'}
            onClick={() => { setEditingUser(undefined); setEditingRole(undefined); setIsModalOpen(true); }}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-black shadow-xl transition-all transform active:scale-95 text-[10px] uppercase tracking-widest ${activeTab === 'AUDIT' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span>{activeTab === 'ROLES' ? 'Define Role' : 'New Identity'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-1 bg-slate-200/50 rounded-2xl w-full border border-slate-200">
        <div className="flex p-1 space-x-1 overflow-x-auto no-scrollbar">
          {(['USERS', 'ROLES', 'MATRIX', 'AUDIT'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab === 'ROLES' ? 'Custom Roles' : tab === 'MATRIX' ? 'Access Matrix' : tab === 'AUDIT' ? 'Audit Logs' : 'Staff Directory'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'AUDIT' ? (
          <div className="animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-8 border-b border-slate-100 bg-slate-50/30">
               {[
                 { label: 'Total Events', value: auditTrends.total, color: 'text-slate-800' },
                 { label: 'Today\'s Scan', value: auditTrends.today, color: 'text-indigo-600' },
                 { label: 'Identity Provisioning', value: auditTrends.creations, color: 'text-emerald-600' },
                 { label: 'Security Toggles', value: auditTrends.security, color: 'text-rose-600' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                 </div>
               ))}
             </div>
             
             <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                  <input 
                    type="text" 
                    placeholder="Search modification hash or operator..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                   {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'].map(act => (
                     <button
                      key={act}
                      onClick={() => setActionFilter(act)}
                      className={`px-4 py-2 text-[8px] font-black uppercase tracking-tighter rounded-lg transition-all ${actionFilter === act ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                     >
                       {act.replace('_', ' ')}
                     </button>
                   ))}
                </div>
             </div>
             
             <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left">
                 <thead className="bg-slate-900 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-10 py-5">TXN Hash / Detailed Modification</th>
                      <th className="px-10 py-5 text-center">Class</th>
                      <th className="px-10 py-5 text-center">Action</th>
                      <th className="px-10 py-5">Target Name</th>
                      <th className="px-10 py-5">Operator</th>
                      <th className="px-10 py-5 text-right">Execution Time</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-10 py-6 max-w-md">
                           <div className="flex flex-col">
                              <span className="font-mono text-[9px] text-indigo-400 mb-1.5 font-black uppercase tracking-tighter"># {log.id}</span>
                              <span className="text-xs font-black text-slate-700 tracking-tight leading-relaxed italic">{log.details}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-center">
                           <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200">
                              {log.entityType}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-center">
                           <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                             log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             log.action === 'DELETE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                             log.action === 'STATUS_CHANGE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                             'bg-indigo-50 text-indigo-600 border-indigo-100'
                           }`}>
                              {log.action.replace('_', ' ')}
                           </span>
                        </td>
                        <td className="px-10 py-6">
                           <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{log.entityName}</span>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-white shadow-lg group-hover:-rotate-6 transition-transform">{log.actor.charAt(0)}</div>
                              <span className="text-[11px] font-bold text-slate-600">{log.actor}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <div className="text-[10px] font-black text-slate-800">{new Date(log.timestamp).toLocaleDateString()}</div>
                           <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-10 py-24 text-center">
                           <div className="flex flex-col items-center">
                             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             </div>
                             <h5 className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">Zero transactional evidence recorded.</h5>
                           </div>
                        </td>
                      </tr>
                    )}
                 </tbody>
               </table>
             </div>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="relative max-w-md w-full">
                <input 
                  type="text" 
                  placeholder={`Filter ${activeTab.toLowerCase().replace('matrix', 'access matrix')}...`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              {activeTab === 'USERS' && (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-10 py-5">Staff Identity</th>
                      <th className="px-10 py-5">Role Assignment</th>
                      <th className="px-10 py-5">Blueprint Integrity</th>
                      <th className="px-10 py-5">Lifecycle</th>
                      <th className="px-10 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border-2 border-white shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:-rotate-3">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-black text-slate-800 text-sm tracking-tight truncate">{user.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-widest">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center space-x-1.5">
                            {Object.entries(user.permissions).map(([mod, level]) => (
                              <div key={mod} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black text-white ${getPermColor(level as string)}`} title={`${mod.toUpperCase()}: ${level}`}>
                                {getPermLabel(level as string)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-10 py-6">
                           <button 
                            onClick={() => toggleUserStatus(user.id)}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 border ${
                             user.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                            }`}
                           >
                             <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                             <span>{user.status}</span>
                           </button>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <ActionMenu actions={getUserActions(user)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'ROLES' && (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-10 py-5">Custom Access Blueprint</th>
                      <th className="px-10 py-5">Active Allocation</th>
                      <th className="px-10 py-5">Fingerprint (C|A|T|D)</th>
                      <th className="px-10 py-5">Authority Class</th>
                      <th className="px-10 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRoles.map((role) => {
                      const assignedCount = users.filter(u => u.role === role.name).length;
                      return (
                        <tr key={role.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-10 py-6">
                            <div className="font-black text-slate-800 text-sm tracking-tight">{role.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-0.5 max-w-[300px] truncate uppercase tracking-tighter">{role.description || 'Custom organizational security profile.'}</div>
                          </td>
                          <td className="px-10 py-6">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${assignedCount > 0 ? 'text-indigo-600 bg-indigo-50 border border-indigo-100' : 'text-slate-400 bg-slate-50 border border-slate-100'}`}>
                              {assignedCount} Active Users
                            </span>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex items-center space-x-1.5">
                              {Object.entries(role.permissions).map(([mod, level]) => (
                                <div key={mod} className="flex flex-col items-center">
                                  <div className={`w-7 h-7 rounded-xl mb-1.5 flex items-center justify-center text-[10px] font-black text-white ${getPermColor(level as string)} transition-transform group-hover:scale-110 shadow-sm`} title={`${mod.toUpperCase()}: ${level}`}>
                                      {getPermLabel(level as string)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${role.isSystem ? 'text-slate-500 bg-slate-100 border border-slate-200' : 'text-emerald-600 bg-emerald-50 border border-emerald-100 shadow-sm'}`}>
                              {role.isSystem ? 'Core Platform' : 'Custom Built'}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-right">
                             <ActionMenu actions={getRoleActions(role)} label={role.isSystem ? 'Core' : 'Action'} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {activeTab === 'MATRIX' && (
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-10 py-6 sticky left-0 bg-slate-900 text-white z-10 border-r border-slate-800">Identity Master</th>
                      <th className="px-10 py-6 text-center">Company</th>
                      <th className="px-10 py-6 text-center">Administration</th>
                      <th className="px-10 py-6 text-center">Transaction</th>
                      <th className="px-10 py-6 text-center">Display/Audit</th>
                      <th className="px-10 py-6 text-center">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-6 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm">
                           <div className="flex flex-col">
                             <span className="font-black text-slate-800 text-xs tracking-tight">{user.name}</span>
                             <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">{user.role}</span>
                           </div>
                        </td>
                        {(['company', 'administration', 'transaction', 'display'] as const).map(mod => {
                           const val = user.permissions[mod];
                           return (
                            <td key={mod} className="px-10 py-6 text-center">
                               <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-white text-[10px] shadow-lg ${getPermColor(val as string)}`}>
                                 {getPermLabel(val as string)}
                               </div>
                            </td>
                           );
                        })}
                        <td className="px-10 py-6 text-center">
                           <div className={`w-2.5 h-2.5 rounded-full mx-auto shadow-[0_0_8px_rgba(0,0,0,0.05)] ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]'}`}></div>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-5xl">
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