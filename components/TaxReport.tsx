import React, { useMemo } from 'react';
import { Voucher } from '../types';

interface TaxReportProps {
  vouchers: Voucher[];
}

const TaxReport: React.FC<TaxReportProps> = ({ vouchers }) => {
  const data = useMemo(() => {
    let outputLocal = 0; // CGST+SGST
    let outputCentral = 0; // IGST
    let inputLocal = 0;
    let inputCentral = 0;
    
    vouchers.forEach(v => {
      const tax = v.taxTotal || 0;
      // Reverse logic for returns: Sales return reduces output, Purchase return reduces input
      if (v.gstClassification === 'Output') {
        const factor = v.type === 'Sales Return' ? -1 : 1;
        if (v.supplyType === 'Local') outputLocal += (tax * factor);
        else outputCentral += (tax * factor);
      } else {
        const factor = v.type === 'Purchase Return' ? -1 : 1;
        if (v.supplyType === 'Local') inputLocal += (tax * factor);
        else inputCentral += (tax * factor);
      }
    });

    const totalOutput = outputLocal + outputCentral;
    const totalInput = inputLocal + inputCentral;
    const netPayable = totalOutput - totalInput;

    return { outputLocal, outputCentral, inputLocal, inputCentral, totalOutput, totalInput, netPayable };
  }, [vouchers]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Payability Status */}
      <div className={`p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 border-b-8 ${data.netPayable >= 0 ? 'bg-indigo-600 border-indigo-900' : 'bg-emerald-600 border-emerald-900'}`}>
         <div className="relative z-10 space-y-4">
            <div className="inline-block px-4 py-1.5 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-md">Consolidated Liability Registry</div>
            <h3 className="text-5xl font-black italic tracking-tighter leading-none">
              {data.netPayable >= 0 ? 'Tax Payable' : 'Tax Refundable'}
            </h3>
            <p className="text-sm font-medium opacity-70 max-w-xs">Calculated based on Input Tax Credit (ITC) vs. Output Tax Liability.</p>
         </div>
         <div className="relative z-10 text-center md:text-right">
            <div className="text-8xl font-black tracking-tighter drop-shadow-2xl tabular-nums">${Math.abs(data.netPayable).toLocaleString()}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mt-4 italic">Settlement Period: Current FY Session</div>
         </div>
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-[150px] opacity-10 -mr-64 -mt-64"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Outward Supply (Output Tax) */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10 space-y-8">
           <div className="flex items-center space-x-4 border-b border-slate-50 pb-6">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner">📤</div>
              <div>
                 <h4 className="text-lg font-black uppercase italic tracking-tight text-slate-800">Output GST Liability</h4>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tax Collected on Sales (Net of Returns)</p>
              </div>
           </div>
           <div className="space-y-6">
              <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Local Supply (CGST+SGST)</span>
                 <span className="text-xl font-black text-slate-900">${data.outputLocal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Central Supply (IGST)</span>
                 <span className="text-xl font-black text-slate-900">${data.outputCentral.toLocaleString()}</span>
              </div>
              <div className="pt-4 flex justify-between items-center px-4">
                 <span className="text-sm font-black uppercase text-rose-600 italic tracking-widest">Total Liability</span>
                 <span className="text-2xl font-black text-slate-900">${data.totalOutput.toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* Inward Supply (Input Tax Credit) */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10 space-y-8">
           <div className="flex items-center space-x-4 border-b border-slate-50 pb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner">📥</div>
              <div>
                 <h4 className="text-lg font-black uppercase italic tracking-tight text-slate-800">Input Tax Credit (ITC)</h4>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tax Paid on Purchases (Net of Returns)</p>
              </div>
           </div>
           <div className="space-y-6">
              <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Local Inward (CGST+SGST)</span>
                 <span className="text-xl font-black text-slate-900">${data.inputLocal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Central Inward (IGST)</span>
                 <span className="text-xl font-black text-slate-900">${data.inputCentral.toLocaleString()}</span>
              </div>
              <div className="pt-4 flex justify-between items-center px-4">
                 <span className="text-sm font-black uppercase text-emerald-600 italic tracking-widest">Total ITC Claimable</span>
                 <span className="text-2xl font-black text-slate-900">${data.totalInput.toLocaleString()}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Compliance Advisory */}
      <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-200 flex flex-col md:flex-row items-center gap-10">
         <div className="w-16 h-16 bg-amber-200 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-amber-900/10 shrink-0">🏛️</div>
         <div className="space-y-2">
            <h5 className="text-sm font-black uppercase tracking-[0.2em] text-amber-900">Regulatory Advisory Node</h5>
            <p className="text-xs font-medium text-amber-800 leading-relaxed italic">
              Nexus has automatically integrated Credit/Debit notes into your statutory liability cluster. Please ensure that all returns have valid Source Document Reference mapping to maintain high-fidelity audit parity.
            </p>
         </div>
      </div>
    </div>
  );
};

export default TaxReport;