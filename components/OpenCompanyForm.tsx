
import React, { useState } from 'react';

interface Company {
  id: string;
  name: string;
  country: string;
  state: string;
  lastAccessed?: string;
  logo: string;
  years?: string[];
}

interface OpenCompanyFormProps {
  companies: Company[];
  onCancel: () => void;
  onLoad: (company: Company) => void;
}

const OpenCompanyForm: React.FC<OpenCompanyFormProps> = ({ companies, onCancel, onLoad }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sorting: Most recently accessed first
  const sortedCompanies = [...companies].sort((a, b) => {
    const timeA = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
    const timeB = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
    return timeB - timeA;
  });

  const filteredCompanies = sortedCompanies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCompany = companies.find(c => c.id === selectedId);

  const formatLastAccessed = (isoString?: string) => {
    if (!isoString) return 'Never accessed';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Open Existing Company</h3>
          <p className="text-sm text-slate-500">Recently accessed profiles are shown at the top.</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
          aria-label="Close form"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-8 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search company by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-700 font-medium"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Company Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredCompanies.map((company) => (
            <div 
              key={company.id}
              onClick={() => setSelectedId(company.id)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center space-x-5 group relative ${
                selectedId === company.id 
                  ? 'border-indigo-600 bg-indigo-50 shadow-md ring-1 ring-indigo-600' 
                  : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Logo Container */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shrink-0 overflow-hidden shadow-sm transition-all duration-300 ${
                selectedId === company.id 
                  ? 'bg-indigo-600 ring-4 ring-indigo-100 scale-105' 
                  : 'bg-gradient-to-br from-slate-400 to-slate-500 border border-slate-200'
              }`}>
                {company.logo && company.logo.startsWith('data:image') ? (
                  <div className="w-full h-full bg-white flex items-center justify-center p-1.5">
                    <img src={company.logo} alt={company.name} className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <span className="drop-shadow-sm">{company.logo || company.name.charAt(0)}</span>
                )}
              </div>

              {/* Company Info */}
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold truncate transition-colors ${
                  selectedId === company.id ? 'text-indigo-900' : 'text-slate-800'
                }`}>
                  {company.name}
                </h4>
                <div className="flex items-center text-xs text-slate-500 font-medium space-x-2 mt-0.5">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{company.country}</span>
                  <span className="text-slate-300">•</span>
                  <span className="truncate">{company.state}</span>
                </div>
                <div className="mt-2 flex items-center text-[10px] font-bold uppercase tracking-wider">
                  <div className={`mr-2 h-1.5 w-1.5 rounded-full ${company.lastAccessed ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <span className={company.lastAccessed ? 'text-indigo-600' : 'text-slate-400'}>
                    {company.lastAccessed ? `Accessed: ${formatLastAccessed(company.lastAccessed)}` : 'Initial Setup'}
                  </span>
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedId === company.id && (
                <div className="text-indigo-600 shrink-0 animate-in zoom-in duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          {filteredCompanies.length === 0 && (
            <div className="col-span-2 py-16 text-center text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="italic font-medium">No records matching "{searchTerm}"</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
          <button 
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all focus:ring-2 focus:ring-slate-100 outline-none"
          >
            Cancel
          </button>
          <button 
            disabled={!selectedId}
            onClick={() => selectedCompany && onLoad(selectedCompany)}
            className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all transform active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed min-w-[160px]"
          >
            Load Workspace
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpenCompanyForm;
