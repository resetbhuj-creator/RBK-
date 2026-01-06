import React, { useState, useEffect, useRef } from 'react';
import { Voucher, Item, Ledger, Company } from '../types';
import * as XLSX from 'xlsx';

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
  const [selectedEntity, setSelectedEntity] = useState(forcedEntity || 'Inventory Items');
  const [targetFormat, setTargetFormat] = useState('CSV');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ENTITIES = ['Accounting Vouchers', 'Inventory Items', 'Ledgers'];
  const FORMATS = ['CSV', 'JSON', 'XLSX'];

  const executeExport = () => {
    setIsProcessing(true);
    let data: any[] = [];
    if (selectedEntity === 'Inventory Items') data = items;
    else if (selectedEntity === 'Accounting Vouchers') data = vouchers;

    setTimeout(() => {
      if (targetFormat === 'CSV') {
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map(item => Object.values(item).map(v => `"${v}"`).join(','));
        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export_${selectedEntity.toLowerCase().replace(' ', '_')}.csv`;
        link.click();
      } else if (targetFormat === 'JSON') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export_${selectedEntity.toLowerCase().replace(' ', '_')}.json`;
        link.click();
      }
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center space-x-6 mb-12">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Data Transfer Node</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Entity Cluster</label>
          <select value={selectedEntity} onChange={e => setSelectedEntity(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10">
            {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Statutory Format</label>
          <select value={targetFormat} onChange={e => setTargetFormat(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/10">
            {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-12 p-20 border-4 border-dashed border-slate-100 rounded-[3rem] text-center group hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer" onClick={executeExport}>
        <div className="text-4xl mb-6">{isProcessing ? '⚙️' : '🚀'}</div>
        <h4 className="text-xl font-black uppercase italic text-slate-800">{isProcessing ? 'Processing Shards...' : `Authorize ${targetFormat} Extraction`}</h4>
        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Execute binary transmission to local node</p>
      </div>
    </div>
  );
};

export default ImportExportModule;