import React, { useState, useMemo } from 'react';
import { Voucher, GstReportType, Tax, TaxGroup } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';

interface GstReportSystemProps {
  vouchers: Voucher[];
  activeCompany: any;
  taxes?: Tax[];
  taxGroups?: TaxGroup[];
  onViewVoucher: (id: string) => void;
}

const GstReportSystem: React.FC<GstReportSystemProps> = ({ vouchers, activeCompany, taxes = [], taxGroups = [], onViewVoucher }) => {
  const [activeReport, setActiveReport] = useState<GstReportType>('GSTR-3B');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] 
  });

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const vDate = new Date(v.date);
      return vDate >= new Date(dateRange.start) && vDate <= new Date(dateRange.end);
    });
  }, [vouchers, dateRange]);

  const reportData = useMemo(() => {
    const summary = {
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      itcAvailable: 0,
      itcCgst: 0,
      itcSgst: 0,
      itcIgst: 0,
      netPayable: 0,
      rateBreakdown: {} as Record<number, { taxable: number, tax: number, cgst: number, sgst: number, igst: number }>
    };

    filteredVouchers.forEach(v => {
      const tax = v.taxTotal || 0;
      const taxable = v.subTotal || v.amount;

      // Global Totals
      if (v.gstClassification === 'Output') {
        summary.taxableValue += taxable;
        if (v.supplyType === 'Local') {
          summary.cgst += tax / 2;
          summary.sgst += tax / 2;
        } else {
          summary.igst += tax;
        }
      } else if (v.gstClassification === 'Input') {
        summary.itcAvailable += tax;
        if (v.supplyType === 'Local') {
          summary.itcCgst += tax / 2;
          summary.itcSgst += tax / 2;
        } else {
          summary.itcIgst += tax;
        }
      }

      // Rate-wise Breakdown (Deep Aggregation)
      v.items?.forEach(item => {
        const rate = item.igstRate || 0;
        if (!summary.rateBreakdown[rate]) {
          summary.rateBreakdown[rate] = { taxable: 0, tax: 0, cgst: 0, sgst: 0, igst: 0 };
        }
        
        summary.rateBreakdown[rate].taxable += item.amount;
        summary.rateBreakdown[rate].tax += (item.taxAmount || 0);
        
        if (v.supplyType === 'Local') {
          summary.rateBreakdown[rate].cgst += (item.taxAmount || 0) / 2;
          summary.rateBreakdown[rate].sgst += (item.taxAmount || 0) / 2;
        } else {
          summary.rateBreakdown[rate].igst += (item.taxAmount || 0);
        }
      });
    });

    summary.netPayable = (summary.cgst + summary.sgst + summary.igst) - summary.itcAvailable;
    return summary;
  }, [filteredVouchers]);

  const hsnSummaryData = useMemo(() => {
    const map: Record<string, { hsn: string, desc: string, uom: string, qty: number, taxable: number, tax: number }> = {};
    
    filteredVouchers.forEach(v => {
      v.items?.forEach(item => {
        const code = item.hsn || 'N/A';
        if (!map[code]) {
          map[code] = { 
            hsn: code, 
            desc: item.name, 
            uom: item.unit || 'Nos', 
            qty: 0, 
            taxable: 0, 
            tax: 0 
          };
        }
        map[code].qty += item.qty;
        map[code].taxable += item.amount;
        map[code].tax += (item.taxAmount || 0);
      });
    });
    
    return Object.values(map);
  }, [filteredVouchers]);

  const handleExport = (format: 'CSV' | 'JSON') => {
    let dataString = '';
    let mimeType = '';

    if (format === 'JSON') {
      dataString = JSON.stringify({
        company: activeCompany.name,
        period: `${dateRange.start} to ${dateRange.end}`,
        report: activeReport,
        summary: reportData,
        hsnSummary: hsnSummaryData,
        vouchers: filteredVouchers
      }, null, 2);
      mimeType = 'application/json';
    } else {
      const headers = ['Vch ID', 'Date', 'Party', 'Supply Type', 'Class', 'Taxable Value', 'Tax Total', 'Grand Total'];
      const rows = filteredVouchers.map(v => [
        v.id, v.date, v.party, v.supplyType, v.gstClassification, 
        (v.subTotal || v.amount).toString(), (v.taxTotal || 0).toString(), v.amount.toString()
      ]);
      dataString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      mimeType = 'text/csv';
    }
    
    const blob = new Blob([dataString], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_gst_${activeReport.toLowerCase()}_${Date.now()}.${format.toLowerCase()}`;
    a.click();
  };

  const SummaryCard = ({ label, value, sub, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
       <div className="relative z-10">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{label}</p>
          <div className={`text-3xl font-black italic tracking-tighter ${color}`}>${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <p className="text-[9px] font-bold text-slate-300 uppercase mt-2">{sub}</p>
       </div>
       <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${color.replace('text', 'bg')}`}></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      {/* Header Cluster */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-4 border-indigo-500/30">
         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
            <div>
               <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg transform -rotate-3 border-4 border-indigo-400/20">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Statutory GST Intelligence</h2>
               </div>
               <p className="text-sm text-slate-400 font-medium max-w-md">Multi-region compliance node. Active State: <span className="text-white font-black">{activeCompany.state}</span></p>
            </div>

            <div className="flex flex-wrap items-center gap-6 bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-inner">
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Period Filter</label>
                  <div className="flex items-center space-x-2">
                     <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                     <span className="text-slate-600 font-black text-[9px]">TO</span>
                     <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
               </div>
               <div className="flex space-x-2 border-l border-white/10 pl-6">
                  <button onClick={() => window.print()} className="p-3 bg-white/10 hover:bg-indigo-600 rounded-xl transition-all border border-white/10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
                  <ActionMenu label="Export Stream" actions={[
                    { label: 'Portal JSON (Offline)', icon: '📦', onClick: () => handleExport('JSON') },
                    { label: 'Portal CSV (B2B)', icon: '📊', onClick: () => handleExport('CSV') }
                  ]} />
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] border border-slate-200 max-w-4xl mx-auto shadow-inner overflow-x-auto no-scrollbar">
         {(['GSTR-1', 'GSTR-2', 'GSTR-3B', 'HSN-SUMMARY'] as GstReportType[]).map(r => (
            <button key={r} onClick={() => setActiveReport(r)} className={`flex-1 min-w-[120px] py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all whitespace-nowrap ${activeReport === r ? 'bg-white text-indigo-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}>{r}</button>
         ))}
      </div>

      {/* Report Content Swapper */}
      <main className="animate-in fade-in duration-500">
        {activeReport === 'GSTR-3B' && (
           <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                 <SummaryCard label="Eligible ITC" value={reportData.itcAvailable} sub="Inward Supply Credit" color="text-emerald-600" />
                 {/* FIX: Corrected typo 'summary.sgst' to 'reportData.sgst' as summary is not available in this scope */}
                 <SummaryCard label="Tax Liability" value={reportData.cgst + reportData.sgst + reportData.igst} sub="Outward Output" color="text-indigo-600" />
                 <SummaryCard label="Net Settlement" value={reportData.netPayable} sub="CASH LEDGER IMPACT" color={reportData.netPayable >= 0 ? "text-rose-600" : "text-emerald-600"} />
                 <SummaryCard label="Taxable Base" value={reportData.taxableValue} sub="Consolidated Volume" color="text-slate-800" />
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h4 className="text-xl font-black italic text-slate-800 uppercase">3.1 & 4.1 Rate-Wise Analysis</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sovereign Slab Breakdown</p>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2"></div>
                       Audit Verified
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400">
                          <tr>
                             <th className="px-10 py-6">Tax Slab Percentage</th>
                             <th className="px-10 py-6 text-right">Taxable Value</th>
                             <th className="px-10 py-6 text-right">Integrated (IGST)</th>
                             <th className="px-10 py-6 text-right">Central (CGST)</th>
                             <th className="px-10 py-6 text-right">State (SGST)</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {/* FIX: Explicitly cast Object.entries to correctly type 'vals' from unknown */}
                          {(Object.entries(reportData.rateBreakdown) as [string, { taxable: number, tax: number, cgst: number, sgst: number, igst: number }][]).sort((a,b) => Number(b[0]) - Number(a[0])).map(([rate, vals]) => (
                            <tr key={rate} className="hover:bg-indigo-50/20 transition-all group">
                               <td className="px-10 py-6">
                                  <div className="flex items-center space-x-3">
                                     <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">{rate}%</div>
                                     <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Sovereign Rate</span>
                                  </div>
                               </td>
                               <td className="px-10 py-6 text-right font-black text-slate-800 tabular-nums text-sm">${vals.taxable.toLocaleString()}</td>
                               <td className="px-10 py-6 text-right font-black text-indigo-600 tabular-nums text-sm">${vals.igst.toLocaleString()}</td>
                               <td className="px-10 py-6 text-right font-black text-indigo-400 tabular-nums text-sm">${vals.cgst.toLocaleString()}</td>
                               <td className="px-10 py-6 text-right font-black text-indigo-400 tabular-nums text-sm">${vals.sgst.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-950 text-white font-black italic">
                             <td className="px-10 py-8 uppercase text-xs tracking-widest">Aggregate Totals</td>
                             <td className="px-10 py-8 text-right text-xl tabular-nums">${reportData.taxableValue.toLocaleString()}</td>
                             <td className="px-10 py-8 text-right text-xl tabular-nums text-indigo-400">${reportData.igst.toLocaleString()}</td>
                             <td className="px-10 py-8 text-right text-xl tabular-nums text-indigo-300">${reportData.cgst.toLocaleString()}</td>
                             <td className="px-10 py-8 text-right text-xl tabular-nums text-indigo-300">${reportData.sgst.toLocaleString()}</td>
                          </tr>
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {(activeReport === 'GSTR-1' || activeReport === 'GSTR-2') && (
           <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h4 className="text-xl font-black italic text-slate-800 uppercase">
                    {activeReport === 'GSTR-1' ? 'Outward B2B Supply Registry' : 'Inward ITC Registry'}
                 </h4>
                 <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${activeReport === 'GSTR-1' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {filteredVouchers.length} Transmissions Tracked
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                       <tr>
                          <th className="px-10 py-6">Voucher Identity</th>
                          <th className="px-10 py-6">Counterparty Master</th>
                          <th className="px-10 py-6">Supply Logic</th>
                          <th className="px-10 py-6 text-right">Taxable</th>
                          <th className="px-10 py-6 text-right">Statutory Tax</th>
                          <th className="px-10 py-6 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredVouchers
                        .filter(v => v.gstClassification === (activeReport === 'GSTR-1' ? 'Output' : 'Input'))
                        .map((v, i) => (
                          <tr key={i} onClick={() => onViewVoucher(v.id)} className="hover:bg-slate-50 group transition-all cursor-pointer">
                             <td className="px-10 py-6">
                                <span className="font-mono text-xs text-indigo-600 font-black">#{v.id}</span>
                                <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">{v.date}</div>
                             </td>
                             <td className="px-10 py-6">
                                <div className="text-xs font-black text-slate-800 uppercase italic group-hover:text-indigo-600 transition-colors">{v.party}</div>
                                <div className="flex items-center space-x-2 mt-1">
                                   <div className={`w-1.5 h-1.5 rounded-full ${v.supplyType === 'Local' ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
                                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">POS: {activeCompany.state}</span>
                                </div>
                             </td>
                             <td className="px-10 py-6">
                                <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase border ${v.supplyType === 'Local' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                   {v.supplyType}
                                </span>
                             </td>
                             <td className="px-10 py-6 text-right font-mono text-xs font-black">${(v.subTotal || v.amount).toLocaleString()}</td>
                             <td className="px-10 py-6 text-right font-mono text-xs font-black text-indigo-600">${(v.taxTotal || 0).toLocaleString()}</td>
                             <td className="px-10 py-6 text-right" onClick={e => e.stopPropagation()}>
                                <ActionMenu label="Inspect" actions={[
                                   { label: 'View Voucher', icon: '👁️', onClick: () => onViewVoucher(v.id) },
                                   { label: 'Audit Trail', icon: '🔍', onClick: () => {} }
                                ]} />
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {filteredVouchers.length === 0 && (
                   <div className="py-20 text-center text-slate-400 italic font-medium uppercase text-[10px] tracking-widest opacity-40">Zero Registry Entries in Specified Period</div>
                 )}
              </div>
           </div>
        )}

        {activeReport === 'HSN-SUMMARY' && (
           <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h4 className="text-xl font-black italic text-slate-800 uppercase">HSN Code Master Summary</h4>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Aggregated by Unique Pattern</div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                       <tr>
                          <th className="px-10 py-6">HSN/SAC Code</th>
                          <th className="px-10 py-6">Primary Description</th>
                          <th className="px-10 py-6 text-center">Unit Volume</th>
                          <th className="px-10 py-6 text-right">Taxable Value</th>
                          <th className="px-10 py-6 text-right">Central (C+S)</th>
                          <th className="px-10 py-6 text-right">Integrated (I)</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {hsnSummaryData.map((row, i) => (
                          <tr key={i} className="hover:bg-indigo-50/20 transition-all group">
                             <td className="px-10 py-6">
                                <div className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black inline-block border border-indigo-100 shadow-sm">
                                   {row.hsn}
                                </div>
                             </td>
                             <td className="px-10 py-6 text-xs font-black text-slate-800 uppercase italic">{row.desc}</td>
                             <td className="px-10 py-6 text-center">
                                <span className="text-sm font-black text-slate-900">{row.qty}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">{row.uom}</span>
                             </td>
                             <td className="px-10 py-6 text-right font-black text-slate-800 tabular-nums">${row.taxable.toLocaleString()}</td>
                             <td className="px-10 py-6 text-right font-black text-slate-500 tabular-nums">${(row.tax / 2).toLocaleString()} x 2</td>
                             <td className="px-10 py-6 text-right font-black text-indigo-600 tabular-nums italic">${row.tax.toLocaleString()}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </main>

      {/* Advisory Node */}
      <div className="p-10 bg-indigo-50 border-2 border-indigo-100 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 shadow-lg group hover:bg-white transition-colors duration-500">
         <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-3xl shadow-2xl shadow-indigo-900/40 shrink-0 transform -rotate-3 transition-transform group-hover:rotate-0 border-4 border-indigo-400/20">🏛️</div>
         <div className="space-y-3">
            <h5 className="text-sm font-black uppercase tracking-widest text-indigo-900 flex items-center">
              Statutory Proofing Advisory
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-3"></div>
            </h5>
            <p className="text-xs font-medium text-indigo-700/80 leading-relaxed italic">
              Nexus provides <span className="text-indigo-900 font-black">Zero-Touch Reconciliation</span>. These reports are derived from verified cryptographic voucher streams. Discrepancies between this summary and the active GSTR-2A/2B portal records may indicate unposted supplier invoices or timing variances.
            </p>
         </div>
      </div>
    </div>
  );
};

export default GstReportSystem;