import React, { useState, useMemo, useRef, useEffect } from 'react';

interface BackupRecord {
  id: string;
  name: string;
  timestamp: string;
  size: string;
  type: 'Manual' | 'Cloud' | 'Auto';
  status: 'Completed' | 'Failed' | 'In Progress' | 'Verified';
  createdBy: string;
  provider?: string;
  components: string[];
}

type BackupMode = 'LOCAL' | 'CLOUD' | 'AUTO';
type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
type ActiveView = 'SNAPSHOTS' | 'AUTOMATION' | 'REGISTRY';

const BackupModule: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('SNAPSHOTS');
  const [backups, setBackups] = useState<BackupRecord[]>([
    { id: 'BK-001', name: 'q4_final_stable_dump', timestamp: '2023-11-20 02:00 AM', size: '42.5 MB', type: 'Auto', status: 'Verified', createdBy: 'System', components: ['DB', 'CONFIG'] },
    { id: 'BK-002', name: 'pre_migration_archive', timestamp: '2023-10-15 11:45 PM', size: '128.2 MB', type: 'Manual', status: 'Completed', createdBy: 'Admin', components: ['DB', 'ASSETS', 'LOGS'] },
    { id: 'BK-003', name: 'weekly_safety_sync', timestamp: '2023-11-13 02:00 AM', size: '41.1 MB', type: 'Cloud', status: 'Verified', createdBy: 'System', provider: 'Google Cloud', components: ['DB'] }
  ]);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMode, setBackupMode] = useState<BackupMode | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'AWS' | 'GCP' | 'AZURE'>('GCP');
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const [backupName, setBackupName] = useState(`nexus_vault_${new Date().toISOString().split('T')[0]}`);
  const [useEncryption, setUseEncryption] = useState(true);
  
  // Automatic Backup Config State
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [autoFrequency, setAutoFrequency] = useState<Frequency>(() => (localStorage.getItem('auto_bk_freq') as Frequency) || 'DAILY');
  const [autoTime, setAutoTime] = useState(() => localStorage.getItem('auto_bk_time') || '02:00');
  const [retentionCount, setRetentionCount] = useState(() => parseInt(localStorage.getItem('auto_bk_retention') || '30'));
  const [autoDestination, setAutoDestination] = useState<'INTERNAL' | 'CLOUD'>(() => (localStorage.getItem('auto_bk_dest') as 'INTERNAL' | 'CLOUD') || 'CLOUD');
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  const [includeDB, setIncludeDB] = useState(true);
  const [includeAssets, setIncludeAssets] = useState(false);
  const [includeLogs, setIncludeLogs] = useState(false);

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
      'Applying Gzip (Level 9) compression...',
      'Calculating SHA-256 integrity hash...',
      'Committing binary volume to disk...'
    ],
    CLOUD: [
      'Establishing TLS 1.3 tunnel to cloud gateway...',
      'Authenticating with IAM service provider...',
      'Serializing encrypted data chunks...',
      'Transmitting multi-part upload (Chunk 1/4)...',
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
      alert("Selection Required: Please select at least one component to include in the archive.");
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
    }, 35);
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
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      size: `${(Math.random() * 50 + (includeAssets ? 100 : 10)).toFixed(1)} MB`,
      type: mode === 'AUTO' ? 'Auto' : (mode === 'LOCAL' ? 'Manual' : 'Cloud'),
      status: 'Completed',
      createdBy: mode === 'AUTO' ? 'System' : 'Admin',
      provider: mode === 'CLOUD' ? providerMap[selectedProvider] : (mode === 'AUTO' ? 'Secondary Node' : 'Internal Disk'),
      components: comps
    };
    
    addLog(`BACKUP SEQUENCE SUCCESSFUL. ARCHIVE ID: ${newBackup.id}`);
    
    setTimeout(() => {
      setBackups(prev => [newBackup, ...prev]);
      setIsBackingUp(false);
      setBackupMode(null);
      setProgress(0);
      setCurrentTask('');
      setActiveView('REGISTRY');
    }, 800);
  };

  const saveAutoPolicy = () => {
    setIsSavingPolicy(true);
    localStorage.setItem('auto_bk_freq', autoFrequency);
    localStorage.setItem('auto_bk_time', autoTime);
    localStorage.setItem('auto_bk_retention', retentionCount.toString());
    localStorage.setItem('auto_bk_dest', autoDestination);
    
    setTimeout(() => {
      setIsSavingPolicy(false);
      alert('Automation Policy committed to System Registry.');
    }, 1000);
  };

  const getNextRun = () => {
    if (!autoBackupEnabled) return 'Policy Disabled';
    const now = new Date();
    const [h, m] = autoTime.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target < now) target.setDate(target.getDate() + 1);
    
    if (autoFrequency === 'WEEKLY') {
      return `Next Sunday at ${autoTime}`;
    }
    if (autoFrequency === 'MONTHLY') {
      return `1st of Next Month at ${autoTime}`;
    }
    return `Tomorrow at ${autoTime}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-4 border-indigo-500/30">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl transform rotate-3 border-4 border-indigo-400/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">Vault Sovereignty</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">Configure organizational data persistence and recovery strategy.</p>
            </div>
          </div>
          
          <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
            {(['SNAPSHOTS', 'AUTOMATION', 'REGISTRY'] as ActiveView[]).map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === view ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}
              >
                {view === 'SNAPSHOTS' ? 'Snapshots' : view === 'AUTOMATION' ? 'Automatic Backups' : 'Registry'}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[150px] -mr-64 -mt-64 opacity-20 pointer-events-none"></div>
      </div>

      {isBackingUp ? (
        <div className="bg-slate-900 rounded-[3rem] p-12 shadow-2xl border-4 border-slate-800 relative overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-12">
              <div className="flex items-center space-x-8">
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl ${backupMode === 'LOCAL' ? 'bg-slate-800 border border-slate-700' : 'bg-indigo-900/50 border border-indigo-500/30'}`}>
                  <svg className="w-12 h-12 text-indigo-400 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Active I/O Stream</span>
                    <span className="text-slate-500 font-mono text-[10px]">{backupMode} SEQUENCE</span>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight leading-none uppercase">{currentTask}</h3>
                </div>
              </div>
              <div className="text-right">
                <div className="text-7xl font-black text-white tabular-nums">{progress}%</div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Serialization State</p>
              </div>
            </div>
            <div className="w-full h-4 bg-slate-800 rounded-full mb-12 overflow-hidden border border-slate-700/50 shadow-inner p-1">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.6)]" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="h-64 bg-black/40 rounded-[2rem] p-8 font-mono text-[11px] text-indigo-300/60 overflow-y-auto custom-scrollbar border border-slate-800">
              {logs.map((log, i) => <div key={i} className="mb-1"><span className="text-slate-700 mr-4 font-bold">{i.toString().padStart(3, '0')}</span>{log}</div>)}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeView === 'SNAPSHOTS' && (
              <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-10 animate-in slide-in-from-left-4 duration-500">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight italic uppercase leading-none">Manual Data Snapshot</h3>
                  <p className="text-sm text-slate-400 font-medium mt-2">Trigger an immediate, on-demand archive of the current system state.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Archive Identifier</label>
                    <input value={backupName} onChange={e => setBackupName(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Cluster</label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                      {['AWS', 'GCP', 'AZURE'].map(p => (
                        <button key={p} onClick={() => setSelectedProvider(p as any)} className={`py-3 text-[10px] font-black rounded-xl transition-all ${selectedProvider === p ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payload Scope</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'db', label: 'Relational DB', active: includeDB, set: setIncludeDB, icon: '💾' },
                        { id: 'assets', label: 'File Assets', active: includeAssets, set: setIncludeAssets, icon: '🖼️' },
                        { id: 'logs', label: 'Audit Stream', active: includeLogs, set: setIncludeLogs, icon: '📜' }
                      ].map(item => (
                        <button key={item.id} onClick={() => item.set(!item.active)} className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all ${item.active ? 'bg-white border-indigo-600 text-indigo-900 shadow-lg' : 'bg-slate-100 border-transparent text-slate-400'}`}>
                           <span className="text-xl">{item.icon}</span>
                           <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex space-x-4 pt-4">
                   <button onClick={() => startBackup('LOCAL')} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all transform active:scale-95">Disk Dump</button>
                   <button onClick={() => startBackup('CLOUD')} className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all transform active:scale-95 shadow-2xl shadow-indigo-900/20">Authorize Mirroring</button>
                </div>
              </div>
            )}

            {activeView === 'AUTOMATION' && (
              <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm space-y-12 animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight italic uppercase leading-none">Automatic Backups Configuration</h3>
                    <p className="text-sm text-slate-400 font-medium mt-2">Manage recurring archival sequences and system health synchronization.</p>
                  </div>
                  <div className="flex items-center space-x-4">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${autoBackupEnabled ? 'text-emerald-600' : 'text-slate-300'}`}>{autoBackupEnabled ? 'ENGINE ONLINE' : 'ENGINE OFFLINE'}</span>
                     <button onClick={() => setAutoBackupEnabled(!autoBackupEnabled)} className={`w-14 h-8 rounded-full relative transition-all shadow-md ${autoBackupEnabled ? 'bg-emerald-50' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${autoBackupEnabled ? 'right-1' : 'left-1'}`}></div>
                     </button>
                  </div>
                </div>

                <div className={`space-y-12 transition-all duration-500 ${autoBackupEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale blur-[2px]'}`}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] ml-1">Frequency Protocol</label>
                            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                               {(['DAILY', 'WEEKLY', 'MONTHLY'] as Frequency[]).map(f => (
                                 <button key={f} onClick={() => setAutoFrequency(f)} className={`py-4 text-[10px] font-black rounded-xl transition-all ${autoFrequency === f ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{f}</button>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] ml-1">Precision Execution Window</label>
                            <div className="relative group">
                               <input type="time" value={autoTime} onChange={e => setAutoTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner" />
                               <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold group-focus-within:text-indigo-600 transition-colors uppercase tracking-widest text-[10px]">Active Node Local</div>
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1 italic leading-relaxed">System performs differential delta at the specified moment to minimize latency.</p>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                               <label className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em]">Rotation Depth (Retention)</label>
                               <span className="text-xs font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{retentionCount} Historical States</span>
                            </div>
                            <input type="range" min="5" max="100" step="5" value={retentionCount} onChange={e => setRetentionCount(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 border border-slate-200 mt-4" />
                            <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2"><span>Min: 5</span><span>Max: 100</span></div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] ml-1">Vault Destination</label>
                            <div className="grid grid-cols-2 gap-4">
                               <button onClick={() => setAutoDestination('CLOUD')} className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 transition-all ${autoDestination === 'CLOUD' ? 'bg-indigo-50 border-indigo-600 shadow-xl' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                  <span className="text-3xl mb-3">☁️</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Cloud Mirror</span>
                                </button>
                               <button onClick={() => setAutoDestination('INTERNAL')} className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 transition-all ${autoDestination === 'INTERNAL' ? 'bg-indigo-50 border-indigo-600 shadow-xl' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                  <span className="text-3xl mb-3">💾</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Local SAN</span>
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="p-8 bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
                      <div className="relative z-10 flex items-center space-x-6">
                         <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-emerald-500/30 group">
                            <div className="animate-pulse group-hover:scale-110 transition-transform">🤖</div>
                         </div>
                         <div>
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-1">Automation Intelligence</h4>
                            <p className="text-sm font-black text-white italic">Next Run Attempt: <span className="text-emerald-400 underline underline-offset-4 decoration-emerald-500/30">{getNextRun()}</span></p>
                         </div>
                      </div>
                      <div className="flex items-center space-x-4 relative z-10">
                         <button 
                            onClick={saveAutoPolicy}
                            disabled={isSavingPolicy}
                            className={`px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl transition-all transform active:scale-95 border-b-4 border-slate-950 ${isSavingPolicy ? 'bg-slate-700 text-slate-500' : 'bg-white text-slate-900 hover:bg-emerald-500 hover:text-white'}`}
                         >
                            {isSavingPolicy ? 'Committing Policy...' : 'Save Configuration'}
                         </button>
                         <button onClick={() => startBackup('AUTO')} className="p-5 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all" title="Dry Run">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         </button>
                      </div>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
                   </div>
                </div>
              </div>
            )}

            {activeView === 'REGISTRY' && (
              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-[10px] uppercase font-black tracking-widest text-slate-400">
                    <tr>
                      <th className="px-10 py-7">Archive Identity</th>
                      <th className="px-10 py-7">Execution Class</th>
                      <th className="px-10 py-7">Binary Volume</th>
                      <th className="px-10 py-7 text-right">Modular Ops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {backups.map(bk => (
                      <tr key={bk.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-10 py-6">
                           <div className="flex items-center space-x-5">
                              <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center text-[10px] font-black shadow-inner border transition-all group-hover:scale-105 ${bk.type === 'Auto' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{bk.type.charAt(0)}</div>
                              <div>
                                 <div className="text-xs font-black text-slate-800 uppercase tracking-tight italic group-hover:text-indigo-600 transition-colors">{bk.name}</div>
                                 <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">{bk.timestamp} • SHA-256 Verified</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${bk.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{bk.status}</span>
                        </td>
                        <td className="px-10 py-6 font-mono text-[11px] font-black text-slate-800 tabular-nums">{bk.size}</td>
                        <td className="px-10 py-6 text-right">
                           <button onClick={() => alert('Initiating Restorative Protocol...')} className="p-3.5 bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm transform active:scale-90 border border-slate-200"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                        </td>
                      </tr>
                    ))}
                    {backups.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-32 text-center">
                           <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
                              <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                           </div>
                           <p className="text-sm font-black uppercase text-slate-300 tracking-[0.4em] italic">Archive registry exhausted</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-4 border-slate-800">
               <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-10 flex items-center">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 mr-3 animate-pulse shadow-[0_0_8px_#34d399]"></div>
                 System Health Metrics
               </h3>
               <div className="space-y-8 relative z-10">
                  <div className="space-y-3">
                     <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest"><span>Cloud Redundancy</span><span>34% Sync</span></div>
                     <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
                        <div className="h-full bg-indigo-500 w-[34%] rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)]"></div>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10">
                        <div className="text-[8px] font-black text-slate-500 uppercase mb-2">DB Shards</div>
                        <div className="text-2xl font-black italic tracking-tighter tabular-nums">128</div>
                     </div>
                     <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10">
                        <div className="text-[8px] font-black text-slate-500 uppercase mb-2">Block Integrity</div>
                        <div className="text-2xl font-black text-emerald-400 italic tracking-tighter">100%</div>
                     </div>
                  </div>
               </div>
               <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-600 rounded-full blur-[80px] opacity-10"></div>
            </div>

            <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-10 shadow-sm space-y-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-50 pb-4">Security Baseline</h4>
               <div className="space-y-8">
                  <div className="flex items-center justify-between group">
                     <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-800 uppercase italic">Block-Level Encryption</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">FIPS 140-2 Validated</p>
                     </div>
                     <button onClick={() => setUseEncryption(!useEncryption)} className={`w-11 h-6 rounded-full relative transition-all shadow-md ${useEncryption ? 'bg-indigo-600 shadow-indigo-900/20' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${useEncryption ? 'right-1' : 'left-1'}`}></div>
                     </button>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 group hover:bg-white transition-colors">
                     <p className="text-[10px] text-indigo-700 font-medium leading-relaxed italic">"Archive logic enforces isolated block persistence. Private keys are never transmitted over plain text channels."</p>
                  </div>
               </div>
            </div>

            <div className="bg-emerald-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-l-8 border-emerald-500">
               <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl mb-6 border border-white/10 shadow-inner">🛡️</div>
                  <h4 className="text-lg font-black uppercase italic tracking-tighter mb-4">DR Strategy Active</h4>
                  <p className="text-xs leading-relaxed font-medium text-emerald-100/60">Your Disaster Recovery protocol is currently set to <span className="text-white font-bold underline decoration-emerald-500 underline-offset-4">ZERO DATA LOSS</span>. Automatic mirrors are active across availability zones.</p>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-10"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupModule;