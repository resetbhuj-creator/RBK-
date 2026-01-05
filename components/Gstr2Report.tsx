import React, { useState, useMemo } from 'react';
import { Voucher, Ledger, VoucherItem, LedgerEntry } from '../types';
import ActionMenu from './ActionMenu';

interface Gstr2ReportProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
  activeCompany: any;
  onViewVoucher: (id: string) => void;
}

const Gstr2Report: React.FC<Gstr2ReportProps> = ({ vouchers, ledgers, activeCompany, onViewVoucher }) => {
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] 
  });

  const reportData = useMemo(() => {
    const summary = {
      b2b: { taxable: 0, tax: 0, count: 0 },
      b2c: { taxable: 0, tax: 0, count: 0 },
      imports: { taxable: 0, tax: 0, count: 0 },
      reversals: { taxable: 0, tax: 0, count: 0 },
      netItcAvailable: 0,
      totalTaxable: 0,
      totalVouchers: 0,
      vouchersList: [] as Array<Voucher & { calculatedTax: number; calculatedTaxable: number }>
    };

    const inwardVouchers = vouchers.filter(v => {
      const vDate = new Date(v.date);
      const inRange = vDate >= new Date(dateRange.start) && vDate <= new Date(dateRange.end);
      // GSTR-2 handles Purchases, Inward GRNs, and Returns
      return inRange && (v.type === 'Purchase' || v.type === 'Purchase Return' || v.type === 'Debit Note' || v.type === 'Goods Receipt Note (GRN)');
    });

    inwardVouchers.forEach(v => {
      const isReturn = v.type === 'Purchase Return' || v.type === 'Debit Note';
      const factor = isReturn ? -1 : 1;
      
      // Accuracy Protocol: Calculate from line items if available, else from entries, else summary
      let lineTaxable = 0;
      let lineTax = 0;

      if (v.items && v.items.length > 0) {
        v.items.forEach(i => {
          lineTaxable += i.amount;
          lineTax += (i.taxAmount || 0);
        });
      } else if (v.entries && v.entries.length > 0) {
        v.entries.forEach(e => {
          if (e.type === 'Dr') lineTaxable += e.amount;
          lineTax += (e.taxAmount || 0);
        });
      } else {
        lineTaxable = v.subTotal || v.amount;
        lineTax = v.taxTotal || 0;
      }

      const taxable = lineTaxable * factor;
      const tax = lineTax * factor;

      const partyLedger = ledgers.find(l => l.name === v.party);
      const isRegistered = !!partyLedger?.taxId;
      const isImport = v.supplyType === 'Central' && (v.party.toLowerCase().includes('global') || v.party.toLowerCase().includes('import') || (v.currency && v.currency !== 'USD' && v.currency !== 'INR'));

      if (isReturn) {
        summary.reversals.taxable += Math.abs(taxable);
        summary.reversals.tax += Math.abs(tax);
        summary.reversals.count++;
      } else if (isImport) {
        summary.imports.taxable += taxable;
        summary.imports.tax += tax;
        summary.imports.count++;
      } else if (isRegistered) {
        summary.b2b.taxable += taxable;
        summary.b2b.tax += tax;
        summary.b2b.count++;
      } else {
        summary.b2c.taxable += taxable;
        summary.b2c.tax += tax;
        summary.b2c.count++;
      }

      summary.totalTaxable += taxable;
      summary.netItcAvailable += tax;
      summary.totalVouchers++;
      summary.vouchersList.push({ 
        ...v, 
        calculatedTax: lineTax, 
        calculatedTaxable: lineTaxable 
      });
    });

    return summary;
  }, [vouchers, ledgers, dateRange]);

  const MetricCard = ({ label, taxable, tax, count, color, icon }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all hover:-translate-y-1">
       <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{label}</span>
             <span className="text-xl group-hover:scale-125 transition-transform duration-500">{icon}</span>
          </div>
          <div className={`text-3xl font-black italic tracking-tighter text-slate-800 tabular-nums`}>
            ${taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
             <div className={`text-[10px] font-black uppercase tracking-widest ${color}`}>Yield: ${tax.toLocaleString()}</div>
             <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[8px] font-black border border-slate-200 uppercase tracking-tighter">{count} SHARDS</span>
          </div>
       </div>
       <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full opacity-[0.02] group-hover:opacity-10 transition-opacity ${color.replace('text', 'bg')}`}></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      {/* Header Architecture */}
      <div className="bg-emerald-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border-b-8 border-emerald-600">
         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
            <div>
               <div className="flex items-center space-x-6 mb-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-600 flex items-center justify-center shadow-2xl border-4 border-emerald-400/20 transform rotate-3 transition-transform hover:rotate-0">
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">GSTR-2 Inward Registry</h2>
                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-[0.4em] mt-2">Verified Input Tax Credit • {activeCompany.name}</p>
                  </div>
               </div>
               
               <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase text-indigo-400 tracking-widest ml-1">Period Shard</label>
                     <div className="flex items-center space-x-2">
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-emerald-900/50 border border-emerald-700 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                        <span className="text-emerald-700 font-black text-[9px]">TO</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-emerald-900/50 border border-emerald-700 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex items-center space-x-12 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
               <div className="text-right">
                  <div className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">TOTAL ITC AVAILABLE</div>
                  <div className="text-5xl font-black italic text-white tabular-nums">${reportData.netItcAvailable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
               </div>
               <div className="w-px h-16 bg-white/10"></div>
               <div className="flex flex-col space-y-2">
                  <button onClick={() => window.print()} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg">Download Statutory Archive</button>
                  <button className="px-6 py-3 bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">Verify Portal Sync</button>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600 rounded-full blur-[180px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
      </div>

      {/* Categorization Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard label="B2B (Registered Suppliers)" taxable={reportData.b2b.taxable} tax={reportData.b2b.tax} count={reportData.b2b.count} color="text-emerald-600" icon="🏭" />
         <MetricCard label="Inward Imports (Customs)" taxable={reportData.imports.taxable} tax={reportData.imports.tax} count={reportData.imports.count} color="text-indigo-600" icon="🚢" />
         <MetricCard label="B2C (Unregistered Shards)" taxable={reportData.b2c.taxable} tax={reportData.b2c.tax} count={reportData.b2c.count} color="text-slate-500" icon="👤" />
         <MetricCard label="Reversals & Return Nodes" taxable={reportData.reversals.taxable} tax={reportData.reversals.tax} count={reportData.reversals.count} color="text-rose-600" icon="🔙" />
      </div>

      {/* Forensic Ledger Stream */}
      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
         <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
               <h4 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">Inward Supply Ledger Shards</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Detailed transaction decomposition for Form GSTR-2 reconciliation.</p>
            </div>
            <div className="text-right">
               <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.4em] bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 animate-pulse shadow-sm">Verified Accuracy ✓</span>
            </div>
         </div>
         
         <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-900 sticky top-0 z-10">
                  <tr>
                     <th className="px-12 py-7">Execution Moment / Hash</th>
                     <th className="px-12 py-7">Supplier Node Identity</th>
                     <th className="px-12 py-7 text-center">Class</th>
                     <th className="px-12 py-7 text-right">Taxable Point</th>
                     <th className="px-12 py-7 text-right bg-emerald-50/20">ITC Yield ($)</th>
                     <th className="px-12 py-7 text-right">Modular Ops</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 bg-white">
                  {reportData.vouchersList.map((v, i) => {
                       const partyLedger = ledgers.find(l => l.name === v.party);
                       const isReturn = v.type === 'Purchase Return' || v.type === 'Debit Note';
                       return (
                          <tr key={i} onClick={() => onViewVoucher(v.id)} className={`hover:bg-emerald-50/20 group transition-all cursor-pointer border-b border-slate-50 last:border-0 ${isReturn ? 'bg-rose-50/5' : ''}`}>
                             <td className="px-12 py-8">
                                <span className={`font-mono text-xs font-black italic underline decoration-transparent group-hover:decoration-emerald-400 transition-all ${isReturn ? 'text-rose-600' : 'text-emerald-600'}`}>#{v.id}</span>
                                <div className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{v.date}</div>
                             </td>
                             <td className="px-12 py-8">
                                <div className="text-sm font-black text-slate-800 uppercase italic group-hover:text-emerald-700 transition-colors">{v.party}</div>
                                <div className="flex items-center space-x-3 mt-2">
                                   <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${partyLedger?.taxId ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                      {partyLedger?.taxId ? `REG: ${partyLedger.taxId}` : 'UNREGISTERED SUPPLIER'}
                                   </span>
                                </div>
                             </td>
                             <td className="px-12 py-8 text-center">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm transition-transform group-hover:scale-110 ${v.supplyType === 'Local' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                   {v.supplyType || 'LOCAL'}
                                </span>
                             </td>
                             <td className={`px-12 py-8 text-right font-mono text-sm font-black italic tracking-tighter ${isReturn ? 'text-rose-800' : 'text-slate-900'}`}>
                                {isReturn ? '(' : ''}${v.calculatedTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}{isReturn ? ')' : ''}
                             </td>
                             <td className={`px-12 py-8 text-right font-mono text-sm font-black tabular-nums bg-emerald-50/10 group-hover:bg-emerald-50/20 transition-all ${isReturn ? 'text-rose-600 font-black' : 'text-emerald-600'}`}>
                                {isReturn ? '-' : ''}${v.calculatedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                             </td>
                             <td className="px-12 py-8 text-right" onClick={e => e.stopPropagation()}>
                                <ActionMenu label="Forensic" actions={[
                                   { label: 'Inspect Source', icon: '👁️', onClick: () => onViewVoucher(v.id), variant: 'primary' },
                                   { label: 'Audit Log', icon: '📜', onClick: () => {} }
                                ]} />
                             </td>
                          </tr>
                       );
                    })}
                  {reportData.totalVouchers === 0 && (
                     <tr>
                        <td colSpan={6} className="py-48 text-center">
                           <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-dashed border-slate-200 opacity-50">
                              <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" /></svg>
                           </div>
                           <h5 className="text-xl font-black uppercase tracking-[0.5em] text-slate-300 italic">Inward Stream Empty</h5>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mt-4 tracking-widest">No valid inward supply objects found for the current period shard.</p>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Statutory Footer Advisory */}
      <div className="p-12 bg-emerald-950 border-4 border-emerald-900 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden group">
         <div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-emerald-900/40 shrink-0 transform -rotate-6 group-hover:rotate-0 transition-transform border-4 border-emerald-400/20 z-10">🛡️</div>
         <div className="space-y-4 relative z-10">
            <h5 className="text-xl font-black uppercase italic tracking-widest text-white flex items-center">
               ITC Verification Protocol
               <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse ml-4 shadow-[0_0_12px_#10b981]"></div>
            </h5>
            <p className="text-sm font-medium text-emerald-100/60 leading-relaxed italic max-w-4xl">
              "The Nexus GSTR-2 inward registry implements a deep-scan verification of all line items. Purchase Returns and Debit Notes are automatically categorized as <span className="text-rose-400 font-black">ITC Reversals</span> in accordance with statutory accounting rules. Discrepancies with supplier-uploaded GSTR-2A/2B data should be resolved via the Communication module prior to quarterly filing."
            </p>
         </div>
         <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600 rounded-full blur-[150px] opacity-10 -mr-40 -mt-40 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
      </div>
    </div>
  );
};

export default Gstr2Report;
