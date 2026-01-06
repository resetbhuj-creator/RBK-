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
import CsvImportWizard, { ImportField } from './CsvImportWizard';

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

  const ITEM_IMPORT_FIELDS: ImportField[] = [
    { key: 'name', label: 'Item Designation', required: true },
    { key: 'category', label: 'Category', defaultValue: 'General' },
    { key: 'unit', label: 'Unit of Measure', defaultValue: 'Nos' },
    { key: 'salePrice', label: 'Standard Sale Price', type: 'number' },
    { key: 'costPrice', label: 'Base Cost Price', type: 'number' },
    { key: 'hsnCode', label: 'HSN/SAC Code', defaultValue: '0000' },
    { key: 'gstRate', label: 'Tax Rate (%)', type: 'number', defaultValue: 18 }
  ];

  const MastersManagementView = () => {
    const [activeTab, setActiveTab] = useState<'LEDGERS' | 'GROUPS' | 'ITEMS' | 'BATCHES' | 'TAX_CONFIGS' | 'TAX_GROUPS'>('LEDGERS');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedItemIdForBatches, setSelectedItemIdForBatches] = useState<string | null>(null);

    const filteredData = useMemo(() => {
      let data: any[] = [];
      if (activeTab === 'LEDGERS') return []; 
      else if (activeTab === 'ITEMS') data = [...items];
      else if (activeTab === 'BATCHES') data = selectedItemIdForBatches ? batches.filter(b => b.itemId === selectedItemIdForBatches) : [...batches];
      else if (activeTab === 'GROUPS') data = [...accountGroups];
      else if (activeTab === 'TAX_CONFIGS') data = [...taxes];
      else if (activeTab === 'TAX_GROUPS') data = [...taxGroups];
      
      const term = searchTerm.toLowerCase();
      return data.filter(x => (x.name || x.batchNo)?.toLowerCase().includes(term));
    }, [activeTab, items, batches, accountGroups, taxes, taxGroups, searchTerm, selectedItemIdForBatches]);

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
      if (editingId) {
        setItems(prev => prev.map(i => i.id === editingId ? { ...data, id: editingId } : i));
      } else {
        setItems(prev => [...prev, { ...data, id: `i-${Date.now()}` }]);
      }
      setIsModalOpen(false);
      setEditingId(null);
    };

    const handleBulkImport = (importedData: any[]) => {
       if (activeTab === 'ITEMS') {
          setItems(prev => [...prev, ...importedData]);
          addAuditLog({
            action: 'CREATE',
            entityType: 'MASTER',
            entityName: 'ITEM_BULK_IMPORT',
            details: `Bulk Ingestion Success: ${importedData.length} item shards committed.`
          });
       }
       setIsImportOpen(false);
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
      ...(activeTab === 'ITEMS' ? [{
        label: 'Manage Batches',
        icon: '📦',
        onClick: () => { setSelectedItemIdForBatches(row.id); setActiveTab('BATCHES'); },
        variant: 'primary' as const
      }] : []),
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
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="text-2xl font-black uppercase italic text-slate-800 tracking-tighter">Institutional Registries</h2>
          <div className="flex items-center space-x-3">
            {activeTab === 'ITEMS' && (
              <button 
                onClick={() => setIsImportOpen(true)}
                className="px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
              >
                CSV Ingest
              </button>
            )}
            {activeTab === 'BATCHES' && selectedItemIdForBatches && (
              <button 
                onClick={() => { setSelectedItemIdForBatches(null); setActiveTab('ITEMS'); }}
                className="px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                &larr; Back to Catalogue
              </button>
            )}
            {activeTab !== 'LEDGERS' && (
              <button 
                onClick={() => { setEditingId(null); setIsModalOpen(true); }} 
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all transform active:scale-95"
              >
                Register {activeTab.split('_')[0].slice(0, -1)}
              </button>
            )}
          </div>
        </div>

        <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] border border-slate-200 w-full shadow-inner overflow-x-auto no-scrollbar">
          {[
            { id: 'LEDGERS', label: 'Financial Ledgers' },
            { id: 'GROUPS', label: 'Account Clusters' },
            { id: 'ITEMS', label: 'Item Catalogue' },
            { id: 'BATCHES', label: 'Inventory Batches' },
            { id: 'TAX_CONFIGS', label: 'Statutory Taxes' },
            { id: 'TAX_GROUPS', label: 'Tax Umbrellas' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as any); setEditingId(null); setSearchTerm(''); if(tab.id !== 'BATCHES') setSelectedItemIdForBatches(null); }} 
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-[1.5rem] whitespace-nowrap px-6 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
            >
                {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'LEDGERS' ? (
          <LedgerManager ledgers={ledgers} setLedgers={setLedgers} accountGroups={accountGroups} />
        ) : (
          <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex flex-col">
                  <input 
                    type="text" 
                    placeholder="Search master registry shards..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full max-w-xl pl-14 pr-8 py-4 rounded-[1.5rem] border border-slate-200 text-sm font-black shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all italic bg-white" 
                  />
                  {activeTab === 'BATCHES' && selectedItemIdForBatches && (
                    <div className="mt-4 flex items-center space-x-3 px-2">
                       <span className="text-[10px] font-black uppercase text-indigo-600">Filtering Lot history for:</span>
                       <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-black text-[10px] uppercase">
                         {items.find(i => i.id === selectedItemIdForBatches)?.name}
                       </span>
                    </div>
                  )}
                </div>
            </div>

            <div className="overflow-x-auto flex-1 custom-scrollbar">
               <table className="w-full text-left">
                 <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 border-b border-slate-800">
                   <tr>
                      <th className="px-12 py-8">{activeTab === 'BATCHES' ? 'Batch / Lot Hash' : 'Designation Node'}</th>
                      <th className="px-12 py-8">Classification</th>
                      {activeTab === 'ITEMS' && <th className="px-12 py-8 text-center">Unit Shard</th>}
                      {activeTab === 'BATCHES' && <th className="px-12 py-8 text-center">Expiry Mirror</th>}
                      {activeTab === 'BATCHES' && <th className="px-12 py-8 text-right">Volume</th>}
                      {(activeTab === 'TAX_CONFIGS' || activeTab === 'TAX_GROUPS') && <th className="px-12 py-8 text-right">Rate / Context</th>}
                      <th className="px-12 py-8 text-right">Modular Operations</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {filteredData.map(row => (
                     <tr key={row.id} className="hover:bg-indigo-50/20 transition-all group">
                       <td className="px-12 py-6">
                          <div className="font-black text-slate-800 italic uppercase text-base tracking-tighter">
                            {row.name || row.batchNo}
                            {row.isSystem && <span className="ml-3 text-[9px] bg-slate-950 text-indigo-400 px-2 py-0.5 rounded-lg border border-slate-800 font-black">LOCKED</span>}
                          </div>
                          {row.hsnCode && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">HSN: {row.hsnCode}</div>}
                          {activeTab === 'BATCHES' && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">MFG: {row.mfgDate}</div>}
                       </td>
                       <td className="px-12 py-6">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border ${row.isSystem ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                              {activeTab === 'BATCHES' ? (items.find(i => i.id === row.itemId)?.name || 'ORPHAN_SHARD') : (row.group || row.category || row.nature || 'Statutory')}
                          </span>
                       </td>
                       {activeTab === 'ITEMS' && <td className="px-12 py-6 text-center text-[10px] font-black text-slate-500 uppercase">{row.unit}</td>}
                       {activeTab === 'BATCHES' && <td className="px-12 py-6 text-center text-[11px] font-black text-rose-500 tabular-nums italic uppercase underline decoration-rose-100">{row.expiryDate || 'PERPETUAL'}</td>}
                       {activeTab === 'BATCHES' && <td className="px-12 py-6 text-right font-black tabular-nums text-indigo-600 text-lg">{row.currentStock}</td>}
                       {activeTab === 'TAX_CONFIGS' && <td className="px-12 py-6 text-right font-black tabular-nums">{row.rate}%</td>}
                       {activeTab === 'TAX_GROUPS' && <td className="px-12 py-6 text-right font-black italic text-indigo-600">Complex Node</td>}
                       <td className="px-12 py-6 text-right">
                          <ActionMenu actions={getRowActions(row)} label="MODULAR" />
                       </td>
                     </tr>
                   ))}
                   {filteredData.length === 0 && (
                     <tr><td colSpan={6} className="py-40 text-center text-slate-300 italic uppercase font-black tracking-widest">No matching shards detected in this partition.</td></tr>
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {isModalOpen && activeTab !== 'LEDGERS' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
               {activeTab === 'GROUPS' && (
                  <GroupForm initialData={editingRecord as AccountGroup} onCancel={() => setIsModalOpen(false)} onSubmit={(data) => { if (editingId) setAccountGroups(prev => prev.map(ag => ag.id === editingId ? { ...data, id: editingId, isSystem: false } : ag)); else setAccountGroups(prev => [...prev, { ...data, id: `ag-${Date.now()}`, isSystem: false }]); setIsModalOpen(false); }} />
               )}
               {activeTab === 'ITEMS' && (
                  <ItemForm initialData={editingRecord as Item} unitMeasures={unitMeasures} taxGroups={taxGroups} taxes={taxes} onCancel={() => setIsModalOpen(false)} onSubmit={handleItemSubmit} />
               )}
               {activeTab === 'BATCHES' && (
                  <BatchForm initialData={editingRecord as Batch} defaultItemId={selectedItemIdForBatches || undefined} items={items} onCancel={() => setIsModalOpen(false)} onSubmit={handleBatchSubmit} />
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

        {isImportOpen && (
           <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                 <CsvImportWizard 
                   entityName={activeTab === 'ITEMS' ? "Item Catalogue" : "Registry Shards"}
                   fields={ITEM_IMPORT_FIELDS}
                   existingKeys={items.map(i => i.name)}
                   onCancel={() => setIsImportOpen(false)} 
                   onImport={handleBulkImport} 
                 />
              </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 min-h-[calc(100vh-160px)] animate-in fade-in duration-500">
      <aside className="w-full lg:w-72 shrink-0 space-y-6">
        <div className="bg-white rounded-[3rem] border border-slate-200 p-6 shadow-sm">
          <nav className="space-y-1.5">
            {ADMINISTRATION_SUB_MENUS.map(item => (
              <button key={item.id} onClick={() => setActiveSubAction(item.id as AdminSubMenu)} className={`w-full flex items-center px-6 py-4 rounded-2xl transition-all ${activeSubAction === item.id ? 'bg-indigo-600 text-white shadow-xl scale-[1.03]' : 'text-slate-500 hover:bg-slate-50'}`}>
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
         activeSubAction === AdminSubMenu.IMPORT_EXPORT ? <ImportExportModule vouchers={vouchers} items={items} setItems={setItems} ledgers={ledgers} setLedgers={setLedgers} addAuditLog={addAuditLog} /> :
         activeSubAction === AdminSubMenu.YEAR_CHANGE ? <YearChangeModule activeCompany={activeCompany} currentFY={currentFY} setCurrentFY={setCurrentFY} onClose={() => setActiveSubAction(null)} /> :
         activeSubAction === AdminSubMenu.EMAIL_GATEWAY ? <EmailGateway vouchers={vouchers} ledgers={ledgers} accountGroups={accountGroups} activeCompany={activeCompany} /> :
         <div className="bg-white rounded-[4rem] p-20 border border-slate-200 h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-slate-800">Admin Control Node</h2>
            <p className="text-sm text-slate-400 font-medium max-w-md">Authorized administrative workstation for system architecture and organizational governance.</p>
         </div>
        }
      </main>
    </div>
  );
};

export default AdministrationModule;