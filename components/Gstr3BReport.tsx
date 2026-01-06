import React, { useState, useMemo } from 'react';
import { Voucher } from '../types';
import ActionMenu from './ActionMenu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Gstr3BReportProps {
  vouchers: Voucher[];
  activeCompany: any;
  onViewVoucher: (id: string) => void;
}

const Gstr3BReport: React.FC<Gstr3BReportProps> = ({ vouchers, activeCompany, onViewVoucher }) => {
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] 
  });

  const reportData = useMemo(() => {
    const summary = {
      table31: {
        a: { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }, // Outward taxable (other than zero, nil, exempt)
        b: { taxable: 0, igst: 0, cess: 0 },                // Zero rated
        c: { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }, // Nil rated, Exempt
        d: { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }, // Inward supplies (Reverse Charge)
        e: { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }, // Non-GST outward
      },
      table4: {
        a1: { igst: 0, cgst: 0, sgst: 0, cess: 0 }, // Import of goods
        a2: { igst: 0, cgst: 0, sgst: 0, cess: 0 }, // Import of services
        a3: { igst: 0, cgst: 0, sgst: 0, cess: 0 }, // Inward (Reverse Charge)
        a5: { igst: 0, cgst: 0, sgst: 0, cess: 0 }, // All other ITC
      },
      netPayable: { igst: 0, cgst: 0, sgst: 0, total: 0 }
    };

    const filtered = vouchers.filter(v => {
      const vDate = new Date(v.date);
      return vDate >= new Date(dateRange.start) && vDate <= new Date(dateRange.end);
    });

    filtered.forEach(v => {
      const isReturn = v.type.includes('Return') || v.type === 'Credit Note' || v.type === 'Debit Note';
      const factor = (v.type === 'Sales Return' || v.type === 'Credit Note' || v.type === 'Purchase Return' || v.type === 'Debit Note') ? -1 : 1;
      
      let vTaxable = 0;
      let vIgst = 0;
      let vCgst = 0;
      let vSgst = 0;

      // Accurate extraction: Use line items if present, else summary totals
      if (v.items && v.items.length > 0) {
        v.items.forEach(i => {
          vTaxable += i.amount * factor;
          vIgst += (i.igstRate ? (i.amount * i.igstRate / 100) : 0) * factor;
          vCgst += (i.cgstRate ? (i.amount * i.cgstRate / 100) : 0) * factor;
          vSgst += (i.sgstRate ? (i.amount * i.sgstRate / 100) : 0) * factor;
        });
      } else {
        vTaxable = (v.subTotal || v.amount) * factor;
        const tax = (v.taxTotal || 0) * factor;
        if (v.supplyType === 'Central') {
          vIgst = tax;
        } else {
          vCgst = tax / 2;
          vSgst = tax / 2;
        }
      }

      if (v.gstClassification === 'Output') {
        // Table 3.1(a) - Standard Taxable Supplies
        summary.table31.a.taxable += vTaxable;
        summary.table31.a.igst += vIgst;
        summary.table31.a.cgst += vCgst;
        summary.table31.a.sgst += vSgst;
      } else if (v.gstClassification === 'Input') {
        // Table 4(A)(5) - All Other ITC
        summary.table4.a5.igst += vIgst;
        summary.table4.a5.cgst += vCgst;
        summary.table4.a5.sgst += vSgst;
      }
    });

    // Net Payable calculation
    summary.netPayable.igst = summary.table31.a.igst - summary.table4.a5.igst;
    summary.netPayable.cgst = summary.table31.a.cgst - summary.table4.a5.cgst;
    summary.netPayable.sgst = summary.table31.a.sgst - summary.table4.a5.sgst;
    summary.netPayable.total = summary.netPayable.igst + summary.netPayable.cgst + summary.netPayable.sgst;

    return summary;
  }, [vouchers, dateRange]);

  const chartData = [
    { name: 'Output IGST', value: reportData.table31.a.igst, fill: '#6366f1' },
    { name: 'Output C+S', value: reportData.table31.a.cgst + reportData.table31.a.sgst, fill: '#818cf8' },
    { name: 'Input IGST', value: reportData.table4.a5.igst, fill: '#10b981' },
    { name: 'Input C+S', value: reportData.table4.a5.cgst + reportData.table4.a5.sgst, fill: '#34d399' }
  ];

  const TableCell = ({ children, isHeader = false, isRight = false, isBold = false }: any) => (
    <td className={`px-8 py-5 border-b border-slate-100 ${isHeader ? 'bg-slate-900 text-slate-400 font-black' : 'text-slate-800'} ${isRight ? 'text-right tabular-nums' : 'text-left'} ${isBold ? 'font-black' : 'font-medium'} text-[11px] uppercase`}>
      {children}
    </td>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
      <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
            <div>
               <div className="flex items-center space-x-6 mb-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl border-4 border-indigo-400/20 transform rotate-3 transition-transform hover:rotate-0">
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">GSTR-3B Statutory Summary</h2>
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-[0.4em] mt-2">Self-Assessment Registry • {activeCompany.name}</p>
                  </div>
               </div>
               
               <div className="flex bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Filing Period Shard</label>
                     <div className="flex items-center space-x-4">
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                        <span className="text-slate-600 font-black text-[9px]">TO</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex items-center space-x-12 bg-white/5 p-10 rounded-[3rem] border border-white/10 backdrop-blur-xl">
               <div className="text-right">
                  <div className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-1 italic">Net Liability for Period</div>
                  <div className={`text-6xl font-black italic tabular-nums ${reportData.netPayable.total >= 0 ? 'text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}>
                    ${Math.abs(reportData.netPayable.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase mt-2">{reportData.netPayable.total >= 0 ? 'CASH PAYMENT REQUIRED' : 'EXCESS CREDIT CARRIED FORWARD'}</div>
               </div>
               <div className="w-px h-16 bg-white/10"></div>
               <div className="flex flex-col space-y-3">
                  <button onClick={() => window.print()} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl">Print Return</button>
                  <button className="px-8 py-3 bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all border border-white/5">Auto-Filing API</button>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[180px] opacity-10 -mr-64 -mt-64 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Table 3.1: Details of Outward Supplies and inward supplies liable to reverse charge */}
            <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">3.1 Outward & Inward Supplies (Reverse Charge)</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Details of taxable value and tax liability</p>
                  </div>
                  <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[9px] font-black uppercase">Statutory View</div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                           <th className="px-10 py-7">Nature of Supplies</th>
                           <th className="px-10 py-7 text-right">Taxable Val ($)</th>
                           <th className="px-10 py-7 text-right">IGST ($)</th>
                           <th className="px-10 py-7 text-right">CGST ($)</th>
                           <th className="px-10 py-7 text-right">SGST ($)</th>
                        </tr>
                     </thead>
                     <tbody>
                        <tr className="hover:bg-slate-50 transition-colors">
                           <TableCell>(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</TableCell>
                           <TableCell isRight isBold>${reportData.table31.a.taxable.toLocaleString()}</TableCell>
                           <TableCell isRight>${reportData.table31.a.igst.toLocaleString()}</TableCell>
                           <TableCell isRight>${reportData.table31.a.cgst.toLocaleString()}</TableCell>
                           <TableCell isRight>${reportData.table31.a.sgst.toLocaleString()}</TableCell>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                           <TableCell>(b) Outward taxable supplies (zero rated)</TableCell>
                           <TableCell isRight isBold>${reportData.table31.b.taxable.toLocaleString()}</TableCell>
                           <TableCell isRight>${reportData.table31.b.igst.toLocaleString()}</TableCell>
                           <TableCell isRight>0.00</TableCell>
                           <TableCell isRight>0.00</TableCell>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                           <TableCell>(c) Other outward supplies (Nil rated, exempted)</TableCell>
                           <TableCell isRight isBold>${reportData.table31.c.taxable.toLocaleString()}</TableCell>
                           <TableCell isRight>0.00</TableCell>
                           <TableCell isRight>0.00</TableCell>
                           <TableCell isRight>0.00</TableCell>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                           <TableCell>(d) Inward supplies (liable to reverse charge)</TableCell>
                           <TableCell isRight isBold>${reportData.table31.d.taxable.toLocaleString()}</TableCell>
                           <TableCell isRight>${reportData.table31.d.igst.toLocaleString()}</TableCell>
                           <TableCell isRight>${reportData.table31.d.cgst.toLocaleString()}</TableCell>
                           <TableCell isRight>${reportData.table31.d.sgst.toLocaleString()}</TableCell>
                        </tr>
                        <tr className="bg-indigo-50/30 font-black">
                           <TableCell isBold>Aggregate Output Liability</TableCell>
                           <TableCell isRight isBold>${(reportData.table31.a.taxable + reportData.table31.b.taxable).toLocaleString()}</TableCell>
                           <TableCell isRight isBold text-indigo-600>${(reportData.table31.a.igst + reportData.table31.b.igst + reportData.table31.d.igst).toLocaleString()}</TableCell>
                           <TableCell isRight isBold>${(reportData.table31.a.cgst + reportData.table31.d.cgst).toLocaleString()}</TableCell>
                           <TableCell isRight isBold>${(reportData.table31.a.sgst + reportData.table31.d.sgst).toLocaleString()}</TableCell>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Table 4: Eligible ITC */}
            <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">4. Eligible ITC Available</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Breakdown of Input Tax Credit components</p>
                  </div>
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[9px] font-black uppercase">Credit Ledger Shard</div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                           <th className="px-10 py-7">Details</th>
                           <th className="px-10 py-7 text-right">Integrated ($)</th>
                           <th className="px-10 py-7 text-right">Central ($)</th>
                           <th className="px-10 py-7 text-right">State ($)</th>
                           <th className="px-10 py-7 text-right">Cess ($)</th>
                        </tr>
                     </thead>
                     <tbody>
                        <tr className="hover:bg-slate-50 transition-colors">
                           <TableCell>(1) Import of goods</TableCell>
                           <TableCell isRight>${reportData.table4.a1.igst.toLocaleString()}</TableCell>
                           <TableCell isRight>0.00</TableCell>
                           <TableCell isRight>0.00</TableCell>
                           <TableCell isRight>0.00</TableCell>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                           <TableCell>(3) Inward supplies liable to reverse charge</TableCell>
                           <TableCell isRight>${reportData.table4.a3.igst.toLocaleString()}</TableCell>
                           <TableCell isRight>${reportData.table4.a3.cgst.toLocaleString()}</TableCell>
                           <TableCell isRight>${reportData.table4.a3.sgst.toLocaleString()}</TableCell>
                           <TableCell isRight>0.00</TableCell>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                           <TableCell>(5) All other ITC</TableCell>
                           <TableCell isRight>${reportData.table4.a5.igst.toLocaleString()}</TableCell>
                           <TableCell isRight>${reportData.table4.a5.cgst.toLocaleString()}</TableCell>
                           <TableCell isRight>${reportData.table4.a5.sgst.toLocaleString()}</TableCell>
                           <TableCell isRight>0.00</TableCell>
                        </tr>
                        <tr className="bg-emerald-50/30 font-black">
                           <TableCell isBold>Total ITC Available</TableCell>
                           <TableCell isRight isBold text-emerald-600>${(reportData.table4.a1.igst + reportData.table4.a3.igst + reportData.table4.a5.igst).toLocaleString()}</TableCell>
                           <TableCell isRight isBold>${(reportData.table4.a3.cgst + reportData.table4.a5.cgst).toLocaleString()}</TableCell>
                           <TableCell isRight isBold>${(reportData.table4.a3.sgst + reportData.table4.a5.sgst).toLocaleString()}</TableCell>
                           <TableCell isRight isBold>0.00</TableCell>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-white rounded-[3.5rem] border border-slate-200 p-10 shadow-sm flex flex-col h-full relative overflow-hidden">
               <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] mb-12 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 mr-3 animate-pulse"></div>
                  Sovereign Flow Analysis
               </h4>
               <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '10px', fontWeight: 900}} />
                        <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                           {chartData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </div>
               <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-50 rounded-full blur-[80px] opacity-20"></div>
            </div>

            <div className="p-10 bg-slate-900 border-4 border-slate-800 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-10 border border-white/10 group-hover:scale-110 transition-transform shadow-2xl shadow-indigo-900/40">🏛️</div>
                  <h4 className="text-xl font-black uppercase italic mb-4">Statutory Reconciliation</h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium mb-10">
                    "GSTR-3B aggregates all ledger shards to determine net cash liability. Integrated Tax (IGST) is prioritized for Input Tax Credit offset as per Section 49."
                  </p>
                  <div className="flex items-center space-x-4">
                     <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] font-black uppercase">Verified Dataset</div>
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32 pointer-events-none"></div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Gstr3BReport;