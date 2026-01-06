
import React, { useState, useEffect, useCallback } from 'react';
import { MainMenuType, Role, User, AuditLog, AdminSubMenu, TransactionSubMenu, DisplaySubMenu, CommunicationSubMenu, HouseKeepingSubMenu, Ledger, Item, Voucher, Tax, TaxGroup, Company, Task, AccountGroup, Batch } from './types';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RibbonMenu from './components/RibbonMenu';
import Dashboard from './components/Dashboard';
import ModulePlaceholder from './components/ModulePlaceholder';
import CompanyModule from './components/CompanyModule';
import AdministrationModule from './components/AdministrationModule';
import TransactionModule from './components/TransactionModule';
import DisplayModule from './components/DisplayModule';
import CommunicationModule from './components/CommunicationModule';
import HouseKeepingModule from './components/HouseKeepingModule';
import VoucherModal from './components/VoucherModal';
import AIAssistant from './components/AIAssistant';
import CommandPalette from './components/CommandPalette';
import { UNIT_MEASURES as DEFAULT_UNITS } from './constants';

const INITIAL_ROLES: Role[] = [
  { id: 'r-sys-01', name: 'Super Admin', permissions: { company: 'all', administration: 'all', transaction: 'all', display: 'all' }, isSystem: true, description: 'Institutional oversight with full sovereign authority over all system modules and data vaults.' },
  { id: 'r-sys-02', name: 'Admin', permissions: { company: 'write', administration: 'write', transaction: 'write', display: 'all' }, isSystem: true, description: 'Standard administrative node for day-to-day management of organizational masters and users.' },
  { id: 'r-sys-03', name: 'Auditor', permissions: { company: 'read', administration: 'none', transaction: 'none', display: 'all' }, isSystem: true, description: 'Read-only access tier for external compliance and statutory review processes.' }
];

const INITIAL_USERS: User[] = [
  { id: 'u-001', name: 'Vance Alexander', email: 'vance@nexus-core.net', role: 'Super Admin', status: 'Active', lastLogin: new Date().toISOString(), permissions: INITIAL_ROLES[0].permissions }
];

const INITIAL_COMPANIES = [
  { 
    id: '1', 
    name: 'Nexus Global Industries Ltd.', 
    years: ['2023 - 2024'], 
    country: 'India', 
    state: 'Maharashtra', 
    currency: 'INR (₹)', 
    taxLaw: 'Indian GST', 
    logo: 'N', 
    taxId: '27AAAAA0000A1Z5', 
    address: 'Nexus Tower, BKC, Mumbai - 400051',
    dataPath: 'C:\\NexusERP\\Data\\Company001',
    fyStartDate: '2023-04-01',
    booksBeginDate: '2023-04-01',
    approvalThreshold: 10000
  }
];

const INITIAL_ACCOUNT_GROUPS: AccountGroup[] = [
  { id: 'ag1', name: 'Bank Accounts', nature: 'Assets', isSystem: true },
  { id: 'ag2', name: 'Cash-in-hand', nature: 'Assets', isSystem: true },
  { id: 'ag3', name: 'Indirect Expenses', nature: 'Expenses', isSystem: true },
  { id: 'ag4', name: 'Sundry Debtors', nature: 'Assets', isSystem: true },
  { id: 'ag5', name: 'Sundry Creditors', nature: 'Liabilities', isSystem: true },
  { id: 'ag6', name: 'Sales Accounts', nature: 'Income', isSystem: true },
  { id: 'ag7', name: 'Purchase Accounts', nature: 'Expenses', isSystem: true }
];

const INITIAL_TAX_GROUPS: TaxGroup[] = [
  { id: 'tg1', name: 'GST 18%', description: 'Standard GST slab for services and most electronic goods.', isSystem: true },
  { id: 'tg2', name: 'GST 12%', description: 'GST slab for processed food and standard consumer goods.', isSystem: true },
  { id: 'tg3', name: 'GST 5%', description: 'GST slab for essential commodities.', isSystem: true }
];

