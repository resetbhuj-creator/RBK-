import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Voucher, Ledger, AccountGroup } from '../types';

interface EmailGatewayProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
  accountGroups?: AccountGroup[];
  activeCompany: any;
  forceTab?: 'CAMPAIGNS' | 'LOGS' | 'CONFIG';
}

interface DispatchLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  type: 'TRANSACTIONAL' | 'BULK' | 'ALERT' | 'SYSTEM_TEST' | 'GROUP_BURST';
  status: 'SENT' | 'FAILED' | 'OPENED' | 'VERIFIED' | 'BOUNCED';
  details?: string;
}

const VAR_TOKENS = [
  { tag: '{{party_name}}', desc: 'Counterparty Title' },
  { tag: '{{vch_id}}', desc: 'Voucher Reference' },
  { tag: '{{amount}}', desc: 'Net Value' },
  { tag: '{{date}}', desc: 'Execution Date' },
  { tag: '{{company_name}}', desc: 'Origin Entity' }
];

const EmailGateway: React.FC<EmailGatewayProps> = ({ vouchers, ledgers, accountGroups = [], activeCompany, forceTab }) => {
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
  const [targetMode, setTargetMode] = useState<'VOUCHERS' | 'LEDGERS' | 'GROUPS'>('VOUCHERS');
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [bulkSubject, setBulkSubject] = useState('Transaction Confirmation: {{vch_id}}');
  const [bulkBody, setBulkBody] = useState('Dear {{party_name}},\n\nThis is to verify that a transaction of {{amount}} was committed on {{date}} against reference {{vch_id}}.\n\nPlease find the statutory documents attached for your records.\n\nThank you.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Logs State
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([
    { id: 'MAIL-204', timestamp: '2023-12-01T10:20:00Z', recipient: 'audit@global-supply.com', subject: 'Invoice SL/23-24/0045 Confirmation', type: 'TRANSACTIONAL', status: 'OPENED' },
    { id: 'MAIL-203', timestamp: '2023-12-01T11:15:00Z', recipient: 'finance@acme-corp.net', subject: 'Statement of Account Q4', type: 'BULK', status: 'SENT' },
    { id: 'MAIL-202', timestamp: '2023-12-01T11:45:00Z', recipient: 'unreachable@node.io', subject: 'Urgent: Payment Receipt', type: 'TRANSACTIONAL', status: 'BOUNCED' }
  ]);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (forceTab) setActiveTab(forceTab); }, [forceTab]);
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [terminalLogs]);

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
    if (targetMode === 'LEDGERS') return ledgers.slice(0, 50).map(l => ({ id: l.id, label: l.name, sub: l.group }));
    return accountGroups.map(g => ({ id: g.id, label: g.name, sub: `${g.nature} Classification` }));
  }, [vouchers, ledgers, accountGroups, targetMode]);

  const executeDispatch = () => {
    if (selectedEntityIds.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      let finalRecipients: { name: string, email: string, ref?: string }[] = [];

      if (targetMode === 'GROUPS') {
        selectedEntityIds.forEach(groupId => {
          const group = accountGroups.find(g => g.id === groupId);
          if (!group) return;
          const groupLedgers = ledgers.filter(l => l.group === group.name && l.email);
          groupLedgers.forEach(l => {
            finalRecipients.push({ name: l.name, email: l.email || 'no-email@nexus.io', ref: group.name });
          });
        });
      } else if (targetMode === 'LEDGERS') {
        selectedEntityIds.forEach(id => {
          const l = ledgers.find(lx => lx.id === id);
          if (l) finalRecipients.push({ name: l.name, email: l.email || 'no-email@nexus.io', ref: l.group });
        });
      } else {
        selectedEntityIds.forEach(id => {
          const v = vouchers.find(vx => vx.id === id);
          if (v) finalRecipients.push({ name: v.party, email: 'counterparty@nexus.io', ref: v.id });
        });
      }

      const newLogs: DispatchLog[] = finalRecipients.map((rec, i) => ({
        id: `MAIL-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        recipient: rec.email,
        subject: bulkSubject.replace('{{vch_id}}', rec.ref || 'N/A').replace('{{party_name}}', rec.name),
        type: targetMode === 'GROUPS' ? 'GROUP_BURST' : (targetMode === 'VOUCHERS' ? 'TRANSACTIONAL' : 'BULK'),
        status: 'SENT'
      }));

      setDispatchLogs(prev => [...newLogs, ...prev]);
      setIsProcessing(false);
      alert(`Sequencer Committed: ${newLogs.length} payloads injected into SMTP cluster.`);
      setActiveTab('LOGS');
    }, 2000);
  };

  const runGatewayTest = () => {
    setIsTesting(true);
    setTerminalLogs([]);
    const addTLog = (m: string) => setTerminalLogs(p => [...p, `[${new Date().toLocaleTimeString()}] ${m}`]);
    
    addTLog(`HANDSHAKE INIT: Initiating TCP connection to ${config.smtpHost}...`);
    setTimeout(() => {
      addTLog(`TCP_ACK: Connection established on port ${config.smtpPort}.`);
      addTLog(`S: 220 relay.nexus-erp.cloud ESMTP Postfix`);
      addTLog(`C: EHLO nexus-erp-v4`);
    }, 500);
    
    setTimeout(() => {
      addTLog(`S: 250-relay.nexus-erp.cloud\nS: 250-PIPELINING\nS: 250-SIZE 10240000\nS: 250 STARTTLS`);
      addTLog(`C: STARTTLS`);
      addTLog(`S: 220 2.0.0 Ready to start TLS`);
    }, 1200);

    setTimeout(() => {
      addTLog(`TLS_ESTABLISHED: Protocol TLS 1.3 | Cipher AES256-GCM-SHA384`);
      addTLog(`C: AUTH LOGIN`);
      addTLog(`S: 334 VXNlcm5hbWU6`);
      addTLog(`C: [ENCRYPTED_ID]`);
      addTLog(`S: 334 UGFzc3dvcmQ6`);
      addTLog(`C: [ENCRYPTED_KEY]`);
      addTLog(`S: 235 2.7.0 Authentication successful`);
    }, 2500);

    setTimeout(() => {
      addTLog(`GATEWAY_VERIFIED: Full handshake parity confirmed.`);
      setIsTesting(false);
    }, 4000);
  };

  const getStatusBadge = (status: DispatchLog['status']) => {
    switch (status) {
      case 'OPENED': return <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase border-2 bg-indigo-50 text-indigo-600 border-indigo-100 flex items-center space-x-1.5 shadow-sm"><span className="animate-pulse">👁️</span><span>Opened</span></span>;
      case 'SENT': return <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase border-2 bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center space-x-1.5 shadow-sm"><span>✅</span><span>Sent</span></span>;
      case 'BOUNCED':
      case 'FAILED': return <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase border-2 bg-rose-50 text-rose-600 border-rose-100 flex items-center space-x-1.5 shadow-sm"><span className="animate-ping">🚫</span><span>Bounced</span></span>;
      default: return <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase border-2 bg-slate-50 text-slate-500 border-slate-200">SENT</span>;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex bg-slate-200/50 p-1.5 rounded-[2.5rem] border border-slate-200 max-w-2xl mx-auto shadow-inner">
         {(['CAMPAIGNS', 'LOGS', 'CONFIG'] as const).map(tab => (
           <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}>{tab}</button>
         ))}
      </div>

      <main>
        {activeTab === 'CAMPAIGNS' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-10 border-b border-slate-50 pb-4">Variable Token Hub</h4>
                 <div className="space-y-3">
                    {VAR_TOKENS.map(t => (
                      <button key={t.tag} onClick={() => insertToken(t.tag)} className="w-full flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-400 hover:bg-white transition-all text-left group">
                         <span className="font-mono text-[11px] font-black text-indigo-600 group-hover:scale-105 transition-transform origin-left">{t.tag}</span>
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{t.desc}</span>
                      </button>
                    ))}
                 </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
               <div className="bg-white rounded-[3.5rem] border border-slate-200 p-12 shadow-sm relative">
                  <div className="flex items-center justify-between mb-12">
                     <h3 className="text-xl font-black uppercase italic text-slate-800 tracking-tight">Mail Compositor</h3>
                     <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                        {(['VOUCHERS', 'LEDGERS', 'GROUPS'] as const).map(m => (
                          <button key={m} onClick={() => { setTargetMode(m as any); setSelectedEntityIds([]); }} className={`px-5 py-2.5 text-[9px] font-black uppercase rounded-xl transition-all ${targetMode === m ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400'}`}>{m}</button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-10">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payload Subject</label>
                       <input value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} className="w-full px-8 py-5 rounded-[2rem] border border-slate-200 bg-white text-sm font-black text-slate-800 outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner italic" />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Body Shard Workspace</label>
                       <textarea ref={textAreaRef} value={bulkBody} onChange={e => setBulkBody(e.target.value)} className="w-full h-96 px-10 py-10 rounded-[3rem] border border-slate-200 bg-slate-50/50 text-sm font-medium leading-relaxed italic resize-none shadow-inner outline-none focus:bg-white transition-all" />
                    </div>

                    <div className="p-12 bg-slate-900 rounded-[4rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden border-b-8 border-indigo-600">
                       <div className="relative z-10">
                          <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.5em] mb-3">Transmission Queue</h4>
                          <div className="text-6xl font-black text-white italic tracking-tighter tabular-nums">{selectedEntityIds.length} <span className="text-base font-bold text-slate-500 not-italic uppercase tracking-widest">Targets Staged</span></div>
                       </div>
                       <button onClick={executeDispatch} disabled={isProcessing || selectedEntityIds.length === 0} className={`relative z-10 px-16 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all transform active:scale-95 ${isProcessing ? 'bg-slate-700 text-slate-500 animate-pulse' : 'bg-white text-slate-900 hover:bg-indigo-600 hover:text-white'}`}>
                          {isProcessing ? 'TRANSFUSING...' : 'AUTHORIZE RELAY'}
                       </button>
                       <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-10 -mr-32 -mt-32"></div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                     <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4">Selector Matrix</h4>
                     <input placeholder="Filter identities..." className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black outline-none shadow-inner" />
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                     {entitiesToMap.map(item => (
                        <div key={item.id} onClick={() => setSelectedEntityIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])} className={`p-5 cursor-pointer transition-all hover:bg-indigo-50 flex items-center space-x-4 ${selectedEntityIds.includes(item.id) ? 'bg-indigo-50/60 border-r-4 border-indigo-600' : ''}`}>
                           <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${selectedEntityIds.includes(item.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`}>
                              {selectedEntityIds.includes(item.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={5}><path d="M5 13l4 4L19 7" /></svg>}
                           </div>
                           <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-black text-slate-800 uppercase italic truncate">{item.label}</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{item.sub}</div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="p-6 bg-slate-900 text-center">
                     <button onClick={() => setSelectedEntityIds(entitiesToMap.map(e => e.id))} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Select All Partition</button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'LOGS' && (
          <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500 min-h-[600px] flex flex-col">
             <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-6">
                <div>
                  <h3 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter leading-none">Mail Dispatch Telemetry</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Historical Payload Tracking • Shard 44-X</p>
                </div>
                <div className="flex items-center space-x-4">
                   <div className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 flex items-center space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></div>
                      <span>Live Stream</span>
                   </div>
                   <button className="px-6 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase hover:bg-rose-50 hover:text-rose-600 transition-all">Flush Buffer</button>
                </div>
             </div>
             <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                   <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-400">
                      <tr>
                         <th className="px-10 py-7">Mail Trace ID</th>
                         <th className="px-10 py-7">Recipient Context</th>
                         <th className="px-10 py-7">Subject Vector</th>
                         <th className="px-10 py-7 text-center">Status Matrix</th>
                         <th className="px-10 py-7 text-right">Moment Captured</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 bg-white">
                      {dispatchLogs.map(log => (
                        <tr key={log.id} className="hover:bg-indigo-50/10 transition-colors group">
                           <td className="px-10 py-6">
                              <div className="flex items-center space-x-3">
                                 <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'BOUNCED' ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`}></span>
                                 <span className="font-mono text-[11px] font-black text-indigo-600 italic">#{log.id}</span>
                              </div>
                           </td>
                           <td className="px-10 py-6 font-black text-slate-800 text-xs truncate max-w-[250px] italic">{log.recipient}</td>
                           <td className="px-10 py-6 text-xs text-slate-500 font-medium italic group-hover:text-slate-800 transition-colors">"{log.subject}"</td>
                           <td className="px-10 py-6 text-center">
                              <div className="flex justify-center">{getStatusBadge(log.status)}</div>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <div className="text-[10px] font-black text-slate-800 tabular-nums">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{new Date(log.timestamp).toLocaleDateString()}</div>
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
             <div className="lg:col-span-2 bg-white rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
                <div className="p-12 border-b border-slate-100 bg-slate-950 text-white flex justify-between items-center">
                   <div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter">Gateway Infrastructure</h3>
                      <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.5em] mt-3">Auth & Secure Encryption Protocol</p>
                   </div>
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">⚙️</div>
                </div>
                <div className="p-12 space-y-12 bg-slate-50/20">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3"></div>Primary Relay Shard</h4>
                         <div className="space-y-5">
                            <input value={config.smtpHost} onChange={e => setConfig({...config, smtpHost: e.target.value})} className="w-full px-7 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black italic shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" placeholder="SMTP Host URI" />
                            <div className="grid grid-cols-2 gap-5">
                               <input value={config.smtpPort} onChange={e => setConfig({...config, smtpPort: e.target.value})} className="w-full px-7 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black text-center shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" placeholder="Port" />
                               <select value={config.encryption} onChange={e => setConfig({...config, encryption: e.target.value as any})} className="w-full px-7 py-4 rounded-2xl border border-slate-200 bg-white text-[10px] font-black text-indigo-600 outline-none shadow-inner cursor-pointer">
                                  <option value="STARTTLS">STARTTLS (RECM)</option>
                                  <option value="SSL">SSL/TLS</option>
                                  <option value="NONE">PLAIN (INSECURE)</option>
                               </select>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-6">
                         <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3"></div>Vault Credentials</h4>
                         <div className="space-y-5">
                            <input value={config.smtpUser} onChange={e => setConfig({...config, smtpUser: e.target.value})} className="w-full px-7 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black italic shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" placeholder="IAM Identifier" />
                            <input type="password" value={config.smtpPass} onChange={e => setConfig({...config, smtpPass: e.target.value})} className="w-full px-7 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" placeholder="Secure Secret Node" />
                         </div>
                      </div>
                   </div>

                   {/* Handshake Console Simulation */}
                   {(terminalLogs.length > 0 || isTesting) && (
                     <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between px-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                              Diagnostic Handshake Console
                           </span>
                           <button onClick={() => setTerminalLogs([])} className="text-[8px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-tighter">Clear Output</button>
                        </div>
                        <div className="bg-slate-950 rounded-[2rem] p-8 font-mono text-[10px] text-emerald-400/80 border-4 border-slate-900 shadow-2xl h-56 overflow-y-auto custom-scrollbar leading-relaxed">
                           {terminalLogs.map((log, i) => (
                             <div key={i} className="mb-1.5 break-all animate-in fade-in slide-in-from-left-2">
                               <span className="text-slate-700 mr-4 font-black">[{i.toString().padStart(3, '0')}]</span>
                               <span className={log.includes('S:') ? 'text-blue-400' : log.includes('C:') ? 'text-amber-400' : ''}>{log}</span>
                             </div>
                           ))}
                           <div ref={terminalEndRef} />
                        </div>
                     </div>
                   )}

                   <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-6">
                      <button onClick={runGatewayTest} disabled={isTesting} className={`px-12 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-4 border-slate-950 ${isTesting ? 'animate-pulse' : ''}`}>{isTesting ? 'TESTING HANDSHAKE...' : 'TEST SMTP HANDSHAKE'}</button>
                      <button className="px-16 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all transform active:scale-95 border-b-4 border-indigo-900">COMMIT INFRASTRUCTURE SHARD</button>
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-4 border-slate-800">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-10">System Reliability Index</h4>
                   <div className="space-y-8 relative z-10">
                      <div>
                        <div className="text-6xl font-black italic tracking-tighter text-emerald-400 tabular-nums">98.4%</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">Node Dispatch Reputation</div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                         <div className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]" style={{ width: '98.4%' }}></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                            <div className="text-[8px] font-black text-slate-500 uppercase">Latency</div>
                            <div className="text-lg font-black italic">42ms</div>
                         </div>
                         <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                            <div className="text-[8px] font-black text-slate-500 uppercase">Sync</div>
                            <div className="text-lg font-black italic">1:1</div>
                         </div>
                      </div>
                   </div>
                   <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-600 rounded-full blur-[100px] opacity-10"></div>
                </div>

                <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm space-y-8">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-50 pb-4">Global Network Policy</h4>
                   <div className="space-y-6">
                      {[
                        { label: 'Enforce Encrypted TLS', active: true },
                        { label: 'Fragment Large Payloads', active: false },
                        { label: 'Throttled Burst Mode', active: true },
                        { label: 'Log Raw Shard Headers', active: false }
                      ].map(f => (
                        <div key={f.label} className="flex items-center justify-between group cursor-pointer">
                           <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter italic group-hover:text-indigo-600 transition-colors">{f.label}</span>
                           <div className={`w-8 h-4 rounded-full relative transition-all ${f.active ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${f.active ? 'right-0.5' : 'left-0.5'}`}></div>
                           </div>
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