import React, { useState } from 'react';
import { Voucher, Ledger } from '../types';

interface SMSGatewayProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
}

const SMSGateway: React.FC<SMSGatewayProps> = ({ vouchers, ledgers }) => {
  const [isLive, setIsLive] = useState(true);
  const [logs, setLogs] = useState([
    { id: 1, to: '+1415****271', msg: 'Sales Inv V-1001 for $12,500 posted.', status: 'Delivered', time: '10:45 AM' },
    { id: 2, to: '+9199****551', msg: 'Payment Receipt V-1003 for $5,000 received.', status: 'Delivered', time: '11:12 AM' },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex flex-col xl:flex-row gap-8">
          <div className="xl:w-1/3 space-y-6">
             <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">Network State</h3>
                   <button onClick={() => setIsLive(!isLive)} className={`w-14 h-8 rounded-full relative transition-all shadow-md ${isLive ? 'bg-blue-600 shadow-blue-900/20' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${isLive ? 'right-1' : 'left-1'}`}></div>
                   </button>
                </div>
                <div className="space-y-6 relative z-10">
                   <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                      <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Throughput Balance</div>
                      <div className="text-4xl font-black text-blue-900 italic">4,821 <span className="text-lg font-bold">Credits</span></div>
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Statutory Sender ID (DLT)</label>
                         <input value="NEXERP" readOnly className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 shadow-inner" />
                      </div>
                      <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transform active:scale-95 transition-all">Recharge Gateway</button>
                   </div>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600 rounded-full blur-[100px] opacity-5 -mr-24 -mt-24 pointer-events-none"></div>
             </div>

             <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                   <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-6">Alert Logic Engine</h4>
                   <div className="space-y-4">
                      {[
                        { label: 'Auto-SMS on High-Value Sales', active: true },
                        { label: 'Payment Reminder T-7 Days', active: true },
                        { label: 'OTP for Context Purge', active: true },
                        { label: 'Nightly Operations Digest', active: false }
                      ].map((logic, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
                           <span className="text-xs font-bold text-slate-400">{logic.label}</span>
                           <div className={`w-2 h-2 rounded-full ${logic.active ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="xl:flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tight">Real-time Transmission Stream</h3>
                <div className="flex items-center space-x-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                   <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Gateway Monitor Active</span>
                </div>
             </div>
             <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                   <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                      <tr>
                         <th className="px-10 py-5">Destination Node</th>
                         <th className="px-10 py-5">Encoded Payload</th>
                         <th className="px-10 py-5">Status</th>
                         <th className="px-10 py-5 text-right">Time Offset</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                           <td className="px-10 py-6 font-mono text-[11px] font-bold text-blue-600">{log.to}</td>
                           <td className="px-10 py-6 text-xs font-medium text-slate-600 italic">"{log.msg}"</td>
                           <td className="px-10 py-6">
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">{log.status}</span>
                           </td>
                           <td className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase">{log.time}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/50">
                         <td colSpan={4} className="px-10 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">End of visible buffer</td>
                      </tr>
                   </tbody>
                </table>
             </div>
             <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex justify-center">
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline decoration-indigo-200 underline-offset-4">Download Packet Audit (JSON)</button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default SMSGateway;