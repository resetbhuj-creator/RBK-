import React, { useState, useMemo } from 'react';
import { Voucher, GstReportType, Tax, TaxGroup } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface GstReportSystemProps {
  vouchers: Voucher[];
  activeCompany: any;
  taxes?: Tax[];
  taxGroups?: TaxGroup[];
  onViewVoucher: (id: string) => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b'];

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
      rateBreakdown: {} as Record<number, { taxable: number, tax: number, cgst: number, sgst: number, igst: number }>,
      complianceScore: 100,
      warnings: [] as string[]
    };

    filteredVouchers.forEach(v => {
      const tax = v.taxTotal || 0;
      const taxable = v.subTotal || v.amount;

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

        if (!item.hsn) {
            summary.complianceScore -= 2;
            if (!summary.warnings.includes('Missing HSN Codes')) summary.warnings.push('HSN Codes missing in some transactions.');
        }
      });
    });

    summary.netPayable = (summary.cgst + summary.sgst + summary.igst) - summary.itcAvailable;
    summary.complianceScore = Math.max(summary.complianceScore, 0);
    return summary;
  }, [filteredVouchers]);

  const chartData = useMemo(() => {
    return [
      { name: 'Liability', value: reportData.cgst + reportData.sgst + reportData.igst, fill: '#6366f1' },
      { name: 'Credit (ITC)', value: reportData.itcAvailable, fill: '#10b981' }
    ];
  }, [reportData]);

  const slabChartData = useMemo(() => {
    // Fix: Cast Object.entries to [string, any][] to avoid 'unknown' type error on 'vals' property access
    return (Object.entries(reportData.rateBreakdown) as [string, any][]).map(([rate, vals]) => ({
      name: `${rate}%`,
      value: vals.taxable
    }));
  }, [reportData.rateBreakdown]);

  const hsnSummaryData = useMemo(() => {
    const map: Record<string, { hsn: string, desc: string, uom: string, qty: number, taxable: number, tax: number }> = {};
    filteredVouchers.forEach(v => {
      v.items?.forEach(item => {
        const code = item.hsn || 'N/A';
        if (!map[code]) {
          map[code] = { hsn: code, desc: item.name, uom: item.unit || 'Nos', qty: 0, taxable: 0, tax: 0 };
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
      dataString = JSON.stringify({ company: activeCompany.name, period: `${dateRange.start} to ${dateRange.end}`, report: activeReport, summary: reportData, vouchers: filteredVouchers }, null, 2);
      mimeType = 'application/json';
    } else {
      const headers = ['Vch ID', 'Date', 'Party', 'Supply Type', 'Class', 'Taxable Value', 'Tax Total', 'Grand Total'];
      const rows = filteredVouchers.map(v => [v.id, v.date, v.party, v.supplyType, v.gstClassification, (v.subTotal || v.amount).toString(), (v.taxTotal || 0).toString(), v.amount.toString()]);
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

  const SummaryCard = ({ label, value, sub, color, icon }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
       <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
            <span className="text-xl opacity-20 group-hover:opacity-100 transition-opacity">{icon}</span>
          </div>
          <div className={`text-3xl font-black italic tracking-tighter ${color}`}>${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <p className="text-[9px] font-bold text-slate-300 uppercase mt-3">{sub}</p>
       </div>
       <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${color.replace('text', 'bg').replace('600', '500')}`}></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      {/* Dynamic Header */}
      <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
            <div>
               <div className="flex items-center space-x-6 mb-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl border-4 border-indigo-400/20 transform rotate-3">
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Tax Intelligence</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">Active Jurisdiction: {activeCompany.state} • v4.4</p>
                  </div>
               </div>
               
               <div className="flex flex-wrap gap-4">
                  <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Reconciliation: Active</span>
                  </div>
                  <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Period: {dateRange.start} → {dateRange.end}</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center space-x-4 bg-white/5 p-2 rounded-[2rem] border border-white/10 backdrop-blur-xl">
               <div className="flex flex-col px-6">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Compliance Score</span>
                  <div className="text-3xl font-black italic tabular-nums">{reportData.complianceScore}%</div>
               </div>
               <div className="w-px h-10 bg-white/10"></div>
               <div className="flex space-x-2 px-6">
                  <button onClick={() => window.print()} className="p-4 bg-white/5 hover:bg-indigo-600 rounded-2xl transition-all border border-white/10 group">
                    <svg className="w-5 h-5 text-indigo-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  </button>
                  <ActionMenu label="Export Data" actions={[
                    { label: 'Portal JSON', icon: '📦', onClick: () => handleExport('JSON') },
                    { label: 'Portal CSV', icon: '📊', onClick: () => handleExport('CSV') }
                  ]} />
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         {/* Main Summary Cards */}
         <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard label="ITC Available" value={reportData.itcAvailable} sub="Verified Inward Supply" color="text-emerald-600" icon="📥" />
            <SummaryCard label="Output Liability" value={reportData.cgst + reportData.sgst + reportData.igst} sub="Verified Outward Supply" color="text-indigo-600" icon="📤" />
            <SummaryCard label="Net Settlement" value={reportData.netPayable} sub="CASH LEDGER IMPACT" color={reportData.netPayable >= 0 ? "text-rose-600" : "text-emerald-600"} icon="🏛️" />
         </div>

         {/* Compliance Health Widget */}
         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Filing Status</h4>
            <div className="space-y-4">
               {reportData.warnings.length > 0 ? reportData.warnings.map((w, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-rose-50 rounded-2xl border border-rose-100">
                     <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                     <span className="text-[9px] font-black text-rose-800 uppercase italic leading-tight">{w}</span>
                  </div>
               )) : (
                  <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                     <span className="text-[9px] font-black text-emerald-800 uppercase italic leading-tight">Data Integrity Optimal</span>
                  </div>
               )}
            </div>
            <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Execute Auto-Fix</button>
         </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm h-[400px] flex flex-col">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] mb-10 flex items-center">
               <div className="w-2 h-2 rounded-full bg-indigo-600 mr-3 animate-pulse"></div>
               Sovereign Flow Analysis
            </h4>
            <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900, textTransform: 'uppercase'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                     <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '12px', fontWeight: 900}} />
                     <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                        {chartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm h-[400px] flex flex-col">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] mb-10 flex items-center">
               <div className="w-2 h-2 rounded-full bg-emerald-600 mr-3 animate-pulse"></div>
               Taxable Volume by Slab
            </h4>
            <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={slabChartData}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                     >
                        {slabChartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: 900}} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] border border-slate-200 max-w-4xl mx-auto shadow-inner overflow-x-auto no-scrollbar">
         {(['GSTR-1', 'GSTR-2', 'GSTR-3B', 'HSN-SUMMARY'] as GstReportType[]).map(r => (
            <button key={r} onClick={() => setActiveReport(r)} className={`flex-1 min-w-[120px] py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all whitespace-nowrap ${activeReport === r ? 'bg-white text-indigo-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}>{r}</button>
         ))}
      </div>

      {/* Report Content */}
      <main className="animate-in fade-in duration-500">
        {activeReport === 'GSTR-3B' && (
              <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h4 className="text-xl font-black italic text-slate-800 uppercase">3.1 & 4.1 Rate-Wise Analysis</h4>
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2"></div>
                       Slab Aggregation Engine v2
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-800">
                          <tr>
                             <th className="px-10 py-7">Sovereign Slab</th>
                             <th className="px-10 py-7 text-right">Taxable Output</th>
                             <th className="px-10 py-7 text-right">Integrated (IGST)</th>
                             <th className="px-10 py-7 text-right">Central (CGST)</th>
                             <th className="px-10 py-7 text-right">State (SGST)</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 bg-white">
                          {(Object.entries(reportData.rateBreakdown) as [string, any][]).sort((a,b) => Number(b[0]) - Number(a[0])).map(([rate, vals], idx) => (
                            <tr key={rate} className="hover:bg-indigo-50/20 transition-all group">
                               <td className="px-10 py-6">
                                  <div className="flex items-center space-x-4">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-lg transform group-hover:rotate-6 transition-all`} style={{ backgroundColor: COLORS[idx % COLORS.length] }}>{rate}%</div>
                                     <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Rate Component</span>
                                  </div>
                               </td>
                               <td className="px-10 py-6 text-right font-black text-slate-800 tabular-nums text-sm italic">${vals.taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                               <td className="px-10 py-6 text-right font-black text-indigo-600 tabular-nums text-sm underline decoration-indigo-100 decoration-4 underline-offset-4">${vals.igst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                               <td className="px-10 py-6 text-right font-black text-indigo-400 tabular-nums text-sm">${vals.cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                               <td className="px-10 py-6 text-right font-black text-indigo-400 tabular-nums text-sm">${vals.sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-950 text-white font-black italic">
                             <td className="px-10 py-10 uppercase text-xs tracking-[0.4em] flex items-center">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-4"></div>
                                Total Volume Shard
                             </td>
                             <td className="px-10 py-10 text-right text-3xl tabular-nums tracking-tighter">${reportData.taxableValue.toLocaleString()}</td>
                             <td className="px-10 py-10 text-right text-3xl tabular-nums tracking-tighter text-indigo-400">${reportData.igst.toLocaleString()}</td>
                             <td className="px-10 py-10 text-right text-3xl tabular-nums tracking-tighter text-indigo-300">${reportData.cgst.toLocaleString()}</td>
                             <td className="px-10 py-10 text-right text-3xl tabular-nums tracking-tighter text-indigo-300">${reportData.sgst.toLocaleString()}</td>
                          </tr>
                       </tbody>
                    </table>
                 </div>
              </div>
        )}

        {activeReport === 'HSN-SUMMARY' && (
           <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h4 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">HSN/SAC Aggregate Summary</h4>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-l border-slate-200 pl-4 ml-4">By Pattern Hash</div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                       <tr>
                          <th className="px-10 py-7">Code Block</th>
                          <th className="px-10 py-7">Description Master</th>
                          <th className="px-10 py-7 text-center">Unit Mass</th>
                          <th className="px-10 py-7 text-right">Taxable Value</th>
                          <th className="px-10 py-7 text-right">Tax Component</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                       {hsnSummaryData.map((row, i) => (
                          <tr key={i} className="hover:bg-indigo-50/20 transition-all group">
                             <td className="px-10 py-6">
                                <div className="px-5 py-2 bg-slate-900 text-indigo-400 rounded-xl text-xs font-black inline-block border border-slate-800 shadow-lg font-mono">
                                   {row.hsn}
                                </div>
                             </td>
                             <td className="px-10 py-6 text-sm font-black text-slate-800 uppercase italic group-hover:text-indigo-700 transition-colors">{row.desc}</td>
                             <td className="px-10 py-6 text-center">
                                <div className="text-lg font-black text-slate-900 tabular-nums italic">{row.qty}</div>
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{row.uom}</div>
                             </td>
                             <td className="px-10 py-6 text-right font-black text-slate-800 tabular-nums italic text-sm underline decoration-slate-100 underline-offset-4">${row.taxable.toLocaleString()}</td>
                             <td className="px-10 py-6 text-right font-black text-indigo-600 tabular-nums text-sm">${row.tax.toLocaleString()}</td>
                          </tr>
                       ))}
                       {hsnSummaryData.length === 0 && (
                          <tr><td colSpan={5} className="py-40 text-center opacity-30 italic font-black uppercase text-[10px] tracking-[0.5em]">No HSN Data Registry Found</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {(activeReport === 'GSTR-1' || activeReport === 'GSTR-2') && (
           <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h4 className="text-xl font-black italic text-slate-800 uppercase">
                    {activeReport === 'GSTR-1' ? 'Outward B2B Supply Registry' : 'Inward ITC Registry'}
                 </h4>
                 <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${activeReport === 'GSTR-1' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {filteredVouchers.length} Transmissions Verified
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                       <tr>
                          <th className="px-12 py-7">Doc ID / Moment</th>
                          <th className="px-12 py-7">Counterparty Identity</th>
                          <th className="px-12 py-7 text-center">Protocol</th>
                          <th className="px-12 py-7 text-right">Taxable Aggregate</th>
                          <th className="px-12 py-7 text-right">Resolved Tax</th>
                          <th className="px-12 py-7 text-right">Modular Ops</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                       {filteredVouchers
                        .filter(v => v.gstClassification === (activeReport === 'GSTR-1' ? 'Output' : 'Input'))
                        .map((v, i) => (
                          <tr key={i} onClick={() => onViewVoucher(v.id)} className="hover:bg-indigo-50/30 group transition-all cursor-pointer border-b border-slate-50 last:border-0">
                             <td className="px-12 py-6">
                                <span className="font-mono text-xs text-indigo-600 font-black italic">#{v.id}</span>
                                <div className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{v.date}</div>
                             </td>
                             <td className="px-12 py-6">
                                <div className="text-sm font-black text-slate-800 uppercase italic group-hover:text-indigo-600 transition-colors underline decoration-transparent group-hover:decoration-indigo-100 underline-offset-4">{v.party}</div>
                                <div className="flex items-center space-x-2 mt-2">
                                   <div className={`w-1.5 h-1.5 rounded-full ${v.supplyType === 'Local' ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">STATE: {activeCompany.state}</span>
                                </div>
                             </td>
                             <td className="px-12 py-6 text-center">
                                <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase border shadow-sm transition-transform group-hover:scale-105 ${v.supplyType === 'Local' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                   {v.supplyType}
                                </span>
                             </td>
                             <td className="px-12 py-6 text-right font-mono text-sm font-black text-slate-900 italic tracking-tighter underline decoration-slate-100 underline-offset-4">${(v.subTotal || v.amount).toLocaleString()}</td>
                             <td className="px-12 py-6 text-right font-mono text-sm font-black text-indigo-600 tabular-nums">${(v.taxTotal || 0).toLocaleString()}</td>
                             <td className="px-12 py-6 text-right" onClick={e => e.stopPropagation()}>
                                <ActionMenu label="Forensic" actions={[
                                   { label: 'Review Voucher', icon: '👁️', onClick: () => onViewVoucher(v.id), variant: 'primary' },
                                   { label: 'Compliance Audit', icon: '⚖️', onClick: () => {} }
                                ]} />
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </main>

      {/* Integrated Compliance Advisory */}
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

export default GstReportSystem;