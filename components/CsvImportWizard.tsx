import React, { useState, useMemo } from 'react';
import { Item } from '../types';
import * as XLSX from 'xlsx';

interface CsvImportWizardProps {
  onCancel: () => void;
  onImport: (items: Item[]) => void;
  existingItems: Item[];
}

interface Mapping {
  name: string;
  category: string;
  unit: string;
  salePrice: string;
  costPrice: string;
  hsnCode: string;
  gstRate: string;
}

const SYSTEM_FIELDS: (keyof Mapping)[] = ['name', 'category', 'unit', 'salePrice', 'costPrice', 'hsnCode', 'gstRate'];

const CsvImportWizard: React.FC<CsvImportWizardProps> = ({ onCancel, onImport, existingItems }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileData, setFileData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({
    name: '', category: '', unit: '', salePrice: '', costPrice: '', hsnCode: '', gstRate: ''
  });
  const [validationResults, setValidationResults] = useState<{ valid: any[], errors: { row: number, msg: string }[] }>({ valid: [], errors: [] });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      if (data.length > 0) {
        const h = data[0] as string[];
        setHeaders(h);
        setFileData(data.slice(1));
        
        // Auto-mapping attempt
        const newMapping = { ...mapping };
        h.forEach(col => {
           const lowerCol = col.toLowerCase();
           if (lowerCol.includes('name')) newMapping.name = col;
           if (lowerCol.includes('cat')) newMapping.category = col;
           if (lowerCol.includes('unit')) newMapping.unit = col;
           if (lowerCol.includes('sale') || lowerCol.includes('mrp')) newMapping.salePrice = col;
           if (lowerCol.includes('cost')) newMapping.costPrice = col;
           if (lowerCol.includes('hsn')) newMapping.hsnCode = col;
           if (lowerCol.includes('gst') || lowerCol.includes('tax')) newMapping.gstRate = col;
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

       const name = rowObj[mapping.name]?.toString() || '';
       const category = rowObj[mapping.category]?.toString() || 'General';
       const unit = rowObj[mapping.unit]?.toString() || 'Nos';
       const salePrice = parseFloat(rowObj[mapping.salePrice]) || 0;
       const costPrice = parseFloat(rowObj[mapping.costPrice]) || 0;
       const hsnCode = rowObj[mapping.hsnCode]?.toString() || '0000';
       const gstRate = parseFloat(rowObj[mapping.gstRate]) || 18;

       if (!name) {
          errors.push({ row: idx + 2, msg: 'Missing item designation name.' });
          return;
       }
       if (existingItems.some(ei => ei.name.toLowerCase() === name.toLowerCase())) {
          errors.push({ row: idx + 2, msg: `Duplicate identity: "${name}" already exists in registry.` });
          return;
       }

       valid.push({
          id: `imp-${Date.now()}-${idx}`,
          name,
          category,
          unit,
          salePrice,
          costPrice,
          hsnCode,
          gstRate,
          currentStock: 0
       });
    });

    setValidationResults({ valid, errors });
    setStep(3);
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
      <div className="px-10 py-8 bg-slate-950 text-white flex justify-between items-center">
         <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">📥</div>
            <div>
               <h3 className="text-xl font-black uppercase italic tracking-tight leading-none">Bulk Ingestion Engine</h3>
               <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.4em] mt-2">Stage {step} of 3 • Ledger Shard Mapping</p>
            </div>
         </div>
         <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-all"><svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
      </div>

      <div className="p-10 min-h-[400px]">
         {step === 1 && (
           <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50 group hover:border-indigo-200 hover:bg-white transition-all">
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" id="csv-upload" />
              <label htmlFor="csv-upload" className="cursor-pointer text-center space-y-6">
                 <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeWidth={2}/></svg>
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-slate-800 uppercase italic">Locate Binary Payload</h4>
                    <p className="text-sm text-slate-400 font-medium">CSV or Excel format required for sector ingestion.</p>
                 </div>
              </label>
           </div>
         )}

         {step === 2 && (
           <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-6">
                 {SYSTEM_FIELDS.map(field => (
                   <div key={field} className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{field.replace(/([A-Z])/g, ' $1')}</label>
                      <select 
                        value={(mapping as any)[field]} 
                        onChange={e => setMapping({...mapping, [field]: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/5"
                      >
                         <option value="">-- Choose CSV Column --</option>
                         {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                   </div>
                 ))}
              </div>
              <div className="pt-8 border-t border-slate-100 flex justify-end space-x-4">
                 <button onClick={() => setStep(1)} className="px-8 py-3 rounded-2xl text-slate-400 font-black text-[10px] uppercase">Back</button>
                 <button onClick={validateData} className="px-12 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all transform active:scale-95">Verify Shards</button>
              </div>
           </div>
         )}

         {step === 3 && (
           <div className="space-y-8 animate-in zoom-in-95">
              <div className="grid grid-cols-2 gap-6">
                 <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                    <div className="text-[10px] font-black uppercase text-emerald-600 mb-2">Valid Objects</div>
                    <div className="text-4xl font-black text-emerald-900 italic">{validationResults.valid.length}</div>
                 </div>
                 <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100">
                    <div className="text-[10px] font-black uppercase text-rose-600 mb-2">Corrupt/Conflict</div>
                    <div className="text-4xl font-black text-rose-900 italic">{validationResults.errors.length}</div>
                 </div>
              </div>

              {validationResults.errors.length > 0 && (
                <div className="h-48 overflow-y-auto custom-scrollbar bg-slate-950 rounded-2xl p-6 border-4 border-slate-900 shadow-inner">
                   <h5 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.4em] mb-4">Error Telemetry</h5>
                   {validationResults.errors.map((err, i) => (
                      <div key={i} className="text-[10px] font-mono text-slate-400 mb-1">
                         <span className="text-rose-600 font-black mr-4">[ROW {err.row}]</span> {err.msg}
                      </div>
                   ))}
                </div>
              )}

              <div className="pt-8 border-t border-slate-100 flex justify-end space-x-4">
                 <button onClick={() => setStep(2)} className="px-8 py-3 rounded-2xl text-slate-400 font-black text-[10px] uppercase">Re-map</button>
                 <button 
                  disabled={validationResults.valid.length === 0}
                  onClick={() => onImport(validationResults.valid)} 
                  className="px-12 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all transform active:scale-95 border-b-4 border-black/40 disabled:opacity-30 disabled:grayscale"
                 >
                   Inject {validationResults.valid.length} Nodes
                 </button>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default CsvImportWizard;
