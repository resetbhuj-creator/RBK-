
import React from 'react';
import { MainMenuType } from '../types';

interface ModulePlaceholderProps {
  type: MainMenuType;
}

const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ type }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-2xl border-2 border-dashed border-slate-200">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{type} Module</h2>
      <p className="text-slate-500 max-w-md">
        This is the primary container for the <span className="font-semibold text-indigo-600">{type}</span> system. 
        Sub-menus and core functionality will be populated here based on your requirements.
      </p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3 group hover:border-indigo-300 transition-all cursor-pointer">
            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-700">Add Sub-Module {i}</div>
              <div className="text-xs text-slate-400">Configure entry point</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModulePlaceholder;
