import React, { useState, useMemo } from 'react';
import { AdminSubMenu, User, Role, AccountGroup, Tax, TaxGroup, Ledger, AuditLog, Voucher, Company, Item, Batch } from '../types';
import { ADMINISTRATION_SUB_MENUS, CATEGORIES, UNIT_MEASURES } from '../constants';
import LedgerManager from './LedgerManager';
import UsersModule from './UsersModule';
import BackupModule from './BackupModule';
import ImportExportModule from './ImportExportModule';
import YearChangeModule from './YearChangeModule';
import GroupForm from './GroupForm';
import ItemForm from './ItemForm';
import BatchForm from './BatchForm';
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
  accountGroups: AccountGroup[];
  setAccountGroups: React.Dispatch<React.SetStateAction<AccountGroup[]>>;
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  batches: Batch[];
  setBatches: React.Dispatch<React.SetStateAction<Batch[]>>;
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
  activeSubAction, setActiveSubAction, setCurrentFY, ledgers, setLedgers, 
  accountGroups, setAccountGroups, items, setItems, batches, setBatches,
  taxes, setTaxes, taxGroups, setTaxGroups, vouchers, setVouchers,
  unitMeasures, setUnitMeasures, companies = [], setCompanies, isFYLocked
}) => {

  const MastersManagementView = () => {
    const [activeTab, setActiveTab] = useState<'LEDGERS' | 'GROUPS' | 'ITEMS' | 'BATCHES' | 'TAX_CONFIGS' | 'TAX_GROUPS'>('LEDGERS');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [itemFilterId, setItemFilterId] = useState<string | null>(null);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    
    const [itemCategoryFilter, setItemCategoryFilter] = useState<string>('ALL');
    const [sortKey, setSortKey] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

    const filteredData = useMemo(() => {
      let data: any[] = [];
      if (activeTab === 'LEDGERS') return []; 
      else if (activeTab === 'ITEMS') data = [...items];
      else if (activeTab === 'BATCHES') {
        data = itemFilterId ? batches.filter(b => b.itemId === itemFilterId) : [...batches];
      }
      else if (activeTab === 'GROUPS') data = [...accountGroups];
      else if (activeTab === 'TAX_CONFIGS') data = [...taxes];
      else if (activeTab === 'TAX_GROUPS') data = [...taxGroups];
      
      const term = searchTerm.toLowerCase();
      
      let result = data.filter(x => {
        const nameMatch = (x.name || x.batchNo)?.toLowerCase().includes(term);
        const hsnMatch = activeTab === 'ITEMS' && x.hsnCode?.toLowerCase().includes(term);
        return nameMatch || hsnMatch;
      });

      if (activeTab === 'ITEMS' && itemCategoryFilter !== 'ALL') {
        result = result.filter(x => x.category === itemCategoryFilter);
      }

      result.sort((a, b) => {
        let valA = a[sortKey as keyof typeof a];
        let valB = b[sortKey as keyof typeof b];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
        if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
        return 0;
      });

      return result;
    }, [activeTab, items, batches, accountGroups, taxes, taxGroups, searchTerm, itemFilterId, itemCategoryFilter, sortKey, sortOrder]);

    const handleSort = (key: string) => {
      if (sortKey === key) setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
      else { setSortKey(key); setSortOrder('ASC'); }
    };

    const editingRecord = useMemo(() => {
        if (!editingId) return undefined;
        if (activeTab === 'TAX_CONFIGS') return taxes.find(t => t.id === editingId);
        if (activeTab === 'TAX_GROUPS') return taxGroups.find(tg => tg.id === editingId);
        if (activeTab === 'ITEMS') return items.find(i => i.id === editingId);
        if (activeTab === 'BATCHES') return batches.find(b => b.id === editingId);
        if (activeTab === 'GROUPS') return accountGroups.find(ag => ag.id === editingId);
        return undefined;
    }, [editingId, activeTab, taxes, taxGroups, items, batches, accountGroups]);

    const handleItemSubmit = (data: any) => {
      const { initialBatch, ...itemData } = data;
      const itemId = editingId || `i-${Date.now()}`;
      
      if (editingId) {
        setItems(prev => prev.map(i => i.id === editingId ? { ...itemData, id: editingId } : i));
        addAuditLog({ action: 'UPDATE', entityType: 'MASTER', entityName: itemData.name, details: `Item ${itemData.name} updated.` });
      } else {
        setItems(prev => [...prev, { ...itemData, id: itemId }]);
        addAuditLog({ action: 'CREATE', entityType: 'MASTER', entityName: itemData.name, details: `Item ${itemData.name} initialized.` });
        if (initialBatch?.batchNo) {
          setBatches(prev => [...prev, { ...initialBatch, id: `b-${Date.now()}`, itemId: itemId }]);
        }
      }
      setIsModalOpen(false);
      setEditingId(null);
    };

    const handleBatchSubmit = (data: Omit<Batch, 'id'>) => {
      if (editingId) {
        setBatches(prev => prev.map(b => b.id === editingId ? { ...data, id: editingId } : b));
      } else {
        setBatches(prev => [...prev, { ...data, id: `b-${Date.now()}` }]);
      }
      setIsModalOpen(false);
      setEditingId(null);
    };

    const getRowActions = (row: any): ActionItem[] => [
      { 
        label: row.isSystem ? 'View' : 'Edit', 
        icon: row.isSystem ? '👁️' : '✏️',
        onClick: () => { setEditingId(row.id); setIsModalOpen(true); },
        variant: 'primary'
      },
      ...(!row.isSystem ? [{ 
        label: 'Delete', 
        icon: '🗑️',
        onClick: () => { 
          if(confirm(`Confirm permanent purge of: ${row.name || row.batchNo}?`)) {
            if (activeTab === 'TAX_CONFIGS') setTaxes(prev => prev.filter(t => t.id !== row.id));
            else if (activeTab === 'TAX_GROUPS') setTaxGroups(prev => prev.filter(tg => tg.id !== row.id));
            else if (activeTab === 'ITEMS') setItems(prev => prev.filter(i => i.id !== row.id));
            else if (activeTab === 'BATCHES') setBatches(prev => prev.filter(b => b.id !== row.id));
          }
        },
        variant: 'danger' as const
      }] : [])
    ];

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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>Bulk Import</span>
              </button>
            )}
            {activeTab !== 'LEDGERS' && (
              <button 
                onClick={() => { setEditingId(null); setIsModalOpen(true); }} 
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
              >
                Add {activeTab.split('_')[0].slice(0, -1)}
              </button>
            )}
          </div>
        </div>

        <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'LEDGERS', label: 'Ledgers' },
            { id: 'GROUPS', label: 'Groups' },
            { id: 'ITEMS', label: 'Item Catalogue' },
            { id: 'BATCHES', label: 'Global Batch List' },
            { id: 'TAX_CONFIGS', label: 'Taxes' },
            { id: 'TAX_GROUPS', label: 'Tax Groups' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as any); setEditingId(null); setSearchTerm(''); setItemFilterId(null); }} 
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-xl border-b-2 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'LEDGERS' ? (
          <LedgerManager ledgers={ledgers} setLedgers={setLedgers} accountGroups={accountGroups} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-slate-100 flex flex-col space-y-4 bg-slate-50/30">
                <input 
                  type="text" 
                  placeholder="Query Registry..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 text-xs font-black shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all italic" 
                />
            </div>

            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left">
                 <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400 border-b border-slate-800">
                   <tr>
                      <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('name')}>Designation Node</th>
                      <th className="px-6 py-4">Classification</th>
                      {activeTab === 'ITEMS' && <th className="px-6 py-4 text-center">Unit</th>}
                      {activeTab === 'BATCHES' && <th className="px-6 py-4 text-center">Stock</th>}
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {filteredData.map(row => (
                     <tr key={row.id} className="hover:bg-indigo-50/20 transition-colors group">
                       <td className="px-6 py-3.5">
                          <div className="font-black text-slate-800 italic uppercase text-xs">
                            {activeTab === 'BATCHES' ? row.batchNo : row.name}
                            {row.isSystem && <span className="ml-2 text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded-lg">SYS</span>}
                          </div>
                          {row.hsnCode && <div className="text-[8px] font-bold text-slate-300 uppercase">HSN: {row.hsnCode}</div>}
                       </td>
                       <td className="px-6 py-3.5">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-500 rounded text-[9px] font-black uppercase tracking-tighter border border-indigo-100">
                              {row.group || row.category || row.nature || 'Standard'}
                          </span>
                       </td>
                       {activeTab === 'ITEMS' && <td className="px-6 py-3.5 text-center text-[9px] font-black">{row.unit}</td>}
                       {activeTab === 'BATCHES' && <td className="px-6 py-3.5 text-center text-[9px] font-black tabular-nums">{row.currentStock}</td>}
                       <td className="px-6 py-3.5 text-right">
                          <ActionMenu actions={getRowActions(row)} label="MODULAR" />
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {isModalOpen && activeTab !== 'LEDGERS' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
               {activeTab === 'GROUPS' && (
                  <GroupForm initialData={editingRecord as AccountGroup} onCancel={() => setIsModalOpen(false)} onSubmit={(data) => { if (editingId) setAccountGroups(prev => prev.map(ag => ag.id === editingId ? { ...data, id: editingId, isSystem: false } : ag)); else setAccountGroups(prev => [...prev, { ...data, id: `ag-${Date.now()}`, isSystem: false }]); setIsModalOpen(false); }} />
               )}
               {activeTab === 'ITEMS' && (
                  <ItemForm initialData={editingRecord as Item} unitMeasures={unitMeasures} taxGroups={taxGroups} taxes={taxes} onCancel={() => setIsModalOpen(false)} onSubmit={handleItemSubmit} />
               )}
               {activeTab === 'BATCHES' && (
                  <BatchForm initialData={editingRecord as Batch} items={items} onCancel={() => setIsModalOpen(false)} onSubmit={handleBatchSubmit} />
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
              <span className="text-[10px] font-black uppercase tracking-widest">Master Overview</span>
            </button>
            {ADMINISTRATION_SUB_MENUS.map(item => (
              <button key={item.id} onClick={() => setActiveSubAction(item.id as AdminSubMenu)} className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all ${activeSubAction === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 overflow-hidden">
        {activeSubAction === AdminSubMenu.MASTERS ? <MastersManagementView /> : 
         activeSubAction === AdminSubMenu.USERS ? <UsersModule users={users} setUsers={setUsers} roles={roles} setRoles={setRoles} auditLogs={auditLogs} addAuditLog={addAuditLog} /> :
         (activeSubAction === AdminSubMenu.BACKUP || activeSubAction === AdminSubMenu.AUTOMATIC_BACKUP) ? <BackupModule initialView={activeSubAction === AdminSubMenu.AUTOMATIC_BACKUP ? 'AUTOMATIC_BACKUPS' : 'SNAPSHOTS'} /> :
         activeSubAction === AdminSubMenu.IMPORT_EXPORT ? <ImportExportModule vouchers={vouchers} items={items} setItems={setItems} /> :
         activeSubAction === AdminSubMenu.YEAR_CHANGE ? <YearChangeModule activeCompany={activeCompany} currentFY={currentFY} setCurrentFY={setCurrentFY} onClose={() => setActiveSubAction(null)} /> :
         activeSubAction === AdminSubMenu.EMAIL_GATEWAY ? <EmailGateway vouchers={vouchers} ledgers={ledgers} accountGroups={accountGroups} activeCompany={activeCompany} /> :
         <div className="bg-white rounded-3xl p-10 border border-slate-200 h-full">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-slate-800">Admin Command Center</h2>
            <p className="text-xs text-slate-400 max-w-md">Central hub for master management and statutory architecture.</p>
         </div>
        }
      </main>
    </div>
  );
};

export default AdministrationModule;