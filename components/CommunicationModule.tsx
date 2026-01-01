import React, { useState } from 'react';
import { CommunicationSubMenu, Voucher, Ledger } from '../types';
import { COMMUNICATION_SUB_MENUS } from '../constants';
import PrintCenter from './PrintCenter';
import EmailGateway from './EmailGateway';
import SMSGateway from './SMSGateway';

interface CommunicationModuleProps {
  activeCompany: any;
  activeSubAction: CommunicationSubMenu | null;
  setActiveSubAction: (sub: CommunicationSubMenu | null) => void;
  vouchers: Voucher[];
  ledgers: Ledger[];
}

const CommunicationModule: React.FC<CommunicationModuleProps> = ({ 
  activeCompany, activeSubAction, setActiveSubAction, vouchers, ledgers 
}) => {

  const renderContent = () => {
    switch (activeSubAction) {
      case CommunicationSubMenu.PRINT_CENTER:
        return <PrintCenter vouchers={vouchers} activeCompany={activeCompany} />;
      case CommunicationSubMenu.EMAIL_GATEWAY:
        return <EmailGateway vouchers={vouchers} ledgers={ledgers} activeCompany={activeCompany} />;
      case CommunicationSubMenu.SMS_ALERTS:
        return <SMSGateway vouchers={vouchers} ledgers={ledgers} />;
      case CommunicationSubMenu.DISPATCH_LOGS:
        return <DispatchLogs />;
      default:
        return <CommunicationDashboard />;
    }
  };

  const CommunicationDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Delivery Hub</h2>
          <p className="text-slate-500 font-medium">Manage document lifecycle and transactional outreach.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COMMUNICATION_SUB_MENUS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubAction(item.id as CommunicationSubMenu)}
            className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 text-left overflow-hidden"
          >
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-xl`}>
              {item.icon}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase italic">{item.label}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
           <div>
              <div className="inline-block px-3 py-1 bg-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-[0.3em] mb-6">Delivery Engine V2.0</div>
              <h3 className="text-4xl font-black italic tracking-tighter mb-4">Statutory Document Automation</h3>
              <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
                Nexus automates the creation of professional tax-compliant invoices and account statements. Every document sent is logged for regulatory verification.
              </p>
              <div className="flex space-x-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <div className="text-2xl font-black text-indigo-400">12.4k</div>
                    <div className="text-[9px] font-black uppercase text-slate-500">Mails Sent</div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <div className="text-2xl font-black text-emerald-400">99.8%</div>
                    <div className="text-[9px] font-black uppercase text-slate-500">Deliverability</div>
                 </div>
              </div>
           </div>
           <div className="flex justify-center">
              <div className="w-64 h-64 bg-indigo-600/20 rounded-full flex items-center justify-center border border-indigo-500/30 animate-pulse">
                 <svg className="w-32 h-32 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" /></svg>
              </div>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px] -mr-64 -mt-64 opacity-20 group-hover:opacity-30 pointer-events-none"></div>
      </div>
    </div>
  );

  const DispatchLogs = () => (
    <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-500">
       <div className="p-10 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-2xl font-black italic uppercase text-slate-800">Communication Audit Trail</h3>
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400">Total Entries: 0</div>
       </div>
       <div className="p-20 text-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-slate-200">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm italic">Zero dispatch activity found in current FY session.</p>
          <button onClick={() => setActiveSubAction(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transform active:scale-95 transition-all">Back to Dashboard</button>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 min-h-[70vh]">
      {activeSubAction && (
        <button onClick={() => setActiveSubAction(null)} className="flex items-center space-x-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          <span>Return to Communication Dashboard</span>
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default CommunicationModule;