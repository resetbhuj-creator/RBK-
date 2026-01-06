import React, { useState, useMemo, useRef, useEffect } from 'react';

interface BackupRecord {
  id: string;
  name: string;
  timestamp: string;
  size: string;
  type: 'Manual' | 'Cloud' | 'Auto';
  status: 'Completed' | 'Failed' | 'In Progress' | 'Verified' | 'Corrupt';
  createdBy: string;
  provider?: string;
  components: string[];
  integrityHash: string;
}

type BackupMode = 'LOCAL' | 'CLOUD' | 'AUTO';
type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
type ActiveView = 'SNAPSHOTS' | 'AUTOMATIC_BACKUPS' | 'REGISTRY';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface BackupModuleProps {
  initialView?: ActiveView;
}

const BackupModule: React.FC<BackupModuleProps> = ({ initialView = 'SNAPSHOTS' }) => {
  const [activeView, setActiveView] = useState<ActiveView>(initialView);
  const [backups, setBackups] = useState<BackupRecord[]>([
    { id: 'BK-001', name: 'q4_final_stable_dump', timestamp: '2023-11-20 02:00 AM', size: '42.5 MB', type: 'Auto', status: 'Verified', createdBy: 'System', components: ['DB', 'CONFIG'], integrityHash: 'sha256:8f3c...2a1' },
    { id: 'BK-002', name: 'pre_migration_archive', timestamp: '2023-10-15 11:45 PM', size: '128.2 MB', type: 'Manual', status: 'Completed', createdBy: 'Admin', components: ['DB', 'ASSETS', 'LOGS'], integrityHash: 'sha256:4d1e...9b2' },
    { id: 'BK-003', name: 'weekly_safety_sync', timestamp: '2023-11-13 02:00 AM', size: '41.1 MB', type: 'Cloud', status: 'Verified', createdBy: 'System', provider: 'Google Cloud', components: ['DB'], integrityHash: 'sha256:1a2b...3c4' }
  ]);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMode, setBackupMode] = useState<BackupMode | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'AWS' | 'GCP' | 'AZURE'>('GCP');
  const [cloudRegion, setCloudRegion] = useState('us-east-1');
  const [compressionLevel, setCompressionLevel] = useState<'NONE' | 'FAST' | 'MAX'>('MAX');
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const [backupName, setBackupName] = useState(`nexus_vault_${new Date().toISOString().split('T')[0]}`);
  const [useEncryption, setUseEncryption] = useState(true);
  
  // Automation State
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [autoFrequency, setAutoFrequency] = useState<Frequency>('DAILY');
  const [autoTime, setAutoTime] = useState('02:00');
  const [autoDay, setAutoDay] = useState('Monday');
  const [retentionCount, setRetentionCount] = useState(30);

  const [includeDB, setIncludeDB] = useState(true);
  const [includeAssets, setIncludeAssets] = useState(false);
  const [includeLogs, setIncludeLogs] = useState(false);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const backupTasks = {
    LOCAL: [
      'Initializing local storage bridge...',
      'Locking relational tables for snapshot consistency...',
      'Streaming core database binary to buffer...',
      `Applying Gzip (${compressionLevel}) compression...`,
      'Calculating SHA-256 integrity hash...',
      'Committing binary volume to disk...'
    ],
    CLOUD: [
      `Establishing TLS 1.3 tunnel to ${selectedProvider} gateway...`,
      'Authenticating with IAM service provider...',
      'Serializing encrypted data chunks...',
      'Transmitting multi-part upload...',
      'Synchronizing metadata across global regions...',
      'Finalizing immutable object lock...'
    ],
    AUTO: [
      'Triggering scheduled maintenance daemon...',
      'Pre-backup sanity check: OK',
      'Acquiring system-wide snapshot lock...',
      'Pushing differential backup to standby nodes...',
      'Verifying archive block signatures...',
      'Rotation: Pruning archives older than policy limit...'
    ]
  };

  const startBackup = (mode: BackupMode) => {
    if (!includeDB && !includeAssets && !includeLogs) {
      alert("Selection Required: Please select at least one component to include.");
      return;
    }
    setBackupMode(mode);
    setIsBackingUp(true);
    setProgress(0);
    setLogs([]);
    addLog(`PROTOCOL INITIALIZED: ${mode} SEQUENCE.`);
    
    let currentStep = -1;
    const activeTasks = mode === 'AUTO' ? backupTasks.AUTO : (mode === 'LOCAL' ? backupTasks.LOCAL : backupTasks.CLOUD);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          finishBackup(mode);
          return 100;
        }
        
        const taskIdx = Math.min(Math.floor((prev / 100) * activeTasks.length), activeTasks.length - 1);
        if (taskIdx !== currentStep) {
          currentStep = taskIdx;
          setCurrentTask(activeTasks[taskIdx]);
          addLog(activeTasks[taskIdx]);
        }
        
        return prev + 1;
      });
    }, 50);
  };

  const finishBackup = (mode: BackupMode) => {
    const providerMap = { AWS: 'Amazon S3', GCP: 'Google Cloud', AZURE: 'Azure Blob' };
    const comps = [];
    if (includeDB) comps.push('DB');
    if (includeAssets) comps.push('ASSETS');
    if (includeLogs) comps.push('LOGS');

    const newBackup: BackupRecord = {
      id: `BK-${Math.floor(Math.random() * 900) + 100}`,
      name: mode === 'AUTO' ? `auto_gen_${Date.now()}` : backupName,
      timestamp: new Date().toLocaleString(),
      size: `${(Math.random() * 50 + 10).toFixed(1)} MB`,
      type: mode === 'AUTO' ? 'Auto' : (mode === 'LOCAL' ? 'Manual' : 'Cloud'),
      status: 'Verified',
      createdBy: mode === 'AUTO' ? 'System' : 'Admin',
      provider: mode === 'CLOUD' ? providerMap[selectedProvider] : 'Local Disk',
      components: comps,
      integrityHash: `sha256:${Math.random().toString(16).slice(2, 10)}...`
    };
    
    setBackups(prev => [newBackup, ...prev]);
    setIsBackingUp(false);
    setProgress(0);
    addLog(`BACKUP SUCCESSFUL: ${newBackup.id}`);
  };

  const redundancyHealth = useMemo(() => {
    const lastManual = backups.find(b => b.type === 'Manual')?.timestamp || 'N/A';
    const lastCloud = backups.find(b => b.type === 'Cloud')?.timestamp || 'N/A';
    const lastAuto = backups.find(b => b.type === 'Auto')?.timestamp || 'N/A';
    return { lastManual, lastCloud, lastAuto };
  }, [backups]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      {/* Redundancy Health Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Manual Snapshots', time: redundancyHealth.lastManual, icon: '💾', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Cloud Mirrors', time: redundancyHealth.lastCloud, icon: '☁️', color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Auto Maintenance', time: redundancyHealth.lastAuto, icon: '⚙️', color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ].map((h, i) => (
          <div key={i} className={`p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg flex items-center space-x-6 bg-white group overflow-hidden relative`}>
            <div className={`w-16 h-16 rounded-2xl ${h.bg} flex items-center justify-center text-3xl shrink-0 border border-slate-100 group-hover:scale-110 transition-transform`}>
              {h.icon}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{h.label}</div>
              <div className={`text-xs font-black italic tabular-nums ${h.time === 'N/A' ? 'text-slate-300' : 'text-slate-800'}`}>
                {h.time === 'N/A' ? 'NO RECORD FOUND' : `LAST: ${h.time}`}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`w-1.5 h-1.5 rounded-full ${h.time === 'N/A' ? 'bg-slate-200' : 'bg-emerald-500 animate-pulse'}`}></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Status: {h.time === 'N/A' ? 'OFFLINE' : 'SYNCHRONIZED'}</span>
              </div>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 ${h.color.replace('text', 'bg')}`}></div>
          </div>
        ))}
      </div>

      {/* Active Process Overlay */}
      {isBackingUp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95">
              <div className="p-16 space-y-12">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex items-center space-x-10">
                       <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-pulse">
                          <svg className="w-12 h-12 text-white animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                       </div>
                       <div>
                          <div className="flex items-center space-x-3 mb-3">
                             <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-200">System Maintenance Mode</span>
                             <span className="text-slate-400 font-mono text-[10px] uppercase">Node: {backupMode} ARCHIVE</span>
                          </div>
                          <h3 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase leading-none">{currentTask || 'Waking sub-systems...'}</h3>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-7xl font-black text-slate-900 italic tracking-tighter tabular-nums">{progress}%</div>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Volume Alignment</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner p-1">
                       <div className="h-full bg-indigo-600 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-[0.5em]">
                       <span>IO_INIT</span>
                       <span>SHARD_MAPPING</span>
                       <span>BLOCK_ENCRYPTION</span>
                       <span>COMMIT_FINAL</span>
                    </div>
                 </div>

                 <div className="h-48 bg-slate-900 rounded-[2rem] p-8 font-mono text-[11px] text-emerald-400/80 overflow-y-auto custom-scrollbar border-4 border-slate-800 shadow-inner">
                    {logs.map((log, i) => <div key={i} className="mb-1 animate-in slide-in-from-left-2"><span className="text-slate-700 mr-4 font-bold select-none">{i.toString().padStart(3, '0')}</span>{log}</div>)}
                    <div ref={consoleEndRef} />
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {activeView === 'SNAPSHOTS' && (
            <div className="bg-white rounded-[3.5rem] border border-slate-200 p-12 shadow-sm space-y-12 animate-in slide-in-from-left-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-200">💾</div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 italic uppercase">Manual Shard Snapshot</h3>
                      <p className="text-sm text-slate-400 font-medium">Initiate an on-demand system-wide archival protocol.</p>
                    </div>
                 </div>
                 <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Relay Ready</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Snapshot Identity</label>
                    <input value={backupName} onChange={e => setBackupName(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-700 shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Partition Scope</label>
                    <div className="flex items-center space-x-4 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                       {[
                         { id: 'db', label: 'DB', active: includeDB, set: setIncludeDB },
                         { id: 'assets', label: 'ASSETS', active: includeAssets, set: setIncludeAssets },
                         { id: 'logs', label: 'LOGS', active: includeLogs, set: setIncludeLogs }
                       ].map(item => (
                         <button key={item.id} onClick={() => item.set(!item.active)} className={`flex-1 py-2.5 text-[9px] font-black uppercase rounded-xl transition-all ${item.active ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{item.label}</button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                 <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl border-l-8 border-indigo-600">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                       <div className="flex justify-between items-start mb-10">
                          <h4 className="text-xl font-black uppercase italic tracking-tighter">Disk Dump</h4>
                          <span className="p-3 bg-white/10 rounded-xl text-2xl">🏠</span>
                       </div>
                       <p className="text-sm text-slate-400 font-medium leading-relaxed mb-10 italic">Generate a manual binary archive to your local validated filesystem node.</p>
                       <button onClick={() => startBackup('LOCAL')} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 border-b-8 border-slate-700">Initialize Local Shard</button>
                    </div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                 </div>

                 <div className="bg-indigo-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl border-l-8 border-sky-400">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                       <div className="flex justify-between items-start mb-10">
                          <h4 className="text-xl font-black uppercase italic tracking-tighter">Cloud Mirror</h4>
                          <div className="flex bg-white/5 p-1 rounded-xl">
                               {(['AWS', 'GCP', 'AZURE'] as const).map(p => (
                                 <button key={p} onClick={(e) => { e.stopPropagation(); setSelectedProvider(p); }} className={`px-3 py-1.5 rounded-lg text-[8px] font-black transition-all ${selectedProvider === p ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{p}</button>
                               ))}
                          </div>
                       </div>
                       <p className="text-sm text-slate-400 font-medium leading-relaxed mb-10 italic">Transmit an encrypted snapshot to your configured multi-region cloud vault.</p>
                       <button onClick={() => startBackup('CLOUD')} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-white hover:text-indigo-900 transition-all transform active:scale-95 border-b-8 border-indigo-900/40">Authorize Mirror</button>
                    </div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-3xl -mr-16 -mt-16 opacity-20"></div>
                 </div>
              </div>
            </div>
          )}

          {activeView === 'AUTOMATIC_BACKUPS' && (
            <div className="bg-white rounded-[4rem] border border-slate-200 p-12 shadow-sm space-y-12 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-10">
                 <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.8rem] flex items-center justify-center text-3xl shadow-inner border border-emerald-100">⚙️</div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-800 italic uppercase">Scheduled Pulse Node</h3>
                       <p className="text-sm text-slate-400 font-medium">Define recurring archival pulses for zero-intervention persistence.</p>
                    </div>
                 </div>
                 <div className="flex items-center space-x-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${autoBackupEnabled ? 'text-emerald-600' : 'text-slate-300'}`}>{autoBackupEnabled ? 'PULSE ACTIVE' : 'PULSE PAUSED'}</span>
                    <button onClick={() => setAutoBackupEnabled(!autoBackupEnabled)} className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${autoBackupEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${autoBackupEnabled ? 'right-1' : 'left-1'}`}></div>
                    </button>
                 </div>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 transition-all duration-500 ${autoBackupEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                 <div className="space-y-10">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">Frequency Protocol</label>
                       <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                          {(['DAILY', 'WEEKLY'] as Frequency[]).map(f => (
                            <button key={f} onClick={() => setAutoFrequency(f)} className={`py-4 text-[10px] font-black rounded-xl transition-all ${autoFrequency === f ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-slate-500'}`}>{f}</button>
                          ))}
                       </div>
                    </div>
                    
                    {autoFrequency === 'WEEKLY' && (
                      <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                         <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">Execution Day</label>
                         <select 
                          value={autoDay} 
                          onChange={e => setAutoDay(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner appearance-none cursor-pointer"
                         >
                           {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                         </select>
                      </div>
                    )}

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">Maintenance Window Start</label>
                       <div className="relative">
                          <input type="time" value={autoTime} onChange={e => setAutoTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-10 py-6 text-3xl font-black text-slate-800 outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner italic" />
                          <svg className="w-6 h-6 text-slate-300 absolute left-4 top-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-10">
                    <div className="p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border-4 border-slate-800 group">
                       <div className="relative z-10">
                          <div className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-6">Retention Context</div>
                          <div className="flex items-end space-x-4 mb-8">
                             <div className="text-7xl font-black italic tracking-tighter tabular-nums">{retentionCount}</div>
                             <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Cycles preserved</span>
                          </div>
                          <input type="range" min="5" max="100" step="5" value={retentionCount} onChange={e => setRetentionCount(parseInt(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-indigo-500 cursor-pointer" />
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-6">Automatic rotation will prune archives older than this limit.</p>
                       </div>
                       <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[80px] opacity-10"></div>
                    </div>

                    <button className="w-full py-7 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-500 transition-all transform active:scale-95 border-b-8 border-indigo-900/40">Verify & Commit Engine State</button>
                 </div>
              </div>
            </div>
          )}

          {activeView === 'REGISTRY' && (
            <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-900">
                  <tr>
                    <th className="px-12 py-8">Archive Shard Identity</th>
                    <th className="px-12 py-8 text-center">Class</th>
                    <th className="px-12 py-8">Binary Volume</th>
                    <th className="px-12 py-8 text-right">Modular Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {backups.map(bk => (
                    <tr key={bk.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-12 py-6">
                         <div className="flex items-center space-x-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner border transition-all group-hover:scale-110 ${bk.type === 'Auto' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : bk.type === 'Manual' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-sky-50 text-sky-600 border-sky-200'}`}>
                               {bk.type === 'Auto' ? '⚙️' : bk.type === 'Manual' ? '💾' : '☁️'}
                            </div>
                            <div>
                               <div className="text-sm font-black text-slate-800 uppercase tracking-tighter italic group-hover:text-indigo-600 transition-colors">{bk.name}</div>
                               <div className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 flex items-center">
                                  <span className="font-mono text-indigo-400 mr-2">{bk.id}</span>
                                  <span className="opacity-50">|</span>
                                  <span className="ml-2">{bk.timestamp}</span>
                               </div>
                            </div>
                         </div>
                      </td>
                      <td className="px-12 py-6 text-center">
                         <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                            bk.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                         }`}>{bk.status}</span>
                      </td>
                      <td className="px-12 py-6 font-mono text-xs font-black text-slate-800 tabular-nums">{bk.size}</td>
                      <td className="px-12 py-6 text-right">
                         <div className="flex justify-end space-x-3">
                            <button onClick={() => alert('Initiating System Restore...')} className="p-3 bg-white border border-slate-200 text-slate-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm transform active:scale-90" title="Initiate Restore">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                            <button onClick={() => alert('Downloading...')} className="p-3 bg-white border border-slate-200 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm transform active:scale-90" title="Export">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-4 border-slate-800">
             <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-12 flex items-center">
               <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3 animate-pulse shadow-[0_0_8px_#34d399]"></div>
               Archive Governance
             </h3>
             <div className="space-y-10 relative z-10">
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-center shadow-inner group hover:bg-white/10 transition-all">
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 group-hover:text-indigo-400 transition-colors">Cumulative Volume</div>
                   <div className="text-5xl font-black italic tracking-tighter tabular-nums text-white">211.8 MB</div>
                   <div className="mt-6 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[42%] shadow-[0_0_12px_#6366f1]"></div>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Backups</div>
                      <div className="text-2xl font-black italic tabular-nums">{backups.length}</div>
                   </div>
                   <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center">
                      <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Reliability</div>
                      <div className="text-2xl font-black text-emerald-400 italic">100%</div>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-600 rounded-full blur-[100px] opacity-10"></div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm space-y-8">
             <h4 className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50 pb-4 tracking-widest">Persistent Logic</h4>
             <div className="space-y-6">
                {[
                  { label: 'AES-256 Crypto Shards', active: true },
                  { label: 'Differential Snapshotting', active: true },
                  { label: 'Immutable Logs (WORM)', active: false },
                  { label: 'Statutory Signing', active: true }
                ].map((f, i) => (
                  <div key={i} className="flex items-center justify-between">
                     <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter italic">{f.label}</span>
                     <div className={`w-2 h-2 rounded-full ${f.active ? 'bg-indigo-600 shadow-[0_0_8px_#6366f1]' : 'bg-slate-200'}`}></div>
                  </div>
                ))}
             </div>
          </div>

          <div className="p-10 bg-indigo-950 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border-l-8 border-sky-500 group">
             <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-white/10 shadow-inner group-hover:scale-110 transition-transform">🛡️</div>
                <h4 className="text-xl font-black uppercase italic tracking-tighter mb-4 leading-tight">Disaster Recovery Strategy: Optimized</h4>
                <p className="text-xs leading-relaxed font-medium text-sky-100/60 italic">Your organization is operating under a <span className="text-white font-bold underline decoration-sky-500 underline-offset-8">Zero Data Loss Policy</span>. All shards are replicated across internal disk nodes and cloud mirrors.</p>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500 rounded-full blur-[80px] opacity-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupModule;