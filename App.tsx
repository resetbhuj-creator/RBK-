import React, { useState, useEffect, useCallback } from 'react';
import { MainMenuType, Role, User, AuditLog, AdminSubMenu, TransactionSubMenu, DisplaySubMenu, CommunicationSubMenu, HouseKeepingSubMenu, Ledger, Company, AccountGroup, Voucher } from './types';
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
import CommandPalette from './components/CommandPalette';
import { UNIT_MEASURES as DEFAULT_UNITS } from './constants';

const INITIAL_ROLES: Role[] = [
  { id: 'r-sys-01', name: 'Super Admin', permissions: { company: 'all', administration: 'all', transaction: 'all', display: 'all' }, isSystem: true, description: 'Institutional oversight.' },
  { id: 'r-sys-02', name: 'Admin', permissions: { company: 'write', administration: 'write', transaction: 'write', display: 'all' }, isSystem: true },
  { id: 'r-sys-03', name: 'Auditor', permissions: { company: 'read', administration: 'none', transaction: 'none', display: 'all' }, isSystem: true }
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

const INITIAL_COMPANIES = [
  { id: '1', name: 'Nexus Global Industries Ltd.', years: ['2023 - 2024'], country: 'India', state: 'Maharashtra', currency: 'INR (₹)', logo: 'N', dataPath: 'C:\\Nexus\\Data', fyStartDate: '2023-04-01', booksBeginDate: '2023-04-01' }
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [viewingVoucherId, setViewingVoucherId] = useState<string | null>(null);

  // Persistence logic (Mocked for brevity)
  const [companies, setCompanies] = useState<Company[]>(() => JSON.parse(localStorage.getItem('nx_companies') || JSON.stringify(INITIAL_COMPANIES)));
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>(() => JSON.parse(localStorage.getItem('nx_groups') || JSON.stringify(INITIAL_ACCOUNT_GROUPS)));
  const [ledgers, setLedgers] = useState<Ledger[]>(() => JSON.parse(localStorage.getItem('nx_ledgers') || '[]'));
  const [vouchers, setVouchers] = useState<Voucher[]>(() => JSON.parse(localStorage.getItem('nx_vouchers') || '[]'));
  const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('nx_users') || JSON.stringify([{ id: 'u1', name: 'Vance Alexander', email: 'vance@nexus.net', role: 'Super Admin', status: 'Active', permissions: INITIAL_ROLES[0].permissions }])));
  const [roles, setRoles] = useState<Role[]>(() => JSON.parse(localStorage.getItem('nx_roles') || JSON.stringify(INITIAL_ROLES)));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => JSON.parse(localStorage.getItem('nx_audit') || '[]'));

  const [currentCompanyId, setCurrentCompanyId] = useState('1');
  const [currentFY, setCurrentFY] = useState('2023 - 2024');
  const [isFYLocked, setIsFYLocked] = useState(false);

  useEffect(() => {
    localStorage.setItem('nx_companies', JSON.stringify(companies));
    localStorage.setItem('nx_groups', JSON.stringify(accountGroups));
    localStorage.setItem('nx_ledgers', JSON.stringify(ledgers));
    localStorage.setItem('nx_vouchers', JSON.stringify(vouchers));
    localStorage.setItem('nx_users', JSON.stringify(users));
    localStorage.setItem('nx_roles', JSON.stringify(roles));
    localStorage.setItem('nx_audit', JSON.stringify(auditLogs));
  }, [companies, accountGroups, ledgers, vouchers, users, roles, auditLogs]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addAuditLog = useCallback((logData: Omit<AuditLog, 'id' | 'timestamp' | 'actor'>) => {
    const newLog: AuditLog = {
      ...logData,
      id: `EV-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Vance Alexander' // Mocked active user
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, []);

  const activeCompany = companies.find(c => c.id === currentCompanyId) || companies[0];

  const handleNavigate = (menu: MainMenuType) => {
    setActiveMenu(menu);
    setActiveAdminSubMenu(null);
    setActiveTransactionSubMenu(null);
    setActiveDisplaySubMenu(null);
    setActiveCommSubMenu(null);
    setActiveHouseKeepingSubMenu(null);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case MainMenuType.DASHBOARD:
        return <Dashboard activeCompany={activeCompany} vouchers={vouchers} tasks={[]} setTasks={() => {}} onViewVoucher={setViewingVoucherId} />;
      case MainMenuType.COMPANY:
        return <CompanyModule companies={companies} setCompanies={setCompanies} currentCompanyId={currentCompanyId} setCurrentCompanyId={setCurrentCompanyId} currentFY={currentFY} setCurrentFY={setCurrentFY} addAuditLog={addAuditLog} />;
      case MainMenuType.ADMINISTRATION:
        return (
          <AdministrationModule 
            users={users} setUsers={setUsers} roles={roles} setRoles={setRoles} 
            auditLogs={auditLogs} addAuditLog={addAuditLog} 
            activeCompany={activeCompany} currentFY={currentFY} 
            activeSubAction={activeAdminSubMenu} setActiveSubAction={setActiveAdminSubMenu} 
            setCurrentFY={(fy, l) => { setCurrentFY(fy); setIsFYLocked(!!l); }}
            ledgers={ledgers} setLedgers={setLedgers} 
            accountGroups={accountGroups} setAccountGroups={setAccountGroups}
            items={[]} setItems={() => {}} batches={[]} setBatches={() => {}}
            taxes={[]} setTaxes={() => {}} taxGroups={[]} setTaxGroups={() => {}}
            vouchers={vouchers} setVouchers={setVouchers}
            unitMeasures={DEFAULT_UNITS} setUnitMeasures={() => {}}
            isFYLocked={isFYLocked}
          />
        );
      case MainMenuType.TRANSACTION:
        return (
          <TransactionModule 
            activeCompany={activeCompany} currentFY={currentFY} isReadOnly={isFYLocked} 
            activeSubAction={activeTransactionSubMenu} setActiveSubAction={setActiveTransactionSubMenu}
            ledgers={ledgers} items={[]} batches={[]} vouchers={vouchers} setVouchers={setVouchers} onViewVoucher={setViewingVoucherId}
          />
        );
      case MainMenuType.DISPLAY:
        return (
          <DisplayModule 
            activeCompany={activeCompany} activeSubAction={activeDisplaySubMenu} setActiveSubAction={setActiveDisplaySubMenu}
            ledgers={ledgers} vouchers={vouchers} items={[]} batches={[]} taxes={[]} taxGroups={[]}
            onViewVoucher={setViewingVoucherId} onPostVoucher={(v) => setVouchers(prev => [...prev, { ...v, id: 'TBD', status: 'Posted' }])}
          />
        );
      default:
        return <ModulePlaceholder type={activeMenu} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={handleNavigate}
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
          activeCompanyName={activeCompany?.name} 
          currentFY={currentFY} 
          isFYLocked={isFYLocked} 
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

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-100/30">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>

        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          vouchers={vouchers}
          ledgers={ledgers}
          companies={companies}
          onNavigate={handleNavigate}
          onViewVoucher={setViewingVoucherId}
          onSelectCompany={(id) => { setCurrentCompanyId(id); setIsCommandPaletteOpen(false); }}
        />

        {viewingVoucherId && (
          <VoucherModal voucher={vouchers.find(v => v.id === viewingVoucherId)!} activeCompany={activeCompany} onClose={() => setViewingVoucherId(null)} />
        )}
      </div>
    </div>
  );
};

export default App;
