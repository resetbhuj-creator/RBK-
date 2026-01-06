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
  const [useImmutable, setUseImmutable] = useState(false);
  
  // Automation State
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [autoFrequency, setAutoFrequency] = useState<Frequency>('DAILY');
  const [autoTime, setAutoTime] = useState('02:00');
  const [autoDay, setAutoDay] = useState('Monday');
  const [retentionCount, setRetentionCount] = useState(30);

  const [includeDB, setIncludeDB] = useState(true);
  const [includeAssets, setIncludeAssets] = useState(false);
  const [includeLogs, setIncludeLogs] = useState(false);

  // Restore State
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

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
      `Establishing TLS 1.3 tunnel to ${selectedProvider} gateway (${cloudRegion})...`,
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
    }, 40);
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
      status: 'Verified',
      createdBy: mode === 'AUTO' ? 'System' : 'Admin',
      provider: mode === 'CLOUD' ? providerMap[selectedProvider] : (mode === 'AUTO' ? 'Secondary Node' : 'Internal Disk'),
      components: comps,
      integrityHash: `sha256:${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
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

  const runRestore = (id: string) => {
    const bk = backups.find(b => b.id === id);
    if (!bk) return;
    
    if (!confirm(`CRITICAL WARNING: You are about to initiate a system restore using archive ${bk.id}. This will overwrite all CURRENT data with the state from ${bk.timestamp}. Continue?`)) return;
    
    setRestoringId(id);
    setIsRestoring(true);
    setProgress(0);
    setLogs([]);
    addLog(`RESTORE PROTOCOL INITIATED: SOURCE=${bk.name}`);
    
    const restoreTasks = [
      "Verifying archive signature...",
      "Matching schema version...",
      "Unpacking relational shards...",
      "Remapping ledger delta indices...",
      "Executing post-restoration sanity check...",
      "Restarting data core..."
    ];

    let currentStep = -1;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsRestoring(false);
            setRestoringId(null);
            alert("Restoration Complete: System context has been successfully reverted.");
          }, 800);
          return 100;
        }
        const taskIdx = Math.min(Math.floor((prev / 100) * restoreTasks.length), restoreTasks.length - 1);
        if (taskIdx !== currentStep) {
          currentStep = taskIdx;
          addLog(restoreTasks[taskIdx]);
        }
        return prev + 2;
      });
    }, 60);
  };

  const vaultStats = useMemo(() => {
    const totalSize = backups.reduce((acc, b) => acc + parseFloat(b.size), 0);
    return {
      totalArchives: backups.length,
      usedStorage: `${totalSize.toFixed(1)} MB`,
      lastBackup: backups[0]?.timestamp || 'Never',
      health: totalSize > 500 ? 'Warning' : 'Healthy'
    };
  }, [backups]);

  const nextBackupTime = useMemo(() => {
    if (!autoBackupEnabled) return 'N/A';
    // Simple mock calculation for next backup display
    const now = new Date();
    const [hours, minutes] = autoTime.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    if (next < now) next.setDate(next.getDate() + 1);
    
    if (autoFrequency === 'WEEKLY') {
      const targetDay = DAYS_OF_WEEK.indexOf(autoDay);
      const currentDay = (now.getDay() + 6) % 7; // Convert to Mon=0
      let daysToAdd = (targetDay - currentDay + 7) % 7;
      if (daysToAdd === 0 && next < now) daysToAdd = 7;
      next.setDate(now.getDate() + daysToAdd);
    }
    
    return next.toLocaleString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  }, [autoBackupEnabled, autoTime, autoFrequency, autoDay]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Dynamic Module Header */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="flex items-center space-x-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-indigo-400/20 transform -rotate-3 hover:rotate-0 transition-transform">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Vault Sovereignty</h2>
              <div className="flex items-center space-x-4 mt-4">
                 <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-400 flex items-center">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2"></div>
                   Vault Status: {vaultStats.health}
                 </span>
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">v4.4 Enterprise Persistence</span>
              </div>
            </div>
          </div>
          
          <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-[2rem] border border-white/10 shadow-inner">
            {[
              { id: 'SNAPSHOTS', label: 'SNAPSHOTS' },
              { id: 'AUTOMATIC_BACKUPS', label: 'AUTOMATIC BACKUPS' },
              { id: 'REGISTRY', label: 'REGISTRY' }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as ActiveView)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === view.id ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[200px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
      </div>

      {(isBackingUp || isRestoring) ? (
        <div className="bg-slate-950 rounded-[3rem] p-12 shadow-2xl border-4 border-slate-900 relative overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-12">
              <div className="flex items-center space-x-8">
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl ${isRestoring ? 'bg-rose-600' : 'bg-indigo-600'} border-4 border-white/10`}>
                  <svg className={`w-12 h-12 text-white animate-spin-slow`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isRestoring ? 'bg-rose-500' : 'bg-indigo-500'}`}>
                      {isRestoring ? 'RESTORE ACTIVE' : 'BACKUP ACTIVE'}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px] uppercase">{backupMode || 'SNAPSHOT'} CLUSTER</span>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight leading-none uppercase">{currentTask || 'Waking sub-systems...'}</h3>
                </div>
              </div>
              <div className="text-right">
                <div className="text-7xl font-black text-white tabular-nums">{progress}%</div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Volume Alignment</p>
              </div>
            </div>
            <div className="w-full h-4 bg-slate-900 rounded-full mb-12 overflow-hidden border border-white/5 shadow-inner p-1">
              <div className={`h-full rounded-full transition-all duration-300 shadow-xl ${isRestoring ? 'bg-rose-500 shadow-rose-500/50' : 'bg-indigo-500 shadow-indigo-500/50'}`} style={{ width: `${progress}%` }}></div>
            </div>
            <div className="h-64 bg-black/40 rounded-[2rem] p-8 font-mono text-[11px] text-indigo-300/60 overflow-y-auto custom-scrollbar border border-white/5">
              {logs.map((log, i) => <div key={i} className="mb-1 animate-in fade-in"><span className="text-slate-700 mr-4 font-bold">{i.toString().padStart(3, '0')}</span>{log}</div>)}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeView === 'SNAPSHOTS' && (
              <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm space-y-12 animate-in slide-in-from-left-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex items-center space-x-5">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🛡️</div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 italic uppercase">Manual Shard Snapshot</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">On-demand archival protocol</p>
                      </div>
                   </div>
                   <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Gateway Ready</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Archive Identity</label>
                      <input value={backupName} onChange={e => setBackupName(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-700 shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Compression Engine</label>
                      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                         {(['NONE', 'FAST', 'MAX'] as const).map(l => (
                           <button key={l} onClick={() => setCompressionLevel(l)} className={`py-3 text-[9px] font-black uppercase rounded-xl transition-all ${compressionLevel === l ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{l}</button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-8">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center">
                     <div className="w-1 h-3 bg-indigo-600 rounded-full mr-3"></div>
                     Partition Scope
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'db', label: 'Financial DB', active: includeDB, set: setIncludeDB, icon: '💾' },
                        { id: 'assets', label: 'Blob Assets', active: includeAssets, set: setIncludeAssets, icon: '📦' },
                        { id: 'logs', label: 'Forensic Logs', active: includeLogs, set: setIncludeLogs, icon: '📜' }
                      ].map(item => (
                        <button key={item.id} onClick={() => item.set(!item.active)} className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 transition-all ${item.active ? 'bg-white border-indigo-600 text-indigo-900 shadow-xl' : 'bg-transparent border-slate-200 text-slate-400 opacity-60'}`}>
                           <span className="text-3xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</span>
                           <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                   <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                      <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="flex justify-between items-start mb-6">
                            <h4 className="text-lg font-black uppercase italic tracking-tighter">Disk Dump</h4>
                            <span className="p-2 bg-white/10 rounded-xl text-xl">🏠</span>
                         </div>
                         <p className="text-xs text-slate-400 font-medium leading-relaxed mb-10 italic">Generate a binary archive to your local validated filesystem node.</p>
                         <button onClick={() => startBackup('LOCAL')} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 border-b-4 border-slate-700">Initialize Local Dump</button>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                   </div>

                   <div className="bg-indigo-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                      <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="flex justify-between items-start mb-6">
                            <h4 className="text-lg font-black uppercase italic tracking-tighter">Cloud Mirror</h4>
                            <div className="flex bg-white/5 p-1 rounded-xl">
                               {(['AWS', 'GCP', 'AZURE'] as const).map(p => (
                                 <button key={p} onClick={(e) => { e.stopPropagation(); setSelectedProvider(p); }} className={`px-2.5 py-1 rounded-lg text-[7px] font-black transition-all ${selectedProvider === p ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{p}</button>
                               ))}
                            </div>
                         </div>
                         <p className="text-xs text-slate-400 font-medium leading-relaxed mb-10 italic">Encrypt and transmit a multi-region snapshot to your cloud provider.</p>
                         <button onClick={() => startBackup('CLOUD')} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-white hover:text-indigo-900 transition-all transform active:scale-95 border-b-4 border-indigo-900/40">Transmit to {selectedProvider}</button>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl -mr-16 -mt-16 opacity-20"></div>
                   </div>
                </div>
              </div>
            )}

            {activeView === 'AUTOMATIC_BACKUPS' && (
              <div className="bg-white rounded-[4rem] border border-slate-200 p-12 shadow-sm space-y-12 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-10">
                   <div>
                      <h3 className="text-2xl font-black text-slate-800 italic uppercase">Automatic Backup Daemon</h3>
                      <p className="text-sm text-slate-400 font-medium">Configure scheduled archival pulses for zero-intervention persistence.</p>
                   </div>
                   <div className="flex items-center space-x-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${autoBackupEnabled ? 'text-emerald-600' : 'text-slate-300'}`}>{autoBackupEnabled ? 'ENGINE ACTIVE' : 'ENGINE OFFLINE'}</span>
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-800 outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner"
                           >
                             {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                        </div>
                      )}

                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">Execution Moment (24H)</label>
                         <input type="time" value={autoTime} onChange={e => setAutoTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-2xl font-black text-slate-800 outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner" />
                      </div>
                   </div>
                   <div className="space-y-10">
                      <div className="space-y-3">
                         <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Archive Retention</label>
                            <span className="text-xs font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg">{retentionCount} Cycles</span>
                         </div>
                         <input type="range" min="5" max="100" step="5" value={retentionCount} onChange={e => setRetentionCount(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none accent-indigo-600 cursor-pointer mt-6" />
                         <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2"><span>Min: 5</span><span>Max: 100</span></div>
                      </div>
                      
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border-2 border-indigo-500/30">
                         <div className="relative z-10">
                            <div className="text-[9px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-4">Next Scheduled Task</div>
                            <div className="text-2xl font-black italic tracking-tighter tabular-nums text-white group-hover:scale-105 transition-transform origin-left">{nextBackupTime}</div>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-4">Calculated based on {autoFrequency} cluster policy</p>
                         </div>
                         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-[80px] opacity-10 -mr-16 -mt-16"></div>
                      </div>

                      <button className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-600 transition-all transform active:scale-95 border-b-8 border-black/40">Verify & Commit Policy</button>
                   </div>
                </div>
              </div>
            )}

            {activeView === 'REGISTRY' && (
              <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-900">
                    <tr>
                      <th className="px-10 py-8">Archive HASH / Identity</th>
                      <th className="px-10 py-8">Redundancy Class</th>
                      <th className="px-10 py-8">Binary Volume</th>
                      <th className="px-10 py-8 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {backups.map(bk => (
                      <tr key={bk.id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="px-10 py-6">
                           <div className="flex items-center space-x-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[10px] font-black shadow-inner border transition-all group-hover:scale-110 ${bk.type === 'Auto' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>{bk.type.charAt(0)}</div>
                              <div>
                                 <div className="text-sm font-black text-slate-800 uppercase tracking-tighter italic group-hover:text-indigo-600 transition-colors">{bk.name}</div>
                                 <div className="text-[9px] font-bold text-slate-400 uppercase mt-1 flex items-center">
                                    <span className="font-mono text-indigo-400 mr-2">{bk.id}</span>
                                    <span className="opacity-50">|</span>
                                    <span className="ml-2">{bk.timestamp}</span>
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex flex-col space-y-1.5">
                              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border self-start ${bk.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500'}`}>{bk.status}</span>
                              <div className="text-[8px] font-bold text-slate-300 uppercase truncate max-w-[120px]">{bk.integrityHash}</div>
                           </div>
                        </td>
                        <td className="px-10 py-6 font-mono text-xs font-black text-slate-800 tabular-nums">{bk.size}</td>
                        <td className="px-10 py-6 text-right">
                           <div className="flex justify-end space-x-2">
                              <button onClick={() => runRestore(bk.id)} className="p-3.5 bg-white border border-slate-200 text-slate-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm transform active:scale-90" title="Initiate System Restore">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              </button>
                              <button onClick={() => alert('Download Initiated...')} className="p-3.5 bg-white border border-slate-200 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm transform active:scale-90" title="Export Archive">
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
                 Vault Analytics
               </h3>
               <div className="space-y-10 relative z-10">
                  <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-center shadow-inner group hover:bg-white/10 transition-all">
                     <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 group-hover:text-indigo-400 transition-colors">Cumulative Volume</div>
                     <div className="text-5xl font-black italic tracking-tighter tabular-nums text-white">{vaultStats.usedStorage}</div>
                     <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[45%] shadow-[0_0_12px_#6366f1]"></div>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center">
                        <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Shards</div>
                        <div className="text-2xl font-black italic tabular-nums">{vaultStats.totalArchives}</div>
                     </div>
                     <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center">
                        <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Integrity</div>
                        <div className="text-2xl font-black text-emerald-400 italic">100%</div>
                     </div>
                  </div>
               </div>
               <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-600 rounded-full blur-[100px] opacity-10"></div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm space-y-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 pb-4">Security Baseline</h4>
               <div className="space-y-10">
                  <div className="flex items-center justify-between group">
                     <div className="space-y-1">
                        <span className="text-xs font-black text-slate-800 uppercase italic leading-none">AES-256 Encryption</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">FIPS 140-2 Level Core</p>
                     </div>
                     <button onClick={() => setUseEncryption(!useEncryption)} className={`w-12 h-7 rounded-full relative transition-all shadow-md ${useEncryption ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${useEncryption ? 'right-1' : 'left-1'}`}></div>
                     </button>
                  </div>
                  <div className="flex items-center justify-between group">
                     <div className="space-y-1">
                        <span className="text-xs font-black text-slate-800 uppercase italic leading-none">Object Lock (WORM)</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Immutable Storage Logic</p>
                     </div>
                     <button onClick={() => setUseImmutable(!useImmutable)} className={`w-12 h-7 rounded-full relative transition-all shadow-md ${useImmutable ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${useImmutable ? 'right-1' : 'left-1'}`}></div>
                     </button>
                  </div>
               </div>
            </div>

            <div className="p-10 bg-emerald-950 rounded-[3rem] text-white relative overflow-hidden shadow-2xl border-l-8 border-emerald-500 group">
               <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-white/10 shadow-inner group-hover:scale-110 transition-transform">🛡️</div>
                  <h4 className="text-xl font-black uppercase italic tracking-tighter mb-4">DR Strategy: Optimized</h4>
                  <p className="text-xs leading-relaxed font-medium text-emerald-100/60 italic">Your Disaster Recovery protocol is currently set to <span className="text-white font-bold underline decoration-emerald-500 underline-offset-8">Zero Data Loss</span>. All manual and cloud shards are cryptographically signed and regionalized.</p>
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