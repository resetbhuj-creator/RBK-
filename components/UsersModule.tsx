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
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES' | 'MATRIX' | 'AUDIT'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

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

  const auditTrends = useMemo(() => {
    const today = new Date().toDateString();
    const userRoleLogs = auditLogs.filter(l => l.entityType === 'USER' || l.entityType === 'ROLE');
    const todayLogs = userRoleLogs.filter(l => new Date(l.timestamp).toDateString() === today);
    return {
      total: userRoleLogs.length,
      today: todayLogs.length,
      creations: userRoleLogs.filter(l => l.action === 'CREATE').length,
      modifications: userRoleLogs.filter(l => l.action === 'UPDATE').length,
      security: userRoleLogs.filter(l => l.action === 'STATUS_CHANGE').length
    };
  }, [auditLogs]);

  // Forensic Delta Engine: Generates structured change strings for the audit log
  const calculateDelta = (oldData: any, newData: any) => {
    const deltas: string[] = [];
    
    // Core Identity Fields
    const trackableFields = ['name', 'email', 'phone', 'role', 'status', 'description'];
    trackableFields.forEach(field => {
      if (oldData[field] !== newData[field]) {
        const from = oldData[field] || 'NULL';
        const to = newData[field] || 'NULL';
        deltas.push(`[${field.toUpperCase()}] ${from} → ${to}`);
      }
    });

    // Deep Permissions Scan for User and Role objects
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
      ? `MODIFICATION TRACE: ${deltas.join(' | ')}`
      : 'CONTEXT VERIFIED: Record saved without attribute mutations.';
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
        lastLogin: 'Never'
      };
      setUsers(prev => [...prev, newUser]);
      addAuditLog({
        action: 'CREATE',
        entityType: 'USER',
        entityName: data.name,
        details: `INITIAL PROVISIONING: Identity context defined for ${data.name} with ${data.role} privileges.`
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
        details: `SECURITY BLUEPRINT: New access tier "${data.name}" committed to registry.`
      });
    }
    setIsModalOpen(false);
    setEditingRole(undefined);
  };

  const toggleUserStatus = (user: User) => {
    setUsers(prev => prev.map(u => {
      if (u.id === user.id) {
        const newStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        addAuditLog({
          action: 'STATUS_CHANGE',
          entityType: 'USER',
          entityName: u.name,
          details: `LIFECYCLE SHIFT: Account integrity status changed from ${u.status} to ${newStatus}.`
        });
        return { ...u, status: newStatus as any };
      }
      return u;
    }));
  };

  const deleteUser = (user: User) => {
    if(confirm(`DESTRUCTION PROTOCOL: Permanently remove ${user.name} from the organizational registry? This action is immutable.`)) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      addAuditLog({
        action: 'DELETE',
        entityType: 'USER',
        entityName: user.name,
        details: `PURGE SEQUENCE: Staff Identity "${user.name}" [ID: ${user.id}] has been decommissioned and detached from all modules.`
      });
    }
  };

  const deleteRole = (role: Role) => {
    const linkedUsers = users.filter(u => u.role === role.name);
    if(linkedUsers.length > 0) {
      alert(`PURGE REJECTED: Role "${role.name}" is currently assigned to ${linkedUsers.length} staff nodes. Reassign identities before deletion.`);
      return;
    }
    if(confirm(`DESTRUCTION PROTOCOL: Purge security blueprint "${role.name}"?`)) {
      setRoles(prev => prev.filter(r => r.id !== role.id));
      addAuditLog({
        action: 'DELETE',
        entityType: 'ROLE',
        entityName: role.name,
        details: `PURGE SEQUENCE: Security Blueprint "${role.name}" has been revoked and removed from policy storage.`
      });
    }
  };

  const getUserActions = (user: User): ActionItem[] => [
    { 
      label: 'Edit Identity', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
      onClick: () => { setEditingUser(user); setIsModalOpen(true); },
      variant: 'primary'
    },
    { 
      label: 'Lifecycle Trace', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      onClick: () => jumpToTrace(user.name)
    },
    { 
      label: user.status === 'Active' ? 'Suspend Access' : 'Restore Access', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
      onClick: () => toggleUserStatus(user),
      variant: user.status === 'Active' ? 'danger' : 'success'
    },
    {
      label: 'Purge Identity',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
      onClick: () => deleteUser(user),
      variant: 'danger'
    }
  ];

  const getRoleActions = (role: Role): ActionItem[] => {
    const actions: ActionItem[] = [
      { 
        label: 'Trace Blueprint', 
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        onClick: () => jumpToTrace(role.name)
      },
      { 
        label: 'Update Blueprint', 
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
        onClick: () => { setEditingRole(role); setIsModalOpen(true); },
        variant: 'primary'
      }
    ];

    if (!role.isSystem) {
      actions.push({
        label: 'Purge Blueprint',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
        onClick: () => deleteRole(role),
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

  const LogInspectorModal = ({ log }: { log: AuditLog }) => {
    const isTrace = log.details.startsWith('MODIFICATION TRACE:');
    const deltas = isTrace 
      ? log.details.replace('MODIFICATION TRACE: ', '').split(' | ') 
      : null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
          <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
            <div className="relative z-10 flex items-center space-x-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transform -rotate-3 border-4 border-white/10 ${
                log.action === 'CREATE' ? 'bg-emerald-600' : 
                log.action === 'DELETE' ? 'bg-rose-600' : 'bg-indigo-600'
              }`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight italic">Forensic Analysis</h3>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em]">Hash: {log.id}</p>
              </div>
            </div>
            <button onClick={() => setSelectedLog(null)} className="relative z-10 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-10 -mr-32 -mt-32"></div>
          </div>

          <div className="p-10 space-y-10">
             <div className="grid grid-cols-2 gap-10">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Execution Moment</label>
                  <div className="text-sm font-black text-slate-800">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Authorized Actor</label>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 border border-slate-200">{log.actor.charAt(0)}</div>
                    <div className="text-sm font-black text-slate-800">{log.actor}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Target Subject</label>
                  <div className="text-sm font-black text-indigo-600 uppercase italic">{log.entityName} <span className="text-slate-300 not-italic ml-1">({log.entityType})</span></div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Operation Type</label>
                  <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase border shadow-sm ${
                    log.action === 'DELETE' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>{log.action}</span>
                </div>
             </div>

             <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 relative overflow-hidden shadow-inner min-h-[160px]">
                <label className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-5 block">Functional Payload Visualizer</label>
                
                {deltas ? (
                  <div className="space-y-4">
                    {deltas.map((d, i) => {
                      const [field, values] = d.split('] ');
                      const [oldVal, newVal] = values.split(' → ');
                      return (
                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-24 truncate">{field.replace('[', '')}</span>
                           <div className="flex items-center space-x-4 flex-1 justify-center">
                              <span className="text-[10px] font-bold text-rose-500 line-through decoration-2 opacity-60">{oldVal}</span>
                              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                              <span className="text-[11px] font-black text-emerald-600 uppercase italic tracking-tight">{newVal}</span>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs font-medium text-slate-700 leading-relaxed italic border-l-4 border-indigo-200 pl-6 py-2">
                     {log.details}
                  </div>
                )}
             </div>

             <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button onClick={() => setSelectedLog(null)} className="px-14 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-4 border-slate-950">Close Forensic Stream</button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const logsByDate = useMemo(() => {
    const groups: Record<string, AuditLog[]> = {};
    filteredLogs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return Object.entries(groups);
  }, [filteredLogs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Security Governance</h2>
          <p className="text-sm text-slate-500 font-medium mt-3">Identity provisioning and immutable forensic logging system.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            disabled={activeTab === 'AUDIT'}
            onClick={() => { setEditingUser(undefined); setEditingRole(undefined); setIsModalOpen(true); }}
            className={`flex items-center justify-center space-x-3 px-8 py-4 rounded-[1.5rem] font-black shadow-2xl transition-all transform active:scale-95 text-[10px] uppercase tracking-[0.2em] ${activeTab === 'AUDIT' ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span>{activeTab === 'ROLES' ? 'Construct Blueprint' : 'Authorize New Identity'}</span>
          </button>
        </div>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-[2.5rem] border border-slate-200 w-full shadow-inner overflow-x-auto no-scrollbar">
          {(['USERS', 'ROLES', 'MATRIX', 'AUDIT'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-indigo-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab === 'ROLES' ? 'Access Tiers' : tab === 'MATRIX' ? 'Auth Matrix' : tab === 'AUDIT' ? 'Forensic Stream' : 'Staff Registry'}
            </button>
          ))}
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        {activeTab === 'AUDIT' ? (
          <div className="animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-10 border-b border-slate-100 bg-slate-50/50">
               {[
                 { label: 'Integrity Points', value: auditTrends.total, color: 'text-slate-800' },
                 { label: 'Active Sessions', value: auditTrends.today, color: 'text-indigo-600' },
                 { label: 'Provisioned', value: auditTrends.creations, color: 'text-emerald-600' },
                 { label: 'Mutations', value: auditTrends.modifications, color: 'text-sky-600' },
                 { label: 'Policy Shifts', value: auditTrends.security, color: 'text-rose-600' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className={`text-3xl font-black italic tracking-tighter tabular-nums ${stat.color}`}>{stat.value}</div>
                 </div>
               ))}
             </div>
             
             <div className="px-10 py-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                <div className="relative max-w-lg w-full">
                  <input 
                    type="text" 
                    placeholder="Search Audit Ledger (Identity, Hash, Action)..." 
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
                      className={`px-5 py-3 text-[9px] font-black uppercase tracking-tighter rounded-xl transition-all whitespace-nowrap ${actionFilter === act ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-700'}`}
                     >
                       {act === 'STATUS_CHANGE' ? 'LIFECYCLE' : act === 'UPDATE' ? 'MUTATION' : act.replace('_', ' ')}
                     </button>
                   ))}
                </div>
             </div>
             
             <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-900">
                    <tr>
                      <th className="px-12 py-7">Forensic Event Detail</th>
                      <th className="px-12 py-7 text-center">Class</th>
                      <th className="px-12 py-7">Subject Entity</th>
                      <th className="px-12 py-7">Authorized Actor</th>
                      <th className="px-12 py-7 text-right">Moment</th>
                    </tr>
                 </thead>
                 <tbody>
                    {logsByDate.map(([date, logs]) => (
                      <React.Fragment key={date}>
                        <tr className="bg-slate-50/80 sticky top-[92px] z-[15] backdrop-blur-md">
                          <td colSpan={5} className="px-12 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-y border-slate-100 italic">{date}</td>
                        </tr>
                        {logs.map((log) => (
                          <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-indigo-50/30 cursor-pointer transition-all group border-b border-slate-50 last:border-0">
                            <td className="px-12 py-8 max-w-md">
                               <div className="flex flex-col">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <span className={`px-2.5 py-1 rounded text-[8px] font-black border transition-all ${
                                      log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                      log.action === 'DELETE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                      log.action === 'STATUS_CHANGE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                      'bg-indigo-50 text-indigo-600 border-indigo-100'
                                    }`}>{log.action === 'STATUS_CHANGE' ? 'LIFECYCLE' : log.action}</span>
                                    <span className="font-mono text-[9px] text-slate-300 font-bold tracking-tighter uppercase">NX-TRC: {log.id}</span>
                                  </div>
                                  <span className="text-xs font-black text-slate-700 leading-relaxed italic tracking-tight group-hover:text-indigo-900 transition-colors line-clamp-1">{log.details}</span>
                               </div>
                            </td>
                            <td className="px-12 py-8 text-center">
                               <span className="px-3 py-1.5 bg-white border border-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm group-hover:shadow-indigo-100 transition-all">
                                  {log.entityType}
                               </span>
                            </td>
                            <td className="px-12 py-8">
                               <span className="text-[12px] font-black text-slate-900 uppercase tracking-tighter hover:text-indigo-600 transition-all italic underline decoration-transparent group-hover:decoration-indigo-200 underline-offset-4">{log.entityName}</span>
                            </td>
                            <td className="px-12 py-8">
                               <div className="flex items-center space-x-4">
                                  <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-xl group-hover:-rotate-12 transition-transform border border-white/20">{log.actor.charAt(0)}</div>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{log.actor}</span>
                                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic opacity-60">Identity Verified</span>
                                  </div>
                               </div>
                            </td>
                            <td className="px-12 py-8 text-right">
                               <div className="text-[11px] font-black text-slate-900 italic tabular-nums">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                               <div className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-widest opacity-60">SEQ-POST</div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        ) : (
          <>
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="relative max-w-lg w-full">
                <input 
                  type="text" 
                  placeholder={`Query active ${activeTab.toLowerCase()} registry...`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 shadow-sm transition-all outline-none italic"
                />
                <svg className="w-6 h-6 text-slate-300 absolute left-5 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{filteredUsers.length + filteredRoles.length} Records Detected</span>
              </div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              {activeTab === 'USERS' && (
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-900">
                    <tr>
                      <th className="px-12 py-7">Staff Identity Node</th>
                      <th className="px-12 py-7">Designation Tier</th>
                      <th className="px-12 py-7">Authority Map</th>
                      <th className="px-12 py-7">Account Lifecycle</th>
                      <th className="px-12 py-7 text-right">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-12 py-8">
                          <div className="flex items-center space-x-6">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border-2 border-white shadow-xl group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:-rotate-3 group-hover:scale-105 text-xl">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-black text-slate-800 text-base tracking-tighter truncate uppercase italic">{user.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-widest mt-1">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-12 py-8">
                          <span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-12 py-8">
                          <div className="flex items-center space-x-2">
                            {Object.entries(user.permissions).map(([mod, level]) => (
                              <div key={mod} className={`w-7 h-7 rounded-xl flex items-center justify-center text-[9px] font-black text-white ${getPermColor(level as string)} transition-transform hover:scale-125 cursor-help`} title={`${mod.toUpperCase()}: ${level}`}>
                                {getPermLabel(level as string)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-12 py-8">
                           <button onClick={() => toggleUserStatus(user)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center space-x-3 border-2 ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}>
                             <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
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
                  <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-900">
                    <tr>
                      <th className="px-12 py-7">Access Blueprint Profile</th>
                      <th className="px-12 py-7 text-center">Active Allocations</th>
                      <th className="px-12 py-7">Modular Sovereignty</th>
                      <th className="px-12 py-7 text-center">Blueprint Class</th>
                      <th className="px-12 py-7 text-right">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRoles.map((role) => {
                      const assignedCount = users.filter(u => u.role === role.name).length;
                      return (
                        <tr key={role.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-12 py-8">
                            <div className="font-black text-slate-800 text-base tracking-tighter italic uppercase underline decoration-transparent group-hover:decoration-indigo-200 underline-offset-4 transition-all">{role.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-1.5 truncate uppercase tracking-widest opacity-80">{role.description || 'Custom organizational security blueprint.'}</div>
                          </td>
                          <td className="px-12 py-8 text-center">
                             <div className="inline-flex items-center space-x-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner group-hover:bg-white transition-all">
                               <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-lg">{assignedCount}</div>
                               <span className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400">Linked</span>
                             </div>
                          </td>
                          <td className="px-12 py-8">
                            <div className="flex items-center space-x-2">
                              {Object.entries(role.permissions).map(([mod, level]) => (
                                <div key={mod} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white ${getPermColor(level as string)} transition-transform group-hover:scale-110 shadow-lg border-2 border-white/20`} title={`${mod.toUpperCase()}: ${level}`}>
                                    {getPermLabel(level as string)}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-12 py-8 text-center">
                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${role.isSystem ? 'text-slate-500 bg-slate-100 border border-slate-200' : 'text-emerald-600 bg-emerald-50 border border-emerald-100 shadow-md animate-pulse'}`}>
                              {role.isSystem ? 'CORE-SYS' : 'USR-DEFINED'}
                            </span>
                          </td>
                          <td className="px-12 py-8 text-right">
                             <ActionMenu actions={getRoleActions(role)} label={role.isSystem ? 'LOCKED' : 'AUTHORIZE'} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto custom-scrollbar">
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