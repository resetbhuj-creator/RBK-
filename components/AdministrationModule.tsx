import React, { useState, useMemo } from 'react';
import { ADMINISTRATION_SUB_MENUS } from '../constants';
import { AdminSubMenu, User, Role, AccountGroup, Tax, TaxGroup, Ledger, Item, AuditLog, Voucher } from '../types';
import LedgerForm from './LedgerForm';
import UsersModule from './UsersModule';
import BackupModule from './BackupModule';
import ImportExportModule from './ImportExportModule';
import YearChangeModule from './YearChangeModule';
import GroupForm from './GroupForm';
import ItemForm from './ItemForm';
import TaxForm from './TaxForm';
import TaxGroupForm from './TaxGroupForm';
import ActionMenu, { ActionItem } from './ActionMenu';

interface AdministrationModuleProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp' | 'actor'>) => void;
  activeCompany: any;
  currentFY: string;
  activeSubAction: AdminSubMenu | null;
  setActiveSubAction: (sub: AdminSubMenu | null) => void;
  setCurrentFY: (fy: string, isLocked?: boolean) => void;
  ledgers: Ledger[];
  setLedgers: React.Dispatch<React.SetStateAction<Ledger[]>>;
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  taxes: Tax[];
  setTaxes: React.Dispatch<React.SetStateAction<Tax[]>>;
  taxGroups: TaxGroup[];
  setTaxGroups: React.Dispatch<React.SetStateAction<TaxGroup[]>>;
  vouchers: Voucher[];
  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;
}

