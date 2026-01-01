
import React, { useState, useEffect } from 'react';

interface SplitYearFormProps {
  currentCompany: string;
  onCancel: () => void;
  onConfirm: (data: any) => void;
}

const SplitYearForm: React.FC<SplitYearFormProps> = ({ currentCompany, onCancel, onConfirm }) => {
  const [formData, setFormData] = useState({
    archiveDate: '2024-03-31',
    newYearStartDate: '2024-04-01',
    newYearEndDate: '2025-03-31',
    confirmArchive: false,
    backupBeforeSplit: true,
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Clear errors when dates change and perform live validation
  useEffect(() => {
    const archive = new Date(formData.archiveDate);
    const nextStart = new Date(formData.newYearStartDate);
    const nextEnd = new Date(formData.newYearEndDate);
    
    const newErrors: { [key: string]: string } = {};
    
    if (nextStart <= archive) {
      newErrors.newYearStartDate = "Start date must be after archive date.";
    }
    
    if (nextEnd <= nextStart) {
      newErrors.newYearEndDate = "End date must be after start date.";
    }

    setFieldErrors(newErrors);
    setGlobalError(null);
  }, [formData.archiveDate, formData.newYearStartDate, formData.newYearEndDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    const archive = new Date(formData.archiveDate);
    const nextStart = new Date(formData.newYearStartDate);

    // Final chronological check
    if (nextStart <= archive) {
      setGlobalError("Chronological Violation: The New Year cannot start on or before the current period ends.");
      return;
    }

    if (!formData.confirmArchive) {
      setGlobalError("Please check the confirmation box to proceed.");
      return;
    }
    
    if (Object.keys(fieldErrors).length > 0) {
      setGlobalError("Please resolve the highlighted date conflicts.");
      return;
    }
    
    onConfirm(formData);
  };

  const inputBaseClass = "w-full px-4 py-2 rounded-lg border outline-none transition-all";
  const errorClass = "border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/30";
  const normalClass = "border-slate-300 focus:ring-2 focus:ring-amber-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-amber-50/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Split Financial Year</h3>
            <p className="text-sm text-slate-500">{currentCompany}</p>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-8">
        {globalError ? (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mb-8 flex items-center animate-in slide-in-from-top-2">
            <svg className="h-5 w-5 text-rose-500 mr-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-rose-800 font-bold">{globalError}</p>
          </div>
        ) : (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700 font-medium">
                  Caution: This process will archive all current transactions up to the archive date and initialize a fresh set of books for the new period.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                <span>Archive Current Year End</span>
              </label>
              <input 
                type="date"
                value={formData.archiveDate}
                onChange={(e) => setFormData({...formData, archiveDate: e.target.value})}
                className={`${inputBaseClass} ${fieldErrors.newYearStartDate ? 'border-amber-300' : normalClass}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                <span>New Year Start Date</span>
                {fieldErrors.newYearStartDate && <span className="text-rose-500 text-xs font-normal animate-pulse">{fieldErrors.newYearStartDate}</span>}
              </label>
              <input 
                type="date"
                value={formData.newYearStartDate}
                onChange={(e) => setFormData({...formData, newYearStartDate: e.target.value})}
                className={`${inputBaseClass} ${fieldErrors.newYearStartDate ? errorClass : normalClass}`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              <span>New Year Closing Date (Target)</span>
              {fieldErrors.newYearEndDate && <span className="text-rose-500 text-xs font-normal">{fieldErrors.newYearEndDate}</span>}
            </label>
            <input 
              type="date"
              value={formData.newYearEndDate}
              onChange={(e) => setFormData({...formData, newYearEndDate: e.target.value})}
              className={`${inputBaseClass} ${fieldErrors.newYearEndDate ? errorClass : normalClass}`}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.backupBeforeSplit}
                onChange={(e) => setFormData({...formData, backupBeforeSplit: e.target.checked})}
                className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600">
                Create a full system backup before performing the split (Recommended)
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input 
                required
                type="checkbox" 
                checked={formData.confirmArchive}
                onChange={(e) => setFormData({...formData, confirmArchive: e.target.checked})}
                className="mt-1 w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
              />
              <span className="text-sm text-slate-800 font-medium">
                I understand that this action is irreversible and will create a new financial database.
              </span>
            </label>
          </div>

          <div className="pt-6 flex justify-end space-x-4">
            <button 
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={Object.keys(fieldErrors).length > 0}
              className="px-8 py-2.5 rounded-xl bg-amber-600 text-white font-bold shadow-lg hover:bg-amber-700 hover:shadow-amber-200 transition-all transform active:scale-95 flex items-center disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Execute Year Split
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SplitYearForm;
