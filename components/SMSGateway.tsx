import React, { useState, useMemo } from 'react';
import { Voucher, Ledger } from '../types';

interface SMSGatewayProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
}

const TEMPLATES = [
  { id: 't1', name: 'Transactional Alert', body: 'Dear {{party_name}}, your invoice {{vch_id}} for {{amount}} has been posted. Status: {{status}}.' },
  { id: 't2', name: 'Payment Receipt', body: 'Nexus ERP: Payment of {{amount}} received against {{vch_id}} for {{party_name}}. Thank you.' },
  { id: 't3', name: 'Security OTP', body: '{{otp}} is your security code for authorized ledger purge. Do not share.' }
];

const SMSGateway: React.FC<SMSGatewayProps> = ({ vouchers, ledgers }) => {
  const [isLive, setIsLive] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('t1');
  const [customBody, setCustomBody] = useState(TEMPLATES[0].body);
  const [logs, setLogs] = useState([
    { id: 1082, to: '+1415****271', msg: 'Invoice V-1001 for $12,500 posted.', status: 'Delivered', time: '10:45 AM' },
    { id: 1081, to: '+9199****551', msg: 'Receipt V-1003 for $5,000 confirmed.', status: 'Delivered', time: '11:12 AM' },
  ]);

  const charBudget = useMemo(() => {
    const chars = customBody.length;
    const credits = Math.ceil(chars / 160);
    return { chars, credits };
  }, [customBody]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex flex-col xl:flex-row gap-10">
          <div className="xl:w-[420px] space-y-8">
             <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">Network Gateway</h3>
                   <button onClick={() => setIsLive(!isLive)} className={`w-14 h-8 rounded-full relative transition-all shadow-md ${isLive ? 'bg-blue-600 shadow-blue-900/20' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${isLive ? 'right-1' : 'left-1'}`}></div>
                   </button>
                </div>
                <div className="space-y-8 relative z-10">
                   <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 shadow-inner text-center">
                      <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Prepaid Credit Balance</div>
                      <div className="text-5xl font-black text-blue-900 italic tracking-tighter tabular-nums">4,821</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">Valid until Dec 2024</div>
                   </div>
                   <div className="space-y-5">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Regulatory Sender ID (DLT)</label>
                         <input value="NEXERP" readOnly className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black text-slate-700 shadow-inner text-center tracking-[0.2em]" />
                      </div>
                      <button className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl transform active:scale-95 transition-all hover:bg-blue-600">Recharge Gateway Credits</button>
                   </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-10 -mr-32 -mt-32 pointer-events-none"></div>
             </div>

             <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border-t-8 border-blue-600">
                <div className="relative z-10">
                   <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-10 flex items-center">
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m12 4a2 2 0 100-4m0 4a2 2 0 110-4" /></svg>
                      Automatic Alert Logic
                   </h4>
                   <div className="space-y-6">
                      {[
                        { label: 'High-Value Sales (> $10k)', active: true },
                        { label: 'Unusual Login Pattern', active: true },
                        { label: 'Monthly Closing Digest', active: false },
                        { label: 'Direct Bank Settlement', active: true }
                      ].map((logic, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                           <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors">{logic.label}</span>
                           <div className={`w-1.5 h-1.5 rounded-full ${logic.active ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]' : 'bg-slate-700'}`}></div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-600 rounded-full blur-[100px] opacity-10"></div>
             </div>
          </div>

          <div className="xl:flex-1 space-y-8">
             <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm">
                <h3 className="text-xl font-black italic uppercase text-slate-800 mb-10">SMS Laboratory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Regulatory Templates</label>
                         <div className="space-y-3">
                            {TEMPLATES.map(t => (
                              <button 
                                key={t.id} 
                                onClick={() => { setSelectedTemplateId(t.id); setCustomBody(t.body); }}
                                className={`w-full p-5 rounded-2xl border-2 transition-all text-left group ${selectedTemplateId === t.id ? 'bg-blue-50 border-blue-600 shadow-xl' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                              >
                                 <div className={`text-[10px] font-black uppercase mb-1 ${selectedTemplateId === t.id ? 'text-blue-700' : 'text-slate-400'}`}>{t.name}</div>
                                 <div className={`text-[11px] font-medium leading-relaxed italic ${selectedTemplateId === t.id ? 'text-blue-900' : 'text-slate-500'}`}>"{t.body.substring(0, 45)}..."</div>
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Custom Message Workspace</label>
                         <textarea 
                           value={customBody} 
                           onChange={e => setCustomBody(e.target.value)} 
                           className="w-full h-48 p-6 rounded-[2rem] border border-slate-200 bg-slate-50 text-sm font-medium italic shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 resize-none"
                         />
                         <div className="flex justify-between items-center px-2">
                            <div className="flex space-x-4">
                               <div className="text-[9px] font-black uppercase text-slate-400">Length: <span className="text-blue-600">{charBudget.chars}</span></div>
                               <div className="text-[9px] font-black uppercase text-slate-400">Credits: <span className="text-blue-600">{charBudget.credits}</span></div>
                            </div>
                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter italic">Unicode Support: Active</span>
                         </div>
                      </div>
                      <div className="pt-4">
                         <button className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-700 transition-all transform active:scale-95">Verify Statutory Compliance</button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden h-[400px] flex flex-col">
                <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                   <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tight leading-none">Transmission Telemetry</h3>
                   <div className="flex items-center space-x-3 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                      Relay Active
                   </div>
                </div>
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                   <table className="w-full text-left">
                      <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                         <tr>
                            <th className="px-10 py-5">Node ID</th>
                            <th className="px-10 py-5">Destination</th>
                            <th className="px-10 py-5">Payload Body</th>
                            <th className="px-10 py-5">Execution Status</th>
                            <th className="px-10 py-5 text-right">Moment</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {logs.map(log => (
                           <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-10 py-6 font-mono text-[10px] font-black text-blue-600">#{log.id}</td>
                              <td className="px-10 py-6 font-black text-slate-700 text-xs">{log.to}</td>
                              <td className="px-10 py-6 text-xs text-slate-400 font-medium italic">"{log.msg}"</td>
                              <td className="px-10 py-6">
                                 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black border border-emerald-100">{log.status}</span>
                              </td>
                              <td className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase">{log.time}</td>
                           </tr>
                         ))}
                         <tr className="bg-slate-50/30"><td colSpan={5} className="px-10 py-4 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">BUFFER TERMINATED</td></tr>
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