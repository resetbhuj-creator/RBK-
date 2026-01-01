import React, { useState, useEffect } from 'react';
import { MainMenuType, Role, User, AuditLog, AdminSubMenu, TransactionSubMenu, DisplaySubMenu, CommunicationSubMenu, HouseKeepingSubMenu, Ledger, Item, Voucher, Tax, TaxGroup } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ModulePlaceholder from './components/ModulePlaceholder';
import CompanyModule from './components/CompanyModule';
import AdministrationModule from './components/AdministrationModule';
import TransactionModule from './components/TransactionModule';
import DisplayModule from './components/DisplayModule';
import CommunicationModule from './components/CommunicationModule';
import HouseKeepingModule from './components/HouseKeepingModule';

const INITIAL_ROLES: Role[] = [
  { id: 'r1', name: 'Super Admin', permissions: { company: 'all', administration: 'all', transaction: 'all', display: 'all' }, isSystem: true },
  { id: 'r2', name: 'Admin', permissions: { company: 'write', administration: 'write', transaction: 'write', display: 'all' }, isSystem: true },
  { id: 'r3', name: 'Manager', permissions: { company: 'read', administration: 'none', transaction: 'write', display: 'all' }, isSystem: true },
  { id: 'r4', name: 'Accountant', permissions: { company: 'read', administration: 'none', transaction: 'write', display: 'all' }, isSystem: true },
  { id: 'r5', name: 'Auditor', permissions: { company: 'read', administration: 'none', transaction: 'none', display: 'all' }, isSystem: true }
];

const INITIAL_COMPANIES = [
  { 
    id: '1', 
    name: 'Nexus Global Industries Ltd.', 
    years: ['2022 - 2023', '2023 - 2024'], 
    country: 'India', 
    state: 'Maharashtra', 
    currency: 'INR (₹)', 
    taxLaw: 'Indian GST', 
    logo: 'N', 
    taxId: '27AAAAA0000A1Z5', 
    address: 'Nexus Tower, BKC, Mumbai - 400051',
    dataPath: 'C:\\NexusERP\\Data\\Company001'
  }
];

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'System Admin', email: 'admin@nexus.com', role: 'Super Admin', status: 'Active', lastLogin: '2 mins ago', permissions: { company: 'all', administration: 'all', transaction: 'all', display: 'all' } }
];

const INITIAL_LEDGERS: Ledger[] = [
  { id: 'l1', name: 'HDFC Bank - 0012', group: 'Bank Accounts', openingBalance: 54000, type: 'Debit' },
  { id: 'l2', name: 'Cash-in-hand', group: 'Cash-in-hand', openingBalance: 1200, type: 'Debit' },
  { id: 'l3', name: 'Office Rent', group: 'Indirect Expenses', openingBalance: 0, type: 'Debit' },
  { id: 'l4', name: 'Acme Retailers', group: 'Sundry Debtors', openingBalance: 0, type: 'Debit' },
  { id: 'l5', name: 'Global Suppliers', group: 'Sundry Creditors', openingBalance: 0, type: 'Credit' }
];

const INITIAL_ITEMS: Item[] = [
  { id: 'i1', name: 'MacBook Pro M3', category: 'Electronics', unit: 'Nos', salePrice: 2400, hsnCode: '8471', gstRate: 18 },
  { id: 'i2', name: 'Software License', category: 'Digital', unit: 'Unit', salePrice: 500, hsnCode: '9973', gstRate: 18 },
  { id: 'i3', name: 'Premium Support Package', category: 'Services', unit: 'Months', salePrice: 2500, hsnCode: '9983', gstRate: 18 }
];

const INITIAL_VOUCHERS: Voucher[] = [
  { id: 'V-1001', type: 'Sales', date: '2023-11-20', party: 'Acme Retailers', amount: 12500, status: 'Posted', narration: 'Bulk sale of laptops', subTotal: 10593.22, taxTotal: 1906.78, items: [{ id: 'vi1', itemId: 'i1', name: 'MacBook Pro M3', hsn: '8471', qty: 5, unit: 'Nos', rate: 2118.64, amount: 10593.22 }] },
  { id: 'V-1002', type: 'Payment', date: '2023-12-01', party: 'Real Estate Holdings', amount: 2500, status: 'Posted', narration: 'Monthly office rent' }
];

