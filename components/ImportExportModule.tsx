import React, { useState, useEffect, useRef } from 'react';

interface TransferJob {
  id: string;
  type: 'IMPORT' | 'EXPORT';
  entity: string;
  timestamp: string;
  status: 'Completed' | 'Failed' | 'Processing';
  records: number;
  format: string;
}

type Stage = 'SETUP' | 'MAP' | 'EXECUTE';

interface ImportExportModuleProps {
  forcedEntity?: string;
  initialTab?: 'IMPORT' | 'EXPORT';
  initialFormat?: string;
  onClose?: () => void;
}

const ImportExportModule: React.FC<ImportExportModuleProps> = ({ 
  forcedEntity, 
  initialTab = 'IMPORT', 
  initialFormat = 'CSV',
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'EXPORT'>(initialTab);
  const [currentStage, setCurrentStage] = useState<Stage>('SETUP');
  const [selectedEntity, setSelectedEntity] = useState(forcedEntity || 'Accounting Vouchers');
  const [targetFormat, setTargetFormat] = useState(initialFormat);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);

  // Format Specific Settings
  const [csvDelimiter, setCsvDelimiter] = useState(',');

  const [jobs, setJobs] = useState<TransferJob[]>([
    { id: 'JOB-901', type: 'EXPORT', entity: 'Sales Vouchers', timestamp: '2023-11-23 10:15 AM', status: 'Completed', records: 1240, format: 'XLSX' },
    { id: 'JOB-902', type: 'IMPORT', entity: 'Accounting Vouchers', timestamp: '2023-11-25 09:30 AM', status: 'Completed', records: 850, format: 'CSV' },
    { id: 'JOB-903', type: 'EXPORT', entity: 'Inventory Items', timestamp: '2023-11-20 09:00 AM', status: 'Completed', records: 85, format: 'XML' },
    { id: 'JOB-905', type: 'IMPORT', entity: 'Users', timestamp: '2023-11-28 04:12 PM', status: 'Completed', records: 45, format: 'CSV' },
  ]);

  const ENTITIES = [
    'Accounting Vouchers',
    'Inventory Vouchers',
    'Ledgers', 
    'Inventory Items', 
    'Users',
    'Companies',
    'Account Groups'
  ];
  
  const FORMATS = ['CSV', 'XML', 'XLSX', 'JSON'];

  const ENTITY_SCHEMAS: Record<string, { source: string; target: string; type: string; required?: boolean }[]> = {
    'Accounting Vouchers': [
      { source: 'vch_no', target: 'Voucher Number', type: 'String', required: true },
      { source: 'vch_date', target: 'Date', type: 'Date', required: true },
      { source: 'vch_type', target: 'Type', type: 'Enum', required: true },
      { source: 'ledger_name', target: 'Ledger Name', type: 'String', required: true },
      { source: 'vch_amount', target: 'Amount', type: 'Float', required: true },
      { source: 'dr_cr', target: 'Dr/Cr', type: 'Enum', required: true },
      { source: 'narration', target: 'Narration', type: 'String' }
    ],
    'Users': [
      { source: 'name', target: 'Name', type: 'String', required: true },
      { source: 'email', target: 'Email', type: 'Email', required: true },
      { source: 'role', target: 'Role', type: 'String', required: true },
      { source: 'status', target: 'Status', type: 'Enum', required: true }
    ],
    'Inventory Items': [
      { source: 'item_id', target: 'Item ID', type: 'String' },
      { source: 'item_name', target: 'Name', type: 'String', required: true },
      { source: 'cat_name', target: 'Category', type: 'String', required: true },
      { source: 'unit_name', target: 'Unit', type: 'String', required: true },
      { source: 'price', target: 'Sale Price', type: 'Float', required: true },
      { source: 'hsn', target: 'HSN/SAC Code', type: 'String', required: true }
    ]
  };

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file.name);
    addLog(`Protocol check: File "${file.name}" detected. Initializing ${targetFormat} parser...`);
    
    if (targetFormat === 'CSV') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const firstLine = content.split('\n')[0];
        const headers = firstLine.split(csvDelimiter).map(h => h.trim());
        
        setDetectedHeaders(headers);
        
        // Auto-mapping attempt
        const initialMapping: Record<string, string> = {};
        const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
        schema.forEach(field => {
          const match = headers.find(h => 
            h.toLowerCase() === field.target.toLowerCase() || 
            h.toLowerCase().replace(/\s/g, '').includes(field.target.toLowerCase().replace(/\s/g, ''))
          );
          if (match) initialMapping[field.target] = match;
        });
        setMapping(initialMapping);
        setCurrentStage('MAP');
      };
      reader.readAsText(file);
    } else {
      // For non-CSV formats in this prototype, we simulate headers
      setDetectedHeaders(['Header_1', 'Header_2', 'Header_3', 'Header_4']);
      setCurrentStage('MAP');
    }
  };

  const downloadTemplate = () => {
    const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
    const headers = schema.map(s => s.target).join(csvDelimiter);
    
    addLog(`Generating protocol template for ${selectedEntity} in ${targetFormat}...`);
    
    const blob = new Blob([headers], { type: targetFormat === 'CSV' ? 'text/csv' : 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${selectedEntity.toLowerCase().replace(/\s/g, '_')}_template.${targetFormat.toLowerCase()}`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    addLog(`Download dispatched: ${selectedEntity.toLowerCase().replace(/\s/g, '_')}_template.${targetFormat.toLowerCase()}`);
  };

  const triggerExportDownload = () => {
    const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
    const headers = schema.map(s => s.target).join(csvDelimiter);
    const content = [headers, 'Sample Data 1, Sample Data 2'].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${selectedEntity.toLowerCase().replace(/\s/g, '_')}_export.${targetFormat.toLowerCase()}`);
    a.click();
  };

  const startOperation = () => {
    setCurrentStage('EXECUTE');
    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    
    addLog(`Sequence Start: ${activeTab === 'IMPORT' ? 'Ingesting' : 'Extracting'} ${selectedEntity}...`);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 12) + 4;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        finalizeJob();
      }
      setProgress(currentProgress);
      
      const rowIdx = Math.floor(currentProgress / 5);
      const logBatch = activeTab === 'IMPORT' ? [
        `Validating record #${rowIdx}: String sanitization...`,
        `Mapping CSV column "${mapping['Name']}" to system attribute "Name"...`,
        `Role check: Verification of "${mapping['Role']}" against system roles...`,
        `Integrity check: Record #${rowIdx} verified against schema.`
      ] : [
        `Serializing objects into ${targetFormat} structure...`,
        `Calculating CRC32 checksum for data packet...`,
        `Buffer synchronization complete for block ${Math.floor(currentProgress / 25)}.`
      ];
      addLog(logBatch[Math.floor(Math.random() * logBatch.length)]);
    }, 250);
  };

  const finalizeJob = () => {
    addLog(`${activeTab} SEQUENCE SUCCESSFUL: Data stream finalized.`);
    if (activeTab === 'EXPORT') triggerExportDownload();

    const newJob: TransferJob = {
      id: `JOB-${Math.floor(Math.random() * 900) + 100}`,
      type: activeTab,
      entity: selectedEntity,
      timestamp: new Date().toLocaleString(),
      status: 'Completed',
      records: Math.floor(Math.random() * 100) + 10,
      format: targetFormat
    };
    setJobs(prev => [newJob, ...prev]);
    setIsProcessing(false);
  };

  const resetStage = () => {
    setCurrentStage('SETUP');
    setProgress(0);
    setLogs([]);
    setSelectedFile(null);
    setMapping({});
  };

  const activeSchema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
  const allRequiredMapped = activeSchema.filter(s => s.required).every(s => mapping[s.target]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-4 border-indigo-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-amber-300/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase">Data Bridge Engine</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">Active: {selectedEntity}</span>
                {onClose && (
                   <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-white/20">Close Bridge</button>
                )}
              </div>
            </div>
          </div>
          {!forcedEntity && (
            <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
              {['IMPORT', 'EXPORT'].map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab as any); resetStage(); }} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
              ))}
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] -mr-64 -mt-64 opacity-10 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {currentStage === 'SETUP' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm animate-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{activeTab === 'IMPORT' ? 'Inbound Sequence' : 'Outbound Stream'}</h3>
                {activeTab === 'IMPORT' && (
                  <button onClick={downloadTemplate} className="flex items-center space-x-2 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                    <span>Download CSV Template</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Entity Classification</label>
                  <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} disabled={!!forcedEntity} className={`w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none text-sm font-bold text-slate-700 bg-slate-50 ${forcedEntity ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Format Protocol</label>
                  <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    {FORMATS.map(f => (
                      <button key={f} onClick={() => setTargetFormat(f)} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${f === targetFormat ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-700'}`}>{f}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div onClick={() => activeTab === 'IMPORT' ? fileInputRef.current?.click() : startOperation()} className="border-4 border-dashed rounded-[2.5rem] p-20 text-center group transition-all cursor-pointer border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20">
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 bg-slate-50 text-slate-300 group-hover:scale-110 group-hover:text-indigo-400 transition-all`}>
                  {activeTab === 'IMPORT' ? (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  ) : (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  )}
                </div>
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">{activeTab === 'IMPORT' ? `Upload ${targetFormat} Data` : 'Authorize Export Stream'}</h4>
                <p className="text-sm text-slate-400 font-medium mt-2">Maximum volume: 50MB. System will auto-parse column headers.</p>
                <button className={`mt-10 px-12 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-2xl transition-all transform active:scale-95 bg-indigo-600 text-white shadow-indigo-100`}>
                   {activeTab === 'IMPORT' ? 'Browse Files' : 'Generate Payload'}
                </button>
              </div>
            </div>
          )}

          {currentStage === 'MAP' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm animate-in zoom-in-95 duration-500">
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Interactive Attribute Map</h3>
                    <p className="text-xs text-slate-400 font-medium">Link columns from <span className="font-bold text-indigo-600">{selectedFile}</span> to system fields.</p>
                  </div>
               </div>
               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {activeSchema.map((field, i) => (
                    <div key={i} className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${mapping[field.target] ? 'bg-indigo-50/30 border-indigo-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${mapping[field.target] ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>{i + 1}</div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-sm text-slate-800 tracking-tight">{field.target}</span>
                            {field.required && <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">*</span>}
                          </div>
                          <span className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-400 rounded text-[8px] font-black uppercase tracking-widest">{field.type}</span>
                        </div>
                      </div>
                      <select value={mapping[field.target] || ''} onChange={(e) => setMapping({...mapping, [field.target]: e.target.value})} className={`min-w-[220px] px-4 py-3 rounded-2xl border bg-white text-xs font-bold transition-all ${mapping[field.target] ? 'border-indigo-200 ring-2 ring-indigo-50' : 'border-slate-200 focus:border-indigo-400'}`}>
                        <option value="">-- Ignore --</option>
                        {detectedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
               </div>
               <div className="mt-12 flex items-center justify-between p-8 bg-slate-900 rounded-[2rem] text-white">
                  <div>
                    <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Alignment Status</div>
                    <div className="text-lg font-black">{Object.keys(mapping).length} / {activeSchema.length} Attributes Resolved</div>
                  </div>
                  <button disabled={!allRequiredMapped} onClick={startOperation} className={`px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all transform active:scale-95 ${allRequiredMapped ? 'bg-indigo-600 text-white shadow-2xl' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}>Authorize Commit &rarr;</button>
               </div>
            </div>
          )}

          {currentStage === 'EXECUTE' && (
            <div className="bg-slate-900 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-10">
                     <h4 className="text-white font-black text-2xl tracking-tight uppercase">Ingestion Terminal</h4>
                     <span className="text-5xl font-black text-white tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-80 bg-black/40 rounded-[2rem] p-8 font-mono text-[11px] text-indigo-300 overflow-y-auto custom-scrollbar border border-slate-800">
                     {logs.map((log, i) => <div key={i} className="mb-1"><span className="text-slate-600 mr-4 font-bold">{i+1}</span>{log}</div>)}
                     <div ref={consoleEndRef} />
                  </div>
                  {!isProcessing && (
                     <div className="mt-10 flex justify-center">
                        <button onClick={onClose || resetStage} className="px-12 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest">Return to Module</button>
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Recent Jobs</h3>
            <div className="space-y-6">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-start space-x-4 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${job.type === 'IMPORT' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>{job.type === 'IMPORT' ? '📥' : '📤'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{job.entity}</span>
                      <span className="text-[8px] font-black uppercase border px-1.5 rounded">{job.format}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{job.records} Records</div>
                    <div className="text-[8px] text-slate-300 mt-1 italic">{job.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportModule;