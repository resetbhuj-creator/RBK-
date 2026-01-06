import React, { useState, useMemo } from 'react';
import { Voucher, GstReportType, Tax, TaxGroup, Ledger } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import Gstr1Report from './Gstr1Report';
import Gstr2Report from './Gstr2Report';
import Gstr3BReport from './Gstr3BReport';
import HsnSummaryReport from './HsnSummaryReport';

interface GstReportSystemProps {
  vouchers: Voucher[];
  activeCompany: any;
  ledgers?: Ledger[];
  taxes?: Tax[];
  taxGroups?: TaxGroup[];
  onViewVoucher: (id: string) => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b'];

const GstReportSystem: React.FC<GstReportSystemProps> = ({ vouchers, activeCompany, ledgers = [], taxes = [], taxGroups = [], onViewVoucher }) => {
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
    return (Object.entries(reportData.rateBreakdown) as [string, any][]).map(([rate, vals]) => ({
      name: `${rate}%`,
      value: vals.taxable
    }));
  }, [reportData.rateBreakdown]);

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
      <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
            <div>
               <div className="flex items-center space-x-6 mb-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl border-4 border-indigo-400/20 transform rotate-3">
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Tax Intelligence</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">Active Jurisdiction: {activeCompany.state || 'Core Hub'} • v4.4</p>
                  </div>
               </div>
               <div className="flex flex-wrap gap-4">
                  <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Sync: Operational</span>
                  </div>
                  <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Filter: {dateRange.start} → {dateRange.end}</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center space-x-4 bg-white/5 p-2 rounded-[2rem] border border-white/10 backdrop-blur-xl">
               <div className="flex flex-col px-6 text-right">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Compliance Confidence</span>
                  <div className="text-3xl font-black italic tabular-nums">{reportData.complianceScore}%</div>
               </div>
               <div className="w-px h-10 bg-white/10"></div>
               <div className="flex space-x-2 px-6">
                  <ActionMenu label="Audit Actions" actions={[
                    { label: 'Export Portal JSON', icon: '📦', onClick: () => handleExport('JSON') },
                    { label: 'Export Portal CSV', icon: '📊', onClick: () => handleExport('CSV') }
                  ]} />
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-64 -mt-64 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard label="ITC Available" value={reportData.itcAvailable} sub="Verified Inward Shards" color="text-emerald-600" icon="📥" />
            <SummaryCard label="Output Liability" value={reportData.cgst + reportData.sgst + reportData.igst} sub="Verified Outward Shards" color="text-indigo-600" icon="📤" />
            <SummaryCard label="Net Shard Settlement" value={reportData.netPayable} sub="CASH IMPACT" color={reportData.netPayable >= 0 ? "text-rose-600" : "text-emerald-600"} icon="🏛️" />
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Filing Alerts</h4>
            <div className="space-y-4">
               {reportData.warnings.length > 0 ? reportData.warnings.map((w, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-rose-50 rounded-2xl border border-rose-100">
                     <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                     <span className="text-[9px] font-black text-rose-800 uppercase italic leading-tight">{w}</span>
                  </div>
               )) : (
                  <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                     <span className="text-[9px] font-black text-emerald-800 uppercase italic leading-tight">Data Registry Stable</span>
                  </div>
               )}
            </div>
            <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Audit Cleanse</button>
         </div>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] border border-slate-200 max-w-4xl mx-auto shadow-inner overflow-x-auto no-scrollbar">
         {(['GSTR-3B', 'GSTR-1', 'GSTR-2', 'HSN-SUMMARY'] as GstReportType[]).map(r => (
            <button key={r} onClick={() => setActiveReport(r)} className={`flex-1 min-w-[120px] py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all whitespace-nowrap ${activeReport === r ? 'bg-white text-indigo-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}>{r}</button>
         ))}
      </div>

      <main className="animate-in fade-in duration-500">
         {activeReport === 'GSTR-1' && <Gstr1Report vouchers={vouchers} ledgers={ledgers} activeCompany={activeCompany} onViewVoucher={onViewVoucher} />}
         {activeReport === 'GSTR-2' && <Gstr2Report vouchers={vouchers} ledgers={ledgers} activeCompany={activeCompany} onViewVoucher={onViewVoucher} />}
         {activeReport === 'GSTR-3B' && <Gstr3BReport vouchers={vouchers} activeCompany={activeCompany} onViewVoucher={onViewVoucher} />}
         {activeReport === 'HSN-SUMMARY' && <HsnSummaryReport vouchers={vouchers} activeCompany={activeCompany} />}
      </main>
    </div>
  );
};

export default GstReportSystem;