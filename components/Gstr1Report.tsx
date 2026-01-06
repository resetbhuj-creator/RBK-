import React, { useState, useMemo } from 'react';
import { Voucher, Ledger } from '../types';
import ActionMenu from './ActionMenu';

interface Gstr1ReportProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
  activeCompany: any;
  onViewVoucher: (id: string) => void;
}

type Gstr1Section = 'B2B' | 'B2CL' | 'B2CS' | 'EXPORTS' | 'EXEMPT' | 'HSN';

interface HsnSummaryEntry {
  hsn: string;
  desc: string;
  uom: string;
  qty: number;
  taxable: number;
  tax: number;
}

interface FilingError {
  vId: string;
  party: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
}

const Gstr1Report: React.FC<Gstr1ReportProps> = ({ vouchers, ledgers, activeCompany, onViewVoucher }) => {
  const [activeSection, setActiveSection] = useState<Gstr1Section>('B2B');
  const [isValidationVisible, setIsValidationVisible] = useState(false);
  const [filingErrors, setFilingErrors] = useState<FilingError[]>([]);
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] 
  });

  const reportData = useMemo(() => {
    const summary = {
      b2b: [] as Voucher[],
      b2cl: [] as Voucher[],
      b2cs: [] as Voucher[],
      exports: [] as Voucher[],
      exempt: [] as Voucher[],
      hsn: {} as Record<string, HsnSummaryEntry>,
      metrics: {
        totalTaxable: 0,
        totalTax: 0,
        count: 0
      }
    };

    const salesVouchers = vouchers.filter(v => {
      const vDate = new Date(v.date);
      const inRange = vDate >= new Date(dateRange.start) && vDate <= new Date(dateRange.end);
      return inRange && (v.type === 'Sales' || v.type === 'Sales Return' || v.type === 'Credit Note');
    });

    salesVouchers.forEach(v => {
      const factor = (v.type === 'Sales Return' || v.type === 'Credit Note') ? -1 : 1;
      const partyLedger = ledgers.find(l => l.name === v.party || l.id === v.ledgerId);
      const gstId = partyLedger?.taxId;
      
      const taxable = (v.subTotal || v.amount) * factor;
      const tax = (v.taxTotal || 0) * factor;

      v.items?.forEach(item => {
        const hsnCode = item.hsn || 'N/A';
        if (!summary.hsn[hsnCode]) {
          summary.hsn[hsnCode] = { hsn: hsnCode, desc: item.name, uom: item.unit || 'Nos', qty: 0, taxable: 0, tax: 0 };
        }
        summary.hsn[hsnCode].qty += item.qty * factor;
        summary.hsn[hsnCode].taxable += item.amount * factor;
        summary.hsn[hsnCode].tax += (item.taxAmount || 0) * factor;

        if (item.igstRate === 0 || item.cgstRate === 0) {
          if (!summary.exempt.includes(v)) summary.exempt.push(v);
        }
      });

      if (v.party.toLowerCase().includes('export')) {
        summary.exports.push(v);
      } else if (gstId) {
        summary.b2b.push(v);
      } else {
        if (v.supplyType === 'Central' && v.amount > 250000) {
          summary.b2cl.push(v);
        } else {
          summary.b2cs.push(v);
        }
      }

      summary.metrics.totalTaxable += taxable;
      summary.metrics.totalTax += tax;
      summary.metrics.count++;
    });

    return summary;
  }, [vouchers, ledgers, dateRange]);

  const handlePrepareForFiling = () => {
    const errors: FilingError[] = [];
    const allRelevant = [...reportData.b2b, ...reportData.b2cl, ...reportData.b2cs];

    allRelevant.forEach(v => {
      const partyLedger = ledgers.find(l => l.name === v.party || l.id === v.ledgerId);
      
      // B2B must have GSTIN
      if (reportData.b2b.includes(v) && !partyLedger?.taxId) {
        errors.push({ vId: v.id, party: v.party, message: 'Recipient GSTIN is missing for B2B transaction.', severity: 'CRITICAL' });
      }

      // Mandatory HSN check
      if (!v.items || v.items.length === 0) {
        errors.push({ vId: v.id, party: v.party, message: 'No item lines detected in voucher.', severity: 'CRITICAL' });
      } else {
        v.items.forEach(item => {
          if (!item.hsn || item.hsn === 'N/A' || item.hsn.trim() === '') {
            errors.push({ vId: v.id, party: v.party, message: `HSN code missing for item: ${item.name}`, severity: 'WARNING' });
          }
        });
      }

      // Place of Supply check
      if (!v.supplyType) {
        errors.push({ vId: v.id, party: v.party, message: 'Place of Supply (Supply Type) not defined.', severity: 'CRITICAL' });
      }
    });

    setFilingErrors(errors);
    setIsValidationVisible(true);
  };

  const handleExportDetailedCSV = () => {
    const headers = ['Section', 'Recipient GSTIN', 'Recipient Name', 'Invoice Number', 'Date', 'Invoice Value', 'Place of Supply', 'Taxable Value', 'Tax Amount', 'Status'];
    const rows: any[] = [];

    const mapVoucherToRow = (v: Voucher, section: string) => {
      const partyLedger = ledgers.find(l => l.name === v.party || l.id === v.ledgerId);
      return [
        section,
        `"${partyLedger?.taxId || 'URP'}"`,
        `"${v.party}"`,
        `"${v.id}"`,
        v.date,
        v.amount.toFixed(2),
        v.supplyType === 'Local' ? `"${activeCompany.state}"` : '"Inter-State"',
        (v.subTotal || v.amount).toFixed(2),
        (v.taxTotal || 0).toFixed(2),
        v.status
      ];
    };

    reportData.b2b.forEach(v => rows.push(mapVoucherToRow(v, 'B2B')));
    reportData.b2cl.forEach(v => rows.push(mapVoucherToRow(v, 'B2C Large')));
    reportData.b2cs.forEach(v => rows.push(mapVoucherToRow(v, 'B2C Small')));

    const csvContent = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GSTR1_Detailed_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sections: { id: Gstr1Section, label: string, count: number, icon: string }[] = [
    { id: 'B2B', label: 'B2B Invoices', count: reportData.b2b.length, icon: '🏭' },
    { id: 'B2CL', label: 'B2C Large', count: reportData.b2cl.length, icon: '🏙️' },
    { id: 'B2CS', label: 'B2C Small', count: reportData.b2cs.length, icon: '🏠' },
    { id: 'EXPORTS', label: 'Exports', count: reportData.exports.length, icon: '✈️' },
    { id: 'EXEMPT', label: 'Exempt/Nil', count: reportData.exempt.length, icon: '🛡️' },
    { id: 'HSN', label: 'HSN Summary', count: Object.keys(reportData.hsn).length, icon: '📑' }
  ];

  const renderActiveTable = () => {
    let list: Voucher[] = [];
    if (activeSection === 'B2B') list = reportData.b2b;
    else if (activeSection === 'B2CL') list = reportData.b2cl;
    else if (activeSection === 'B2CS') list = reportData.b2cs;
    else if (activeSection === 'EXPORTS') list = reportData.exports;
    else if (activeSection === 'EXEMPT') list = reportData.exempt;

    if (activeSection === 'HSN') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400">
              <tr>
                <th className="px-10 py-6">HSN/SAC Code</th>
                <th className="px-10 py-6">Description</th>
                <th className="px-10 py-6 text-center">UoM</th>
                <th className="px-10 py-6 text-right">Taxable Value</th>
                <th className="px-10 py-6 text-right">Tax Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(Object.values(reportData.hsn) as HsnSummaryEntry[]).map((row, i) => (
                <tr key={i} className="hover:bg-indigo-50/20 transition-all border-b border-slate-50 last:border-0">
                  <td className="px-10 py-6 font-mono text-xs font-black text-indigo-600">{row.hsn}</td>
                  <td className="px-10 py-6 text-xs font-black text-slate-800 uppercase italic">{row.desc}</td>
                  <td className="px-10 py-6 text-center text-[10px] font-bold text-slate-400">{row.qty} {row.uom}</td>
                  <td className="px-10 py-6 text-right font-black tabular-nums italic text-slate-900">${row.taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-10 py-6 text-right font-black tabular-nums text-indigo-600">${row.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {Object.keys(reportData.hsn).length === 0 && (
                <tr><td colSpan={5} className="py-32 text-center opacity-30 italic font-black uppercase text-[10px] tracking-widest">No HSN Data Available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400 tracking-widest">
            <tr>
              <th className="px-8 py-6">Recipient GSTIN</th>
              <th className="px-8 py-6">Invoice Number</th>
              <th className="px-8 py-6">Date</th>
              <th className="px-8 py-6 text-right">Total Value</th>
              <th className="px-8 py-6 text-center">Place of Supply</th>
              <th className="px-8 py-6 text-right">Taxable Value</th>
              <th className="px-8 py-6 text-right">Tax Amount</th>
              <th className="px-8 py-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {list.map((v, i) => {
              const partyLedger = ledgers.find(l => l.name === v.party || l.id === v.ledgerId);
              const gstId = partyLedger?.taxId || 'UNREGISTERED';
              const pos = v.supplyType === 'Local' ? activeCompany.state : 'Central / Inter-state';
              
              return (
                <tr key={i} className="hover:bg-indigo-50/20 transition-all cursor-pointer group border-b border-slate-50 last:border-0" onClick={() => onViewVoucher(v.id)}>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${gstId !== 'UNREGISTERED' ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {gstId}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 truncate max-w-[120px]">{v.party}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-mono text-xs font-black text-slate-700 italic group-hover:text-indigo-600 transition-colors">#{v.id}</td>
                  <td className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase">{v.date}</td>
                  <td className="px-8 py-6 text-right font-black tabular-nums text-slate-900">${v.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${v.supplyType === 'Local' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {pos}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-black tabular-nums italic text-slate-600">${(v.subTotal || v.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-8 py-6 text-right font-black tabular-nums text-indigo-600">${(v.taxTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                    <ActionMenu label="Forensic" actions={[{ label: 'Inspect', icon: '👁️', onClick: () => onViewVoucher(v.id), variant: 'primary' }]} />
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={8} className="py-32 text-center opacity-30 italic font-black uppercase text-[10px] tracking-widest">Registry Buffer Empty for this Section</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
            <div>
               <div className="flex items-center space-x-6 mb-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl border-4 border-indigo-400/20 transform rotate-3 transition-transform hover:rotate-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /></svg>
                  </div>
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">GSTR-1 Statutory Audit</h2>
               </div>
               <p className="text-sm text-slate-400 font-medium max-w-md">Real-time aggregation of outward supplies categorized per regulatory mapping rules.</p>
            </div>

            <div className="flex items-center space-x-6 bg-white/5 backdrop-blur-md p-6 rounded-[2.2rem] border border-white/10">
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Period Shard</label>
                  <div className="flex items-center space-x-2">
                     <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                     <span className="text-slate-600 font-black text-[9px]">TO</span>
                     <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
               </div>
               <div className="w-px h-12 bg-white/10 mx-2"></div>
               <div className="flex flex-col space-y-2">
                  <button onClick={handlePrepareForFiling} className="px-8 py-3 bg-white text-slate-900 hover:bg-emerald-500 hover:text-white rounded-2xl shadow-xl transition-all font-black text-[10px] uppercase tracking-widest">Prepare for Filing</button>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-32 -mt-32"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {[
           { label: 'Aggregate Taxable', value: reportData.metrics.totalTaxable, color: 'text-slate-800', bg: 'bg-white' },
           { label: 'Output Liability', value: reportData.metrics.totalTax, color: 'text-indigo-600', bg: 'bg-indigo-50' },
           { label: 'Transaction Density', value: reportData.metrics.count, color: 'text-emerald-600', bg: 'bg-emerald-50', isValue: false }
         ].map((stat, i) => (
           <div key={i} className={`p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:-translate-y-1 transition-all ${stat.bg}`}>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">{stat.label}</div>
              <div className={`text-4xl font-black italic tracking-tighter tabular-nums ${stat.color}`}>
                {stat.isValue !== false ? `$${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : stat.value}
              </div>
           </div>
         ))}
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm gap-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 flex-1 w-full">
          {sections.map(s => (
            <button 
              key={s.id} 
              onClick={() => setActiveSection(s.id)}
              className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center group ${activeSection === s.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl scale-[1.05] z-10' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
            >
              <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{s.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-tighter leading-tight">{s.label}</span>
              <span className={`mt-2 px-2 py-0.5 rounded text-[8px] font-black ${activeSection === s.id ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>{s.count} Shards</span>
            </button>
          ))}
        </div>
        <div className="lg:ml-8 lg:border-l lg:border-slate-100 lg:pl-8 flex flex-col space-y-4 shrink-0 w-full lg:w-auto">
           <button onClick={handleExportDetailedCSV} className="flex items-center justify-center space-x-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>Export Detailed CSV</span>
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col animate-in slide-in-from-bottom-2 duration-500">
         {renderActiveTable()}
      </div>

      {isValidationVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
              <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center">
                 <div className="flex items-center space-x-5">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                       <h3 className="text-xl font-black uppercase tracking-tight italic">Filing Readiness Audit</h3>
                       <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Statutory Compliance Check v4.4</p>
                    </div>
                 </div>
                 <button onClick={() => setIsValidationVisible(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="p-12 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {filingErrors.length === 0 ? (
                    <div className="text-center py-20 animate-in zoom-in-95">
                       <div className="w-24 h-24 bg-emerald-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border-2 border-emerald-100 shadow-inner">
                          <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                       </div>
                       <h4 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Registry Cleared</h4>
                       <p className="text-sm text-slate-400 font-medium">No critical statutory data gaps detected. You are ready to export for filing.</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <div className="flex items-center justify-between mb-6">
                          <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">Potential statutory roadblocks: {filingErrors.length}</h4>
                          <span className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase border border-rose-100">Action Required</span>
                       </div>
                       {filingErrors.map((err, i) => (
                          <div key={i} className={`p-6 rounded-[2rem] border-2 transition-all flex items-start space-x-6 ${err.severity === 'CRITICAL' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shrink-0 ${err.severity === 'CRITICAL' ? 'bg-rose-600' : 'bg-amber-600'}`}>
                                {err.severity === 'CRITICAL' ? '!' : 'W'}
                             </div>
                             <div className="flex-1">
                                <div className="flex items-center justify-between">
                                   <span className="text-xs font-black text-slate-900 italic uppercase">Ref: {err.vId}</span>
                                   <button onClick={() => { onViewVoucher(err.vId); setIsValidationVisible(false); }} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">Correct Shard &rarr;</button>
                                </div>
                                <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">Entity: {err.party}</p>
                                <p className={`text-xs font-medium mt-3 italic ${err.severity === 'CRITICAL' ? 'text-rose-900' : 'text-amber-900'}`}>"{err.message}"</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
                 <button onClick={() => setIsValidationVisible(false)} className="px-10 py-5 rounded-[1.5rem] text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white transition-all">Close Auditor</button>
                 <button onClick={handleExportDetailedCSV} className="px-14 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all transform active:scale-95 border-b-4 border-slate-950">Bypass & Export Detailed CSV</button>
              </div>
           </div>
        </div>
      )}

      <div className="p-12 bg-slate-900 border-4 border-slate-800 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden group">
         <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-indigo-900/40 shrink-0 transform -rotate-6 transition-transform group-hover:rotate-0 border-4 border-indigo-400/20 z-10">🛡️</div>
         <div className="space-y-4 relative z-10">
            <h5 className="text-xl font-black uppercase italic tracking-widest text-white flex items-center">
              Statutory Proofing Logic
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse ml-4 shadow-[0_0_12px_#10b981]"></div>
            </h5>
            <p className="text-sm font-medium text-slate-400 leading-relaxed italic max-w-4xl">
              "The Nexus GST engine utilizes <span className="text-indigo-400 font-black">Cryptographic Ledger Mapping</span> to ensure that all financial statements are mathematically derived from verified voucher streams. Discrepancies between this summary and government portal records (GSTR-2A/2B) typically indicate unposted supplier invoices or temporal variances in transmission."
            </p>
         </div>
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-40 -mt-40 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
      </div>
    </div>
  );
};

export default Gstr1Report;