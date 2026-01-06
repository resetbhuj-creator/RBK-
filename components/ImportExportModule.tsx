import React, { useState, useRef } from 'react';
import { Voucher, Item, Ledger } from '../types';

interface ImportExportModuleProps {
  vouchers?: Voucher[];
  items?: Item[];
  setItems?: React.Dispatch<React.SetStateAction<Item[]>>;
  forcedEntity?: string;
}

const ImportExportModule: React.FC<ImportExportModuleProps> = ({ 
  vouchers = [],
  items = [],
  setItems,
  forcedEntity
}) => {
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'EXPORT'>('EXPORT');
  const [selectedEntity, setSelectedEntity] = useState(forcedEntity || 'Accounting Vouchers');
  const [targetFormat, setTargetFormat] = useState('CSV');
  const [isProcessing, setIsProcessing] = useState(false);

  const ENTITIES = ['Accounting Vouchers', 'Inventory Items', 'Ledger Masters'];
  const FORMATS = ['CSV', 'JSON', 'XML', 'XLSX'];

  const executeExport = () => {
    setIsProcessing(true);
    let data: any[] = [];
    if (selectedEntity === 'Inventory Items') data = items;
    else if (selectedEntity === 'Accounting Vouchers') data = vouchers;
    else if (selectedEntity === 'Ledger Masters') data = []; // Placeholder for ledger masters

    setTimeout(() => {
      if (data.length === 0) {
        alert("Buffer Error: No records found for the selected entity.");
        setIsProcessing(false);
        return;
      }

      let content = '';
      let mimeType = '';
      let extension = '';

      if (targetFormat === 'CSV') {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).map(v => typeof v === 'object' ? JSON.stringify(v) : `"${v}"`).join(','));
        content = [headers, ...rows].join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      } else if (targetFormat === 'JSON') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else if (targetFormat === 'XML') {
        content = '<?xml version="1.0" encoding="UTF-8"?>\n<NexusExport>\n' + 
          data.map(item => `  <Record>\n${Object.entries(item).map(([k, v]) => `    <${k}>${typeof v === 'object' ? JSON.stringify(v) : v}</${k}>`).join('\n')}\n  </Record>`).join('\n') + 
          '\n</NexusExport>';
        mimeType = 'application/xml';
        extension = 'xml';
      } else {
          alert('XLSX logic typically requires external library buffer.');
          setIsProcessing(false);
          return;
      }

      if (content) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nexus_export_${selectedEntity.toLowerCase().replace(/\s/g, '_')}_${Date.now()}.${extension}`;
        link.click();
      }
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-[4rem] border border-slate-200 p-16 shadow-sm animate-in fade-in duration-500 max-w-5xl mx-auto flex flex-col">
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center space-x-8">
           <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl border-4 border-indigo-400/20 transform -rotate-3">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
           </div>
           <div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Data Portability Engine</h2>
              <p className="text-sm text-slate-400 font-medium mt-2">Bulk extraction and ingestion of organizational relational shards.</p>
           </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner shrink-0">
           {(['IMPORT', 'EXPORT'] as const).map(t => (
             <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-slate-400'}`}>{t}</button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 flex-1">
        <div className="space-y-8">
           <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] ml-1">Entity Cluster</label>
              <select value={selectedEntity} onChange={e => setSelectedEntity(e.target.value)} className="w-full px-8 py-6 rounded-[2rem] border border-slate-200 bg-slate-50 font-black text-sm text-indigo-600 outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner appearance-none cursor-pointer hover:bg-white transition-colors">
                {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] ml-1">Serialization Format</label>
              <div className="grid grid-cols-4 gap-3">
                 {FORMATS.map(f => (
                   <button key={f} onClick={() => setTargetFormat(f)} className={`py-6 rounded-[2rem] border-2 text-[11px] font-black uppercase tracking-widest transition-all ${targetFormat === f ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}>{f}</button>
                 ))}
              </div>
           </div>
        </div>

        <div className="flex flex-col h-full">
           <div 
             className={`flex-1 border-4 border-dashed rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center group transition-all cursor-pointer ${isProcessing ? 'bg-slate-900 border-indigo-500 border-indigo-500 shadow-xl' : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white hover:shadow-2xl'}`}
             onClick={executeExport}
           >
              <div className="relative mb-8">
                 <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-5xl transition-all duration-700 ${isProcessing ? 'bg-indigo-600 text-white animate-spin-slow shadow-[0_0_40px_rgba(79,70,229,0.4)]' : 'bg-white text-slate-300 group-hover:scale-110 group-hover:text-indigo-500 shadow-lg'}`}>
                    {isProcessing ? '⚙️' : (activeTab === 'EXPORT' ? '🚀' : '📥')}
                 </div>
              </div>
              <h4 className={`text-2xl font-black uppercase italic tracking-tighter ${isProcessing ? 'text-indigo-400 animate-pulse' : 'text-slate-800'}`}>
                {isProcessing ? 'Processing Binary Data...' : `Authorize ${activeTab} Sequence`}
              </h4>
              <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-[0.4em]">Execute {targetFormat} transmission for {selectedEntity}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportModule;