const INITIAL_TAXES: Tax[] = [
  { id: 't1', name: 'Output CGST @ 9%', rate: 9, type: 'CGST', classification: 'Output', supplyType: 'Local', groupId: 'tg1' },
  { id: 't2', name: 'Output SGST @ 9%', rate: 9, type: 'SGST', classification: 'Output', supplyType: 'Local', groupId: 'tg1' },
  { id: 't3', name: 'Output IGST @ 18%', rate: 18, type: 'IGST', classification: 'Output', supplyType: 'Central', groupId: 'tg1' },
  { id: 't4', name: 'Input CGST @ 6%', rate: 6, type: 'CGST', classification: 'Input', supplyType: 'Local', groupId: 'tg2' },
  { id: 't5', name: 'Input SGST @ 6%', rate: 6, type: 'SGST', classification: 'Input', supplyType: 'Local', groupId: 'tg2' }
];

const INITIAL_LEDGERS: Ledger[] = [
  { id: 'l1', name: 'HDFC Bank - 0012', group: 'Bank Accounts', openingBalance: 54000, type: 'Debit' },
  { id: 'l2', name: 'Cash-in-hand', group: 'Cash-in-hand', openingBalance: 1200, type: 'Debit' },
  { id: 'l3', name: 'Office Rent', group: 'Indirect Expenses', openingBalance: 0, type: 'Debit' },
  { id: 'l4', name: 'Acme Retailers', group: 'Sundry Debtors', openingBalance: 0, type: 'Debit' },
  { id: 'l5', name: 'Global Suppliers', group: 'Sundry Creditors', openingBalance: 0, type: 'Credit' }
];

const INITIAL_ITEMS: Item[] = [
  { id: 'i1', name: 'MacBook Pro M3', category: 'Electronics', unit: 'Nos', salePrice: 2400, costPrice: 1800, hsnCode: '8471', gstRate: 18, taxGroupId: 'tg1', currentStock: 45, isBatchTracked: true },
  { id: 'i2', name: 'iPhone 15 Pro', category: 'Electronics', unit: 'Nos', salePrice: 1100, costPrice: 750, hsnCode: '8517', gstRate: 18, taxGroupId: 'tg1', currentStock: 120, isBatchTracked: true },
  { id: 'i3', name: 'Leather Messenger Bag', category: 'Consumables', unit: 'Nos', salePrice: 150, costPrice: 45, hsnCode: '4202', gstRate: 12, taxGroupId: 'tg2', currentStock: 12, isBatchTracked: false }
];

const INITIAL_BATCHES: Batch[] = [
  { id: 'b1', itemId: 'i1', batchNo: 'MBP-2023-001', mfgDate: '2023-10-01', expiryDate: '2025-10-01', currentStock: 25 },
  { id: 'b2', itemId: 'i1', batchNo: 'MBP-2023-002', mfgDate: '2023-11-15', expiryDate: '2025-11-15', currentStock: 20 },
  { id: 'b3', itemId: 'i2', batchNo: 'IP15-Batch-A', mfgDate: '2023-09-20', expiryDate: '2026-09-20', currentStock: 120 }
];

