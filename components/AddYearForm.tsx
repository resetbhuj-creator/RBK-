import React, { useState, useMemo } from 'react';

interface AddYearFormProps {
  currentCompany: string;
  existingYears: string[];
  onCancel: () => void;
  onSubmit: (year: string) => void;
}

const AddYearForm: React.FC<AddYearFormProps> = ({ currentCompany, existingYears, onCancel, onSubmit }) => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-04-01`);
  const [endDate, setEndDate] = useState(`${currentYear + 1}-03-31`);
  const [error, setError] = useState<string | null>(null);

  const periodMetrics = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.round(diffDays / 30.44);

    const startY = start.getFullYear();
    const endY = end.getFullYear();
    const label = startY === endY ? `${startY}` : `${startY} - ${endY}`;

    return {
      days: diffDays,
      months: months,
      label: label,
      isInvalid: diffDays <= 0,
      isStandard: months === 12
    };
  }, [startDate, endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!periodMetrics || periodMetrics.isInvalid) {
      setError("Chronological Conflict: The financial cycle end date must be strictly after the start date.");
      return;
    }

    if (existingYears.includes(periodMetrics.label)) {
      setError(`Duplicate Entry: The cycle "${periodMetrics.label}" is already registered in the company registry.`);
      return;
    }

    onSubmit(periodMetrics.label);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-w-2xl mx-auto">
      <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Add Financial Cycle</h3>
            <p className="text-sm text-slate-500 font-medium">Provisioning new period for <span className="text-indigo-600 font-bold">{currentCompany}</span></p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        {error && (
          <div className="p-5 bg-rose-50 border-l-4 border-rose-500 flex items-center space-x-4 animate-in fade-in slide-in-from-top-2">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            </div>
            <span className="text-sm text-rose-800 font-bold leading-snug">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Period Opening Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold text-slate-700 bg-slate-50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Period Closing Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold text-slate-700 bg-slate-50 transition-all"
            />
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-2">Cycle Preview</div>
              <div className="text-3xl font-black tracking-tighter">
                {periodMetrics?.label || '---- - ----'}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 border-2 ${
                periodMetrics?.isStandard ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${periodMetrics?.isStandard ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></div>
                <span>{periodMetrics?.months} Months Duration</span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32 transition-opacity group-hover:opacity-30"></div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform active:scale-95 flex items-center justify-center space-x-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            <span>Initialize Cycle</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddYearForm;