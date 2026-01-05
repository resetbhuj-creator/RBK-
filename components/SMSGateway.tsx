import React, { useState, useMemo } from 'react';
import { Voucher, Ledger } from '../types';

interface SMSGatewayProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
}

const TEMPLATES = [
  { id: 't1', name: 'Transactional Dispatch', dltId: 'DLT-8801', body: 'Dear {{party_name}}, your invoice {{vch_id}} for {{amount}} has been posted. Secure Node: Operational.' },
  { id: 't2', name: 'Payment Receipt', dltId: 'DLT-8802', body: 'Nexus Alert: Payment of {{amount}} confirmed for {{vch_id}}. Ledger state synchronized. Thank you.' },
  { id: 't3', name: 'Security Handshake', dltId: 'DLT-0091', body: 'Your Nexus authentication code is {{otp}}. This node-level token expires in 5 minutes.' }
];

const SMSGateway: React.FC<SMSGatewayProps> = ({ vouchers, ledgers }) => {
  const [isLive, setIsLive] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('t1');
  const [customBody, setCustomBody] = useState(TEMPLATES[0].body);
  const [logs, setLogs] = useState([
    { id: 4092, to: '+1415****271', msg: 'Invoice SL/23-24/001 for $12,500 posted.', status: 'Delivered', time: '10:45 AM', latency: '42ms' },
    { id: 4091, to: '+9199****551', msg: 'Handshake token 442901 transmitted.', status: 'Delivered', time: '11:12 AM', latency: '14ms' },
  ]);

  const charBudget = useMemo(() => {
    const chars = customBody.length;
    const credits = Math.ceil(chars / 160);
    return { chars, credits };
  }, [customBody]);

  const activeTemplate = useMemo(() => TEMPLATES.find(t => t.id === selectedTemplateId), [selectedTemplateId]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
       <div className="flex flex-col xl:flex-row gap-10">
          {/* Gateway Status & Credits */}
          <div className="xl:w-[420px] space-y-8 shrink-0">
             <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Network Node</h3>
                   <button onClick={() => setIsLive(!isLive)} className={`w-14 h-8 rounded-full relative transition-all shadow-md ${isLive ? 'bg-blue-600 shadow-blue-900/20' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${isLive ? 'right-1' : 'left-1'}`}></div>
                   </button>
                </div>
                <div className="space-y-10 relative z-10">
                   <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 shadow-inner text-center">
                      <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Global Credit Shards</div>
                      <div className="text-6xl font-black text-blue-950 italic tracking-tighter tabular-nums">12,402</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">Auto-Topup: Active</div>
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Regulatory Header (DLT-ID)</label>
                         <input value="NX-CORP-ID" readOnly className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black text-slate-700 shadow-inner text-center tracking-[0.2em] font-mono" />
                      </div>
                      <button className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all transform active:scale-95 border-b-4 border-black/30">Refill Shard Registry</button>
                   </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-10 -mr-32 -mt-32"></div>
             </div>

             <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border-t-8 border-blue-600">
                <div className="relative z-10 space-y-10">
                   <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] flex items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mr-3 animate-pulse shadow-[0_0_8px_#34d399]"></div>
                      Trigger Policy Node
                   </h4>
                   <div className="space-y-6">
                      {[
                        { label: 'Unusual Node Access', active: true },
                        { label: 'Sales > $5,000 Volume', active: true },
                        { label: 'Ledger Audit Failures', active: true },
                        { label: 'Weekly Fiscal Summary', active: false }
                      ].map((logic, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                           <span className="text-[11px] font-black text-slate-400 tracking-tight uppercase italic">{logic.label}</span>
                           <div className={`w-2 h-2 rounded-full ${logic.active ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-slate-700'}`}></div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Template & Queue Lab */}
          <div className="xl:flex-1 space-y-8">
             <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tight">Signal Dispatch Lab</h3>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-widest">Format: GSM-7</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registered Statutory Blocks</label>
                      <div className="space-y-3">
                         {TEMPLATES.map(t => (
                           <button 
                             key={t.id} 
                             onClick={() => { setSelectedTemplateId(t.id); setCustomBody(t.body); }}
                             className={`w-full p-6 rounded-[2rem] border-2 transition-all text-left group ${selectedTemplateId === t.id ? 'bg-blue-50 border-blue-600 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-blue-200'}`}
                           >
                              <div className="flex justify-between items-center mb-2">
                                 <div className={`text-[10px] font-black uppercase ${selectedTemplateId === t.id ? 'text-blue-800' : 'text-slate-500'}`}>{t.name}</div>
                                 <span className="text-[8px] font-mono text-slate-400">{t.dltId}</span>
                              </div>
                              <div className={`text-[11px] font-medium leading-relaxed italic ${selectedTemplateId === t.id ? 'text-blue-900' : 'text-slate-400'}`}>"{t.body.substring(0, 50)}..."</div>
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Signal Body</label>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${charBudget.credits > 1 ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                               {charBudget.chars} Chars • {charBudget.credits} Credits
                            </span>
                         </div>
                         <textarea 
                           value={customBody} 
                           onChange={e => setCustomBody(e.target.value)} 
                           className="w-full h-56 p-8 rounded-[2.5rem] border border-slate-200 bg-slate-50 text-sm font-medium italic shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 resize-none leading-relaxed"
                         />
                         <div className="flex items-center space-x-2 px-2 mt-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Statutory ID Matching active for: {activeTemplate?.dltId}</span>
                         </div>
                      </div>
                      <div className="pt-4">
                         <button className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-600 transition-all transform active:scale-95 border-b-8 border-black/30">Authorize Sequence Burst</button>
                      </div>
                   </div>
                </div>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-600 rounded-full blur-[100px] opacity-5 pointer-events-none"></div>
             </div>

             {/* Queue Telemetry */}
             <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden h-[450px] flex flex-col">
                <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                   <div>
                      <h3 className="text-xl font-black italic uppercase text-slate-800 leading-none">Transmission Telemetry</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Global Routing Shard: 44-X</p>
                   </div>
                   <div className="flex items-center space-x-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                      Carrier Node Sync
                   </div>
                </div>
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10">
                         <tr>
                            <th className="px-10 py-6">Signal Hash</th>
                            <th className="px-10 py-6">Endpoint</th>
                            <th className="px-10 py-6">Payload Snapshot</th>
                            <th className="px-10 py-6 text-center">Status</th>
                            <th className="px-10 py-6 text-right">Latency</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {logs.map(log => (
                           <tr key={log.id} className="hover:bg-blue-50/30 transition-all group">
                              <td className="px-10 py-6 font-mono text-[10px] font-black text-blue-600 italic">#{log.id}</td>
                              <td className="px-10 py-6 font-black text-slate-800 text-xs tabular-nums">{log.to}</td>
                              <td className="px-10 py-6 text-xs text-slate-400 font-medium italic group-hover:text-slate-800 transition-colors">"{log.msg}"</td>
                              <td className="px-10 py-6 text-center">
                                 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black border border-emerald-100 uppercase">{log.status}</span>
                              </td>
                              <td className="px-10 py-6 text-right">
                                 <div className="text-[10px] font-black text-slate-800 tabular-nums">{log.latency}</div>
                                 <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{log.time}</div>
                              </td>
                           </tr>
                         ))}
                         <tr className="bg-slate-50/20"><td colSpan={5} className="px-10 py-6 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Telemetry Stream Finalized</td></tr>
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default SMSGateway;