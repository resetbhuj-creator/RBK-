import React from 'react';
import { AuditLog } from '../../types';

interface SystemAuditProps {
  auditLogs: AuditLog[];
  onViewVoucher?: (id: string) => void;
}

const SystemAudit: React.FC<SystemAuditProps> = ({ auditLogs, onViewVoucher }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
         <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tight">Access & Activity Stream</h3>
            <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100">Live Monitor Active</div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                     <th className="px-10 py-5">Actor / Subject</th>
                     <th className="px-10 py-5">System Action</th>
                     <th className="px-10 py-5">Functional Payload</th>
                     <th className="px-10 py-5 text-right">Relative Time</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {auditLogs.slice(0, 15).map(log => {
                    const isVoucher = log.entityType === 'VOUCHER';
                    return (
                      <tr 
                        key={log.id} 
                        onClick={() => isVoucher && onViewVoucher?.(log.entityName)}
                        className={`transition-colors ${isVoucher ? 'cursor-pointer hover:bg-indigo-50/80 group' : 'hover:bg-slate-50/80'}`}
                      >
                         <td className="px-10 py-6">
                            <div className="flex items-center space-x-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black italic text-xs shadow-lg transition-all ${isVoucher ? 'bg-indigo-600 group-hover:rotate-12' : 'bg-slate-800'}`}>
                                  {log.actor.charAt(0)}
                               </div>
                               <div>
                                  <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{log.actor}</div>
                                  <div className={`text-[9px] font-bold uppercase ${isVoucher ? 'text-indigo-400' : 'text-slate-400'}`}>{log.entityType}: {log.entityName}</div>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                               log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                               log.action === 'DELETE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                               'bg-indigo-50 text-indigo-600 border-indigo-100'
                            }`}>
                               {log.action}
                            </span>
                         </td>
                         <td className="px-10 py-6">
                            <p className={`text-xs font-medium italic max-w-md truncate ${isVoucher ? 'text-indigo-900' : 'text-slate-600'}`}>"{log.details}"</p>
                            {isVoucher && <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to Inspect Shard &rarr;</div>}
                         </td>
                         <td className="px-10 py-6 text-right">
                            <div className="text-[10px] font-black text-slate-800">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified Packet</div>
                         </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default SystemAudit;