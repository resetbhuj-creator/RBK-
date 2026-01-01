
import React, { useState } from 'react';

interface Company {
  id: string;
  name: string;
  years: string[];
}

interface DeleteCompanyFormProps {
  companies: Company[];
  onCancel: () => void;
  onDelete: (data: any) => void;
}

const DeleteCompanyForm: React.FC<DeleteCompanyFormProps> = ({ companies, onCancel, onDelete }) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [deleteScope, setDeleteScope] = useState<'COMPLETE' | 'YEAR'>('YEAR');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [confirmationText, setConfirmationText] = useState<string>('');
  const [hasBackup, setHasBackup] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  
  // Robust validation: case-insensitive and trimmed
  const isNameMatched = selectedCompany && 
    confirmationText.trim().toLowerCase() === selectedCompany.name.trim().toLowerCase();
  
  const isScopeValid = deleteScope === 'COMPLETE' || (deleteScope === 'YEAR' && selectedYear !== '');

  const isFormValid = 
    selectedCompany && 
    isScopeValid &&
    isNameMatched &&
    hasBackup;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid && !isProcessing) {
      setIsProcessing(true);
      // Simulate network delay for better UX feedback
      setTimeout(() => {
        onDelete({
          companyId: selectedCompanyId,
          scope: deleteScope,
          year: selectedYear,
          companyName: selectedCompany.name
        });
        setIsProcessing(false);
      }, 1500);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-rose-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="px-8 py-6 border-b border-rose-100 flex justify-between items-center bg-rose-50/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Delete Company / Year</h3>
            <p className="text-sm text-rose-500 font-medium tracking-wide uppercase">Security Level: High</p>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-8">
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mb-8 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-rose-800 font-medium">
                Warning: This will permanently remove {deleteScope === 'COMPLETE' ? 'ALL' : 'financial year'} data for the selected entity.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">1. Select Target Company</label>
              <select 
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  setSelectedYear('');
                  setConfirmationText('');
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none transition-all bg-white"
              >
                <option value="">-- Select Company --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {selectedCompanyId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">2. Deletion Scope</label>
                  <select 
                    value={deleteScope}
                    onChange={(e) => setDeleteScope(e.target.value as 'COMPLETE' | 'YEAR')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                  >
                    <option value="YEAR">Specific Financial Year</option>
                    <option value="COMPLETE">Complete Company Profile</option>
                  </select>
                </div>

                {deleteScope === 'YEAR' && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">3. Select Financial Year</label>
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                    >
                      <option value="">-- Choose Year --</option>
                      {selectedCompany?.years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {selectedCompanyId && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    4. Confirm Company Name (Type: <span className="text-rose-600 font-bold">{selectedCompany.name}</span>)
                  </label>
                  <input 
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type name here..."
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${isNameMatched ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-300 focus:ring-2 focus:ring-rose-500'}`}
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={hasBackup}
                      onChange={(e) => setHasBackup(e.target.checked)}
                      className="mt-1 w-5 h-5 text-rose-600 border-slate-300 rounded focus:ring-rose-500 transition-all"
                    />
                    <span className="text-sm text-slate-600 leading-snug group-hover:text-slate-900 transition-colors">
                      I have created a system backup and understand that this data will be <span className="text-rose-600 font-bold">permanently purged</span>.
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Validation Checklist */}
          {selectedCompanyId && (
            <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-bold uppercase tracking-wider">
              <div className={`flex items-center space-x-2 ${selectedCompanyId ? 'text-emerald-600' : 'text-slate-300'}`}>
                <div className={`w-2 h-2 rounded-full ${selectedCompanyId ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>Target Set</span>
              </div>
              <div className={`flex items-center space-x-2 ${isScopeValid ? 'text-emerald-600' : 'text-slate-300'}`}>
                <div className={`w-2 h-2 rounded-full ${isScopeValid ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>Scope Valid</span>
              </div>
              <div className={`flex items-center space-x-2 ${isNameMatched ? 'text-emerald-600' : 'text-slate-300'}`}>
                <div className={`w-2 h-2 rounded-full ${isNameMatched ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>Name Verified</span>
              </div>
              <div className={`flex items-center space-x-2 ${hasBackup ? 'text-emerald-600' : 'text-slate-300'}`}>
                <div className={`w-2 h-2 rounded-full ${hasBackup ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>Backup Ready</span>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
            <button 
              type="button"
              disabled={isProcessing}
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!isFormValid || isProcessing}
              className="px-8 py-2.5 rounded-xl bg-rose-600 text-white font-bold shadow-lg hover:bg-rose-700 hover:shadow-rose-200 transition-all transform active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center min-w-[160px] justify-center"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Purging...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleteScope === 'COMPLETE' ? 'Delete Company' : 'Delete Year Data'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteCompanyForm;
