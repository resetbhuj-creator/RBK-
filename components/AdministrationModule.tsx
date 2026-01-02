import React, { useState, useMemo } from 'react';
import { ADMINISTRATION_SUB_MENUS } from '../constants';
import { AdminSubMenu, User, Role, AccountGroup, Tax, TaxGroup, Ledger, Item, AuditLog, Voucher, Company } from '../types';
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
import EmailGateway from './EmailGateway';

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
  unitMeasures: string[];
  setUnitMeasures: React.Dispatch<React.SetStateAction<string[]>>;
  companies?: Company[];
  setCompanies?: React.Dispatch<React.SetStateAction<Company[]>>;
  isFYLocked?: boolean;
}

const AdministrationModule: React.FC<AdministrationModuleProps> = ({ 
  users, setUsers, roles, setRoles, auditLogs, addAuditLog, activeCompany, currentFY, 
  activeSubAction, setActiveSubAction, setCurrentFY, ledgers, setLedgers, items, setItems,
  taxes, setTaxes, taxGroups, setTaxGroups, vouchers, setVouchers,
  unitMeasures, setUnitMeasures, companies = [], setCompanies, isFYLocked
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
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const filteredData = useMemo(() => {
      let data: any[] = [];
      if (activeTab === 'LEDGERS') data = ledgers;
      else if (activeTab === 'ITEMS') data = items;
      else if (activeTab === 'GROUPS') data = accountGroups;
      else if (activeTab === 'TAX_CONFIGS') data = taxes;
      else if (activeTab === 'TAX_GROUPS') data = taxGroups;
      
      const term = searchTerm.toLowerCase();
      return data.filter(x => {
        const nameMatch = x.name?.toLowerCase().includes(term);
        const descMatch = activeTab === 'TAX_GROUPS' && x.description?.toLowerCase().includes(term);
        return nameMatch || descMatch;
      });
    }, [activeTab, ledgers, items, accountGroups, taxes, taxGroups, searchTerm]);

    const editingRecord = useMemo(() => {
        if (!editingId) return undefined;
        if (activeTab === 'TAX_CONFIGS') return taxes.find(t => t.id === editingId);
        if (activeTab === 'TAX_GROUPS') return taxGroups.find(tg => tg.id === editingId);
        if (activeTab === 'LEDGERS') return ledgers.find(l => l.id === editingId);
        if (activeTab === 'ITEMS') return items.find(i => i.id === editingId);
        if (activeTab === 'GROUPS') return accountGroups.find(ag => ag.id === editingId);
        return undefined;
    }, [editingId, activeTab, taxes, taxGroups, ledgers, items, accountGroups]);

    const getRowActions = (row: any): ActionItem[] => {
      const actions: ActionItem[] = [
        { 
          label: 'Edit', 
          icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
          onClick: () => { setEditingId(row.id); setIsModalOpen(true); },
          variant: 'primary'
        }
      ];

      if (!row.isSystem) {
        actions.push({ 
          label: 'Delete', 
          icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
          onClick: () => { 
            const msg = activeTab === 'TAX_GROUPS' 
              ? `Purge tax group "${row.name}"? This will detach all linked statutory ledgers.`
              : `Confirm permanent purge of master record: ${row.name}?`;

            if(confirm(msg)) {
                if (activeTab === 'TAX_CONFIGS') setTaxes(prev => prev.filter(t => t.id !== row.id));
                else if (activeTab === 'TAX_GROUPS') setTaxGroups(prev => prev.filter(tg => tg.id !== row.id));
                else if (activeTab === 'LEDGERS') setLedgers(prev => prev.filter(l => l.id !== row.id));
                else if (activeTab === 'ITEMS') setItems(prev => prev.filter(i => i.id !== row.id));
                else if (activeTab === 'GROUPS') setAccountGroups(prev => prev.filter(ag => ag.id !== row.id));
            }
          },
          variant: 'danger'
        });
      }

      return actions;
    };

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black uppercase italic text-slate-800 tracking-tight">Master Registries</h2>
          <div className="flex items-center space-x-3">
            {activeTab === 'ITEMS' && (
              <button 
                onClick={() => setIsImportModalOpen(true)} 
                className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span>Bulk Import</span>
              </button>
            )}
            <button 
              onClick={() => { setEditingId(null); setIsModalOpen(true); }} 
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
            >
              Add {activeTab === 'ITEMS' ? 'Catalogue' : activeTab.split('_')[0].slice(0, -1)}
            </button>
          </div>
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
                  placeholder={`Search ${activeTab.replace('_', ' ').toLowerCase()}...`} 
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
                    {activeTab === 'ITEMS' && <th className="px-6 py-3 text-center">Unit</th>}
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
                          <div className="font-black text-slate-800 italic uppercase tracking-tight text-xs flex items-center">
                            {row.name}
                            {row.isSystem && (
                              <svg className="w-2.5 h-2.5 ml-2 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                            )}
                          </div>
                          {row.hsnCode && <div className="text-[8px] font-bold text-slate-300 uppercase mt-0.5">HSN: {row.hsnCode}</div>}
                          {associatedGroupName && <div className="text-[8px] font-black text-indigo-400 uppercase mt-0.5 italic">Group: {associatedGroupName}</div>}
                          {activeTab === 'TAX_GROUPS' && row.description && (
                            <div className="text-[9px] text-slate-400 font-medium italic mt-1 max-w-xs truncate" title={row.description}>
                              {row.description}
                            </div>
                          )}
                       </td>
                       <td className="px-6 py-3.5">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded text-[9px] font-black uppercase tracking-tighter border border-indigo-100">
                              {row.group || row.category || row.nature || row.type || 'Consolidated'}
                          </span>
                       </td>
                       {activeTab === 'ITEMS' && (
                          <td className="px-6 py-3.5 text-center">
                             <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase tracking-widest border border-slate-200">{row.unit}</span>
                          </td>
                       )}
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
                          <ActionMenu actions={getRowActions(row)} label={row.isSystem ? 'LOCKED' : 'ACTION'} />
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
                  <GroupForm initialData={editingRecord as AccountGroup} onCancel={() => setIsModalOpen(false)} onSubmit={(data) => { if (editingId) setAccountGroups(prev => prev.map(ag => ag.id === editingId ? { ...data, id: editingId } : ag)); else setAccountGroups(prev => [...prev, { ...data, id: `ag-${Date.now()}` }]); setIsModalOpen(false); }} />
               )}
               {activeTab === 'ITEMS' && (
                  <ItemForm 
                    initialData={editingRecord as Item} 
                    unitMeasures={unitMeasures} 
                    taxGroups={taxGroups}
                    taxes={taxes}
                    onQuickUnitAdd={(u) => setUnitMeasures(prev => Array.from(new Set([...prev, u])))}
                    onCancel={() => setIsModalOpen(false)} 
                    onSubmit={(data) => { if (editingId) setItems(prev => prev.map(i => i.id === editingId ? { ...data, id: editingId } : i)); else setItems(prev => [...prev, { ...data, id: `i-${Date.now()}` }]); setIsModalOpen(false); }} 
                  />
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

        {isImportModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-6xl my-10">
              <div className="bg-white rounded-[4rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-6 right-10 z-50">
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="p-3 bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all border border-white/20"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <ImportExportModule 
                  items={items} 
                  setItems={setItems} 
                  forcedEntity="Inventory Items" 
                  initialFormat="CSV" 
                  onClose={() => setIsImportModalOpen(false)} 
                />
              </div>
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
         activeSubAction === AdminSubMenu.IMPORT_EXPORT ? <ImportExportModule vouchers={vouchers} setVouchers={setVouchers} items={items} setItems={setItems} ledgers={ledgers} setLedgers={setLedgers} companies={companies} setCompanies={setCompanies} /> :
         activeSubAction === AdminSubMenu.YEAR_CHANGE ? <YearChangeModule activeCompany={activeCompany} currentFY={currentFY} setCurrentFY={setCurrentFY} onClose={() => setActiveSubAction(null)} /> :
         activeSubAction === AdminSubMenu.COMMUNICATION ? <EmailGateway vouchers={vouchers} ledgers={ledgers} activeCompany={activeCompany} forceTab="CONFIG" /> :
         <div className="bg-white rounded-3xl p-10 border border-slate-200 animate-in fade-in h-full space-y-10">
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-slate-800">Admin Control</h2>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">Central nexus for organizational metadata and statutory configurations.</p>
            </div>

            {/* Period Governance Widget */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-l-8 border-rose-600">
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="space-y-4">
                     <div className="inline-block px-3 py-1 bg-rose-600/30 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] border border-rose-600/30">Period Governance</div>
                     <h3 className="text-3xl font-black italic uppercase tracking-tighter">Financial Session</h3>
                     <div className="flex items-center space-x-6">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Period</span>
                           <span className="text-xl font-black text-white italic">{currentFY}</span>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Integrity Status</span>
                           <span className={`text-sm font-black uppercase tracking-widest ${isFYLocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                             {isFYLocked ? 'Locked (Audit Mode)' : 'Open (Operational)'}
                           </span>
                        </div>
                     </div>
                  </div>
                  <button 
                    onClick={() => setActiveSubAction(AdminSubMenu.YEAR_CHANGE)}
                    className="px-10 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-600 hover:text-white transition-all transform active:scale-95 border-b-4 border-slate-950 flex items-center space-x-4"
                  >
                    <span>Change Working Year</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
               </div>
               <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600 rounded-full blur-[120px] opacity-10 -mr-40 -mt-40 pointer-events-none"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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