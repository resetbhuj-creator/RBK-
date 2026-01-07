import React, { useState, useMemo } from 'react';
import ActionMenu from './ActionMenu';

export interface DispatchLog {
  id: string;
  vchId: string | null;
  type: 'Email' | 'SMS' | 'Print';
  party: string;
  target: string;
  timestamp: string;
  status: 'Sent' | 'Delivered' | 'Bounced' | 'Opened' | 'Failed' | 'Printed';
  latency?: string;
}

interface DispatchLogsProps {
  onViewVoucher: (id: string) => void;
}

const INITIAL_LOGS: DispatchLog[] = [
  { id: 'LOG-9082', vchId: 'SL/23-24/0001', type: 'Email', party: 'Acme Global', target: 'finance@acme.com', timestamp: '2023-12-01T10:20:00Z', status: 'Opened', latency: '1.2s' },
  { id: 'LOG-9081', vchId: 'PY/23-24/0001', type: 'SMS', party: 'Retailers Inc', target: '+141500022', timestamp: '2023-12-01T10:45:00Z', status: 'Delivered', latency: '0.4s' },
  { id: 'LOG-9080', vchId: null, type: 'Print', party: 'Self-Pickup', target: 'Local LPT1', timestamp: '2023-12-01T11:00:00Z', status: 'Printed' },
  { id: 'LOG-9079', vchId: 'SL/23-24/0001', type: 'Email', party: 'Global Supp', target: 'billing@global.net', timestamp: '2023-12-01T11:15:00Z', status: 'Bounced', latency: '2.5s' },
  { id: 'LOG-9078', vchId: 'RC/23-24/0042', type: 'SMS', party: 'Vance Alex', target: '+188899900', timestamp: '2023-12-01T11:30:00Z', status: 'Failed', latency: '12s' },
];

const DispatchLogs: React.FC<DispatchLogsProps> = ({ onViewVoucher }) => {
  const [logs, setLogs] = useState<DispatchLog[]>(INITIAL_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | DispatchLog['type']>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Success' | 'Issue'>('All');

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = l.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           l.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           l.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All' || l.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || 
                           (statusFilter === 'Success' && ['Sent', 'Delivered', 'Opened', 'Printed'].includes(l.status)) ||
                           (statusFilter === 'Issue' && ['Bounced', 'Failed'].includes(l.status));
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [logs, searchTerm, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter(l => ['Sent', 'Delivered', 'Opened', 'Printed'].includes(l.status)).length;
    return { rate: total ? Math.round((success / total) * 100) : 0, total };
  }, [logs]);

  const getStatusStyle = (status: DispatchLog['status']) => {
    switch (status) {
      case 'Opened': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'Delivered':
      case 'Printed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Bounced':
      case 'Failed': return 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getStatusIcon = (status: DispatchLog['status']) => {
    switch (status) {
      case 'Opened': return '👁️';
      case 'Delivered': return '✅';
      case 'Printed': return '🖨️';
      case 'Bounced': return '🚫';
      case 'Failed': return '⚠️';
      default: return '✉️';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl border border-white/20 shadow-inner">📜</div>
              <div>
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Dispatch Audit Stream</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mt-2 italic">Forensic Communications Log • Node Layer 04</p>
              </div>
           </div>
           <div className="flex items-center space-x-10">
              <div className="text-center">
                 <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Transmission Success</div>
                 <div className="text-4xl font-black italic text-emerald-400 tabular-nums">{stats.rate}%</div>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="text-center">
                 <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Payload Count</div>
                 <div className="text-4xl font-black italic text-white tabular-nums">{stats.total}</div>
              </div>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-6">
           <div className="relative flex-1 w-full max-w-xl">
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search audit hash or counterparty..."
                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.8rem] text-xs font-black shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all italic"
              />
              <svg className="w-5 h-5 absolute left-5 top-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
           
           <div className="flex items-center space-x-3 shrink-0">
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 outline-none cursor-pointer hover:border-indigo-300 transition-all shadow-sm">
                 <option value="All">All Channels</option>
                 <option value="Email">Email Shards</option>
                 <option value="SMS">Signal Shards</option>
                 <option value="Print">Physical Buffers</option>
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer hover:border-indigo-300 transition-all shadow-sm">
                 <option value="All">All States</option>
                 <option value="Success">Healthy Transmissions</option>
                 <option value="Issue">Anomalies Only</option>
              </select>
           </div>
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar">
           <table className="w-full text-left">
              <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                 <tr>
                    <th className="px-10 py-6">Audit Reference</th>
                    <th className="px-10 py-6">Target Destination</th>
                    <th className="px-10 py-6 text-center">Protocol</th>
                    <th className="px-10 py-6 text-center">Status Registry</th>
                    <th className="px-10 py-6 text-right">Moment / Latency</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-indigo-50/20 transition-all group border-b border-slate-50 last:border-0">
                       <td className="px-10 py-6">
                          <div className="font-mono text-[10px] font-black text-indigo-500 italic">#{log.id}</div>
                          {log.vchId ? (
                            <button onClick={() => onViewVoucher(log.vchId!)} className="text-[8px] font-black text-slate-400 uppercase mt-1.5 hover:text-indigo-600 transition-colors">VCH: {log.vchId} &rarr;</button>
                          ) : (
                            <div className="text-[8px] font-bold text-slate-300 uppercase mt-1.5 italic">Direct Signal</div>
                          )}
                       </td>
                       <td className="px-10 py-6">
                          <div className="text-sm font-black text-slate-800 uppercase italic tracking-tighter group-hover:text-indigo-600 transition-colors">{log.party}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{log.target}</div>
                       </td>
                       <td className="px-10 py-6 text-center">
                          <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${
                            log.type === 'Email' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            log.type === 'SMS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {log.type}
                          </span>
                       </td>
                       <td className="px-10 py-6 text-center">
                          <div className="flex flex-col items-center">
                             <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border-2 shadow-sm flex items-center space-x-2 transition-all group-hover:scale-105 ${getStatusStyle(log.status)}`}>
                                <span>{getStatusIcon(log.status)}</span>
                                <span>{log.status}</span>
                             </span>
                          </div>
                       </td>
                       <td className="px-10 py-6 text-right">
                          <div className="text-[10px] font-black text-slate-800 tabular-nums">{new Date(log.timestamp).toLocaleTimeString()}</div>
                          {log.latency && <div className="text-[8px] font-bold text-emerald-500 uppercase mt-1">LAT: {log.latency}</div>}
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
           {filteredLogs.length === 0 && (
             <div className="py-40 text-center opacity-30 italic flex flex-col items-center">
                <div className="text-6xl mb-6 grayscale animate-pulse">📡</div>
                <p className="text-[11px] font-black uppercase tracking-[0.5em]">No dispatch shards detected</p>
                <button onClick={() => {setSearchTerm(''); setTypeFilter('All'); setStatusFilter('All');}} className="mt-8 text-[9px] font-black text-indigo-600 uppercase border-b-2 border-indigo-600 pb-1">Reset Matrix</button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default DispatchLogs;