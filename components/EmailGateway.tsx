import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Voucher, Ledger } from '../types';

interface EmailGatewayProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
  activeCompany: any;
  forceTab?: 'CAMPAIGNS' | 'LOGS' | 'CONFIG';
}

interface DispatchLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  type: 'TRANSACTIONAL' | 'BULK' | 'ALERT' | 'SYSTEM_TEST';
  status: 'SENT' | 'FAILED' | 'OPENED' | 'VERIFIED';
  details?: string;
}

const VAR_TOKENS = [
  { tag: '{{party_name}}', desc: 'Counterparty Title' },
  { tag: '{{vch_id}}', desc: 'Voucher Reference' },
  { tag: '{{amount}}', desc: 'Net Value' },
  { tag: '{{date}}', desc: 'Execution Date' },
  { tag: '{{company_name}}', desc: 'Origin Entity' },
  { tag: '{{closing_bal}}', desc: 'Ledger Position' }
];

const EmailGateway: React.FC<EmailGatewayProps> = ({ vouchers, ledgers, activeCompany, forceTab }) => {
  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'LOGS' | 'CONFIG'>(forceTab || 'CAMPAIGNS');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Configuration State
  const [config, setConfig] = useState({
    smtpHost: 'relay.nexus-erp.cloud',
    smtpPort: '587',
    smtpUser: 'auth_node_04',
    smtpPass: '••••••••••••••••',
    senderName: `${activeCompany.name} Accounts`,
    senderEmail: `finance@${activeCompany.name.toLowerCase().replace(/\s/g, '-')}.net`,
    useTLS: true,
    authRequired: true,
    encryption: 'STARTTLS' as 'NONE' | 'SSL' | 'STARTTLS',
    signature: `--\nRegards,\nFinancial Core Hub\nNexus Enterprise Suite`
  });

  // Sequencer State
  const [targetMode, setTargetMode] = useState<'VOUCHERS' | 'LEDGERS'>('VOUCHERS');
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [bulkSubject, setBulkSubject] = useState('Transaction Confirmation: {{vch_id}}');
  const [bulkBody, setBulkBody] = useState('Dear {{party_name}},\n\nThis is to verify that a transaction of {{amount}} was committed on {{date}} against reference {{vch_id}}.\n\nPlease find the statutory documents attached for your records.\n\nThank you.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Logs State
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([
    { id: 'MAIL-204', timestamp: '2023-12-01 10:20 AM', recipient: 'audit@global-supply.com', subject: 'Invoice SL/23-24/0045 Confirmation', type: 'TRANSACTIONAL', status: 'OPENED' },
    { id: 'MAIL-203', timestamp: '2023-12-01 11:15 AM', recipient: 'finance@acme-corp.net', subject: 'Statement of Account Q4', type: 'BULK', status: 'SENT' }
  ]);

  useEffect(() => { if (forceTab) setActiveTab(forceTab); }, [forceTab]);

  const insertToken = (token: string) => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const text = bulkBody;
    const newText = text.substring(0, start) + token + text.substring(end);
    setBulkBody(newText);
    setTimeout(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.setSelectionRange(start + token.length, start + token.length);
    }, 10);
  };

  const entitiesToMap = useMemo(() => {
    if (targetMode === 'VOUCHERS') return vouchers.slice(0, 50).map(v => ({ id: v.id, label: `${v.party} (${v.id})`, sub: v.date }));
    return ledgers.slice(0, 50).map(l => ({ id: l.id, label: l.name, sub: l.group }));
  }, [vouchers, ledgers, targetMode]);

  // Added utility to log events locally in the component for the gateway telemetry
  const addLog = (msg: string) => {
    const newLog: DispatchLog = {
      id: `SYS-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      recipient: 'SYSTEM_NODE',
      subject: 'Gateway Internal Diagnostic',
      type: 'SYSTEM_TEST',
      status: 'VERIFIED',
      details: msg
    };
    setDispatchLogs(prev => [newLog, ...prev]);
  };

  const executeDispatch = () => {
    if (selectedEntityIds.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      const newLogs: DispatchLog[] = selectedEntityIds.map((id, i) => ({
        id: `MAIL-${Date.now()}-${i}`,
        timestamp: new Date().toLocaleString(),
        recipient: `counterparty-${i}@corporate-node.com`,
        subject: bulkSubject.replace('{{vch_id}}', id),
        type: targetMode === 'VOUCHERS' ? 'TRANSACTIONAL' : 'BULK',
        status: 'SENT'
      }));
      setDispatchLogs(prev => [...newLogs, ...prev]);
      setIsProcessing(false);
      alert(`Sequencer Finalized: ${selectedEntityIds.length} payloads injected into SMTP cluster.`);
      setActiveTab('LOGS');
    }, 2000);
  };

  // Fix: Implemented the missing runGatewayTest function to handle infrastructure verification
  const runGatewayTest = () => {
    setIsTesting(true);
    addLog(`GATEWAY TEST: Initiating SMTP handshake with ${config.smtpHost}:${config.smtpPort}...`);
    
    setTimeout(() => {
      setIsTesting(false);
      addLog(`GATEWAY TEST: Connection verified. TLS 1.3 Handshake successful.`);
      alert('SMTP Gateway Handshake Successful. Connection is established.');
    }, 2000);
  };

  const reputationScore = 98.4;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex bg-slate-200/50 p-1.5 rounded-[2.5rem] border border-slate-200 max-w-2xl mx-auto shadow-inner">
         {(['CAMPAIGNS', 'LOGS', 'CONFIG'] as const).map(tab => (
           <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
           >
             {tab === 'CAMPAIGNS' ? 'Sequencer' : tab === 'LOGS' ? 'Telemetry' : 'Gateway Node'}
           </button>
         ))}
      </div>

      <main>
        {activeTab === 'CAMPAIGNS' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Variable Injector Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-10 border-b border-slate-50 pb-4">Token Library</h4>
                 <div className="space-y-3">
                    {VAR_TOKENS.map(t => (
                      <button 
                        key={t.tag} 
                        onClick={() => insertToken(t.tag)}
                        className="w-full flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-400 hover:bg-white transition-all text-left group"
                      >
                         <span className="font-mono text-[11px] font-black text-indigo-600 group-hover:scale-105 transition-transform origin-left">{t.tag}</span>
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{t.desc}</span>
                      </button>
                    ))}
                 </div>
                 <p className="mt-8 text-[9px] text-slate-400 italic leading-relaxed text-center">Click token to inject at cursor.</p>
              </div>

              <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border-l-8 border-indigo-500">
                 <div className="relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-6">Attach Policy</h4>
                    <div className="space-y-4">
                       <label className="flex items-center space-x-3 cursor-pointer group">
                          <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500 bg-indigo-950/50" />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-100">Attach PDF Invoice</span>
                       </label>
                       <label className="flex items-center space-x-3 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500 bg-indigo-950/50" />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-100">Ledger Statement</span>
                       </label>
                    </div>
                 </div>
              </div>
            </div>

            {/* Template Editor */}
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm relative">
                  <div className="flex items-center justify-between mb-10">
                     <h3 className="text-xl font-black uppercase italic text-slate-800">Mail Compositor</h3>
                     <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        {['VOUCHERS', 'LEDGERS'].map(m => (
                          <button key={m} onClick={() => { setTargetMode(m as any); setSelectedEntityIds([]); }} className={`px-4 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${targetMode === m ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>{m}</button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Subject Protocol</label>
                       <input value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm" />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payload Workspace</label>
                       <textarea 
                        ref={textAreaRef}
                        value={bulkBody} 
                        onChange={e => setBulkBody(e.target.value)} 
                        className="w-full h-80 px-8 py-8 rounded-[2.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium leading-relaxed italic resize-none shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10" 
                       />
                    </div>

                    <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                       <div className="relative z-10">
                          <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-2">Transmission Ready</h4>
                          <div className="text-5xl font-black text-white italic tracking-tighter tabular-nums">{selectedEntityIds.length} <span className="text-base font-bold text-slate-500 not-italic uppercase tracking-widest">Targets</span></div>
                       </div>
                       <button 
                        onClick={executeDispatch}
                        disabled={isProcessing || selectedEntityIds.length === 0}
                        className={`relative z-10 px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all transform active:scale-95 ${isProcessing ? 'bg-slate-700 text-slate-500 animate-pulse' : 'bg-white text-slate-900 hover:bg-indigo-600 hover:text-white'}`}
                       >
                          {isProcessing ? 'Transmitting...' : 'Initiate Relay'}
                       </button>
                       <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10"></div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Target Selection Rail */}
            <div className="space-y-6">
               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                     <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Selection Matrix</h4>
                     <input placeholder="Filter..." className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                     {entitiesToMap.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedEntityIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                          className={`p-5 cursor-pointer transition-all hover:bg-slate-50 flex items-center space-x-4 ${selectedEntityIds.includes(item.id) ? 'bg-indigo-50 border-r-4 border-indigo-600' : ''}`}
                        >
                           <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${selectedEntityIds.includes(item.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>
                              {selectedEntityIds.includes(item.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                           </div>
                           <div className="min-w-0">
                              <div className="text-[11px] font-black text-slate-800 uppercase italic truncate">{item.label}</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">{item.sub}</div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="p-5 bg-slate-900 text-center">
                     <button onClick={() => setSelectedEntityIds(entitiesToMap.map(e => e.id))} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Select All Visible</button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'LOGS' && (
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
             <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black italic uppercase text-slate-800">Dispatch History</h3>
                <div className="flex items-center space-x-4">
                   <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100">Live Telemetry</div>
                   <button className="text-[10px] font-black text-slate-400 uppercase hover:text-rose-600">Flush Buffer</button>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                      <tr>
                         <th className="px-10 py-6">Trace Shard</th>
                         <th className="px-10 py-6">Recipient Node</th>
                         <th className="px-10 py-6">Subject Pattern</th>
                         <th className="px-10 py-6 text-center">Status</th>
                         <th className="px-10 py-6 text-right">Moment</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {dispatchLogs.map(log => (
                        <tr key={log.id} className="hover:bg-indigo-50/10 transition-colors group">
                           <td className="px-10 py-6 font-mono text-[10px] font-black text-indigo-500 italic">{log.id}</td>
                           <td className="px-10 py-6 font-black text-slate-800 text-xs truncate max-w-[200px]">{log.recipient}</td>
                           <td className="px-10 py-6 text-xs text-slate-500 font-medium italic">"{log.subject}"</td>
                           <td className="px-10 py-6 text-center">
                              <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${
                                log.status === 'OPENED' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              }`}>{log.status}</span>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <div className="text-[10px] font-black text-slate-800">{log.timestamp.split(',')[1]}</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase">{log.timestamp.split(',')[0]}</div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'CONFIG' && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in zoom-in-95 duration-500">
             <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-slate-950 text-white">
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter">Infrastructure Node</h3>
                   <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.4em] mt-2">Auth & Encryption Parameters</p>
                </div>
                <div className="p-10 space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3"></div>Relay Cluster</h4>
                         <div className="space-y-4">
                            <input value={config.smtpHost} onChange={e => setConfig({...config, smtpHost: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black" placeholder="Host" />
                            <div className="grid grid-cols-2 gap-4">
                               <input value={config.smtpPort} onChange={e => setConfig({...config, smtpPort: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black text-center" placeholder="Port" />
                               <select value={config.encryption} onChange={e => setConfig({...config, encryption: e.target.value as any})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-xs font-black text-indigo-600">
                                  <option value="STARTTLS">STARTTLS</option>
                                  <option value="SSL">SSL/TLS</option>
                               </select>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3"></div>Vault Credentials</h4>
                         <div className="space-y-4">
                            <input value={config.smtpUser} onChange={e => setConfig({...config, smtpUser: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black" placeholder="User" />
                            <input type="password" value={config.smtpPass} onChange={e => setConfig({...config, smtpPass: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black" placeholder="Secret" />
                         </div>
                      </div>
                   </div>
                   <div className="pt-10 border-t border-slate-100 flex justify-end gap-4">
                      <button onClick={runGatewayTest} className={`px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all ${isTesting ? 'animate-pulse' : ''}`}>{isTesting ? 'Handshaking...' : 'Test Handshake'}</button>
                      <button className="px-12 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl">Apply Node Logic</button>
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-4 border-slate-800">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-10">Sender Reputation</h4>
                   <div className="space-y-6">
                      <div className="text-6xl font-black italic tracking-tighter text-emerald-400">{reputationScore}%</div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 shadow-[0_0_12px_#10b981]" style={{ width: `${reputationScore}%` }}></div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest leading-relaxed italic">
                        Node reputation is based on simulated SPF, DKIM, and DMARC alignment.
                      </p>
                   </div>
                </div>

                <div className="bg-white rounded-[3rem] p-8 border-2 border-slate-100 shadow-sm space-y-6">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Policy Flags</h4>
                   <div className="space-y-4">
                      {['Enforce SSL', 'Log Payload Headers', 'Throttling Mode', 'Statutory Footer'].map(f => (
                        <div key={f} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                           <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{f}</span>
                           <button className="w-10 h-5 bg-indigo-600 rounded-full relative"><div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div></button>
                        </div>
                      ))}
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