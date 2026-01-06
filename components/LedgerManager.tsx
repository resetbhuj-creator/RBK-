import React, { useState, useMemo } from 'react';
import { Ledger, AccountGroup, AuditLog } from '../types';
import LedgerForm from './LedgerForm';
import GroupForm from './GroupForm';
import ActionMenu, { ActionItem } from './ActionMenu';

interface LedgerManagerProps {
  ledgers: Ledger[];
  setLedgers: React.Dispatch<React.SetStateAction<Ledger[]>>;
  accountGroups: AccountGroup[];
  setAccountGroups: React.Dispatch<React.SetStateAction<AccountGroup[]>>;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp' | 'actor'>) => void;
}

const LedgerManager: React.FC<LedgerManagerProps> = ({ 
  ledgers, setLedgers, accountGroups, setAccountGroups, addAuditLog 
}) => {
  const [activeTab, setActiveTab] = useState<'LEDGERS' | 'GROUPS'>('LEDGERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'LEDGERS') {
      return ledgers.filter(l => l.name.toLowerCase().includes(term) || l.group.toLowerCase().includes(term));
    } else {
      return accountGroups.filter(g => g.name.toLowerCase().includes(term) || g.nature.toLowerCase().includes(term));
    }
  }, [ledgers, accountGroups, searchTerm, activeTab]);

  const handleAddOrEdit = (data: any) => {
    if (activeTab === 'LEDGERS') {
      if (editingId) {
        setLedgers(prev => prev.map(l => l.id === editingId ? { ...data, id: editingId } : l));
        addAuditLog({ action: 'UPDATE', entityType: 'LEDGER', entityName: data.name, details: 'Modified financial ledger shard.' });
      } else {
        const id = `l-${Date.now()}`;
        setLedgers(prev => [...prev, { ...data, id }]);
        addAuditLog({ action: 'CREATE', entityType: 'LEDGER', entityName: data.name, details: 'Initialized new ledger node.' });
      }
    } else {
      if (editingId) {
        setAccountGroups(prev => prev.map(g => g.id === editingId ? { ...data, id: editingId } : g));
        addAuditLog({ action: 'UPDATE', entityType: 'GROUP', entityName: data.name, details: 'Modified account cluster blueprint.' });
      } else {
        const id = `ag-${Date.now()}`;
        setAccountGroups(prev => [...prev, { ...data, id, isSystem: false }]);
        addAuditLog({ action: 'CREATE', entityType: 'GROUP', entityName: data.name, details: 'Created new account cluster classification.' });
      }
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const getActions = (row: any): ActionItem[] => [
    { label: 'Modify Shard', icon: '✏️', onClick: () => { setEditingId(row.id); setIsModalOpen(true); }, variant: 'primary' },
    ...(!row.isSystem ? [{ label: 'Purge Identity', icon: '🗑️', onClick: () => {}, variant: 'danger' as const }] : [])
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] border border-slate-200 max-w-md mx-auto shadow-inner">
         {(['LEDGERS', 'GROUPS'] as const).map(t => (
           <button 
            key={t} 
            onClick={() => { setActiveTab(t); setSearchTerm(''); }}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800'}`}
           >
             {t === 'LEDGERS' ? 'Ledger Registry' : 'Account Groups'}
           </button>
         ))}
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={`Query ${activeTab.toLowerCase()} registry...`} className="w-full max-w-md pl-12 pr-6 py-4 rounded-3xl border border-slate-200 text-xs font-black shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all italic bg-white" />
           <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="px-8 py-4 bg-slate-950 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-8 border-black/40">Register {activeTab.slice(0, -1)}</button>
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar">
           <table className="w-full text-left">
              <thead className="bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-500">
                 <tr>
                    <th className="px-10 py-7">Shard Identification</th>
                    <th className="px-10 py-7">Primary Classification</th>
                    <th className="px-10 py-7 text-right">Resolved Value ($)</th>
                    <th className="px-10 py-7 text-right">Operations</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredData.map((row: any) => (
                   <tr key={row.id} className="hover:bg-indigo-50/20 transition-all group">
                      <td className="px-10 py-6">
                         <div className="text-sm font-black text-slate-800 italic uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">{row.name}</div>
                         <div className="text-[9px] font-bold text-slate-300 uppercase mt-1">Hash: {row.id}</div>
                      </td>
                      <td className="px-10 py-6">
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${row.isSystem ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm'}`}>
                            {row.group || row.nature || 'SYSTEM'}
                         </span>
                      </td>
                      <td className="px-10 py-6 text-right font-black text-slate-900 tabular-nums text-lg italic">
                         ${(row.openingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-10 py-6 text-right">
                         <ActionMenu actions={getActions(row)} label="Modify Shard" />
                      </td>
                   </tr>
                 ))}
                 {filteredData.length === 0 && (
                   <tr><td colSpan={4} className="py-40 text-center text-slate-300 italic uppercase font-black tracking-widest">No matching shards detected in current partition.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl rounded-[3.5rem]">
              {activeTab === 'LEDGERS' ? (
                <LedgerForm 
                  initialData={ledgers.find(l => l.id === editingId)} 
                  accountGroups={accountGroups} 
                  onCancel={() => setIsModalOpen(false)} 
                  onSubmit={handleAddOrEdit} 
                />
              ) : (
                <GroupForm 
                  initialData={accountGroups.find(g => g.id === editingId)} 
                  onCancel={() => setIsModalOpen(false)} 
                  onSubmit={handleAddOrEdit} 
                />
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default LedgerManager;
