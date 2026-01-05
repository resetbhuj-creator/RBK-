import React, { useState, useMemo } from 'react';
import { Voucher, Ledger, VoucherItem } from '../types';
import ActionMenu from './ActionMenu';

interface Gstr1ReportProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
  activeCompany: any;
  onViewVoucher: (id: string) => void;
}

type Gstr1Section = 'B2B' | 'B2CL' | 'B2CS' | 'EXPORTS' | 'EXEMPT' | 'HSN';

// Added HsnSummaryEntry interface to define the structure of HSN report rows
interface HsnSummaryEntry {
  hsn: string;
  desc: string;
  uom: string;
  qty: number;
  taxable: number;
  tax: number;
}

const Gstr1Report: React.FC<Gstr1ReportProps> = ({ vouchers, ledgers, activeCompany, onViewVoucher }) => {
  const [activeSection, setActiveSection] = useState<Gstr1Section>('B2B');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] 
  });

  const reportData = useMemo(() => {
    const summary = {
      b2b: [] as Voucher[],
      b2cl: [] as Voucher[], // B2C Large: Unregistered, Central, > 2.5L
      b2cs: [] as Voucher[], // B2C Small: Unregistered, Other
      exports: [] as Voucher[],
      exempt: [] as Voucher[], // Nil rated or Exempt
      // Explicitly typed the hsn record with the HsnSummaryEntry interface
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
      return inRange && (v.type === 'Sales' || v.type === 'Sales Return');
    });

    salesVouchers.forEach(v => {
      const isReturn = v.type === 'Sales Return';
      const factor = isReturn ? -1 : 1;
      const partyLedger = ledgers.find(l => l.name === v.party);
      const gstId = partyLedger?.taxId;
      
      const taxable = (v.subTotal || v.amount) * factor;
      const tax = (v.taxTotal || 0) * factor;

      // HSN Aggregation
      v.items?.forEach(item => {
        const hsnCode = item.hsn || 'N/A';
        if (!summary.hsn[hsnCode]) {
          summary.hsn[hsnCode] = { hsn: hsnCode, desc: item.name, uom: item.unit || 'Nos', qty: 0, taxable: 0, tax: 0 };
        }
        summary.hsn[hsnCode].qty += item.qty * factor;
        summary.hsn[hsnCode].taxable += item.amount * factor;
        summary.hsn[hsnCode].tax += (item.taxAmount || 0) * factor;

        // Exempt detection
        if (item.igstRate === 0) {
          if (!summary.exempt.includes(v)) summary.exempt.push(v);
        }
      });

      // Categorization
      if (v.party.toLowerCase().includes('export') || (v.supplyType === 'Central' && !gstId && v.party.toLowerCase().includes('global'))) {
        summary.exports.push(v);
      } else if (gstId) {
        summary.b2b.push(v);
      } else {
        // B2C Logic
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
              {/* Cast Object.values to HsnSummaryEntry[] to resolve unknown type access errors on lines 122-126 */}
              {(Object.values(reportData.hsn) as HsnSummaryEntry[]).map((row, i) => (
                <tr key={i} className="hover:bg-indigo-50/20 transition-all border-b border-slate-50 last:border-0">
                  <td className="px-10 py-6 font-mono text-xs font-black text-indigo-600">{row.hsn}</td>
                  <td className="px-10 py-6 text-xs font-black text-slate-800 uppercase italic">{row.desc}</td>
                  <td className="px-10 py-6 text-center text-[10px] font-bold text-slate-400">{row.qty} {row.uom}</td>
                  <td className="px-10 py-6 text-right font-black tabular-nums italic text-slate-900">${row.taxable.toLocaleString()}</td>
                  <td className="px-10 py-6 text-right font-black tabular-nums text-indigo-600">${row.tax.toLocaleString()}</td>
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
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-10 py-6">Vch ID / Date</th>
              <th className="px-10 py-6">Counterparty</th>
              <th className="px-10 py-6 text-center">Supply</th>
              <th className="px-10 py-6 text-right">Taxable</th>
              <th className="px-10 py-6 text-right">Tax</th>
              <th className="px-10 py-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {list.map((v, i) => (
              <tr key={i} onClick={() => onViewVoucher(v.id)} className="hover:bg-indigo-50/20 transition-all cursor-pointer border-b border-slate-50 last:border-0 group">
                <td className="px-10 py-6">
                  <div className="font-mono text-xs font-black text-indigo-600">#{v.id}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">{v.date}</div>
                </td>
                <td className="px-10 py-6">
                  <div className="text-sm font-black text-slate-800 uppercase italic group-hover:text-indigo-600 transition-colors">{v.party}</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">{ledgers.find(l => l.name === v.party)?.taxId || 'UNREGISTERED'}</div>
                </td>
                <td className="px-10 py-6 text-center">
                  <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${v.supplyType === 'Local' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{v.supplyType}</span>
                </td>
                <td className="px-10 py-6 text-right font-black tabular-nums italic text-slate-900">${(v.subTotal || v.amount).toLocaleString()}</td>
                <td className="px-10 py-6 text-right font-black tabular-nums text-indigo-600">${(v.taxTotal || 0).toLocaleString()}</td>
                <td className="px-10 py-6 text-right" onClick={e => e.stopPropagation()}>
                  <ActionMenu label="Forensic" actions={[{ label: 'Inspect', icon: '👁️', onClick: () => onViewVoucher(v.id), variant: 'primary' }]} />
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="py-32 text-center opacity-30 italic font-black uppercase text-[10px] tracking-widest">Buffer Empty for this Shard</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
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
               <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-xl transition-all font-black text-[10px] uppercase tracking-widest">Execute Re-sync</button>
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
                {stat.isValue !== false ? `$${stat.value.toLocaleString()}` : stat.value}
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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

      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col animate-in slide-in-from-bottom-2 duration-500">
         {renderActiveTable()}
      </div>

      <div className="p-12 bg-slate-900 border-4 border-slate-800 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden group">
         <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-indigo-900/40 shrink-0 transform -rotate-6 transition-transform group-hover:rotate-0 border-4 border-indigo-400/20 z-10">🏛️</div>
         <div className="space-y-4 relative z-10">
            <h5 className="text-xl font-black uppercase italic tracking-widest text-white flex items-center">
              Statutory Reconstruction Protocol
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse ml-4 shadow-[0_0_12px_#10b981]"></div>
            </h5>
            <p className="text-sm font-medium text-slate-400 leading-relaxed italic max-w-4xl">
              "The GSTR-1 engine performs high-fidelity partitioning of your sales stream based on counterparty registration flags. B2C Large categorization is strictly enforced for inter-state supplies exceeding <span className="text-white font-black">$2,500</span> (normalized benchmark) to ensure alignment with Form GSTR-1 Tables 5A & 5B."
            </p>
         </div>
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-40 -mt-40 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
      </div>
    </div>
  );
};

export default Gstr1Report;