const INITIAL_VOUCHERS: Voucher[] = [
  { id: 'SL/23-24/00001', type: 'Sales', date: '2023-11-20', party: 'Acme Retailers', amount: 12500, status: 'Posted', narration: 'Bulk sale of laptops', subTotal: 10593.22, taxTotal: 1906.78, items: [{ id: 'vi1', itemId: 'i1', name: 'MacBook Pro M3', hsn: '8471', qty: 5, unit: 'Nos', rate: 2118.64, amount: 10593.22, igstRate: 18, taxAmount: 1906.78, batchNo: 'MBP-2023-001' }] }
];

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<MainMenuType>(MainMenuType.DASHBOARD);
  const [activeAdminSubMenu, setActiveAdminSubMenu] = useState<AdminSubMenu | null>(null);
  const [activeTransactionSubMenu, setActiveTransactionSubMenu] = useState<TransactionSubMenu | null>(null);
  const [activeDisplaySubMenu, setActiveDisplaySubMenu] = useState<DisplaySubMenu | null>(null);
  const [activeCommSubMenu, setActiveCommSubMenu] = useState<CommunicationSubMenu | null>(null);
  const [activeHouseKeepingSubMenu, setActiveHouseKeepingSubMenu] = useState<HouseKeepingSubMenu | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
  const [viewingVoucherId, setViewingVoucherId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Core Data State
  const [companies, setCompanies] = useState<Company[]>(() => JSON.parse(localStorage.getItem('nexus_erp_companies') || JSON.stringify(INITIAL_COMPANIES)));
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>(() => JSON.parse(localStorage.getItem('nexus_erp_account_groups') || JSON.stringify(INITIAL_ACCOUNT_GROUPS)));
  const [ledgers, setLedgers] = useState<Ledger[]>(() => JSON.parse(localStorage.getItem('nexus_erp_ledgers') || JSON.stringify(INITIAL_LEDGERS)));
  const [items, setItems] = useState<Item[]>(() => JSON.parse(localStorage.getItem('nexus_erp_items') || JSON.stringify(INITIAL_ITEMS)));
  const [batches, setBatches] = useState<Batch[]>(() => JSON.parse(localStorage.getItem('nexus_erp_batches') || JSON.stringify(INITIAL_BATCHES)));
  const [vouchers, setVouchers] = useState<Voucher[]>(() => JSON.parse(localStorage.getItem('nexus_erp_vouchers') || JSON.stringify(INITIAL_VOUCHERS)));
  const [taxes, setTaxes] = useState<Tax[]>(() => JSON.parse(localStorage.getItem('nexus_erp_taxes') || JSON.stringify(INITIAL_TAXES)));
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>(() => JSON.parse(localStorage.getItem('nexus_erp_tax_groups') || JSON.stringify(INITIAL_TAX_GROUPS)));
  
  // IAM State
  const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('nexus_erp_users') || JSON.stringify(INITIAL_USERS)));
  const [roles, setRoles] = useState<Role[]>(() => JSON.parse(localStorage.getItem('nexus_erp_roles') || JSON.stringify(INITIAL_ROLES)));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => JSON.parse(localStorage.getItem('nexus_erp_audit_logs') || '[]'));

  const [unitMeasures, setUnitMeasures] = useState<string[]>(() => JSON.parse(localStorage.getItem('nexus_erp_unit_measures') || JSON.stringify(DEFAULT_UNITS)));
  const [currentCompanyId, setCurrentCompanyId] = useState(() => localStorage.getItem('nexus_erp_current_company_id') || '1');
  const [currentFY, setCurrentFY] = useState(() => localStorage.getItem('nexus_erp_current_fy') || '2023 - 2024');
  const [isFYLocked, setIsFYLocked] = useState(() => localStorage.getItem('nexus_erp_fy_locked') === 'true');

  // Persistence Sync
  useEffect(() => {
    localStorage.setItem('nexus_erp_companies', JSON.stringify(companies));
    localStorage.setItem('nexus_erp_account_groups', JSON.stringify(accountGroups));
    localStorage.setItem('nexus_erp_ledgers', JSON.stringify(ledgers));
    localStorage.setItem('nexus_erp_items', JSON.stringify(items));
    localStorage.setItem('nexus_erp_batches', JSON.stringify(batches));
    localStorage.setItem('nexus_erp_vouchers', JSON.stringify(vouchers));
    localStorage.setItem('nexus_erp_taxes', JSON.stringify(taxes));
    localStorage.setItem('nexus_erp_tax_groups', JSON.stringify(taxGroups));
    localStorage.setItem('nexus_erp_users', JSON.stringify(users));
    localStorage.setItem('nexus_erp_roles', JSON.stringify(roles));
    localStorage.setItem('nexus_erp_audit_logs', JSON.stringify(auditLogs));
    localStorage.setItem('nexus_erp_current_company_id', currentCompanyId);
    localStorage.setItem('nexus_erp_current_fy', currentFY);
    localStorage.setItem('nexus_erp_fy_locked', String(isFYLocked));
  }, [companies, accountGroups, ledgers, items, batches, vouchers, taxes, taxGroups, users, roles, auditLogs, currentCompanyId, currentFY, isFYLocked]);

  // Global Key Handler
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const addAuditLog = useCallback((logData: Omit<AuditLog, 'id' | 'timestamp' | 'actor'> & { actor?: string }) => {
    const newLog: AuditLog = {
      ...logData,
      id: `EV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      actor: logData.actor || 'Vance Alexander'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, []);

  const generateVoucherId = useCallback((type: string) => {
    const prefixMap: Record<string, string> = {
      'Sales': 'SL', 'Purchase': 'PR', 'Sales Return': 'SR', 'Purchase Return': 'PR-RET',
      'Payment': 'PY', 'Receipt': 'RC', 'Contra': 'CN', 'Journal': 'JR',
      'Delivery Note': 'DN', 'Goods Receipt Note (GRN)': 'GRN', 'Stock Adjustment': 'SA', 'Purchase Order': 'PO',
      'Credit Note': 'CRN', 'Debit Note': 'DRN'
    };
    const prefix = prefixMap[type] || 'VCH';
    const yearParts = currentFY.split(' - ').map(y => y.trim().slice(-2));
    const yearPart = yearParts.join('-');
    const yearIdentifier = `/${yearPart}/`;
    
    const relevantVouchers = vouchers.filter(v => v.type === type && v.id.includes(yearIdentifier));
    
    let maxNum = 0;
    relevantVouchers.forEach(v => {
      const parts = v.id.split('/');
      const serialPart = parts[parts.length - 1];
      const num = parseInt(serialPart);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    });

    const nextNum = (maxNum + 1).toString().padStart(5, '0');
    return `${prefix}/${yearPart}/${nextNum}`;
  }, [vouchers, currentFY]);

  const handlePostVoucher = (data: Omit<Voucher, 'id' | 'status'> & { status?: Voucher['status'] }) => {
    let assignedId = generateVoucherId(data.type);
    
    let attempts = 0;
    while (vouchers.some(v => v.id === assignedId) && attempts < 10) {
      const parts = assignedId.split('/');
      const nextNum = (parseInt(parts[parts.length - 1]) + 1).toString().padStart(5, '0');
      assignedId = `${parts[0]}/${parts[1]}/${nextNum}`;
      attempts++;
    }

    const newVch: Voucher = { ...data, id: assignedId, status: data.status || 'Posted' };
    setVouchers(prev => [newVch, ...prev]);
  };

  const activeCompany = companies.find((c: any) => c.id === currentCompanyId) || { name: 'None Selected' };
  const voucherToView = viewingVoucherId ? vouchers.find(v => v.id === viewingVoucherId) : null;

  const handleSetCurrentFY = (fy: string, locked?: boolean) => {
    setCurrentFY(fy);
    if (locked !== undefined) setIsFYLocked(locked);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case MainMenuType.DASHBOARD:
        return <Dashboard activeCompany={activeCompany} vouchers={vouchers} onViewVoucher={setViewingVoucherId} tasks={[]} setTasks={() => {}} />;
      case MainMenuType.COMPANY:
        return <CompanyModule companies={companies} setCompanies={setCompanies} currentCompanyId={currentCompanyId} setCurrentCompanyId={setCurrentCompanyId} currentFY={currentFY} setCurrentFY={handleSetCurrentFY} addAuditLog={addAuditLog} />;
      case MainMenuType.ADMINISTRATION:
        return (
          <AdministrationModule 
            users={users} setUsers={setUsers} 
            roles={roles} setRoles={setRoles} 
            auditLogs={auditLogs} addAuditLog={addAuditLog} 
            activeCompany={activeCompany} currentFY={currentFY} 
            activeSubAction={activeAdminSubMenu} setActiveSubAction={setActiveAdminSubMenu} 
            setCurrentFY={handleSetCurrentFY}
            companies={companies} ledgers={ledgers} setLedgers={setLedgers} 
            accountGroups={accountGroups} setAccountGroups={setAccountGroups}
            items={items} setItems={setItems}
            batches={batches} setBatches={setBatches}
            taxes={taxes} setTaxes={setTaxes} taxGroups={taxGroups} setTaxGroups={setTaxGroups} vouchers={vouchers} setVouchers={setVouchers}
            unitMeasures={unitMeasures} setUnitMeasures={setUnitMeasures}
            isFYLocked={isFYLocked}
          />
        );
      case MainMenuType.TRANSACTION:
        return (
          <TransactionModule 
            /* Fixed missing setActiveSubAction parameter on line 246 by passing setActiveTransactionSubMenu */
            activeCompany={activeCompany} currentFY={currentFY} isReadOnly={isFYLocked} activeSubAction={activeTransactionSubMenu} setActiveSubAction={setActiveTransactionSubMenu}
            ledgers={ledgers} items={items} batches={batches} vouchers={vouchers} setVouchers={setVouchers} onViewVoucher={setViewingVoucherId}
          />
        );
      case MainMenuType.DISPLAY:
        return (
          <DisplayModule 
            activeCompany={activeCompany} activeSubAction={activeDisplaySubMenu} setActiveSubAction={setActiveDisplaySubMenu}
            ledgers={ledgers} vouchers={vouchers} items={items} batches={batches} taxes={taxes} taxGroups={taxGroups}
            onViewVoucher={setViewingVoucherId}
            onPostVoucher={handlePostVoucher}
          />
        );
      case MainMenuType.COMMUNICATION:
        return <CommunicationModule activeCompany={activeCompany} activeSubAction={activeCommSubMenu} setActiveSubAction={setActiveCommSubMenu} vouchers={vouchers} ledgers={ledgers} onViewVoucher={setViewingVoucherId} />;
      case MainMenuType.HOUSE_KEEPING:
        /* Fixed property name from setActiveHouseKeepingSubMenu to setActiveSubAction on line 261 and corrected missing state setter value */
        return <HouseKeepingModule activeCompany={activeCompany} activeSubAction={activeHouseKeepingSubMenu} setActiveSubAction={setActiveHouseKeepingSubMenu} auditLogs={auditLogs} ledgers={ledgers} vouchers={vouchers} setVouchers={setVouchers} onViewVoucher={setViewingVoucherId} />;
      default:
        return <ModulePlaceholder type={activeMenu} />;
    }
  };

  const handleSidebarMenuChange = (menu: MainMenuType) => {
    setActiveMenu(menu);
    setActiveAdminSubMenu(null);
    setActiveTransactionSubMenu(null);
    setActiveDisplaySubMenu(null);
    setActiveCommSubMenu(null);
    setActiveHouseKeepingSubMenu(null);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={handleSidebarMenuChange}
        activeAdminSubMenu={activeAdminSubMenu} setActiveAdminSubMenu={setActiveAdminSubMenu}
        activeTransactionSubMenu={activeTransactionSubMenu} setActiveTransactionSubMenu={setActiveTransactionSubMenu}
        activeDisplaySubMenu={activeDisplaySubMenu} setActiveDisplaySubMenu={setActiveDisplaySubMenu}
        activeCommSubMenu={activeCommSubMenu} setActiveCommSubMenu={setActiveCommSubMenu}
        activeHouseKeepingSubMenu={activeHouseKeepingSubMenu} setActiveHouseKeepingSubMenu={setActiveHouseKeepingSubMenu}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeCompany={activeCompany}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          title={activeMenu} 
          activeCompanyName={activeCompany.name} 
          currentFY={currentFY} 
          isFYLocked={isFYLocked} 
          vouchers={vouchers}
          onViewVoucher={setViewingVoucherId}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenPalette={() => setIsCommandPaletteOpen(true)}
        />
        
        <RibbonMenu 
          activeMenu={activeMenu} 
          setActiveMenu={setActiveMenu}
          activeAdminSubMenu={activeAdminSubMenu} setActiveAdminSubMenu={setActiveAdminSubMenu}
          activeTransactionSubMenu={activeTransactionSubMenu} setActiveTransactionSubMenu={setActiveTransactionSubMenu}
          activeDisplaySubMenu={activeDisplaySubMenu} setActiveDisplaySubMenu={setActiveDisplaySubMenu}
          activeCommSubMenu={activeCommSubMenu} setActiveCommSubMenu={setActiveCommSubMenu}
          activeHouseKeepingSubMenu={activeHouseKeepingSubMenu} setActiveHouseKeepingSubMenu={setActiveHouseKeepingSubMenu}
          isCollapsed={isRibbonCollapsed}
          setIsCollapsed={setIsRibbonCollapsed}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar scroll-smooth bg-slate-100/50">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {renderContent()}
          </div>
        </main>

        <AIAssistant vouchers={vouchers} ledgers={ledgers} activeCompany={activeCompany} onViewVoucher={setViewingVoucherId} />
        
        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          vouchers={vouchers}
          ledgers={ledgers}
          onNavigate={handleSidebarMenuChange}
          onViewVoucher={setViewingVoucherId}
        />

        {voucherToView && (
          <VoucherModal voucher={voucherToView} activeCompany={activeCompany} onClose={() => setViewingVoucherId(null)} />
        )}
        
        <footer className="h-6 bg-indigo-900 text-white flex items-center justify-between px-4 text-[9px] font-black uppercase tracking-widest shrink-0 border-t border-white/5">
           <div className="flex items-center space-x-4">
              <span className="flex items-center"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse"></div> Secure Node: Operational</span>
              <span className="opacity-30">|</span>
              <span>Draft Buffer: {vouchers.filter(v => v.status === 'Draft').length} Objects</span>
              <span className="opacity-30 ml-4">Press CMD+K for Global Search</span>
           </div>
           <div className="flex items-center space-x-4">
              <span>Thread Integrity: Verified</span>
              <span className="opacity-30">|</span>
              <span>Cluster: US-EAST-1</span>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
