import React, { useState, useEffect, useRef } from 'react';
import { Voucher, VoucherItem } from '../types';

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
  forcedEntity?: string;
  initialTab?: 'IMPORT' | 'EXPORT';
  initialFormat?: string;
  onClose?: () => void;
}

const ImportExportModule: React.FC<ImportExportModuleProps> = ({ 
  vouchers = [],
  setVouchers,
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
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);

  // Format Specific Settings
  const [csvDelimiter, setCsvDelimiter] = useState(',');

  const [jobs, setJobs] = useState<TransferJob[]>([
    { id: 'JOB-901', type: 'EXPORT', entity: 'Sales Vouchers', timestamp: '2023-11-23 10:15 AM', status: 'Completed', records: 1240, format: 'XLSX' },
    { id: 'JOB-902', type: 'IMPORT', entity: 'Accounting Vouchers', timestamp: '2023-11-25 09:30 AM', status: 'Completed', records: 850, format: 'CSV' },
  ]);

  const ENTITIES = [
    'Accounting Vouchers',
    'Inventory Vouchers',
    'Ledgers', 
    'Inventory Items', 
    'Users'
  ];
  
  const FORMATS = ['CSV', 'XML'];

  const ENTITY_SCHEMAS: Record<string, { source: string; target: string; type: string; required?: boolean }[]> = {
    'Accounting Vouchers': [
      { source: 'id', target: 'Voucher Number', type: 'String', required: true },
      { source: 'date', target: 'Date', type: 'Date', required: true },
      { source: 'type', target: 'Type', type: 'Enum', required: true },
      { source: 'party', target: 'Party Name', type: 'String', required: true },
      { source: 'amount', target: 'Amount', type: 'Float', required: true },
      { source: 'narration', target: 'Narration', type: 'String' }
    ],
    'Inventory Vouchers': [
      { source: 'id', target: 'Voucher Number', type: 'String', required: true },
      { source: 'date', target: 'Date', type: 'Date', required: true },
      { source: 'type', target: 'Type', type: 'Enum', required: true },
      { source: 'party', target: 'Party Name', type: 'String', required: true },
      { source: 'subTotal', target: 'Sub Total', type: 'Float', required: true },
      { source: 'taxTotal', target: 'Tax Total', type: 'Float', required: true },
      { source: 'amount', target: 'Grand Total', type: 'Float', required: true },
      { source: 'narration', target: 'Narration', type: 'String' }
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
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      
      if (targetFormat === 'CSV') {
        const firstLine = content.split('\n')[0];
        const headers = firstLine.split(csvDelimiter).map(h => h.trim().replace(/^"|"$/g, ''));
        setDetectedHeaders(headers);
        
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
      } else if (targetFormat === 'XML') {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, "text/xml");
        const firstNode = xmlDoc.documentElement.firstElementChild;
        if (firstNode) {
          const headers = Array.from(firstNode.children).map(c => c.tagName);
          setDetectedHeaders(headers);
          
          const initialMapping: Record<string, string> = {};
          const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
          schema.forEach(field => {
            const match = headers.find(h => 
              h.toLowerCase() === field.target.toLowerCase() || 
              h.toLowerCase().replace(/_/g, ' ').includes(field.target.toLowerCase())
            );
            if (match) initialMapping[field.target] = match;
          });
          setMapping(initialMapping);
        }
      }
      setCurrentStage('MAP');
    };
    reader.readAsText(file);
  };

  const generateCSV = (data: Voucher[]) => {
    const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
    const headers = schema.map(s => s.target).join(csvDelimiter);
    const rows = data.map(v => {
      return schema.map(s => {
        const val = (v as any)[s.source] || '';
        return `"${val}"`;
      }).join(csvDelimiter);
    });
    return [headers, ...rows].join('\n');
  };

  const generateXML = (data: Voucher[]) => {
    const rootName = selectedEntity.replace(/\s/g, '');
    const itemName = rootName.slice(0, -1);
    const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
    data.forEach(item => {
      xml += `  <${itemName}>\n`;
      schema.forEach(s => {
        const val = (item as any)[s.source] || '';
        const tagName = s.target.replace(/\s/g, '_');
        xml += `    <${tagName}>${val}</${tagName}>\n`;
      });
      xml += `  </${itemName}>\n`;
    });
    xml += `</${rootName}>`;
    return xml;
  };

  const parseCSV = (content: string): Partial<Voucher>[] => {
    const lines = content.split('\n');
    const headers = lines[0].split(csvDelimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
    
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(csvDelimiter).map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = { status: 'Posted' };
      schema.forEach(s => {
        const mappedHeader = mapping[s.target];
        const headerIdx = headers.indexOf(mappedHeader);
        if (headerIdx !== -1) {
          let val: any = values[headerIdx];
          if (s.type === 'Float') val = parseFloat(val) || 0;
          obj[s.source] = val;
        }
      });
      return obj as Partial<Voucher>;
    });
  };

  const parseXML = (content: string): Partial<Voucher>[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");
    const items = Array.from(xmlDoc.documentElement.children);
    const schema = ENTITY_SCHEMAS[selectedEntity] || ENTITY_SCHEMAS['Accounting Vouchers'];
    
    return items.map(node => {
      const obj: any = { status: 'Posted' };
      schema.forEach(s => {
        const mappedTag = mapping[s.target];
        const element = node.querySelector(mappedTag);
        if (element) {
          let val: any = element.textContent;
          if (s.type === 'Float') val = parseFloat(val) || 0;
          obj[s.source] = val;
        }
      });
      return obj as Partial<Voucher>;
    });
  };

  const startOperation = () => {
    setCurrentStage('EXECUTE');
    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    
    addLog(`Sequence Start: ${activeTab === 'IMPORT' ? 'Ingesting' : 'Extracting'} ${selectedEntity}...`);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        if (activeTab === 'IMPORT' && fileContent && setVouchers) {
          const parsed = targetFormat === 'CSV' ? parseCSV(fileContent) : parseXML(fileContent);
          addLog(`Parsing complete. Validated ${parsed.length} records.`);
          setVouchers(prev => [...(parsed as Voucher[]), ...prev]);
        }
        
        finalizeJob();
      }
      setProgress(currentProgress);
      addLog(`Processing data block ${Math.floor(currentProgress / 20)}...`);
    }, 200);
  };

  const finalizeJob = () => {
    addLog(`${activeTab} SEQUENCE SUCCESSFUL: Data finalized.`);
    if (activeTab === 'EXPORT') {
      const content = targetFormat === 'CSV' ? generateCSV(vouchers) : generateXML(vouchers);
      const blob = new Blob([content], { type: targetFormat === 'CSV' ? 'text/csv' : 'text/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_export_${selectedEntity.toLowerCase().replace(/\s/g, '_')}_${Date.now()}.${targetFormat.toLowerCase()}`;
      a.click();
    }

    const newJob: TransferJob = {
      id: `JOB-${Math.floor(Math.random() * 900) + 100}`,
      type: activeTab,
      entity: selectedEntity,
      timestamp: new Date().toLocaleString(),
      status: 'Completed',
      records: activeTab === 'EXPORT' ? vouchers.length : 0,
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-4 border-indigo-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-amber-300/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">Data Bridge Hub</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">Target: {selectedEntity}</span>
              </div>
            </div>
          </div>
          <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
            {['IMPORT', 'EXPORT'].map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab as any); resetStage(); }} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{tab}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {currentStage === 'SETUP' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm animate-in slide-in-from-left-4 duration-500">
              <h3 className="text-xl font-black text-slate-800 mb-8 uppercase italic">{activeTab === 'IMPORT' ? 'Inbound Configuration' : 'Outbound Configuration'}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Entity Class</label>
                  <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold">
                    {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Protocol Format</label>
                  <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    {FORMATS.map(f => (
                      <button key={f} onClick={() => setTargetFormat(f)} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${f === targetFormat ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-700'}`}>{f}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div onClick={() => activeTab === 'IMPORT' ? fileInputRef.current?.click() : startOperation()} className="border-4 border-dashed rounded-[2.5rem] p-20 text-center group transition-all cursor-pointer border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20">
                <input type="file" ref={fileInputRef} className="hidden" accept={targetFormat === 'CSV' ? '.csv' : '.xml'} onChange={handleFileChange} />
                <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-slate-300 group-hover:scale-110 group-hover:text-indigo-500 transition-all">
                   {activeTab === 'IMPORT' ? '📥' : '📤'}
                </div>
                <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{activeTab === 'IMPORT' ? `Link ${targetFormat} Source` : `Authorize ${targetFormat} Stream`}</h4>
                <p className="text-xs text-slate-400 mt-2">Verified data structures required for statutory integrity.</p>
              </div>
            </div>
          )}

          {currentStage === 'MAP' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm animate-in zoom-in-95 duration-500">
               <h3 className="text-xl font-black text-slate-800 mb-8 uppercase italic">Field Mapping Protocol</h3>
               <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeSchema.map((field, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-4">
                        <span className="text-[10px] font-black text-indigo-600">{i + 1}</span>
                        <span className="font-black text-sm text-slate-800 tracking-tight">{field.target} {field.required && <span className="text-rose-500">*</span>}</span>
                      </div>
                      <select value={mapping[field.target] || ''} onChange={(e) => setMapping({...mapping, [field.target]: e.target.value})} className="min-w-[180px] px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white">
                        <option value="">-- Ignore --</option>
                        {detectedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
               </div>
               <div className="mt-10 flex justify-end">
                  <button disabled={!allRequiredMapped} onClick={startOperation} className={`px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all transform active:scale-95 ${allRequiredMapped ? 'bg-indigo-600 text-white shadow-2xl' : 'bg-slate-100 text-slate-300'}`}>Initiate Transfer &rarr;</button>
               </div>
            </div>
          )}

          {currentStage === 'EXECUTE' && (
            <div className="bg-slate-900 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-10">
                  <h4 className="text-white font-black text-2xl tracking-tight">Sequence Execution</h4>
                  <span className="text-5xl font-black text-white">{progress}%</span>
               </div>
               <div className="h-64 bg-black/40 rounded-2xl p-6 font-mono text-[10px] text-indigo-300/80 overflow-y-auto custom-scrollbar border border-slate-800">
                  {logs.map((log, i) => <div key={i} className="mb-1"><span className="text-slate-600 mr-3">{i+1}</span>{log}</div>)}
                  <div ref={consoleEndRef} />
               </div>
               {!isProcessing && (
                  <div className="mt-8 flex justify-center">
                     <button onClick={resetStage} className="px-10 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Reset Bridge</button>
                  </div>
               )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Execution Log</h3>
            <div className="space-y-6">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-start space-x-4 border-b border-slate-50 pb-4 last:border-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${job.type === 'IMPORT' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>{job.type === 'IMPORT' ? '📥' : '📤'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-800 uppercase truncate">{job.entity}</span>
                      <span className="text-[8px] font-black bg-slate-100 px-1 rounded">{job.format}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{job.records} Objects</div>
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