const INITIAL_TAX_GROUPS: TaxGroup[] = [
  { id: 'tg1', name: 'GST Consolidated', description: 'Standard GST grouping for domestic supply.' }
];

const INITIAL_TAXES: Tax[] = [
  { id: 't1', name: 'Output CGST @ 9%', rate: 9, type: 'CGST', classification: 'Output', supplyType: 'Local', groupId: 'tg1' },
  { id: 't2', name: 'Output SGST @ 9%', rate: 9, type: 'SGST', classification: 'Output', supplyType: 'Local', groupId: 'tg1' }
];

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<MainMenuType>(MainMenuType.DASHBOARD);
  const [activeAdminSubMenu, setActiveAdminSubMenu] = useState<AdminSubMenu | null>(null);
  const [activeTransactionSubMenu, setActiveTransactionSubMenu] = useState<TransactionSubMenu | null>(null);
  const [activeDisplaySubMenu, setActiveDisplaySubMenu] = useState<DisplaySubMenu | null>(null);
  const [activeCommSubMenu, setActiveCommSubMenu] = useState<CommunicationSubMenu | null>(null);
  const [activeHouseKeepingSubMenu, setActiveHouseKeepingSubMenu] = useState<HouseKeepingSubMenu | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Persistence State
  const [companies, setCompanies] = useState(() => JSON.parse(localStorage.getItem('nexus_erp_companies') || JSON.stringify(INITIAL_COMPANIES)));
  const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('nexus_erp_users') || JSON.stringify(INITIAL_USERS)));
  const [roles, setRoles] = useState<Role[]>(() => JSON.parse(localStorage.getItem('nexus_erp_roles') || JSON.stringify(INITIAL_ROLES)));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => JSON.parse(localStorage.getItem('nexus_erp_audit_logs') || '[]'));
  
  // Master Data State
  const [ledgers, setLedgers] = useState<Ledger[]>(() => JSON.parse(localStorage.getItem('nexus_erp_ledgers') || JSON.stringify(INITIAL_LEDGERS)));
  const [items, setItems] = useState<Item[]>(() => JSON.parse(localStorage.getItem('nexus_erp_items') || JSON.stringify(INITIAL_ITEMS)));
  const [vouchers, setVouchers] = useState<Voucher[]>(() => JSON.parse(localStorage.getItem('nexus_erp_vouchers') || JSON.stringify(INITIAL_VOUCHERS)));
  const [taxes, setTaxes] = useState<Tax[]>(() => JSON.parse(localStorage.getItem('nexus_erp_taxes') || JSON.stringify(INITIAL_TAXES)));
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>(() => JSON.parse(localStorage.getItem('nexus_erp_tax_groups') || JSON.stringify(INITIAL_TAX_GROUPS)));
  
  const [currentCompanyId, setCurrentCompanyId] = useState(() => localStorage.getItem('nexus_erp_current_company_id') || '1');
  const [currentFY, setCurrentFY] = useState(() => localStorage.getItem('nexus_erp_current_fy') || '2023 - 2024');
  const [isFYLocked, setIsFYLocked] = useState(() => localStorage.getItem('nexus_erp_fy_locked') === 'true');

  useEffect(() => {
    localStorage.setItem('nexus_erp_companies', JSON.stringify(companies));
    localStorage.setItem('nexus_erp_users', JSON.stringify(users));
    localStorage.setItem('nexus_erp_roles', JSON.stringify(roles));
    localStorage.setItem('nexus_erp_audit_logs', JSON.stringify(auditLogs));
    localStorage.setItem('nexus_erp_ledgers', JSON.stringify(ledgers));
    localStorage.setItem('nexus_erp_items', JSON.stringify(items));
    localStorage.setItem('nexus_erp_vouchers', JSON.stringify(vouchers));
    localStorage.setItem('nexus_erp_taxes', JSON.stringify(taxes));
    localStorage.setItem('nexus_erp_tax_groups', JSON.stringify(taxGroups));
    localStorage.setItem('nexus_erp_current_company_id', currentCompanyId);
    localStorage.setItem('nexus_erp_current_fy', currentFY);
    localStorage.setItem('nexus_erp_fy_locked', isFYLocked.toString());
  }, [companies, users, roles, auditLogs, ledgers, items, vouchers, taxes, taxGroups, currentCompanyId, currentFY, isFYLocked]);

  const activeCompany = companies.find((c: any) => c.id === currentCompanyId) || { name: 'None Selected' };

  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp' | 'actor'>) => {
    const newLog: AuditLog = { ...log, id: `log-${Date.now()}`, timestamp: new Date().toISOString(), actor: 'System Admin' };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case MainMenuType.DASHBOARD:
        return <Dashboard activeCompany={activeCompany} />;
      case MainMenuType.COMPANY:
        return <CompanyModule companies={companies} setCompanies={setCompanies} currentCompanyId={currentCompanyId} setCurrentCompanyId={setCurrentCompanyId} currentFY={currentFY} setCurrentFY={setCurrentFY} />;
      case MainMenuType.ADMINISTRATION:
        return (
          <AdministrationModule 
            users={users} setUsers={setUsers} roles={roles} setRoles={setRoles} auditLogs={auditLogs} addAuditLog={addAuditLog} 
            activeCompany={activeCompany} currentFY={currentFY} activeSubAction={activeAdminSubMenu} setActiveSubAction={setActiveAdminSubMenu} setCurrentFY={(fy, locked) => {
              setCurrentFY(fy);
              if (locked !== undefined) setIsFYLocked(locked);
              addAuditLog({ action: 'UPDATE', entityType: 'SYSTEM', entityName: 'Accounting Context', details: `Financial context switched to period: ${fy}` });
            }}
            ledgers={ledgers} setLedgers={setLedgers} items={items} setItems={setItems}
            taxes={taxes} setTaxes={setTaxes} taxGroups={taxGroups} setTaxGroups={setTaxGroups}
          />
        );
      case MainMenuType.TRANSACTION:
        return (
          <TransactionModule 
            activeCompany={activeCompany} isReadOnly={isFYLocked} activeSubAction={activeTransactionSubMenu} setActiveSubAction={setActiveTransactionSubMenu}
            ledgers={ledgers} items={items} vouchers={vouchers} setVouchers={setVouchers}
          />
        );
      case MainMenuType.DISPLAY:
        return (
          <DisplayModule 
            activeCompany={activeCompany} activeSubAction={activeDisplaySubMenu} setActiveSubAction={setActiveDisplaySubMenu}
            ledgers={ledgers} vouchers={vouchers} items={items}
          />
        );
      case MainMenuType.COMMUNICATION:
        return (
          <CommunicationModule 
            activeCompany={activeCompany} 
            activeSubAction={activeCommSubMenu} 
            setActiveSubAction={setActiveCommSubMenu}
            vouchers={vouchers}
            ledgers={ledgers}
          />
        );
      case MainMenuType.HOUSE_KEEPING:
        return (
          <HouseKeepingModule 
            activeCompany={activeCompany} 
            activeSubAction={activeHouseKeepingSubMenu} 
            setActiveSubAction={setActiveHouseKeepingSubMenu}
            auditLogs={auditLogs}
            ledgers={ledgers}
            vouchers={vouchers}
          />
        );
      default:
        return <ModulePlaceholder type={activeMenu} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={(menu) => { setActiveMenu(menu); setActiveAdminSubMenu(null); setActiveTransactionSubMenu(null); setActiveDisplaySubMenu(null); setActiveCommSubMenu(null); setActiveHouseKeepingSubMenu(null); }} 
        activeAdminSubMenu={activeAdminSubMenu} setActiveAdminSubMenu={setActiveAdminSubMenu} 
        activeTransactionSubMenu={activeTransactionSubMenu} setActiveTransactionSubMenu={setActiveTransactionSubMenu} 
        activeDisplaySubMenu={activeDisplaySubMenu} setActiveDisplaySubMenu={setActiveDisplaySubMenu}
        activeCommSubMenu={activeCommSubMenu} setActiveCommSubMenu={setActiveCommSubMenu}
        activeHouseKeepingSubMenu={activeHouseKeepingSubMenu} setActiveHouseKeepingSubMenu={setActiveHouseKeepingSubMenu}
        isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activeCompany={activeCompany} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} title={activeMenu} activeCompanyName={activeCompany.name} currentFY={currentFY} isFYLocked={isFYLocked} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;