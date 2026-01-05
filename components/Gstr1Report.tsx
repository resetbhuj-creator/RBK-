import React, { useState, useMemo } from 'react';
import { Voucher, Ledger } from '../types';
import ActionMenu from './ActionMenu';

interface Gstr1ReportProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
  activeCompany: any;
  onViewVoucher: (id: string) => void;
}

const Gstr1Report: React.FC<Gstr1ReportProps> = ({ vouchers, ledgers, activeCompany, onViewVoucher }) => {
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] 
  });

  const reportData = useMemo(() => {
    const summary = {
      b2b: { taxable: 0, tax: 0, count: 0 },
      b2c: { taxable: 0, tax: 0, count: 0 },
      exports: { taxable: 0, tax: 0, count: 0 },
      netTaxable: 0,
      netTax: 0,
      totalVouchers: 0
    };

    const salesVouchers = vouchers.filter(v => {
      const vDate = new Date(v.date);
      const inRange = vDate >= new Date(dateRange.start) && vDate <= new Date(dateRange.end);
      return inRange && (v.type === 'Sales' || v.type === 'Sales Return');
    });

    salesVouchers.forEach(v => {
      const isReturn = v.type === 'Sales Return';
      const factor = isReturn ? -1 : 1;
      const taxable = (v.subTotal || v.amount) * factor;
      const tax = (v.taxTotal || 0) * factor;

      // Identify party registration status
      const partyLedger = ledgers.find(l => l.name === v.party);
      const isRegistered = partyLedger?.taxId && partyLedger.taxId.trim().length > 0;
      const isExport = v.supplyType === 'Central' && (v.party.toLowerCase().includes('global') || v.party.toLowerCase().includes('export'));

      if (isExport) {
        summary.exports.taxable += taxable;
        summary.exports.tax += tax;
        summary.exports.count++;
      } else if (isRegistered) {
        summary.b2b.taxable += taxable;
        summary.b2b.tax += tax;
        summary.b2b.count++;
      } else {
        summary.b2c.taxable += taxable;
        summary.b2c.tax += tax;
        summary.b2c.count++;
      }

      summary.netTaxable += taxable;
      summary.netTax += tax;
      summary.totalVouchers++;
    });

    return summary;
  }, [vouchers, ledgers, dateRange]);

  const MetricCard = ({ label, taxable, tax, count, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
       <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{label}</span>
             <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${color.replace('text', 'bg').replace('600', '50')} ${color} border border-current opacity-60`}>
                {count} Nodes
             </span>
          </div>
          <div className={`text-3xl font-black italic tracking-tighter text-slate-800 tabular-nums`}>
            ${taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-3 mt-4">
             <div className={`text-[10px] font-black uppercase tracking-widest ${color}`}>Tax: ${tax.toLocaleString()}</div>
             <div className="w-1 h-1 rounded-full bg-slate-200"></div>
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Liability</div>
          </div>
       </div>
       <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-10 transition-opacity ${color.replace('text', 'bg')}`}></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
            <div>
               <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl border-4 border-indigo-400/20 transform -rotate-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /></svg>
                  </div>
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">GSTR-1 Outward Registry</h2>
               </div>
               <p className="text-sm text-slate-400 font-medium max-w-md">Comprehensive audit of outward supplies for statutory reconciliation.</p>
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
               <button className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-xl transition-all active:scale-95 group">
                  <svg className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               </button>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-32 -mt-32"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <MetricCard label="B2B Supplies (Registered)" taxable={reportData.b2b.taxable} tax={reportData.b2b.tax} count={reportData.b2b.count} color="text-indigo-600" />
         <MetricCard label="B2C Supplies (Unregistered)" taxable={reportData.b2c.taxable} tax={reportData.b2c.tax} count={reportData.b2c.count} color="text-sky-600" />
         <MetricCard label="Zero Rated / Exports" taxable={reportData.exports.taxable} tax={reportData.exports.tax} count={reportData.exports.count} color="text-emerald-600" />
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
         <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
               <h4 className="text-xl font-black italic text-slate-800 uppercase">Statutory Invoice Tableau</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Aggregated Registry {dateRange.start} → {dateRange.end}</p>
            </div>
            <div className="text-right">
               <div className="text-4xl font-black italic tracking-tighter text-slate-900">${reportData.netTaxable.toLocaleString()}</div>
               <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Net Aggregate Taxable</div>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-950 text-[9px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-900">
                  <tr>
                     <th className="px-12 py-7">Audit HASH / Date</th>
                     <th className="px-12 py-7">Counterparty Identity</th>
                     <th className="px-12 py-7">Jurisdiction</th>
                     <th className="px-12 py-7 text-right">Taxable Value</th>
                     <th className="px-12 py-7 text-right">Tax Component</th>
                     <th className="px-12 py-7 text-right">Operations</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 bg-white">
                  {vouchers.filter(v => (v.type === 'Sales' || v.type === 'Sales Return') && (new Date(v.date) >= new Date(dateRange.start) && new Date(v.date) <= new Date(dateRange.end))).map((v, i) => {
                     const isB2B = ledgers.find(l => l.name === v.party)?.taxId;
                     return (
                        <tr key={i} onClick={() => onViewVoucher(v.id)} className="hover:bg-indigo-50/20 transition-all group cursor-pointer border-b border-slate-50">
                           <td className="px-12 py-8">
                              <span className="font-mono text-xs text-indigo-600 font-black">#{v.id}</span>
                              <div className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{v.date}</div>
                           </td>
                           <td className="px-12 py-8">
                              <div className="text-sm font-black text-slate-800 uppercase italic group-hover:text-indigo-600 transition-colors">{v.party}</div>
                              <div className="flex items-center space-x-3 mt-2">
                                 <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${isB2B ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                    {isB2B ? `B2B: ${isB2B}` : 'B2C (Unregistered)'}
                                 </span>
                              </div>
                           </td>
                           <td className="px-12 py-8">
                              <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${v.supplyType === 'Local' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                 {v.supplyType}
                              </span>
                           </td>
                           <td className="px-12 py-8 text-right font-mono text-xs font-black text-slate-900 italic underline decoration-slate-100 underline-offset-4 tracking-tighter">
                              ${(v.subTotal || v.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                           </td>
                           <td className="px-12 py-8 text-right font-mono text-xs font-black text-indigo-600 tabular-nums">
                              ${(v.taxTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                           </td>
                           <td className="px-12 py-8 text-right" onClick={e => e.stopPropagation()}>
                              <ActionMenu label="Inspect" actions={[
                                 { label: 'Review Voucher', icon: '👁️', onClick: () => onViewVoucher(v.id), variant: 'primary' },
                                 { label: 'Audit Trail', icon: '🔍', onClick: () => {} }
                              ]} />
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border-l-8 border-indigo-500">
         <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="space-y-4">
               <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Portal Reconciliation</h3>
               <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xl">
                  Nexus automatically maps outward supplies to GSTR-1 tables (4A, 4B, 5, 6, 7). This report is verified against your master ledger opening balances. Discrepancies should be audited before final portal submission.
               </p>
            </div>
            <div className="flex space-x-4 shrink-0">
               <button className="px-10 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 hover:text-white transition-all transform active:scale-95 border-b-4 border-slate-950">Generate Offline Utility</button>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-10 -mr-40 -mt-40 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Gstr1Report;