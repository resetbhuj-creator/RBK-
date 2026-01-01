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
  status: 'SENT' | 'FAILED' | 'PENDING';
  details?: string;
}

const EmailGateway: React.FC<EmailGatewayProps> = ({ vouchers, ledgers, activeCompany }) => {
  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'LOGS' | 'CONFIG'>('CAMPAIGNS');
  
  // Configuration State
  const [config, setConfig] = useState({
    smtpHost: 'smtp.nexus-relay.cloud',
    smtpPort: '587',
    senderName: `${activeCompany.name} Finance`,
    senderEmail: `finance@${activeCompany.name.toLowerCase().replace(/\s/g, '-')}.com`,
    useTLS: true,
    signature: '--\nBest Regards,\nFinance Department\nNexus ERP Integrated'
  });

  // Bulk State
  const [targetGroup, setTargetGroup] = useState('Sundry Debtors');
  const [bulkSubject, setBulkSubject] = useState('Payment Reminder & Statement of Account');
  const [bulkBody, setBulkBody] = useState('Dear Valued Partner,\n\nWe are sharing the current outstanding statement for your review. Please find the details attached.');
  const [isProcessing, setIsProcessing] = useState(false);

  // Logs State
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([
    { id: 'LOG-001', timestamp: '2023-11-28 10:20 AM', recipient: 'acme.retail@gmail.com', subject: 'Invoice V-1001', type: 'TRANSACTIONAL', status: 'SENT' },
    { id: 'LOG-002', timestamp: '2023-11-28 11:15 AM', recipient: 'global.supp@outlook.com', subject: 'Monthly Reconciliation', type: 'BULK', status: 'SENT' }
  ]);

  const ledgerGroups = useMemo(() => {
    const groups = Array.from(new Set(ledgers.map(l => l.group)));
    return groups;
  }, [ledgers]);

  const targetLedgers = useMemo(() => {
    return ledgers.filter(l => l.group === targetGroup);
  }, [ledgers, targetGroup]);

  const executeBulkDispatch = () => {
    if (targetLedgers.length === 0) return;
    setIsProcessing(true);
    
    // Simulate bulk sending
    setTimeout(() => {
      const newLogs: DispatchLog[] = targetLedgers.map((l, i) => ({
        id: `LOG-${Date.now()}-${i}`,
        timestamp: new Date().toLocaleString(),
        recipient: `${l.name.toLowerCase().replace(/\s/g, '.')}@business.net`,
        subject: bulkSubject,
        type: 'BULK',
        status: 'SENT'
      }));
      
      setDispatchLogs(prev => [...newLogs, ...prev]);
      setIsProcessing(false);
      alert(`Bulk sequence finished: ${targetLedgers.length} dispatch objects queued for transmission.`);
      setActiveTab('LOGS');
    }, 2000);
  };

  const CampaignView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic text-slate-800 tracking-tight">Bulk Transmission Sequencer</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Target specific ledger partitions for outreach</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Target Ledger Group</label>
                  <select 
                    value={targetGroup} 
                    onChange={e => setTargetGroup(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                  >
                    {ledgerGroups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Payload Type</label>
                  <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    {['Statement', 'Outstanding', 'Notice'].map(type => (
                      <button key={type} className="flex-1 py-3 text-[10px] font-black uppercase rounded-xl text-slate-400 hover:text-slate-700 transition-all">{type}</button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Subject Header</label>
               <input value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none" />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Email Content Template</label>
               <div className="relative">
                  <textarea value={bulkBody} onChange={e => setBulkBody(e.target.value)} className="w-full h-64 px-8 py-8 rounded-[2.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium leading-relaxed italic resize-none shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10" />
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button className="px-3 py-1 bg-slate-800 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Load Template</button>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-slate-900 rounded-[2.5rem] border-b-8 border-indigo-600 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
               <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-2">Audience Scope</div>
                  <div className="text-4xl font-black text-white italic tabular-nums">{targetLedgers.length} <span className="text-sm uppercase font-bold text-slate-500 not-italic">Resolved Masters</span></div>
               </div>
               <button 
                onClick={executeBulkDispatch}
                disabled={isProcessing || targetLedgers.length === 0}
                className={`relative z-10 px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all transform active:scale-95 flex items-center space-x-4 ${isProcessing ? 'bg-slate-700 text-slate-400 animate-pulse' : 'bg-white text-slate-900 hover:bg-indigo-600 hover:text-white'}`}
               >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  <span>{isProcessing ? 'Transmitting Batch...' : 'Authorize Dispatch'}</span>
               </button>
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-10 -mr-32 -mt-32"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
           <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-8 flex items-center">
              <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Smart Tokens
           </h4>
           <div className="space-y-3">
              {[
                { tag: '{{party_name}}', desc: 'Legal Title of Ledger' },
                { tag: '{{closing_bal}}', desc: 'Active Balance' },
                { tag: '{{fy_period}}', desc: 'Current Financial Year' },
                { tag: '{{company_name}}', desc: 'Legal Entity Name' }
              ].map(t => (
                <div key={t.tag} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-all cursor-copy">
                   <span className="font-mono text-[10px] font-black text-indigo-600">{t.tag}</span>
                   <span className="text-[9px] font-bold text-slate-400 uppercase">{t.desc}</span>
                </div>
              ))}
           </div>
           <p className="mt-8 text-[10px] text-slate-400 italic leading-relaxed">System will perform a lazy replacement of these tokens for each recipient in the selected group.</p>
        </div>
      </div>
    </div>
  );

  const LogsView = () => (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
       <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-black italic uppercase text-slate-800">Dispatch Audit Registry</h3>
          <div className="flex items-center space-x-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Real-time Tracker Active</span>
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                <tr>
                   <th className="px-10 py-6">Audit HASH</th>
                   <th className="px-10 py-6">Recipient Node</th>
                   <th className="px-10 py-6">Payload Header</th>
                   <th className="px-10 py-6">Classification</th>
                   <th className="px-10 py-6 text-center">Status</th>
                   <th className="px-10 py-6 text-right">Relative Time</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {dispatchLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                     <td className="px-10 py-6 font-mono text-[9px] text-indigo-500 font-black italic">{log.id}</td>
                     <td className="px-10 py-6 font-black text-slate-700 text-xs">{log.recipient}</td>
                     <td className="px-10 py-6 text-xs text-slate-400 font-medium italic group-hover:text-slate-800 transition-colors">"{log.subject}"</td>
                     <td className="px-10 py-6">
                        <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${log.type === 'BULK' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{log.type}</span>
                     </td>
                     <td className="px-10 py-6 text-center">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black border border-emerald-100">{log.status}</span>
                     </td>
                     <td className="px-10 py-6 text-right">
                        <div className="text-[10px] font-black text-slate-800 uppercase">{log.timestamp.split(' ')[1]} {log.timestamp.split(' ')[2]}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{log.timestamp.split(' ')[0]}</div>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const ConfigView = () => (
    <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
       <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
          <div className="p-12 border-b border-slate-100 bg-slate-900 text-white relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Gateway Environment</h3>
                <p className="text-xs text-indigo-400 font-black uppercase tracking-[0.4em] mt-2">I/O Cluster Configuration</p>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
          </div>

          <div className="p-12 space-y-12 bg-slate-50/50">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">Network Stack</h4>
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">SMTP Host Cluster</label>
                         <input value={config.smtpHost} onChange={e => setConfig({...config, smtpHost: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Port</label>
                           <input value={config.smtpPort} onChange={e => setConfig({...config, smtpPort: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Encryption</label>
                           <button onClick={() => setConfig({...config, useTLS: !config.useTLS})} className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${config.useTLS ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>TLS / SSL</button>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">Identity Mapping</h4>
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Sender Label</label>
                         <input value={config.senderName} onChange={e => setConfig({...config, senderName: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm outline-none" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Authorized Outbound Gateway</label>
                         <input value={config.senderEmail} onChange={e => setConfig({...config, senderEmail: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm outline-none" />
                      </div>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">Institutional Signature</h4>
                <textarea value={config.signature} onChange={e => setConfig({...config, signature: e.target.value})} className="w-full h-32 px-6 py-6 rounded-[2.5rem] border border-slate-200 bg-white text-sm font-mono italic shadow-inner outline-none" />
             </div>

             <div className="pt-8 border-t border-slate-100 flex justify-end space-x-4">
                <button className="px-10 py-4 rounded-2xl border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Discard Toggles</button>
                <button onClick={() => alert('Cluster Updated Successfully')} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95">Verify & Commit Cluster</button>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex bg-slate-200/50 p-1.5 rounded-[2.5rem] border border-slate-200 max-w-2xl mx-auto shadow-inner">
         {(['CAMPAIGNS', 'LOGS', 'CONFIG'] as const).map(tab => (
           <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
           >
             {tab === 'CAMPAIGNS' ? 'Bulk Dispatch' : tab === 'LOGS' ? 'History Logs' : 'Gateway Config'}
           </button>
         ))}
      </div>

      <main>
        {activeTab === 'CAMPAIGNS' && <CampaignView />}
        {activeTab === 'LOGS' && <LogsView />}
        {activeTab === 'CONFIG' && <ConfigView />}
      </main>

      <div className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 shadow-lg mt-12">
         <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-indigo-900/20 shrink-0 transform rotate-3 transition-transform hover:rotate-0">🤖</div>
         <div className="space-y-3">
            <h5 className="text-sm font-black uppercase tracking-widest text-indigo-900 flex items-center">
              Transmission Intelligence
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-3"></div>
            </h5>
            <p className="text-xs font-medium text-indigo-700/80 leading-relaxed italic">
              The Nexus Dispatch engine supports multi-threaded delivery via TLS-hardened SMTP clusters. Bulk operations are throttled at 50 units per minute to maintain organizational sender reputation and compliance with global SPF/DKIM standards.
            </p>
         </div>
      </div>
    </div>
  );
};

export default EmailGateway;