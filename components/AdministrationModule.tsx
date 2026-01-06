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
    
    // Advanced Item Filters
    const [itemCategoryFilter, setItemCategoryFilter] = useState<string>('ALL');
    const [itemUnitFilter, setItemUnitFilter] = useState<string>('ALL');
    const [itemTaxFilter, setItemTaxFilter] = useState<'ALL' | 'TAXABLE' | 'EXEMPT'>('ALL');
    
    // Sort State
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
        const descMatch = (activeTab === 'TAX_GROUPS' || activeTab === 'TAX_CONFIGS') && x.description?.toLowerCase().includes(term);
        const hsnMatch = activeTab === 'ITEMS' && x.hsnCode?.toLowerCase().includes(term);
        const natureMatch = activeTab === 'GROUPS' && x.nature?.toLowerCase().includes(term);
        const itemMatch = activeTab === 'BATCHES' && items.find(i => i.id === x.itemId)?.name.toLowerCase().includes(term);
        return nameMatch || descMatch || hsnMatch || natureMatch || itemMatch;
      });

      if (activeTab === 'ITEMS') {
        result = result.filter(x => {
          const categoryMatch = itemCategoryFilter === 'ALL' || x.category === itemCategoryFilter;
          const unitMatch = itemUnitFilter === 'ALL' || x.unit === itemUnitFilter;
          const taxMatch = itemTaxFilter === 'ALL' 
            ? true 
            : itemTaxFilter === 'TAXABLE' ? x.gstRate > 0 : x.gstRate === 0;
          return categoryMatch && unitMatch && taxMatch;
        });
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
    }, [activeTab, items, batches, accountGroups, taxes, taxGroups, searchTerm, itemFilterId, itemCategoryFilter, itemUnitFilter, itemTaxFilter, sortKey, sortOrder]);

    const handleSort = (key: string) => {
      if (sortKey === key) {
        setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
      } else {
        setSortKey(key);
        setSortOrder('ASC');
      }
    };

    const SortIndicator = ({ field }: { field: string }) => {
      if (sortKey !== field) return <span className="ml-1 opacity-10 group-hover/th:opacity-50">↕</span>;
      return <span className="ml-1 text-indigo-600">{sortOrder === 'ASC' ? '↑' : '↓'}</span>;
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

    const handleQuickGroupAdd = (groupData: Omit<AccountGroup, 'id' | 'isSystem'>) => {
      const newGroup: AccountGroup = {
        ...groupData,
        id: `ag-${Date.now()}`,
        isSystem: false
      };
      setAccountGroups(prev => [...prev, newGroup]);
    };

    const handleItemSubmit = (data: any) => {
      const { initialBatch, ...itemData } = data;
      const itemId = editingId || `i-${Date.now()}`;
      
      if (editingId) {
        setItems(prev => prev.map(i => i.id === editingId ? { ...itemData, id: editingId } : i));
        addAuditLog({ action: 'UPDATE', entityType: 'MASTER', entityName: itemData.name, details: `Item ${itemData.name} updated in catalogue.` });
      } else {
        setItems(prev => [...prev, { ...itemData, id: itemId }]);
        addAuditLog({ action: 'CREATE', entityType: 'MASTER', entityName: itemData.name, details: `New item ${itemData.name} initialized in catalogue.` });
        
        if (initialBatch && initialBatch.batchNo) {
          const newBatch: Batch = {
            ...initialBatch,
            id: `b-${Date.now()}`,
            itemId: itemId
          };
          setBatches(prev => [...prev, newBatch]);
          addAuditLog({ action: 'CREATE', entityType: 'MASTER', entityName: newBatch.batchNo, details: `Opening batch ${newBatch.batchNo} instantiated for ${itemData.name}.` });
        }
      }
      setIsModalOpen(false);
      setEditingId(null);
    };

    const handleBatchSubmit = (data: Omit<Batch, 'id'>) => {
      if (editingId) {
        setBatches(prev => prev.map(b => b.id === editingId ? { ...data, id: editingId } : b));
        addAuditLog({ action: 'UPDATE', entityType: 'MASTER', entityName: data.batchNo, details: `Batch ${data.batchNo} modified.` });
      } else {
        const newBatch: Batch = { ...data, id: `b-${Date.now()}` };
        setBatches(prev => [...prev, newBatch]);
        addAuditLog({ action: 'CREATE', entityType: 'MASTER', entityName: data.batchNo, details: `New batch ${data.batchNo} registered.` });
      }
      setIsModalOpen(false);
      setEditingId(null);
    };

    const deleteBatch = (id: string, batchNo: string) => {
      if(confirm(`Confirm permanent purge of Batch Serial: ${batchNo}?`)) {
        setBatches(prev => prev.filter(b => b.id !== id));
        addAuditLog({ action: 'DELETE', entityType: 'MASTER', entityName: batchNo, details: `Batch ${batchNo} removed from registry.` });
      }
    };

    const getRowActions = (row: any): ActionItem[] => {
      const actions: ActionItem[] = [
        { 
          label: row.isSystem ? 'View Details' : 'Edit', 
          icon: row.isSystem ? '👁️' : '✏️',
          onClick: () => { setEditingId(row.id); setIsModalOpen(true); },
          variant: 'primary'
        }
      ];

      if (activeTab === 'ITEMS' && row.isBatchTracked) {
        actions.push({
          label: expandedItemId === row.id ? 'Hide Batches' : 'Manage Batches',
          icon: '📦',
          onClick: () => setExpandedItemId(expandedItemId === row.id ? null : row.id),
          variant: 'primary'
        });
      }

      if (!row.isSystem) {
        actions.push({ 
          label: 'Delete', 
          icon: '🗑️',
          onClick: () => { 
            const msg = activeTab === 'TAX_GROUPS' 
              ? `Purge tax group "${row.name}"? This action cannot be reversed.`
              : activeTab === 'GROUPS'
              ? `Confirm permanent purge of Account Group: ${row.name}?`
              : activeTab === 'BATCHES'
              ? `Purge Batch Serial: ${row.batchNo}?`
              : `Confirm permanent purge of master record: ${row.name}?`;

            if(confirm(msg)) {
                if (activeTab === 'TAX_CONFIGS') setTaxes(prev => prev.filter(t => t.id !== row.id));
                else if (activeTab === 'TAX_GROUPS') setTaxGroups(prev => prev.filter(tg => tg.id !== row.id));
                else if (activeTab === 'ITEMS') {
                   setItems(prev => prev.filter(i => i.id !== row.id));
                   setBatches(prev => prev.filter(b => b.itemId !== row.id));
                }
                else if (activeTab === 'BATCHES') setBatches(prev => prev.filter(b => b.id !== row.id));
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
            {activeTab !== 'LEDGERS' && (
              <button 
                onClick={() => { setEditingId(null); setIsModalOpen(true); }} 
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
              >
                Add {activeTab === 'ITEMS' ? 'Catalogue Item' : activeTab === 'GROUPS' ? 'Account Group' : activeTab === 'BATCHES' ? 'Inventory Batch' : (activeTab === 'TAX_GROUPS' ? 'Tax Group' : activeTab.split('_')[0].slice(0, -1))}
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
              onClick={() => { setActiveTab(tab.id as any); setEditingId(null); setSearchTerm(''); setItemFilterId(null); setExpandedItemId(null); }} 
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-t-xl border-b-2 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'LEDGERS' ? (
          <LedgerManager 
            ledgers={ledgers} 
            setLedgers={setLedgers} 
            accountGroups={accountGroups} 
            onQuickGroupAdd={handleQuickGroupAdd}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-slate-100 flex flex-col space-y-6 bg-slate-50/30">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-2xl group w-full">
                    <input 
                      type="text" 
                      placeholder={activeTab === 'ITEMS' ? "Search Catalogue by Name or HSN..." : activeTab === 'GROUPS' ? "Search groups..." : activeTab === 'BATCHES' ? "Search global batches..." : (activeTab === 'TAX_GROUPS' ? "Search tax frameworks..." : "Search...")}
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-xs font-black shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all placeholder-slate-400 italic" 
                    />
                    <svg className="w-5 h-5 text-slate-300 absolute left-3 top-2.5 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  {filteredData.length} Matches Found
                </div>
              </div>

              {activeTab === 'ITEMS' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Category Node</label>
                    <select value={itemCategoryFilter} onChange={e => setItemCategoryFilter(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-indigo-600 outline-none">
                      <option value="ALL">All Categories</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">UoM Profile</label>
                    <select value={itemUnitFilter} onChange={e => setItemUnitFilter(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-indigo-600 outline-none">
                      <option value="ALL">All Units</option>
                      {UNIT_MEASURES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Statutory State</label>
                    <div className="flex bg-white border border-slate-200 p-0.5 rounded-xl">
                      {(['ALL', 'TAXABLE', 'EXEMPT'] as const).map(t => (
                        <button key={t} onClick={() => setItemTaxFilter(t)} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black transition-all ${itemTaxFilter === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end pb-0.5">
                    <button onClick={() => { setItemCategoryFilter('ALL'); setItemUnitFilter('ALL'); setItemTaxFilter('ALL'); setSearchTerm(''); }} className="w-full py-2 bg-slate-200 hover:bg-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Reset</button>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left">
                 <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400 border-b border-slate-800">
                   <tr>
                      <th className="px-6 py-4 cursor-pointer group/th hover:bg-slate-800 transition-colors" onClick={() => handleSort('name')}>
                        <div className="flex items-center">
                          {activeTab === 'BATCHES' ? 'Batch Reference' : (activeTab === 'TAX_GROUPS' ? 'Statutory Framework' : 'Catalogue Designation')} <SortIndicator field="name" />
                        </div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer group/th hover:bg-slate-800 transition-colors" onClick={() => handleSort('category')}>
                        {activeTab === 'TAX_GROUPS' ? 'Framework Descriptor' : 'Classification'} <SortIndicator field="category" />
                      </th>
                      {activeTab === 'ITEMS' && (
                        <>
                          <th className="px-6 py-4 text-center">Batch Vol</th>
                          <th className="px-6 py-4 text-center">Unit</th>
                        </>
                      )}
                      {activeTab === 'BATCHES' && (
                        <>
                          <th className="px-6 py-4 text-center">Available Stock</th>
                          <th className="px-6 py-4 text-center">MFG / EXP Boundaries</th>
                        </>
                      )}
                      {activeTab === 'TAX_GROUPS' && <th className="px-6 py-4 text-center">Linked Components</th>}
                      {activeTab === 'TAX_CONFIGS' && <th className="px-6 py-4">Rate</th>}
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {filteredData.map(row => {
                     const itemBatches = batches.filter(b => b.itemId === row.id);
                     const isExpanded = expandedItemId === row.id;
                     const linkedTaxesCount = activeTab === 'TAX_GROUPS' ? taxes.filter(t => t.groupId === row.id).length : 0;

                     return (
                       <React.Fragment key={row.id}>
                         <tr className={`hover:bg-indigo-50/20 transition-colors group border-b border-slate-50 last:border-0 ${isExpanded ? 'bg-indigo-50/10' : ''}`}>
                           <td className="px-6 py-3.5">
                              <div className="font-black text-slate-800 italic uppercase tracking-tight text-xs flex items-center">
                                {activeTab === 'BATCHES' ? row.batchNo : row.name}
                                {row.isSystem && <span className="ml-2 text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded-lg tracking-widest">SYS</span>}
                              </div>
                              {row.hsnCode && <div className="text-[8px] font-bold text-slate-300 uppercase mt-0.5">HSN: {row.hsnCode}</div>}
                              {activeTab === 'BATCHES' && <div className="text-[8px] font-black text-indigo-400 uppercase mt-0.5 italic">Item: {items.find(i => i.id === row.itemId)?.name}</div>}
                           </td>
                           <td className="px-6 py-3.5">
                              {activeTab === 'TAX_GROUPS' ? (
                                <span className="text-[10px] font-medium text-slate-500 line-clamp-1 italic max-w-xs">{row.description || 'Generic statutory framework...'}</span>
                              ) : (
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-500 rounded text-[9px] font-black uppercase tracking-tighter border border-indigo-100 italic">
                                    {activeTab === 'BATCHES' ? 'Lot/Batch' : (row.group || row.category || row.nature || 'Standard')}
                                </span>
                              )}
                           </td>
                           {activeTab === 'ITEMS' && (
                              <>
                                <td className="px-6 py-3.5 text-center">
                                   {row.isBatchTracked ? (
                                     <button onClick={() => setExpandedItemId(isExpanded ? null : row.id)} className={`px-2 py-0.5 rounded-lg text-[9px] font-black tabular-nums shadow-sm transition-all ${isExpanded ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-100 text-slate-500 hover:bg-indigo-100'}`}>
                                        {itemBatches.length}
                                     </button>
                                   ) : (
                                     <span className="text-[8px] font-bold text-slate-200 uppercase">N/A</span>
                                   )}
                                </td>
                                <td className="px-6 py-3.5 text-center">
                                   <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase border border-slate-200">{row.unit}</span>
                                </td>
                              </>
                           )}
                           {activeTab === 'BATCHES' && (
                              <>
                                <td className="px-6 py-3.5 text-center font-black tabular-nums">{row.currentStock}</td>
                                <td className="px-6 py-3.5 text-center">
                                   <div className="text-[8px] font-black text-slate-400 uppercase">M: {row.mfgDate}</div>
                                   <div className="text-[8px] font-black text-indigo-400 uppercase mt-0.5">E: {row.expiryDate || 'N/A'}</div>
                                </td>
                              </>
                           )}
                           {activeTab === 'TAX_GROUPS' && (
                             <td className="px-6 py-3.5 text-center">
                               <div className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black border border-indigo-100 italic shadow-sm">
                                 {linkedTaxesCount} Shards Linked
                               </div>
                             </td>
                           )}
                           {activeTab === 'TAX_CONFIGS' && <td className="px-6 py-3.5 font-black">{row.rate}%</td>}
                           <td className="px-6 py-3.5 text-right">
                              <ActionMenu actions={getRowActions(row)} label={row.isSystem ? 'LOCKED' : 'ACTION'} />
                           </td>
                         </tr>
                         
                         {activeTab === 'ITEMS' && isExpanded && (
                           <tr className="bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                             <td colSpan={6} className="px-10 py-6 border-b border-indigo-100">
                               <div className="bg-white rounded-[2.5rem] border border-indigo-100 shadow-xl overflow-hidden">
                                  <div className="p-6 bg-slate-950 text-white flex justify-between items-center">
                                     <div className="flex items-center space-x-3">
                                        <span className="text-lg">📦</span>
                                        <h5 className="text-[11px] font-black uppercase tracking-widest italic">Batch Management: {row.name}</h5>
                                     </div>
                                     <button onClick={() => { setItemFilterId(row.id); setEditingId(null); setActiveTab('BATCHES'); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Add New Lot Shard</button>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[10px]">
                                      <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-100">
                                        <tr>
                                          <th className="px-6 py-3">Batch/Serial</th>
                                          <th className="px-6 py-3">MFG Date</th>
                                          <th className="px-6 py-3">Expiry</th>
                                          <th className="px-6 py-3 text-right">Stock</th>
                                          <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {itemBatches.map(b => (
                                          <tr key={b.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3 font-mono font-black text-indigo-600">{b.batchNo}</td>
                                            <td className="px-6 py-3 font-bold">{b.mfgDate}</td>
                                            <td className="px-6 py-3 font-bold text-rose-500">{b.expiryDate}</td>
                                            <td className="px-6 py-3 text-right font-black tabular-nums">{b.currentStock}</td>
                                            <td className="px-6 py-3 text-right flex justify-end space-x-2">
                                               <button onClick={() => { setEditingId(b.id); setActiveTab('BATCHES'); setIsModalOpen(true); }} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all" title="Edit Batch">✏️</button>
                                               <button onClick={() => deleteBatch(b.id, b.batchNo)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-all" title="Purge Batch">🗑️</button>
                                            </td>
                                          </tr>
                                        ))}
                                        {itemBatches.length === 0 && (
                                          <tr><td colSpan={5} className="py-10 text-center opacity-30 italic font-black uppercase tracking-widest">No active batches recorded.</td></tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                               </div>
                             </td>
                           </tr>
                         )}
                       </React.Fragment>
                     );
                   })}
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
                  <ItemForm initialData={editingRecord as Item} unitMeasures={unitMeasures} taxGroups={taxGroups} taxes={taxes} onQuickUnitAdd={(u) => setUnitMeasures(prev => Array.from(new Set([...prev, u])))} onCancel={() => setIsModalOpen(false)} onSubmit={handleItemSubmit} />
               )}
               {activeTab === 'BATCHES' && (
                  <BatchForm initialData={editingRecord as Batch} defaultItemId={itemFilterId || undefined} items={items} onCancel={() => { setIsModalOpen(false); if(expandedItemId) setActiveTab('ITEMS'); }} onSubmit={handleBatchSubmit} />
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
                  <button onClick={() => setIsImportModalOpen(false)} className="p-3 bg-white/10 hover:bg-rose-50 text-white rounded-full transition-all border border-white/20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <ImportExportModule items={items} setItems={setItems} forcedEntity="Inventory Items" initialFormat="CSV" onClose={() => setIsImportModalOpen(false)} />
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
              <span className="text-[10px] font-black uppercase tracking-widest">Master Overview</span>
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
                <div className="flex justify-between items-baseline">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Active Batches</span>
                    <span className="text-xl font-black italic">{batches.length}</span>
                </div>
            </div>
        </div>
      </aside>
      
      <main className="flex-1 overflow-hidden">
        {activeSubAction === AdminSubMenu.MASTERS ? <MastersManagementView /> : 
         activeSubAction === AdminSubMenu.USERS ? <UsersModule users={users} setUsers={setUsers} roles={roles} setRoles={setRoles} auditLogs={auditLogs} addAuditLog={addAuditLog} /> :
         (activeSubAction === AdminSubMenu.BACKUP || activeSubAction === AdminSubMenu.AUTOMATIC_BACKUP) ? <BackupModule initialView={activeSubAction === AdminSubMenu.AUTOMATIC_BACKUP ? 'AUTOMATIC_BACKUPS' : 'SNAPSHOTS'} /> :
         activeSubAction === AdminSubMenu.IMPORT_EXPORT ? <ImportExportModule vouchers={vouchers} setVouchers={setVouchers} items={items} setItems={setItems} ledgers={ledgers} setLedgers={setLedgers} companies={companies} setCompanies={setCompanies} /> :
         activeSubAction === AdminSubMenu.YEAR_CHANGE ? <YearChangeModule activeCompany={activeCompany} currentFY={currentFY} setCurrentFY={setCurrentFY} onClose={() => setActiveSubAction(null)} /> :
         activeSubAction === AdminSubMenu.EMAIL_GATEWAY ? <EmailGateway vouchers={vouchers} ledgers={ledgers} accountGroups={accountGroups} activeCompany={activeCompany} /> :
         <div className="bg-white rounded-3xl p-10 border border-slate-200 animate-in fade-in h-full space-y-10">
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-slate-800">Admin Command Center</h2>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">Central hub for organizational master management and statutory architecture.</p>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-l-8 border-rose-600">
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="space-y-4">
                     <div className="inline-block px-3 py-1 bg-rose-600/30 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] border border-rose-600/30">Governance Engine</div>
                     <h3 className="text-3xl font-black italic uppercase tracking-tighter">Accounting Context</h3>
                     <div className="flex items-center space-x-6">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Fiscal Cycle</span>
                           <span className="text-xl font-black text-white italic">{currentFY}</span>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Audit Stability</span>
                           <span className={`text-sm font-black uppercase tracking-widest ${isFYLocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                             {isFYLocked ? 'Locked (Audit Only)' : 'Active (Operational)'}
                           </span>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setActiveSubAction(AdminSubMenu.YEAR_CHANGE)} className="px-10 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-600 hover:text-white transition-all transform active:scale-95 border-b-4 border-slate-950 flex items-center space-x-4">
                    <span>Relocate Session</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
               </div>
               <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600 rounded-full blur-[120px] opacity-10 -mr-40 -mt-40 pointer-events-none"></div>
            </div>
         </div>
        }
      </main>
    </div>
  );
};

export default AdministrationModule;