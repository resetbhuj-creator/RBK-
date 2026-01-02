import React, { useState, useMemo } from 'react';
import { Voucher, Ledger } from '../types';

interface EmailGatewayProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
  activeCompany: any;
}

interface DispatchLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  type: 'TRANSACTIONAL' | 'BULK' | 'ALERT';
  status: 'SENT' | 'FAILED' | 'OPENED';
  details?: string;
}

const EmailGateway: React.FC<EmailGatewayProps> = ({ vouchers, ledgers, activeCompany }) => {
  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'LOGS' | 'CONFIG'>('CAMPAIGNS');
  
  // Configuration State
  const [config, setConfig] = useState({
    smtpHost: 'relay.nexus-erp.cloud',
    smtpPort: '587',
    senderName: `${activeCompany.name} Accounts`,
    senderEmail: `finance@corp-node.net`,
    useTLS: true,
    signature: `--\nRegards,\nInstitutional Finance Hub\nGenerated via Nexus ERP Suite`
  });

  // Bulk State
  const [targetGroup, setTargetGroup] = useState('Sundry Debtors');
  const [bulkSubject, setBulkSubject] = useState('Statutory Statement of Account: {{fy_period}}');
  const [bulkBody, setBulkBody] = useState('Dear {{party_name}},\n\nPlease review your active balance of {{closing_bal}} for the current period. Attached is the reconciled ledger statement from {{company_name}}.\n\nKindly revert for any discrepancies.');
  const [isProcessing, setIsProcessing] = useState(false);

  // Logs State
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([
    { id: 'MAIL-991', timestamp: '2023-12-01 10:20 AM', recipient: 'procurement@acme-hq.com', subject: 'Invoice V-1001 Confirmation', type: 'TRANSACTIONAL', status: 'OPENED' },
    { id: 'MAIL-990', timestamp: '2023-12-01 11:15 AM', recipient: 'billing@global-logistics.net', subject: 'Statement of Account Q3', type: 'BULK', status: 'SENT' }
  ]);

  const ledgerGroups = useMemo(() => Array.from(new Set(ledgers.map(l => l.group))), [ledgers]);
  const targetLedgers = useMemo(() => ledgers.filter(l => l.group === targetGroup), [ledgers, targetGroup]);

  const highlightTokens = (text: string) => {
    const tokens = ['{{party_name}}', '{{closing_bal}}', '{{fy_period}}', '{{company_name}}'];
    let parts = [text];
    tokens.forEach(token => {
      parts = parts.flatMap(part => {
        if (typeof part !== 'string') return part;
        const subParts = part.split(token);
        const result: any[] = [];
        subParts.forEach((sp, i) => {
          result.push(sp);
          if (i < subParts.length - 1) result.push(<span key={i} className="text-indigo-600 font-black bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 mx-0.5">{token}</span>);
        });
        return result;
      });
    });
    return parts;
  };

  const executeBulkDispatch = () => {
    if (targetLedgers.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      const newLogs: DispatchLog[] = targetLedgers.map((l, i) => ({
        id: `MAIL-${Date.now()}-${i}`,
        timestamp: new Date().toLocaleString(),
        recipient: `${l.name.toLowerCase().replace(/\s/g, '.')}@corporate-id.com`,
        subject: bulkSubject.replace('{{fy_period}}', '2023-24'),
        type: 'BULK',
        status: 'SENT'
      }));
      setDispatchLogs(prev => [...newLogs, ...prev]);
      setIsProcessing(false);
      alert(`Sequencer Complete: ${targetLedgers.length} outbound objects injected into SMTP pool.`);
      setActiveTab('LOGS');
    }, 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex bg-slate-200/50 p-1.5 rounded-[2.5rem] border border-slate-200 max-w-2xl mx-auto shadow-inner">
         {(['CAMPAIGNS', 'LOGS', 'CONFIG'] as const).map(tab => (
           <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
           >
             {tab === 'CAMPAIGNS' ? 'Sequencer' : tab === 'LOGS' ? 'Telemetry' : 'Gateway Config'}
           </button>
         ))}
      </div>

      <main>
        {activeTab === 'CAMPAIGNS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm relative overflow-hidden">
                <div className="flex items-center space-x-6 mb-12">
                  <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-900/40 transform -rotate-3 transition-transform hover:rotate-0">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic text-slate-800 tracking-tight leading-none">Smart Dispatch Lab</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Dynamic Template Engineering & Routing</p>
                  </div>
                </div>

                <div className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Master Partition</label>
                         <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner appearance-none cursor-pointer">
                           {ledgerGroups.map(g => <option key={g} value={g}>{g}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Protocol Tier</label>
                         <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                            {['Standard', 'Urgent', 'Bulk'].map(t => (
                              <button key={t} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${t === 'Bulk' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Subject Registry</label>
                      <div className="relative group">
                         <input value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} className="w-full px-7 py-5 rounded-[1.5rem] border border-slate-200 bg-white text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm" />
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                            <span className="text-[9px] font-black text-slate-300 uppercase italic">Token Detected ✓</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Dynamic Payload Body</label>
                        <div className="flex space-x-2">
                           <button className="px-3 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Format JSON</button>
                           <button className="px-3 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Clear Canvas</button>
                        </div>
                      </div>
                      <div className="relative">
                         <textarea value={bulkBody} onChange={e => setBulkBody(e.target.value)} className="w-full h-80 px-8 py-8 rounded-[2.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium leading-relaxed italic resize-none shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 scrollbar-hide" />
                         <div className="absolute bottom-6 left-8 right-8 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 text-[10px] font-medium text-slate-500 pointer-events-none">
                            <span className="font-black text-indigo-600 uppercase tracking-widest">Visual Preview: </span>
                            {highlightTokens(bulkBody)}
                         </div>
                      </div>
                   </div>

                   <div className="p-10 bg-slate-900 rounded-[3rem] border-b-8 border-indigo-600 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                      <div className="relative z-10 space-y-2">
                         <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em]">Ready for Transmission</h4>
                         <div className="text-5xl font-black text-white italic tracking-tighter tabular-nums">{targetLedgers.length} <span className="text-base font-bold text-slate-500 not-italic uppercase tracking-widest">Unique Recipients</span></div>
                      </div>
                      <button 
                        onClick={executeBulkDispatch}
                        disabled={isProcessing || targetLedgers.length === 0}
                        className={`relative z-10 px-16 py-6 rounded-[2.2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all transform active:scale-95 flex items-center space-x-5 ${isProcessing ? 'bg-slate-700 text-slate-400 animate-pulse shadow-none' : 'bg-white text-slate-900 hover:bg-indigo-600 hover:text-white'}`}
                      >
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                         <span>{isProcessing ? 'Transmitting Cluster...' : 'Engage Dispatch'}</span>
                      </button>
                      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-40 -mt-40 pointer-events-none"></div>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-10 border-b border-slate-50 pb-4">Variable Token Lab</h4>
                 <div className="space-y-4">
                    {[
                      { tag: '{{party_name}}', desc: 'Counterparty legal identity' },
                      { tag: '{{closing_bal}}', desc: 'Resolved net balance' },
                      { tag: '{{fy_period}}', desc: 'Active financial cycle' },
                      { tag: '{{company_name}}', desc: 'Sovereign entity title' },
                      { tag: '{{party_address}}', desc: 'Primary shipment location' }
                    ].map(t => (
                      <div key={t.tag} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-copy">
                         <span className="font-mono text-[11px] font-black text-indigo-600">{t.tag}</span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{t.desc}</span>
                      </div>
                    ))}
                 </div>
                 <p className="mt-8 text-[10px] text-slate-400 italic leading-relaxed font-medium">Click to copy token to clipboard. Nexus will perform a late-bound replacement during the dispatch sequence.</p>
              </div>

              <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border-l-8 border-indigo-500">
                 <div className="relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-6">Delivery Logic</h4>
                    <p className="text-xs leading-relaxed font-medium text-indigo-100/70 mb-8">
                      Inbound mails are prioritized for transactional alerts. Bulk campaigns are throttled to ensure <span className="text-white font-black underline decoration-emerald-500">100% IP Reputation</span> maintenance.
                    </p>
                    <div className="flex items-center space-x-3 text-[10px] font-black uppercase text-emerald-400">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span>Node: US-EAST-CL1 Active</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'LOGS' && (
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
             <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tight leading-none">Telemetry Audit Trail</h3>
                <div className="flex items-center space-x-6">
                   <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Real-time Stream</span>
                   </div>
                   <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all">Clear Buffer</button>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                      <tr>
                         <th className="px-10 py-6">Trace ID</th>
                         <th className="px-10 py-6">Recipient Node</th>
                         <th className="px-10 py-6">Subject Digest</th>
                         <th className="px-10 py-6">Tier</th>
                         <th className="px-10 py-6 text-center">Status</th>
                         <th className="px-10 py-6 text-right">Moment</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {dispatchLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                           <td className="px-10 py-6 font-mono text-[9px] text-indigo-500 font-black italic">{log.id}</td>
                           <td className="px-10 py-6 font-black text-slate-700 text-xs truncate max-w-[200px]">{log.recipient}</td>
                           <td className="px-10 py-6 text-xs text-slate-400 font-medium italic group-hover:text-slate-800 transition-colors">"{log.subject}"</td>
                           <td className="px-10 py-6">
                              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${log.type === 'BULK' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{log.type}</span>
                           </td>
                           <td className="px-10 py-6 text-center">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black border transition-all ${
                                log.status === 'OPENED' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              }`}>{log.status}</span>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <div className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{log.timestamp.split(' ')[1]} {log.timestamp.split(' ')[2]}</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{log.timestamp.split(' ')[0]}</div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'CONFIG' && (
          <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
             <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
                <div className="p-12 border-b border-slate-100 bg-slate-900 text-white relative overflow-hidden">
                   <div className="relative z-10">
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter">Cluster Infrastructure</h3>
                      <p className="text-xs text-indigo-400 font-black uppercase tracking-[0.4em] mt-2">I/O Relay Authentication</p>
                   </div>
                   <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-20 -mr-40 -mt-40"></div>
                </div>

                <div className="p-12 space-y-12 bg-slate-50/50">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-8">
                         <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3"></div>Relay Stack</h4>
                         <div className="space-y-5">
                            <div className="space-y-1.5">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">SMTP Gateway</label>
                               <input value={config.smtpHost} onChange={e => setConfig({...config, smtpHost: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Port</label>
                                 <input value={config.smtpPort} onChange={e => setConfig({...config, smtpPort: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 shadow-sm outline-none" />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Encryption</label>
                                 <button onClick={() => setConfig({...config, useTLS: !config.useTLS})} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${config.useTLS ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>TLS Active</button>
                              </div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3"></div>Outbound Persona</h4>
                         <div className="space-y-5">
                            <div className="space-y-1.5">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Authorized Sender Alias</label>
                               <input value={config.senderName} onChange={e => setConfig({...config, senderName: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 shadow-sm outline-none" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Relay Identity (Email)</label>
                               <input value={config.senderEmail} onChange={e => setConfig({...config, senderEmail: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 shadow-sm outline-none" />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3"></div>Global Signature Registry</h4>
                      <textarea value={config.signature} onChange={e => setConfig({...config, signature: e.target.value})} className="w-full h-40 px-8 py-8 rounded-[2.5rem] border border-slate-200 bg-white text-xs font-mono italic shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10" />
                   </div>

                   <div className="pt-10 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-5">
                      <button className="px-10 py-4 rounded-[1.5rem] border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all">Discard Toggles</button>
                      <button onClick={() => alert('Infrastructure Context Updated')} className="px-14 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-4 border-slate-950">Verify & Commit Infrastructure</button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmailGateway;