import React, { useState, useMemo } from 'react';
// Fixed import: ActionItem is not exported from types
import { Ledger, AccountGroup } from '../types';
import LedgerForm from './LedgerForm';
// Imported ActionItem from the correct module
import ActionMenu, { ActionItem } from './ActionMenu';

interface LedgerManagerProps {
  ledgers: Ledger[];
  setLedgers: React.Dispatch<React.SetStateAction<Ledger[]>>;
  accountGroups: AccountGroup[];
  onQuickGroupAdd?: (groupData: Omit<AccountGroup, 'id' | 'isSystem'>) => void;
}

const LedgerManager: React.FC<LedgerManagerProps> = ({ ledgers, setLedgers, accountGroups, onQuickGroupAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredLedgers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return ledgers.filter(l => 
      l.name.toLowerCase().includes(term) || 
      l.group.toLowerCase().includes(term)
    );
  }, [ledgers, searchTerm]);

  const editingLedger = useMemo(() => 
    editingId ? ledgers.find(l => l.id === editingId) : undefined
  , [editingId, ledgers]);

  const handleAddOrEdit = (data: Omit<Ledger, 'id'>) => {
    if (editingId) {
      setLedgers(prev => prev.map(l => l.id === editingId ? { ...data, id: editingId } : l));
    } else {
      // Fixed syntax error: 'new Ledger' should be 'newLedger'
      const newLedger: Ledger = {
        ...data,
        id: `l-${Date.now()}`
      };
      setLedgers(prev => [...prev, newLedger]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Confirm permanent purge of ledger node: ${name}?`)) {
      setLedgers(prev => prev.filter(l => l.id !== id));
    }
  };

  const getActions = (ledger: Ledger): ActionItem[] => [
    { 
      label: 'Edit', 
      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
      onClick: () => { setEditingId(ledger.id); setIsModalOpen(true); },
      variant: 'primary'
    },
    { 
      label: 'Delete', 
      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
      onClick: () => handleDelete(ledger.id, ledger.name),
      variant: 'danger'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black uppercase italic text-slate-800 tracking-tight leading-none">Ledger Registry</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Managing Financial Identity Nodes</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setIsModalOpen(true); }}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all transform active:scale-95 border-b-4 border-indigo-900/40"
        >
          Initialize Ledger
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="relative flex-1 max-w-md group">
            <input 
              type="text" 
              placeholder="Search by name or group..."
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-10 py-3 rounded-2xl border border-slate-200 text-xs font-black shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all placeholder-slate-400 italic" 
            />
            <svg className="w-5 h-5 text-slate-300 absolute left-4 top-2.5 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 p-0.5 text-slate-300 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            {filteredLedgers.length} Accounts in Registry
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-8 py-6">Account Designation</th>
                <th className="px-8 py-6">Group Classification</th>
                <th className="px-8 py-6 text-right">Opening Point</th>
                <th className="px-8 py-6 text-center">Polarity</th>
                <th className="px-8 py-6 text-right">Modular Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {filteredLedgers.map((ledger) => (
                <tr key={ledger.id} className="hover:bg-indigo-50/20 transition-all group border-b border-slate-50 last:border-0">
                  <td className="px-8 py-5">
                    <div className="font-black text-slate-800 italic uppercase tracking-tight text-xs">{ledger.name}</div>
                    <div className="text-[8px] font-bold text-slate-300 uppercase mt-0.5">Hash ID: {ledger.id}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-indigo-100 italic">
                      {ledger.group}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-mono text-sm tabular-nums text-slate-700 font-bold">
                    ${ledger.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                      ledger.type === 'Debit' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-amber-500 text-white border-amber-600'
                    }`}>
                      {ledger.type === 'Debit' ? 'DR' : 'CR'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <ActionMenu actions={getActions(ledger)} label="Configure" />
                  </td>
                </tr>
              ))}
              {filteredLedgers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-32 text-center opacity-30 italic">
                    <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
                      <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero Matching Ledgers</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <LedgerForm 
              initialData={editingLedger}
              accountGroups={accountGroups}
              onCancel={() => { setIsModalOpen(false); setEditingId(null); }}
              onSubmit={handleAddOrEdit}
              onQuickGroupAdd={onQuickGroupAdd}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerManager;