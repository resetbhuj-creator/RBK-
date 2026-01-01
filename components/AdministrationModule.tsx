import React, { useState, useMemo } from 'react';
import { ADMINISTRATION_SUB_MENUS } from '../constants';
import { AdminSubMenu, User, Role, AccountGroup, Tax, TaxGroup, Ledger, Item, AuditLog } from '../types';
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
}

const AdministrationModule: React.FC<AdministrationModuleProps> = ({ 
  users, setUsers, roles, setRoles, auditLogs, addAuditLog, activeCompany, currentFY, 
  activeSubAction, setActiveSubAction, setCurrentFY, ledgers, setLedgers, items, setItems,
  taxes, setTaxes, taxGroups, setTaxGroups
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
          label: 'Edit Master', 
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
          onClick: () => { setEditingId(row.id); setIsModalOpen(true); },
          variant: 'primary'
        },
        { 
          label: 'Delete', 
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
          onClick: () => { 
            if(confirm(`Purge record for ${row.name}?`)) {
                if (activeTab === 'TAX_CONFIGS') setTaxes(prev => prev.filter(t => t.id !== row.id));
                else if (activeTab === 'TAX_GROUPS') setTaxGroups(prev => prev.filter(tg => tg.id !== row.id));
                else if (activeTab === 'LEDGERS') setLedgers(prev => prev.filter(l => l.id !== row.id));
                else if (activeTab === 'ITEMS') setItems(prev => prev.filter(i => i.id !== row.id));
                alert('Record Purged.'); 
            }
          },
          variant: 'danger'
        }
      ];
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase italic text-slate-800">Master Registries</h2>
          <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transform active:scale-95 transition-all">
            Add {activeTab.replace('_', ' ').replace('CONFIGS', 'CONFIGURATION').slice(0, -1)}
          </button>
        </div>

        <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'LEDGERS', label: 'Account Ledgers' },
            { id: 'GROUPS', label: 'Account Groups' },
            { id: 'ITEMS', label: 'Item Catalogue' },
            { id: 'TAX_CONFIGS', label: 'Tax Configurations' },
            { id: 'TAX_GROUPS', label: 'Tax Groups' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as any); setEditingId(null); }} 
              className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-4 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab.replace('_', ' ')}...`} 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-12 pr-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10" 
                />
                <svg className="w-5 h-5 text-slate-300 absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{filteredData.length} Records Found</div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                 <tr>
                    <th className="px-10 py-5">Identity / Designation</th>
                    <th className="px-10 py-5">Classification & Metadata</th>
                    {activeTab === 'TAX_CONFIGS' && <th className="px-10 py-5">Rate (%)</th>}
                    <th className="px-10 py-5 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {filteredData.map(row => (
                   <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                     <td className="px-10 py-6">
                        <div className="font-black text-slate-800 italic uppercase tracking-tight">{row.name}</div>
                        {row.hsnCode && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">HSN: {row.hsnCode}</div>}
                     </td>
                     <td className="px-10 py-6">
                        <div className="flex flex-col">
                            <div className="flex items-center space-x-2 mb-1">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100 self-start">
                                    {row.group || row.category || row.nature || row.type || (activeTab === 'TAX_GROUPS' ? 'Consolidated' : 'Master')}
                                </span>
                                {row.groupId && (
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                        Group: {taxGroups.find(tg => tg.id === row.groupId)?.name || 'Linked'}
                                    </span>
                                )}
                            </div>
                            {row.description && <span className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{row.description}</span>}
                        </div>
                     </td>
                     {activeTab === 'TAX_CONFIGS' && (
                        <td className="px-10 py-6">
                           <span className="text-sm font-black text-slate-900">{row.rate}%</span>
                        </td>
                     )}
                     <td className="px-10 py-6 text-right">
                        <ActionMenu actions={getRowActions(row)} />
                     </td>
                   </tr>
                 ))}
                 {filteredData.length === 0 && (
                     <tr><td colSpan={activeTab === 'TAX_CONFIGS' ? 4 : 3} className="py-24 text-center text-slate-400 italic">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest opacity-50">Zero entries detected for this registry.</span>
                        </div>
                     </td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
             {activeTab === 'LEDGERS' && (
                <LedgerForm 
                  initialData={editingRecord as Ledger} 
                  accountGroups={accountGroups} 
                  onCancel={() => setIsModalOpen(false)} 
                  onSubmit={(data) => { 
                    if (editingId) setLedgers(prev => prev.map(l => l.id === editingId ? { ...data, id: editingId } : l));
                    else setLedgers(prev => [...prev, { ...data, id: `l-${Date.now()}` }]); 
                    setIsModalOpen(false); 
                  }} 
                />
             )}
             {activeTab === 'GROUPS' && (
                <GroupForm 
                  initialData={editingRecord as AccountGroup} 
                  onCancel={() => setIsModalOpen(false)} 
                  onSubmit={(data) => { 
                    setAccountGroups(prev => [...prev, { ...data, id: `ag-${Date.now()}` }]); 
                    setIsModalOpen(false); 
                  }} 
                />
             )}
             {activeTab === 'ITEMS' && (
                <ItemForm 
                  initialData={editingRecord as Item} 
                  onCancel={() => setIsModalOpen(false)} 
                  onSubmit={(data) => { 
                    if (editingId) setItems(prev => prev.map(i => i.id === editingId ? { ...data, id: editingId } : i));
                    else setItems(prev => [...prev, { ...data, id: `i-${Date.now()}` }]); 
                    setIsModalOpen(false); 
                  }} 
                />
             )}
             {activeTab === 'TAX_CONFIGS' && (
                <TaxForm 
                    initialData={editingRecord as Tax} 
                    taxGroups={taxGroups} 
                    onCancel={() => setIsModalOpen(false)} 
                    onSubmit={(data) => { 
                        if (editingId) setTaxes(prev => prev.map(t => t.id === editingId ? { ...data, id: editingId } : t));
                        else setTaxes(prev => [...prev, { ...data, id: `t-${Date.now()}` }]); 
                        setIsModalOpen(false); 
                    }} 
                />
             )}
             {activeTab === 'TAX_GROUPS' && (
                 <TaxGroupForm 
                    initialData={editingRecord as TaxGroup} 
                    onCancel={() => setIsModalOpen(false)} 
                    onSubmit={(data) => { 
                        if (editingId) setTaxGroups(prev => prev.map(tg => tg.id === editingId ? { ...data, id: editingId } : tg));
                        else setTaxGroups(prev => [...prev, { ...data, id: `tg-${Date.now()}` }]); 
                        setIsModalOpen(false); 
                    }} 
                />
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 min-h-[75vh]">
      <aside className="w-full lg:w-80 shrink-0 space-y-6">
        <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm">
          <nav className="space-y-1.5">
            <button onClick={() => setActiveSubAction(null)} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-[1.5rem] transition-all ${activeSubAction === null ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span className="text-[11px] font-black uppercase tracking-widest">Global Status</span>
            </button>
            {ADMINISTRATION_SUB_MENUS.map(item => (
              <button key={item.id} onClick={() => setActiveSubAction(item.id as AdminSubMenu)} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-[1.5rem] transition-all ${activeSubAction === item.id ? 'bg-indigo-600 text-white shadow-2xl' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">Quick Telemetry</h4>
            <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Ledgers</span>
                    <span className="text-lg font-black">{ledgers.length}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tax Masters</span>
                    <span className="text-lg font-black">{taxes.length}</span>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-[100px] opacity-20 -mr-16 -mt-16"></div>
        </div>
      </aside>
      <main className="flex-1">
        {activeSubAction === AdminSubMenu.MASTERS ? <MastersManagementView /> : 
         activeSubAction === AdminSubMenu.USERS ? <UsersModule users={users} setUsers={setUsers} roles={roles} setRoles={setRoles} auditLogs={auditLogs} addAuditLog={addAuditLog} /> :
         activeSubAction === AdminSubMenu.BACKUP ? <BackupModule /> :
         activeSubAction === AdminSubMenu.IMPORT_EXPORT ? <ImportExportModule /> :
         activeSubAction === AdminSubMenu.YEAR_CHANGE ? <YearChangeModule activeCompany={activeCompany} currentFY={currentFY} setCurrentFY={setCurrentFY} onClose={() => setActiveSubAction(null)} /> :
         <div className="bg-white rounded-[3rem] p-12 border border-slate-200 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-slate-800">Administration Control</h2>
            <p className="text-slate-500 max-w-md leading-relaxed">System-wide configuration portal for Master registries, user permissions, and database continuity protocols.</p>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-6">🔑</div>
                    <h5 className="text-sm font-black uppercase text-slate-800 tracking-tight">Security Hardened</h5>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-2">Active Multi-Role Auth</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-6">🏛️</div>
                    <h5 className="text-sm font-black uppercase text-slate-800 tracking-tight">Statutory Ready</h5>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-2">GST Compliant Core</p>
                </div>
            </div>
         </div>
        }
      </main>
    </div>
  );
};

export default AdministrationModule;