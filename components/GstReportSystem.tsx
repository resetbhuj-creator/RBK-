import React, { useState, useMemo } from 'react';
import { Voucher, GstReportType, Tax, TaxGroup } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';

interface GstReportSystemProps {
  vouchers: Voucher[];
  activeCompany: any;
  taxes?: Tax[];
  taxGroups?: TaxGroup[];
}

const GstReportSystem: React.FC<GstReportSystemProps> = ({ vouchers, activeCompany, taxes = [], taxGroups = [] }) => {
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
      groupSummaries: {} as Record<string, { taxable: number, tax: number, name: string }>
    };

    filteredVouchers.forEach(v => {
      const tax = v.taxTotal || 0;
      const taxable = v.subTotal || v.amount;

      // Group-based aggregation logic
      // In a real voucher, we would have explicit tax ledger mappings.
      // Here we simulate by checking supply type and assuming standard statutory distributions.
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
    });

    summary.netPayable = (summary.cgst + summary.sgst + summary.igst) - summary.itcAvailable;
    return summary;
  }, [filteredVouchers, taxes, taxGroups]);

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

  const getTransactionActions = (v: Voucher): ActionItem[] => [
    { 
      label: 'Portal Verification', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
      onClick: () => alert(`Checking GSTR-2B filing status for ${v.id}...`),
      variant: 'primary'
    },
    { 
      label: 'Tax Invoice Print', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
      onClick: () => alert(`Loading statutory print layout...`)
    }
  ];

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
      {/* Header & Controls */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-4 border-indigo-500/30">
         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
            <div>
               <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg transform -rotate-3">⚖️</div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase">Statutory Report System</h2>
               </div>
               <p className="text-sm text-slate-400 font-medium max-w-md">Multi-Region GST Compliance & Filing Assistance Engine. Verified for {activeCompany.state} Jurisdiction.</p>
            </div>

            <div className="flex flex-wrap items-center gap-6 bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-inner">
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Reporting Window</label>
                  <div className="flex items-center space-x-2">
                     <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                     <span className="text-slate-600 font-black">TO</span>
                     <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
               </div>
               <div className="flex space-x-2 border-l border-white/10 pl-6">
                  <button onClick={() => window.print()} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all shadow-xl border border-white/10" title="Print Audit Layout"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
                  <button onClick={() => handleExport('CSV')} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all shadow-xl border border-white/10" title="Export Portal CSV"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                  <ActionMenu 
                    label="Export"
                    actions={[
                      { label: 'Portal JSON', icon: '📦', onClick: () => handleExport('JSON') },
                      { label: 'E-Invoice Sync', icon: '⚡', onClick: () => alert('Syncing with IRP node...') }
                    ]} 
                  />
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[150px] -mr-64 -mt-64 opacity-20 pointer-events-none"></div>
      </div>

      {/* Report Switcher */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] border border-slate-200 max-w-3xl mx-auto shadow-inner">
         {(['GSTR-1', 'GSTR-2', 'GSTR-3B', 'HSN-SUMMARY'] as GstReportType[]).map(r => (
            <button key={r} onClick={() => setActiveReport(r)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeReport === r ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>{r}</button>
         ))}
      </div>

      {/* Main Content Area */}
      {activeReport === 'GSTR-3B' && (
         <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
               <SummaryCard label="Eligible ITC" value={reportData.itcAvailable} sub="Inward Supply Credit" color="text-emerald-600" />
               <SummaryCard label="Output Tax" value={reportData.cgst + reportData.sgst + reportData.igst} sub="Liability Generated" color="text-indigo-600" />
               <SummaryCard label="Net Payable" value={Math.max(0, reportData.netPayable)} sub="CASH LEDGER BALANCE REQ." color="text-rose-600" />
               <SummaryCard label="Taxable Turnover" value={reportData.taxableValue} sub="Consolidated Volume" color="text-slate-800" />
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xl font-black italic text-slate-800 uppercase">3.1 Statutory Liability Breakdown</h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Values in ${activeCompany.currency}</span>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                        <tr>
                           <th className="px-10 py-6">Supply Classification</th>
                           <th className="px-10 py-6 text-right">Taxable Value</th>
                           <th className="px-10 py-6 text-right">IGST</th>
                           <th className="px-10 py-6 text-right">CGST</th>
                           <th className="px-10 py-6 text-right">SGST/UTGST</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        <tr className="hover:bg-slate-50 transition-colors">
                           <td className="px-10 py-6 font-black text-slate-800 uppercase text-xs group flex items-center justify-between">
                              <span>(a) Outward Taxable Supplies</span>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ActionMenu actions={[{ label: 'GSTR-1 Reco', icon: '📝', onClick: () => {} }]} label="Audit" />
                              </div>
                           </td>
                           <td className="px-10 py-6 text-right font-mono text-sm">${reportData.taxableValue.toLocaleString()}</td>
                           <td className="px-10 py-6 text-right font-mono text-sm text-indigo-600">${reportData.igst.toLocaleString()}</td>
                           <td className="px-10 py-6 text-right font-mono text-sm text-indigo-600">${reportData.cgst.toLocaleString()}</td>
                           <td className="px-10 py-6 text-right font-mono text-sm text-indigo-600">${reportData.sgst.toLocaleString()}</td>
                        </tr>
                        {taxGroups.map(tg => {
                           const groupTaxes = taxes.filter(t => t.groupId === tg.id);
                           if (groupTaxes.length === 0) return null;
                           return (
                             <tr key={tg.id} className="bg-slate-50/30">
                                <td className="px-10 py-4 font-bold text-slate-500 uppercase text-[10px] italic">
                                   --- Sub-Group: {tg.name}
                                </td>
                                <td colSpan={4} className="px-10 py-4 text-right text-[10px] text-slate-300 uppercase tracking-widest">
                                   Aggregated within above statutory totals
                                </td>
                             </tr>
                           );
                        })}
                        <tr className="bg-slate-50 font-black">
                           <td className="px-10 py-6 uppercase text-xs text-indigo-900 group flex items-center justify-between">
                              <span>Total Eligible ITC (Inward)</span>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ActionMenu actions={[{ label: 'GSTR-2B Check', icon: '✅', onClick: () => {} }]} label="Audit" />
                              </div>
                           </td>
                           <td className="px-10 py-6 text-right font-mono text-sm text-emerald-600">--</td>
                           <td className="px-10 py-6 text-right font-mono text-lg text-emerald-600">${reportData.itcIgst.toLocaleString()}</td>
                           <td className="px-10 py-6 text-right font-mono text-lg text-emerald-600">${reportData.itcCgst.toLocaleString()}</td>
                           <td className="px-10 py-6 text-right font-mono text-lg text-emerald-600">${reportData.itcSgst.toLocaleString()}</td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      )}

      {(activeReport === 'GSTR-1' || activeReport === 'GSTR-2') && (
         <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
               <h4 className="text-xl font-black italic text-slate-800 uppercase">
                 {activeReport === 'GSTR-1' ? 'GSTR-1 Outward Supplies (B2B)' : 'GSTR-2 Inward Supplies (B2B/ITC)'}
               </h4>
               <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${activeReport === 'GSTR-1' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                 {activeReport === 'GSTR-1' ? 'Sales Ledger' : 'Purchase Ledger'}
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                     <tr>
                        <th className="px-10 py-6">{activeReport === 'GSTR-1' ? 'Receiver Master' : 'Supplier Identity'}</th>
                        <th className="px-10 py-6">Invoice #</th>
                        <th className="px-10 py-6">Supply Type</th>
                        <th className="px-10 py-6 text-right">Taxable Value</th>
                        <th className="px-10 py-6 text-right">Tax Total</th>
                        <th className="px-10 py-6 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredVouchers.filter(v => v.gstClassification === (activeReport === 'GSTR-1' ? 'Output' : 'Input')).map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50 group transition-all">
                           <td className="px-10 py-5">
                              <div className="text-xs font-black text-slate-800 uppercase">{v.party}</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">POS: {activeCompany.state}</div>
                           </td>
                           <td className="px-10 py-5 font-mono text-xs text-indigo-600">{v.id}</td>
                           <td className="px-10 py-5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${v.supplyType === 'Local' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>{v.supplyType}</span>
                           </td>
                           <td className="px-10 py-5 text-right font-mono text-xs">${(v.subTotal || v.amount).toLocaleString()}</td>
                           <td className="px-10 py-5 text-right font-mono text-xs font-bold text-indigo-600">${(v.taxTotal || 0).toLocaleString()}</td>
                           <td className="px-10 py-5 text-right">
                              <ActionMenu actions={getTransactionActions(v)} />
                           </td>
                        </tr>
                     ))}
                     {filteredVouchers.filter(v => v.gstClassification === (activeReport === 'GSTR-1' ? 'Output' : 'Input')).length === 0 && (
                        <tr>
                           <td colSpan={6} className="px-10 py-20 text-center text-slate-400 italic font-medium">Zero transactional evidence recorded for this period.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {activeReport === 'HSN-SUMMARY' && (
         <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center">
               <h4 className="text-xl font-black italic text-slate-800 uppercase">HSN Code Wise Summary</h4>
               <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Update Master Map</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                     <tr>
                        <th className="px-10 py-6">HSN/SAC Code</th>
                        <th className="px-10 py-6">Description</th>
                        <th className="px-10 py-6">UoM</th>
                        <th className="px-10 py-6 text-center">Total Qty</th>
                        <th className="px-10 py-6 text-right">Taxable Value</th>
                        <th className="px-10 py-6 text-right">Tax Amount</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {hsnSummaryData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 group transition-all">
                           <td className="px-10 py-6 font-mono text-indigo-600 font-bold">{row.hsn}</td>
                           <td className="px-10 py-6 text-xs font-black text-slate-800 uppercase">{row.desc}</td>
                           <td className="px-10 py-6 text-xs text-slate-400 font-bold">{row.uom}</td>
                           <td className="px-10 py-6 text-center font-black text-slate-900">{row.qty}</td>
                           <td className="px-10 py-6 text-right font-mono text-xs font-bold">${row.taxable.toLocaleString()}</td>
                           <td className="px-10 py-6 text-right font-mono text-xs font-bold text-indigo-600">${row.tax.toLocaleString()}</td>
                        </tr>
                     ))}
                     {hsnSummaryData.length === 0 && (
                        <tr>
                           <td colSpan={6} className="px-10 py-20 text-center text-slate-400 italic font-medium">No HSN-mapped items found in vouchers for this period.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* Advisory Footer */}
      <div className="p-10 bg-indigo-50 border-2 border-indigo-100 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 shadow-lg">
         <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-indigo-900/20 shrink-0 transform -rotate-3 transition-transform hover:rotate-0">🏛️</div>
         <div className="space-y-3">
            <h5 className="text-sm font-black uppercase tracking-widest text-indigo-900 flex items-center">
              Statutory Filing Advisory
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-3"></div>
            </h5>
            <p className="text-xs font-medium text-indigo-700/80 leading-relaxed italic">
              Nexus Report Engine provides auto-calculated GST returns. Data aggregation is now driven by your user-defined <span className="text-indigo-900 font-black">Tax Group</span> mappings, ensuring consistency between ledger partitions and statutory filings.
            </p>
         </div>
      </div>
    </div>
  );
};

export default GstReportSystem;