const AdministrationModule: React.FC<AdministrationModuleProps> = ({ 
  users, setUsers, roles, setRoles, auditLogs, addAuditLog, activeCompany, currentFY, 
  activeSubAction, setActiveSubAction, setCurrentFY, ledgers, setLedgers, items, setItems,
  taxes, setTaxes, taxGroups, setTaxGroups, vouchers, setVouchers
}) => {
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([
    { id: 'ag1', name: 'Bank Accounts', nature: 'Assets', isSystem: true },
    { id: 'ag2', name: 'Cash-in-hand', nature: 'Assets', isSystem: true },
    { id: 'ag3', name: 'Indirect Expenses', nature: 'Expenses', isSystem: true },
    { id: 'ag4', name: 'Sundry Debtors', nature: 'Assets', isSystem: true },
    { id: 'ag5', name: 'Sundry Creditors', nature: 'Liabilities', isSystem: true }
  ]);

  const MastersManagementView = () => {
    const [activeTab, setActiveTab] = useState<'LEDGERS' | 'GROUPS' | 'ITEMS' | 'TAX_CONFIGS' | 'TAX_GROUPS'>('LEDGERS');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const filteredData = useMemo(() => {
      let data: any[] = [];
      if (activeTab === 'LEDGERS') data = ledgers;
      else if (activeTab === 'ITEMS') data = items;
      else if (activeTab === 'GROUPS') data = accountGroups;
      else if (activeTab === 'TAX_CONFIGS') data = taxes;
      else if (activeTab === 'TAX_GROUPS') data = taxGroups;
      
      return data.filter(x => x.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activeTab, ledgers, items, accountGroups, taxes, taxGroups, searchTerm]);

    const editingRecord = useMemo(() => {
        if (!editingId) return undefined;
        if (activeTab === 'TAX_CONFIGS') return taxes.find(t => t.id === editingId);
        if (activeTab === 'TAX_GROUPS') return taxGroups.find(tg => tg.id === editingId);
        if (activeTab === 'LEDGERS') return ledgers.find(l => l.id === editingId);
        if (activeTab === 'ITEMS') return items.find(i => i.id === editingId);
        return undefined;
    }, [editingId, activeTab, taxes, taxGroups, ledgers, items]);

    const getRowActions = (row: any): ActionItem[] => {
      return [
        { 
          label: 'Edit', 
          icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
          onClick: () => { setEditingId(row.id); setIsModalOpen(true); },
          variant: 'primary'
        },
        { 
          label: 'Delete', 
          icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
          onClick: () => { 
            if(confirm(`Purge record for ${row.name}?`)) {
                if (activeTab === 'TAX_CONFIGS') setTaxes(prev => prev.filter(t => t.id !== row.id));
                else if (activeTab === 'TAX_GROUPS') setTaxGroups(prev => prev.filter(tg => tg.id !== row.id));
                else if (activeTab === 'LEDGERS') setLedgers(prev => prev.filter(l => l.id !== row.id));
                else if (activeTab === 'ITEMS') setItems(prev => prev.filter(i => i.id !== row.id));
            }
          },
          variant: 'danger'
        }
      ];
    };

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black uppercase italic text-slate-800 tracking-tight">Master Registries</h2>
          <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">
            Add {activeTab.split('_')[0].slice(0, -1)}
          </button>
        </div>

        <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'LEDGERS', label: 'Ledgers' },
            { id: 'GROUPS', label: 'Groups' },
            { id: 'ITEMS', label: 'Catalogue' },
            { id: 'TAX_CONFIGS', label: 'Taxes' },
            { id: 'TAX_GROUPS', label: 'Tax Groups' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as any); setEditingId(null); }} 
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-xl border-b-2 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="relative flex-1 max-w-xs">
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab.toLowerCase()}...`} 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-8 pr-4 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-500/20" 
                />
                <svg className="w-3.5 h-3.5 text-slate-300 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{filteredData.length} entries</div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                 <tr>
                    <th className="px-6 py-3">Identity / Designation</th>
                    <th className="px-6 py-3">Classification</th>
                    {activeTab === 'TAX_CONFIGS' && <th className="px-6 py-3">Rate</th>}
                    {activeTab === 'TAX_GROUPS' && <th className="px-6 py-3 text-center">Components</th>}
                    <th className="px-6 py-3 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {filteredData.map(row => {
                   const componentCount = activeTab === 'TAX_GROUPS' ? taxes.filter(t => t.groupId === row.id).length : 0;
                   const associatedGroupName = activeTab === 'TAX_CONFIGS' ? taxGroups.find(tg => tg.id === row.groupId)?.name : null;

                   return (
                     <tr key={row.id} className="hover:bg-indigo-50/20 transition-colors group">
                       <td className="px-6 py-3.5">
                          <div className="font-black text-slate-800 italic uppercase tracking-tight text-xs">{row.name}</div>
                          {row.hsnCode && <div className="text-[8px] font-bold text-slate-300 uppercase mt-0.5">HSN: {row.hsnCode}</div>}
                          {associatedGroupName && <div className="text-[8px] font-black text-indigo-400 uppercase mt-0.5 italic">Group: {associatedGroupName}</div>}
                       </td>
                       <td className="px-6 py-3.5">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded text-[9px] font-black uppercase tracking-tighter border border-indigo-100">
                              {row.group || row.category || row.nature || row.type || 'Consolidated'}
                          </span>
                       </td>
                       {activeTab === 'TAX_CONFIGS' && (
                          <td className="px-6 py-3.5">
                             <span className="text-xs font-black text-slate-900">{row.rate}%</span>
                          </td>
                       )}
                       {activeTab === 'TAX_GROUPS' && (
                          <td className="px-6 py-3.5 text-center">
                             <span className={`px-2 py-1 rounded-lg text-[10px] font-black shadow-sm ${componentCount > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {componentCount} Ledgers
                             </span>
                          </td>
                       )}
                       <td className="px-6 py-3.5 text-right">
                          <ActionMenu actions={getRowActions(row)} />
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
               {activeTab === 'LEDGERS' && (
                  <LedgerForm initialData={editingRecord as Ledger} accountGroups={accountGroups} onCancel={() => setIsModalOpen(false)} onSubmit={(data) => { if (editingId) setLedgers(prev => prev.map(l => l.id === editingId ? { ...data, id: editingId } : l)); else setLedgers(prev => [...prev, { ...data, id: `l-${Date.now()}` }]); setIsModalOpen(false); }} />
               )}
               {activeTab === 'GROUPS' && (
                  <GroupForm initialData={editingRecord as AccountGroup} onCancel={() => setIsModalOpen(false)} onSubmit={(data) => { setAccountGroups(prev => [...prev, { ...data, id: `ag-${Date.now()}` }]); setIsModalOpen(false); }} />
               )}
               {activeTab === 'ITEMS' && (
                  <ItemForm initialData={editingRecord as Item} onCancel={() => setIsModalOpen(false)} onSubmit={(data) => { if (editingId) setItems(prev => prev.map(i => i.id === editingId ? { ...data, id: editingId } : i)); else setItems(prev => [...prev, { ...data, id: `i-${Date.now()}` }]); setIsModalOpen(false); }} />
               )}
               {activeTab === 'TAX_CONFIGS' && (
                  <TaxForm initialData={editingRecord as Tax} taxGroups={taxGroups} onCancel={() => setIsModalOpen(false)} onSubmit={(data) => { if (editingId) setTaxes(prev => prev.map(t => t.id === editingId ? { ...data, id: editingId } : t)); else setTaxes(prev => [...prev, { ...data, id: `t-${Date.now()}` }]); setIsModalOpen(false); }} />
               )}
               {activeTab === 'TAX_GROUPS' && (
                   <TaxGroupForm initialData={editingRecord as TaxGroup} taxes={taxes} onCancel={() => setIsModalOpen(false)} onSubmit={(data) => { if (editingId) setTaxGroups(prev => prev.map(tg => tg.id === editingId ? { ...data, id: editingId } : tg)); else setTaxGroups(prev => [...prev, { ...data, id: `tg-${Date.now()}` }]); setIsModalOpen(false); }} />
               )}
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-140px)] animate-in fade-in duration-300">
      <aside className="w-full lg:w-56 shrink-0 space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">
          <nav className="space-y-0.5">
            <button onClick={() => setActiveSubAction(null)} className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all ${activeSubAction === null ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest">General</span>
            </button>
            {ADMINISTRATION_SUB_MENUS.map(item => (
              <button key={item.id} onClick={() => setActiveSubAction(item.id as AdminSubMenu)} className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all ${activeSubAction === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-indigo-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl border border-indigo-900">
            <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Registry Metrics</h4>
            <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-baseline">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Ledgers</span>
                    <span className="text-xl font-black italic">{ledgers.length}</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Inventory</span>
                    <span className="text-xl font-black italic">{items.length}</span>
                </div>
            </div>
        </div>
      </aside>
      
      <main className="flex-1 overflow-hidden">
        {activeSubAction === AdminSubMenu.MASTERS ? <MastersManagementView /> : 
         activeSubAction === AdminSubMenu.USERS ? <UsersModule users={users} setUsers={setUsers} roles={roles} setRoles={setRoles} auditLogs={auditLogs} addAuditLog={addAuditLog} /> :
         activeSubAction === AdminSubMenu.BACKUP ? <BackupModule /> :
         activeSubAction === AdminSubMenu.IMPORT_EXPORT ? <ImportExportModule vouchers={vouchers} setVouchers={setVouchers} /> :
         activeSubAction === AdminSubMenu.YEAR_CHANGE ? <YearChangeModule activeCompany={activeCompany} currentFY={currentFY} setCurrentFY={setCurrentFY} onClose={() => setActiveSubAction(null)} /> :
         <div className="bg-white rounded-3xl p-10 border border-slate-200 animate-in fade-in h-full">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-slate-800">Admin Control</h2>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">Central nexus for organizational metadata and statutory configurations.</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm mb-4">🔐</div>
                    <h5 className="text-xs font-black uppercase text-slate-800">IAM Policy</h5>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Role Based Auth</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm mb-4">📦</div>
                    <h5 className="text-xs font-black uppercase text-slate-800">Vault Health</h5>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Snapshot Synchronized</p>
                </div>
            </div>
         </div>
        }
      </main>
    </div>
  );
};

export default AdministrationModule;