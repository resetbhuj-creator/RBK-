import React, { useState, useRef, useEffect } from 'react';
import { Voucher } from '../types';
import PrintLayout from './PrintLayout';

interface VoucherModalProps {
  voucher: Voucher;
  activeCompany: any;
  onClose: () => void;
}

const VoucherModal: React.FC<VoucherModalProps> = ({ voucher, activeCompany, onClose }) => {
  const [scale, setScale] = useState(0.8);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handlePrint = () => {
    const printContent = document.getElementById('printable-area');
    const win = window.open('', '', 'height=1000,width=1000');
    if (win && printContent) {
      win.document.write('<html><head><title>Print Voucher ' + voucher.id + '</title>');
      win.document.write('<script src="https://cdn.tailwindcss.com"></script>');
      win.document.write('</head><body >');
      win.document.write(printContent.innerHTML);
      win.document.write('</body></html>');
      win.document.close();
      setTimeout(() => { win.print(); win.close(); }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300 p-4 md:p-8">
      <div className="w-full max-w-7xl h-full flex flex-col bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-800 ring-1 ring-white/10">
        
        {/* Modal Toolbar */}
        <div className="px-10 py-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
           <div className="flex items-center space-x-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                 <h3 className="text-xl font-black uppercase italic text-white tracking-tight leading-none">Document Viewer</h3>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-2">Registry ID: {voucher.id}</p>
              </div>
           </div>

           <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-slate-800 p-1.5 rounded-2xl border border-slate-700 mr-4">
                 <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-2 hover:bg-slate-700 text-slate-400 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg></button>
                 <span className="px-4 text-[10px] font-black text-white tabular-nums">{Math.round(scale * 100)}%</span>
                 <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 hover:bg-slate-700 text-slate-400 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
              </div>
              
              <button onClick={handlePrint} className="flex items-center space-x-3 px-6 py-3 bg-white text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all transform active:scale-95 shadow-xl">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 <span>Print Document</span>
              </button>
              
              <button onClick={onClose} className="p-3 bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-600 rounded-2xl transition-all border border-slate-700 ml-4">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
        </div>

        {/* Content Viewport */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-slate-100/50 p-16 flex flex-col items-center custom-scrollbar scroll-smooth">
           <div id="printable-area" className="transition-transform duration-300 ease-out origin-top">
              <PrintLayout voucher={voucher} activeCompany={activeCompany} scale={scale} />
           </div>
           {/* Space for bottom shadow overflow */}
           <div className="h-32 shrink-0"></div>
        </div>

        {/* Status Bar */}
        <div className="px-10 py-4 bg-white border-t border-slate-200 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">
           <div className="flex items-center space-x-6">
              <span>Class: {voucher.type}</span>
              <span className="w-px h-3 bg-slate-200"></span>
              <span>Context: {voucher.supplyType || 'N/A'}</span>
              <span className="w-px h-3 bg-slate-200"></span>
              <span>Integrity: VERIFIED</span>
           </div>
           <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Secured Nexus Stream</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherModal;