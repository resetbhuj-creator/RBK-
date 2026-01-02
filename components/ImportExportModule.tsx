import React, { useState, useEffect, useRef } from 'react';
import { Voucher, Item, Ledger } from '../types';

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
  vouchers?: Voucher[];
  setVouchers?: React.Dispatch<React.SetStateAction<Voucher[]>>;
  items?: Item[];
  setItems?: React.Dispatch<React.SetStateAction<Item[]>>;
  ledgers?: Ledger[];
  setLedgers?: React.Dispatch<React.SetStateAction<Ledger[]>>;
  forcedEntity?: string;
  initialTab?: 'IMPORT' | 'EXPORT';
  initialFormat?: string;
  onClose?: () => void;
}

const ImportExportModule: React.FC<ImportExportModuleProps> = ({ 
  vouchers = [],
  setVouchers,
  items = [],
  setItems,
  ledgers = [],
  setLedgers,
  forcedEntity, 
  initialTab = 'IMPORT', 
  initialFormat = 'XML',
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
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [csvDelimiter, setCsvDelimiter] = useState(',');

  const [jobs, setJobs] = useState<TransferJob[]>([
    { id: 'JOB-901', type: 'EXPORT', entity: 'Sales Vouchers', timestamp: '2023-11-23 10:15 AM', status: 'Completed', records: 1240, format: 'XML' },
    { id: 'JOB-902', type: 'IMPORT', entity: 'Accounting Vouchers', timestamp: '2023-11-25 09:30 AM', status: 'Completed', records: 850, format: 'CSV' },
  ]);

  const ENTITIES = [
    'Accounting Vouchers',
    'Inventory Vouchers',
    'Ledgers', 
    'Inventory Items'
  ];
  
  const FORMATS = ['XML', 'CSV'];

  const ENTITY_SCHEMAS: Record<string, { source: string; target: string; type: string; required?: boolean }[]> = {
    'Accounting Vouchers': [
      { source: 'id', target: 'VoucherNo', type: 'String', required: true },
      { source: 'date', target: 'Date', type: 'Date', required: true },
      { source: 'type', target: 'Type', type: 'Enum', required: true },
      { source: 'party', target: 'PartyName', type: 'String', required: true },
      { source: 'amount', target: 'Amount', type: 'Float', required: true },
      { source: 'narration', target: 'Narration', type: 'String' }
    ],
    'Inventory Vouchers': [
      { source: 'id', target: 'VoucherNo', type: 'String', required: true },
      { source: 'date', target: 'Date', type: 'Date', required: true },
      { source: 'type', target: 'Type', type: 'Enum', required: true },
      { source: 'party', target: 'PartyName', type: 'String', required: true },
      { source: 'subTotal', target: 'SubTotal', type: 'Float', required: true },
      { source: 'taxTotal', target: 'TaxTotal', type: 'Float', required: true },
      { source: 'amount', target: 'GrandTotal', type: 'Float', required: true },
      { source: 'narration', target: 'Narration', type: 'String' }
    ],
    'Inventory Items': [
      { source: 'name', target: 'ItemName', type: 'String', required: true },
      { source: 'category', target: 'Category', type: 'String', required: true },
      { source: 'unit', target: 'UoM', type: 'String', required: true },
      { source: 'salePrice', target: 'SalePrice', type: 'Float', required: true },
      { source: 'hsnCode', target: 'HSNCode', type: 'String', required: true },
      { source: 'gstRate', target: 'GSTRate', type: 'Float', required: true }
    ],
    'Ledgers': [
      { source: 'name', target: 'LedgerName', type: 'String', required: true },
      { source: 'group', target: 'GroupName', type: 'String', required: true },
      { source: 'openingBalance', target: 'OpeningBalance', type: 'Float', required: true },
      { source: 'type', target: 'Type', type: 'Enum', required: true }
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
    addLog(`System Probe: File "${file.name}" linked. Initializing ${targetFormat} validation sequence...`);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      
      try {
        if (targetFormat === 'CSV') {
          const firstLine = content.split('\n')[0];
          const headers = firstLine.split(csvDelimiter).map(h => h.trim().replace(/^"|"$/g, ''));
          setDetectedHeaders(headers);
          autoMapHeaders(headers);
        } else if (targetFormat === 'XML') {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, "text/xml");
          if (xmlDoc.getElementsByTagName("parsererror").length > 0) throw new Error("Invalid XML Structure");
          
          const firstNode = xmlDoc.documentElement.firstElementChild;
          if (firstNode) {
            const headers = Array.from(firstNode.children).map(c => c.tagName);
            setDetectedHeaders(headers);
            autoMapHeaders(headers);
          } else {
            throw new Error("Empty XML Data Root");
          }
        }
        setCurrentStage('MAP');
      } catch (err: any) {
        addLog(`CRITICAL ERROR: ${err.message}. Aborting sequence.`);
        alert(`Failed to parse ${targetFormat} structure: ${err.message}`);
        resetStage();
      }
    };
    reader.readAsText(file);
  };

  const autoMapHeaders = (headers: string[]) => {
    const initialMapping: Record<string, string> = {};
    const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
    schema.forEach(field => {
      const match = headers.find(h => 
        h.toLowerCase() === field.target.toLowerCase() || 
        h.toLowerCase().replace(/[_\s]/g, '').includes(field.target.toLowerCase().replace(/[_\s]/g, ''))
      );
      if (match) initialMapping[field.target] = match;
    });
    setMapping(initialMapping);
  };

  const generateXML = (data: any[]) => {
    const rootName = selectedEntity.replace(/\s/g, '') + 'Root';
    const itemName = selectedEntity.replace(/\s/g, '').slice(0, -1) || 'Record';
    const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
    data.forEach(item => {
      xml += `  <${itemName}>\n`;
      schema.forEach(s => {
        const val = (item as any)[s.source] !== undefined ? (item as any)[s.source] : '';
        xml += `    <${s.target}>${val}</${s.target}>\n`;
      });
      xml += `  </${itemName}>\n`;
    });
    xml += `</${rootName}>`;
    return xml;
  };

  const parseXML = (content: string): any[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");
    const itemsNodes = Array.from(xmlDoc.documentElement.children);
    const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
    
    return itemsNodes.map(node => {
      const obj: any = {};
      schema.forEach(s => {
        const mappedTag = mapping[s.target];
        const element = node.getElementsByTagName(mappedTag)[0];
        if (element) {
          let val: any = element.textContent;
          if (s.type === 'Float') val = parseFloat(val) || 0;
          obj[s.source] = val;
        }
      });
      return obj;
    });
  };

  const downloadTemplate = () => {
    const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
    let content = '';
    let mimeType = '';
    let fileName = `template_${selectedEntity.toLowerCase().replace(/\s/g, '_')}`;

    if (targetFormat === 'CSV') {
      content = schema.map(s => s.target).join(csvDelimiter);
      mimeType = 'text/csv';
      fileName += '.csv';
    } else {
      const rootName = selectedEntity.replace(/\s/g, '') + 'Root';
      const itemName = selectedEntity.replace(/\s/g, '').slice(0, -1) || 'Record';
      content = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n  <${itemName}>\n`;
      schema.forEach(s => {
        content += `    <${s.target}>VALUE</${s.target}>\n`;
      });
      content += `  </${itemName}>\n</${rootName}>`;
      mimeType = 'text/xml';
      fileName += '.xml';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    addLog(`Nexus Template Dispatched: ${fileName}`);
  };

  const startOperation = () => {
    setCurrentStage('EXECUTE');
    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    
    addLog(`TRANSACTION START: ${activeTab} sequence initiated for cluster "${selectedEntity}".`);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        if (activeTab === 'IMPORT' && fileContent) {
          const parsed = targetFormat === 'CSV' ? [] : parseXML(fileContent);
          
          if (selectedEntity === 'Inventory Items' && setItems) setItems(prev => [...parsed, ...prev]);
          else if (selectedEntity === 'Ledgers' && setLedgers) setLedgers(prev => [...parsed, ...prev]);
          else if (setVouchers) setVouchers(prev => [...parsed, ...prev]);

          addLog(`Sequence Verified. ${parsed.length} objects committed to organizational ledger.`);
        }
        
        finalizeJob();
      }
      setProgress(currentProgress);
      if (currentProgress % 20 === 0) addLog(`Syncing data block at index ${currentProgress * 12}...`);
    }, 200);
  };

  const finalizeJob = () => {
    let dataSource: any[] = [];
    if (selectedEntity === 'Inventory Items') dataSource = items;
    else if (selectedEntity === 'Ledgers') dataSource = ledgers;
    else dataSource = vouchers;

    addLog(`SEQUENCE SUCCESSFUL: Operation finalized.`);
    if (activeTab === 'EXPORT') {
      const content = targetFormat === 'XML' ? generateXML(dataSource) : 'CSV_CONTENT_PLACEHOLDER';
      const blob = new Blob([content], { type: targetFormat === 'XML' ? 'text/xml' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_export_${selectedEntity.toLowerCase().replace(/\s/g, '_')}_${Date.now()}.${targetFormat.toLowerCase()}`;
      a.click();
      addLog(`Binary blob transmitted to local storage.`);
    }

    const newJob: TransferJob = {
      id: `JOB-${Math.floor(Math.random() * 900) + 100}`,
      type: activeTab,
      entity: selectedEntity,
      timestamp: new Date().toLocaleString(),
      status: 'Completed',
      records: activeTab === 'EXPORT' ? dataSource.length : 0,
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
    setFileContent(null);
    setMapping({});
  };

  const activeSchema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
  const allRequiredMapped = activeSchema.filter(s => s.required).every(s => mapping[s.target]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-indigo-400/30 group">
              <svg className="w-10 h-10 text-white group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">Integrity Bridge Hub</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2"></div>
                  Format: {targetFormat} Engine
                </span>
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Protocol: NX-092-B</span>
              </div>
            </div>
          </div>
          <div className="flex bg-white/5 p-1.5 rounded-[1.5rem] border border-white/10 backdrop-blur-md">
            {['IMPORT', 'EXPORT'].map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab as any); resetStage(); }} className={`px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {currentStage === 'SETUP' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm animate-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-xl font-black text-slate-800 uppercase italic">I/O Initialization</h3>
                 <button onClick={downloadTemplate} className="text-[10px] font-black text-indigo-600 uppercase hover:underline underline-offset-8 decoration-indigo-200 tracking-[0.2em]">Download Sample Pattern</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Entity Cluster</label>
                  <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner">
                    {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Statutory Format</label>
                  <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                    {FORMATS.map(f => (
                      <button key={f} onClick={() => setTargetFormat(f)} className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all ${f === targetFormat ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-700'}`}>{f}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div onClick={() => activeTab === 'IMPORT' ? fileInputRef.current?.click() : startOperation()} className="border-4 border-dashed rounded-[3rem] p-24 text-center group transition-all cursor-pointer border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20">
                <input type="file" ref={fileInputRef} className="hidden" accept={targetFormat === 'CSV' ? '.csv' : '.xml'} onChange={handleFileChange} />
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-200 group-hover:scale-110 group-hover:text-indigo-600 transition-all shadow-sm border border-slate-50">
                   <span className="text-4xl">{activeTab === 'IMPORT' ? '📥' : '📤'}</span>
                </div>
                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{activeTab === 'IMPORT' ? `Verify ${targetFormat} Stream` : `Authorize ${targetFormat} Extraction`}</h4>
                <p className="text-sm text-slate-400 mt-3 font-medium">Verified data structures required for master synchronization.</p>
              </div>
            </div>
          )}

          {currentStage === 'MAP' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm animate-in zoom-in-95 duration-500">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-slate-800 uppercase italic">Pattern Mapping Protocol</h3>
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase border border-indigo-100">Found: {detectedHeaders.length} Nodes</span>
               </div>
               <div className="space-y-4 max-h-[440px] overflow-y-auto pr-4 custom-scrollbar">
                  {activeSchema.map((field, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 group hover:border-indigo-200 transition-all">
                      <div className="flex items-center space-x-5">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">{i + 1}</div>
                        <div>
                           <span className="font-black text-sm text-slate-800 tracking-tight uppercase italic">{field.target} {field.required && <span className="text-rose-500">*</span>}</span>
                           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Class: {field.type}</div>
                        </div>
                      </div>
                      <select value={mapping[field.target] || ''} onChange={(e) => setMapping({...mapping, [field.target]: e.target.value})} className="min-w-[220px] px-5 py-3 rounded-xl border border-slate-200 text-xs font-black text-indigo-600 bg-white shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20">
                        <option value="">-- Discard Field --</option>
                        {detectedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
               </div>
               <div className="mt-12 flex justify-between items-center">
                  <button onClick={resetStage} className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-rose-500 transition-colors">Discard Sequence</button>
                  <button disabled={!allRequiredMapped} onClick={startOperation} className={`px-14 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-2xl ${allRequiredMapped ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-300'}`}>Execute Synchronizer &rarr;</button>
               </div>
            </div>
          )}

          {currentStage === 'EXECUTE' && (
            <div className="bg-slate-950 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden border-4 border-slate-900">
               <div className="flex items-center justify-between mb-12 relative z-10">
                  <div>
                     <h4 className="text-white font-black text-3xl italic tracking-tighter uppercase">Cluster Execution</h4>
                     <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mt-2 animate-pulse">Syncing organizational shards...</p>
                  </div>
                  <span className="text-7xl font-black text-white italic tabular-nums">{progress}%</span>
               </div>
               <div className="h-72 bg-black/50 rounded-[2rem] p-8 font-mono text-[10px] text-emerald-500/80 overflow-y-auto custom-scrollbar border border-white/5 shadow-inner">
                  {logs.map((log, i) => <div key={i} className="mb-1 animate-in slide-in-from-left-2 duration-300"><span className="text-slate-700 mr-4 font-bold">{i.toString().padStart(3, '0')}</span>{log}</div>)}
                  <div ref={consoleEndRef} />
               </div>
               {!isProcessing && (
                  <div className="mt-10 flex justify-center relative z-10">
                     <button onClick={resetStage} className="px-16 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 hover:text-white transition-all transform active:scale-95">Reset Bridge Gateway</button>
                  </div>
               )}
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full blur-[100px] opacity-10"></div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 flex items-center">
               <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3 animate-pulse"></div>
               Transfer Registry
            </h3>
            <div className="space-y-8">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-start space-x-5 border-b border-slate-50 pb-6 last:border-0 last:pb-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border ${job.type === 'IMPORT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                     {job.type === 'IMPORT' ? '📥' : '📤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 uppercase italic truncate">{job.entity}</span>
                      <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-lg tracking-widest">{job.format}</span>
                    </div>
                    <div className="flex items-center space-x-3 mt-2">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.records} Records</span>
                       <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                       <span className="text-[10px] text-slate-400 font-bold uppercase truncate italic">{job.timestamp.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                 <div className="text-center py-10 opacity-30 italic text-sm font-medium">Registry Buffer Empty</div>
              )}
            </div>
          </div>

          <div className="bg-indigo-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-l-8 border-indigo-500">
             <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-6">Security Compliance</h4>
                <p className="text-xs leading-relaxed font-medium text-indigo-100/70 mb-10">
                  Nexus enforces <span className="text-white font-black underline decoration-emerald-500 underline-offset-4">Statutory Schema Matching</span>. XML objects must align with the organizational blueprint before ledger commitment.
                </p>
                <div className="flex items-center space-x-4">
                   <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-[9px] font-black uppercase">AES-256 Enabled</div>
                   <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-[9px] font-black uppercase">FIPS Validated</div>
                </div>
             </div>
             <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-600 rounded-full blur-[80px] opacity-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportModule;