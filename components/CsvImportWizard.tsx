import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

export interface ImportField {
  key: string;
  label: string;
  required?: boolean;
  type?: 'string' | 'number' | 'select';
  options?: string[];
  defaultValue?: any;
}

interface CsvImportWizardProps {
  onCancel: () => void;
  onImport: (data: any[]) => void;
  entityName: string;
  fields: ImportField[];
  existingKeys?: string[];
  keyField?: string;
}

const CsvImportWizard: React.FC<CsvImportWizardProps> = ({ 
  onCancel, 
  onImport, 
  entityName, 
  fields, 
  existingKeys = [], 
  keyField = 'name' 
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileData, setFileData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validationResults, setValidationResults] = useState<{ valid: any[], errors: { row: number, msg: string }[] }>({ valid: [], errors: [] });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (typeof bstr !== 'string') return;
      
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      if (data.length > 0) {
        const h = data[0].map(val => String(val).trim());
        setHeaders(h);
        setFileData(data.slice(1));
        
        // Auto-mapping logic based on fuzzy matching
        const newMapping: Record<string, string> = {};
        fields.forEach(f => {
           const targetLabel = f.label.toLowerCase();
           const targetKey = f.key.toLowerCase();
           const match = h.find(col => {
              const c = col.toLowerCase();
              return c === targetLabel || c === targetKey || c.includes(targetKey) || targetKey.includes(c);
           });
           if (match) newMapping[f.key] = match;
        });
        setMapping(newMapping);
        setStep(2);
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateData = () => {
    const valid: any[] = [];
    const errors: { row: number, msg: string }[] = [];

    fileData.forEach((row, idx) => {
       const rowObj: any = {};
       headers.forEach((h, i) => rowObj[h] = row[i]);

       const processedObj: any = { id: `IMP-${Date.now()}-${idx}` };
       let rowValid = true;

       fields.forEach(field => {
          const rawValue = rowObj[mapping[field.key]];
          let value = rawValue !== undefined ? String(rawValue).trim() : (field.defaultValue ?? '');

          if (field.required && !value) {
             errors.push({ row: idx + 2, msg: `Missing required field: ${field.label}` });
             rowValid = false;
          }

          if (field.type === 'number') {
             processedObj[field.key] = parseFloat(value) || 0;
          } else {
             processedObj[field.key] = value;
          }
       });

       if (rowValid) {
          const keyVal = processedObj[keyField];
          if (existingKeys.some(ek => ek.toLowerCase() === String(keyVal).toLowerCase())) {
             errors.push({ row: idx + 2, msg: `Conflict: ${keyField} "${keyVal}" already exists in registry.` });
             rowValid = false;
          }
       }

       if (rowValid) valid.push(processedObj);
    });

    setValidationResults({ valid, errors });
    setStep(3);
  };

  const downloadTemplate = () => {
    const templateHeaders = fields.map(f => f.label).join(',');
    const blob = new Blob([templateHeaders], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nexus_Template_${entityName.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
      <div className="px-10 py-10 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
         <div className="relative z-10 flex items-center space-x-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center shadow-2xl transform -rotate-3 border-4 border-indigo-400/20 text-3xl">📥</div>
            <div>
               <h3 className="text-2xl font-black uppercase italic tracking-tight leading-none">Bulk Ingestion: {entityName}</h3>
               <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.4em] mt-3">Stage {step} of 3 • Ledger Shard Sync</p>
            </div>
         </div>
         <button onClick={onCancel} className="relative z-10 p-3 bg-white/5 hover:bg-rose-500 rounded-full transition-all border border-white/10 group">
            <svg className="w-6 h-6 text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
         </button>
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
      </div>

      <div className="p-10 min-h-[450px] bg-slate-50/20">
         {step === 1 && (
           <div className="space-y-10 animate-in fade-in">
              <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50 group hover:border-indigo-200 hover:bg-white transition-all duration-500 cursor-pointer relative overflow-hidden">
                 <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" id="csv-upload" />
                 <label htmlFor="csv-upload" className="cursor-pointer text-center space-y-8 relative z-10">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 border border-slate-100">
                       <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeWidth={2}/></svg>
                    </div>
                    <div>
                       <h4 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Locate Data Payload</h4>
                       <p className="text-sm text-slate-400 font-medium mt-2">CSV or XLSX format required for sector ingestion.</p>
                    </div>
                 </label>
              </div>
              <div className="flex justify-center">
                 <button 
                  onClick={downloadTemplate}
                  className="flex items-center space-x-3 px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5 5-5M12 3v12" strokeWidth={3}/></svg>
                    <span>Download Statutory Template</span>
                 </button>
              </div>
           </div>
         )}

         {step === 2 && (
           <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                 <div className="flex items-center space-x-3 mb-10 border-b border-slate-50 pb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-black">1</div>
                    <h4 className="text-sm font-black uppercase text-slate-800 tracking-widest">Field Mapping Workspace</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {fields.map(field => (
                      <div key={field.key} className="space-y-2 group">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 group-hover:text-indigo-600 transition-colors">
                           {field.label} {field.required && <span className="text-rose-500">*</span>}
                         </label>
                         <div className="relative">
                            <select 
                              value={mapping[field.key] || ''} 
                              onChange={e => setMapping({...mapping, [field.key]: e.target.value})}
                              className="w-full px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-indigo-600 outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
                            >
                               <option value="">-- Choose CSV Column --</option>
                               {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-300"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth={3}/></svg></div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6">
                 <button onClick={() => setStep(1)} className="px-10 py-4 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Back</button>
                 <button onClick={validateData} className="px-20 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-black/40">Verify Shard Parity</button>
              </div>
           </div>
         )}

         {step === 3 && (
           <div className="space-y-10 animate-in zoom-in-95 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="p-10 bg-emerald-50 rounded-[3rem] border-4 border-emerald-100 shadow-inner group overflow-hidden relative">
                    <div className="relative z-10">
                       <div className="text-[11px] font-black uppercase text-emerald-600 tracking-widest mb-2 flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-3"></div>Clean Shards</div>
                       <div className="text-7xl font-black text-emerald-900 italic tabular-nums group-hover:scale-110 transition-transform origin-left">{validationResults.valid.length}</div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                 </div>
                 <div className="p-10 bg-rose-50 rounded-[3rem] border-4 border-rose-100 shadow-inner group overflow-hidden relative">
                    <div className="relative z-10">
                       <div className="text-[11px] font-black uppercase text-rose-600 tracking-widest mb-2 flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse mr-3"></div>Conflicts Detected</div>
                       <div className="text-7xl font-black text-rose-900 italic tabular-nums group-hover:scale-110 transition-transform origin-left">{validationResults.errors.length}</div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                 </div>
              </div>

              {validationResults.errors.length > 0 && (
                <div className="bg-slate-900 rounded-[2.5rem] p-10 border-4 border-slate-800 shadow-inner">
                   <div className="flex items-center space-x-3 mb-8">
                      <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></div>
                      <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em]">Conflict Telemetry</h5>
                   </div>
                   <div className="h-48 overflow-y-auto custom-scrollbar space-y-3">
                      {validationResults.errors.map((err, i) => (
                         <div key={i} className="text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors flex items-start space-x-6">
                            <span className="text-rose-600 font-black shrink-0">[LINE_{err.row.toString().padStart(3, '0')}]</span> 
                            <span className="italic">"{err.msg}"</span>
                         </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6">
                 <button onClick={() => setStep(2)} className="px-10 py-4 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Adjust Mapping</button>
                 <button 
                  disabled={validationResults.valid.length === 0}
                  onClick={() => onImport(validationResults.valid)} 
                  className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-600 transition-all transform active:scale-95 border-b-8 border-black/40 disabled:opacity-20 disabled:grayscale disabled:pointer-events-none"
                >
                  Authorize Ingestion Shards
                </button>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default CsvImportWizard;