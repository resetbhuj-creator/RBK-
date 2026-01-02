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
      modifications: auditLogs.filter(l => l.action === 'UPDATE').length,
      security: auditLogs.filter(l => l.action === 'STATUS_CHANGE').length
    };
  }, [auditLogs]);

  // Precise Diff Calculation for Audit Visibility
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

    // Deep Permissions Scan
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
      : 'CONTEXT UPDATE: Record verified/saved without attribute mutation.';
  };

  const jumpToTrace = (entityName: string) => {
    setSearchTerm(entityName);
    setActionFilter('ALL');
    setActiveTab('AUDIT');
  };

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Target', 'Details', 'Audit Hash'];
    const rows = filteredLogs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.actor,
      l.action,
      l.entityName,
      l.details.replace(/,/g, ';'),
      l.id
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_audit_export_${Date.now()}.csv`;
    a.click();
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
    }
  ];

  const getRoleActions = (role: Role): ActionItem[] => [
    { 
      label: 'Trace Blueprint', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      onClick: () => jumpToTrace(role.name)
    },
    { 
      label: 'Update Blueprint', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
      onClick: () => { setEditingRole(role); setIsModalOpen(true); },
      variant: 'primary'
    }
  ];

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

  const LogInspectorModal = ({ log }: { log: AuditLog }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10 flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${
              log.action === 'CREATE' ? 'bg-emerald-600' : 
              log.action === 'DELETE' ? 'bg-rose-600' : 'bg-indigo-600'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight italic">Forensic Detail View</h3>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Transaction Hash: {log.id}</p>
            </div>
          </div>
          <button onClick={() => setSelectedLog(null)} className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-10 space-y-8">
           <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Execution Moment</label>
                <div className="text-sm font-black text-slate-800">{new Date(log.timestamp).toLocaleString()}</div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Authorized Actor</label>
                <div className="text-sm font-black text-slate-800">{log.actor}</div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Target Subject</label>
                <div className="text-sm font-black text-slate-800 uppercase italic">{log.entityName} ({log.entityType})</div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">System Operation</label>
                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase border border-slate-200">{log.action}</span>
              </div>
           </div>
           <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200">
              <label className="text-[9px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-3 block">Functional Payload Details</label>
              <div className="text-xs font-medium text-slate-700 leading-relaxed italic">
                 {log.details}
              </div>
           </div>
           <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">Close Inspector</button>
           </div>
        </div>
      </div>
    </div>
  );

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Identity & Access Governance</h2>
          <p className="text-sm text-slate-500 font-medium">Provision organizational credentials and monitor security lifecycle events.</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'AUDIT' && (
            <button 
              onClick={exportAuditCSV}
              className="flex items-center space-x-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-black shadow-xl hover:bg-slate-700 transition-all text-[10px] uppercase tracking-widest border border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>Export Audit</span>
            </button>
          )}
          <button 
            disabled={activeTab === 'AUDIT'}
            onClick={() => { setEditingUser(undefined); setEditingRole(undefined); setIsModalOpen(true); }}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-black shadow-xl transition-all transform active:scale-95 text-[10px] uppercase tracking-widest ${activeTab === 'AUDIT' ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span>{activeTab === 'ROLES' ? 'Design Role' : 'New Provision'}</span>
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
              {tab === 'ROLES' ? 'Security Tiers' : tab === 'MATRIX' ? 'Auth Matrix' : tab === 'AUDIT' ? 'Audit Stream' : 'Staff Records'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'AUDIT' ? (
          <div className="animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-8 border-b border-slate-100 bg-slate-50/30">
               {[
                 { label: 'Total Events', value: auditTrends.total, color: 'text-slate-800' },
                 { label: 'Today\'s Activity', value: auditTrends.today, color: 'text-indigo-600' },
                 { label: 'Initializations', value: auditTrends.creations, color: 'text-emerald-600' },
                 { label: 'Modifications', value: auditTrends.modifications, color: 'text-sky-600' },
                 { label: 'Security Shifts', value: auditTrends.security, color: 'text-rose-600' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                 </div>
               ))}
             </div>
             
             <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="relative max-w-md w-full">
                  <input 
                    type="text" 
                    placeholder="Search by Identity or Modification Hash..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm outline-none"
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
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-900 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-10 py-5">Forensic Mutation Details</th>
                      <th className="px-10 py-5 text-center">Class</th>
                      <th className="px-10 py-5">Entity Subject</th>
                      <th className="px-10 py-5">Operator Context</th>
                      <th className="px-10 py-5 text-right">Execution Moment</th>
                    </tr>
                 </thead>
                 <tbody>
                    {logsByDate.map(([date, logs]) => (
                      <React.Fragment key={date}>
                        <tr className="bg-slate-50/50 sticky top-[77px] z-[5]">
                          <td colSpan={5} className="px-10 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-y border-slate-100 backdrop-blur-md italic">{date}</td>
                        </tr>
                        {logs.map((log) => (
                          <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-indigo-50/20 cursor-pointer transition-colors group">
                            <td className="px-10 py-6 max-w-md">
                               <div className="flex flex-col">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                                      log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                      log.action === 'DELETE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                      log.action === 'STATUS_CHANGE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                      'bg-indigo-50 text-indigo-600 border-indigo-100'
                                    }`}>{log.action.replace('_', ' ')}</span>
                                    <span className="font-mono text-[9px] text-slate-300 font-bold uppercase tracking-tighter">HASH: {log.id}</span>
                                  </div>
                                  <span className="text-xs font-black text-slate-700 leading-relaxed italic tracking-tight group-hover:text-indigo-900 transition-colors line-clamp-2">{log.details}</span>
                               </div>
                            </td>
                            <td className="px-10 py-6 text-center">
                               <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200">
                                  {log.entityType}
                               </span>
                            </td>
                            <td className="px-10 py-6">
                               <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter hover:text-indigo-600 transition-all">{log.entityName}</span>
                            </td>
                            <td className="px-10 py-6">
                               <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-white shadow-lg group-hover:-rotate-6 transition-transform">{log.actor.charAt(0)}</div>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-600">{log.actor}</span>
                                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-tighter italic">Verified Actor</span>
                                  </div>
                               </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                               <div className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                               <div className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-60">Sequence Post</div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-10 py-24 text-center">
                           <div className="flex flex-col items-center opacity-40">
                             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                               <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             </div>
                             <h5 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Zero mutation evidence in selected window.</h5>
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
                  placeholder={`Search active ${activeTab.toLowerCase()}...`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all outline-none"
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
                      <th className="px-10 py-5">Designation</th>
                      <th className="px-10 py-5">Auth Profile</th>
                      <th className="px-10 py-5">Account Lifecycle</th>
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
                              <span className="font-black text-slate-800 text-sm tracking-tight truncate uppercase">{user.name}</span>
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
                           <button onClick={() => toggleUserStatus(user)} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 border ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}>
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
                      <th className="px-10 py-5">Access Blueprint Name</th>
                      <th className="px-10 py-5">Active Allocations</th>
                      <th className="px-10 py-5">Modular Authorities</th>
                      <th className="px-10 py-5">Tier Type</th>
                      <th className="px-10 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRoles.map((role) => {
                      const assignedCount = users.filter(u => u.role === role.name).length;
                      return (
                        <tr key={role.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-10 py-6">
                            <div className="font-black text-slate-800 text-sm tracking-tight italic uppercase">{role.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-0.5 truncate uppercase tracking-tighter">{role.description || 'Custom organizational security blueprint.'}</div>
                          </td>
                          <td className="px-10 py-6 text-xs font-black text-slate-600">
                             <div className="flex items-center space-x-2">
                               <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold">{assignedCount}</div>
                               <span className="text-[9px] uppercase tracking-widest text-slate-400">Linked Accounts</span>
                             </div>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex items-center space-x-1.5">
                              {Object.entries(role.permissions).map(([mod, level]) => (
                                <div key={mod} className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black text-white ${getPermColor(level as string)} transition-transform group-hover:scale-110 shadow-sm`} title={`${mod.toUpperCase()}: ${level}`}>
                                    {getPermLabel(level as string)}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${role.isSystem ? 'text-slate-500 bg-slate-100 border border-slate-200' : 'text-emerald-600 bg-emerald-50 border border-emerald-100 shadow-sm'}`}>
                              {role.isSystem ? 'CORE' : 'CUSTOM'}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-right">
                             <ActionMenu actions={getRoleActions(role)} label={role.isSystem ? 'LOCKED' : 'ACTION'} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {activeTab === 'MATRIX' && (
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-[10px] uppercase font-black tracking-widest text-slate-400">
                    <tr>
                      <th className="px-10 py-6">Staff Designation</th>
                      <th className="px-10 py-6 text-center">Company Domain</th>
                      <th className="px-10 py-6 text-center">Administration</th>
                      <th className="px-10 py-6 text-center">Transactions</th>
                      <th className="px-10 py-6 text-center">Analytics</th>
                      <th className="px-10 py-6 text-center">Audit Lock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-6 font-black text-slate-800 text-xs italic uppercase">{user.name} <span className="ml-2 text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">({user.role})</span></td>
                        {(['company', 'administration', 'transaction', 'display'] as const).map(mod => (
                          <td key={mod} className="px-10 py-6 text-center">
                             <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-white text-[10px] shadow-lg ${getPermColor(user.permissions[mod])}`}>
                               {getPermLabel(user.permissions[mod])}
                             </div>
                          </td>
                        ))}
                        <td className="px-10 py-6 text-center">
                           <div className={`w-2 h-2 rounded-full mx-auto ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
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