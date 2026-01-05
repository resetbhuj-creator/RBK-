import React, { useState, useEffect, useCallback } from 'react';
import { MainMenuType, Role, User, AuditLog, AdminSubMenu, TransactionSubMenu, DisplaySubMenu, CommunicationSubMenu, HouseKeepingSubMenu, Ledger, Item, Voucher, Tax, TaxGroup, Company, Task } from './types';
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

const INITIAL_LEDGERS: Ledger[] = [
  { id: 'l1', name: 'HDFC Bank - 0012', group: 'Bank Accounts', openingBalance: 54000, type: 'Debit' },
  { id: 'l2', name: 'Cash-in-hand', group: 'Cash-in-hand', openingBalance: 1200, type: 'Debit' }
];

const INITIAL_ITEMS: Item[] = [
  { id: 'i1', name: 'MacBook Pro M3', category: 'Electronics', unit: 'Nos', salePrice: 2400, hsnCode: '8471', gstRate: 18 }
];

const INITIAL_VOUCHERS: Voucher[] = [
  { id: 'SL/23-24/00001', type: 'Sales', date: '2023-11-20', party: 'Acme Retailers', amount: 12500, status: 'Posted', narration: 'Bulk sale of laptops', subTotal: 10593.22, taxTotal: 1906.78, items: [{ id: 'vi1', itemId: 'i1', name: 'MacBook Pro M3', hsn: '8471', qty: 5, unit: 'Nos', rate: 2118.64, amount: 10593.22 }] }
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

  // Core Data State
  const [companies, setCompanies] = useState<Company[]>(() => JSON.parse(localStorage.getItem('nexus_erp_companies') || JSON.stringify(INITIAL_COMPANIES)));
  const [ledgers, setLedgers] = useState<Ledger[]>(() => JSON.parse(localStorage.getItem('nexus_erp_ledgers') || JSON.stringify(INITIAL_LEDGERS)));
  const [items, setItems] = useState<Item[]>(() => JSON.parse(localStorage.getItem('nexus_erp_items') || JSON.stringify(INITIAL_ITEMS)));
  const [vouchers, setVouchers] = useState<Voucher[]>(() => JSON.parse(localStorage.getItem('nexus_erp_vouchers') || JSON.stringify(INITIAL_VOUCHERS)));
  
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
    localStorage.setItem('nexus_erp_ledgers', JSON.stringify(ledgers));
    localStorage.setItem('nexus_erp_items', JSON.stringify(items));
    localStorage.setItem('nexus_erp_vouchers', JSON.stringify(vouchers));
    localStorage.setItem('nexus_erp_users', JSON.stringify(users));
    localStorage.setItem('nexus_erp_roles', JSON.stringify(roles));
    localStorage.setItem('nexus_erp_audit_logs', JSON.stringify(auditLogs));
    localStorage.setItem('nexus_erp_current_company_id', currentCompanyId);
    localStorage.setItem('nexus_erp_current_fy', currentFY);
    localStorage.setItem('nexus_erp_fy_locked', String(isFYLocked));
  }, [companies, ledgers, items, vouchers, users, roles, auditLogs, currentCompanyId, currentFY, isFYLocked]);

  const addAuditLog = useCallback((logData: Omit<AuditLog, 'id' | 'timestamp' | 'actor'> & { actor?: string }) => {
    const newLog: AuditLog = {
      ...logData,
      id: `EV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      actor: logData.actor || 'Vance Alexander'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, []);

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
            companies={companies} ledgers={ledgers} setLedgers={setLedgers} items={items} setItems={setItems}
            taxes={[]} setTaxes={() => {}} taxGroups={[]} setTaxGroups={() => {}} vouchers={vouchers} setVouchers={setVouchers}
            unitMeasures={unitMeasures} setUnitMeasures={setUnitMeasures}
            isFYLocked={isFYLocked}
          />
        );
      case MainMenuType.TRANSACTION:
        return (
          <TransactionModule 
            activeCompany={activeCompany} currentFY={currentFY} isReadOnly={isFYLocked} activeSubAction={activeTransactionSubMenu} setActiveSubAction={setActiveTransactionSubMenu}
            ledgers={ledgers} items={items} vouchers={vouchers} setVouchers={setVouchers} onViewVoucher={setViewingVoucherId}
          />
        );
      case MainMenuType.DISPLAY:
        return (
          <DisplayModule 
            activeCompany={activeCompany} activeSubAction={activeDisplaySubMenu} setActiveSubAction={setActiveDisplaySubMenu}
            ledgers={ledgers} vouchers={vouchers} items={items} taxes={[]} taxGroups={[]}
            onViewVoucher={setViewingVoucherId}
          />
        );
      case MainMenuType.COMMUNICATION:
        return <CommunicationModule activeCompany={activeCompany} activeSubAction={activeCommSubMenu} setActiveSubAction={setActiveCommSubMenu} vouchers={vouchers} ledgers={ledgers} onViewVoucher={setViewingVoucherId} />;
      case MainMenuType.HOUSE_KEEPING:
        return <HouseKeepingModule activeCompany={activeCompany} activeSubAction={activeHouseKeepingSubMenu} setActiveSubAction={setActiveHouseKeepingSubMenu} auditLogs={auditLogs} ledgers={ledgers} vouchers={vouchers} setVouchers={setVouchers} />;
      default:
        return <ModulePlaceholder type={activeMenu} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu}
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
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
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

        <AIAssistant vouchers={vouchers} ledgers={ledgers} activeCompany={activeCompany} />
        {voucherToView && (
          <VoucherModal voucher={voucherToView} activeCompany={activeCompany} onClose={() => setViewingVoucherId(null)} />
        )}
        
        <footer className="h-6 bg-indigo-900 text-white flex items-center justify-between px-4 text-[9px] font-black uppercase tracking-widest shrink-0 border-t border-white/5">
           <div className="flex items-center space-x-4">
              <span className="flex items-center"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse"></div> Secure Node: Operational</span>
              <span className="opacity-30">|</span>
              <span>Draft Buffer: {vouchers.filter(v => v.status === 'Draft').length} Objects</span>
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