import React, { useState } from 'react';

const PreferenceCenter: React.FC = () => {
  const [prefs, setPrefs] = useState({
    autoSave: true,
    mfaRequired: false,
    verboseLogs: true,
    compactView: false,
    highContrast: true
  });

  const toggle = (key: keyof typeof prefs) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-10 border-b border-slate-100 bg-indigo-50/20">
            <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tight">System Environment Flags</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Configure global operational behavior across the organization.</p>
         </div>
         
         <div className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {[
                 { id: 'autoSave', label: 'In-Flight Persistence', desc: 'Automatically draft unsaved vouchers every 30s.', icon: '💾' },
                 { id: 'mfaRequired', label: 'Elevated Authentication', desc: 'Enforce MFA for all user roles during login.', icon: '🔐' },
                 { id: 'verboseLogs', label: 'Granular Telemetry', desc: 'Capture detailed field-level modification audits.', icon: '📜' },
                 { id: 'compactView', label: 'Efficiency Layout', desc: 'Reduce whitespace in transactional registries.', icon: '⚡' }
               ].map(item => (
                 <div key={item.id} className="flex items-start justify-between p-6 rounded-3xl border border-slate-100 bg-slate-50/50 group transition-all hover:bg-white hover:border-indigo-100 hover:shadow-lg">
                    <div className="flex items-start space-x-4">
                       <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">{item.icon}</div>
                       <div>
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.label}</h4>
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-[200px] mt-1">{item.desc}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => toggle(item.id as any)}
                      className={`w-14 h-8 rounded-full relative transition-all shadow-md mt-1 ${prefs[item.id as keyof typeof prefs] ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                       <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${prefs[item.id as keyof typeof prefs] ? 'right-1' : 'left-1'}`}></div>
                    </button>
                 </div>
               ))}
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-end space-x-4">
               <button className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Discard Toggles</button>
               <button className="px-12 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95">Commit Global State</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PreferenceCenter;