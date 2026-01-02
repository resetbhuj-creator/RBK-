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
import VoucherModal from './components/VoucherModal';
import { UNIT_MEASURES as DEFAULT_UNITS } from './constants';

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
    dataPath: 'C:\\NexusERP\\Data\\Company001',
    businessType: 'Private Limited Company'
  }
];

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'System Admin', email: 'admin@nexus.com', role: 'Super Admin', status: 'Active', lastLogin: '2 mins ago', permissions: { company: 'all', administration: 'all', transaction: 'all', display: 'all' } }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', actor: 'System Admin', action: 'CREATE', entityType: 'SYSTEM', entityName: 'Nexus Core', details: 'System initialization successful. Multi-region master mapping complete.', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'log-2', actor: 'System Admin', action: 'STATUS_CHANGE', entityType: 'USER', entityName: 'System Admin', details: 'LIFECYCLE SHIFT: Account integrity status changed from Suspended to Active.', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 'log-3', actor: 'System Admin', action: 'UPDATE', entityType: 'ROLE', entityName: 'Accountant', details: 'MODIFICATION TRACE: [PERM:TRANSACTION] read → write | [PERM:DISPLAY] none → all', timestamp: new Date(Date.now() - 600000).toISOString() }
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
  { id: 'i2', name: 'Software License', category: 'Digital Assets', unit: 'Unit', salePrice: 500, hsnCode: '9973', gstRate: 18 },
  { id: 'i3', name: 'Premium Support Package', category: 'Services', unit: 'Months', salePrice: 2500, hsnCode: '9983', gstRate: 18 }
];

const INITIAL_VOUCHERS: Voucher[] = [
  { id: 'SL/23-24/0001', type: 'Sales', date: '2023-11-20', party: 'Acme Retailers', amount: 12500, status: 'Posted', narration: 'Bulk sale of laptops', subTotal: 10593.22, taxTotal: 1906.78, items: [{ id: 'vi1', itemId: 'i1', name: 'MacBook Pro M3', hsn: '8471', qty: 5, unit: 'Nos', rate: 2118.64, amount: 10593.22 }] },
  { id: 'PY/23-24/0001', type: 'Payment', date: '2023-12-01', party: 'Real Estate Holdings', amount: 2500, status: 'Posted', narration: 'Monthly office rent' }
];

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<MainMenuType>(MainMenuType.DASHBOARD);
  const [activeAdminSubMenu, setActiveAdminSubMenu] = useState<AdminSubMenu | null>(null);
  const [activeTransactionSubMenu, setActiveTransactionSubMenu] = useState<TransactionSubMenu | null>(null);
  const [activeDisplaySubMenu, setActiveDisplaySubMenu] = useState<DisplaySubMenu | null>(null);
  const [activeCommSubMenu, setActiveCommSubMenu] = useState<CommunicationSubMenu | null>(null);
  const [activeHouseKeepingSubMenu, setActiveHouseKeepingSubMenu] = useState<HouseKeepingSubMenu | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Global Document Viewer State
  const [viewingVoucherId, setViewingVoucherId] = useState<string | null>(null);

  // Persistence State
  const [companies, setCompanies] = useState(() => JSON.parse(localStorage.getItem('nexus_erp_companies') || JSON.stringify(INITIAL_COMPANIES)));
  const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('nexus_erp_users') || JSON.stringify(INITIAL_USERS)));
  const [roles, setRoles] = useState<Role[]>(() => JSON.parse(localStorage.getItem('nexus_erp_roles') || JSON.stringify(INITIAL_ROLES)));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => JSON.parse(localStorage.getItem('nexus_erp_audit_logs') || JSON.stringify(INITIAL_AUDIT_LOGS)));
  const [ledgers, setLedgers] = useState<Ledger[]>(() => JSON.parse(localStorage.getItem('nexus_erp_ledgers') || JSON.stringify(INITIAL_LEDGERS)));
  const [items, setItems] = useState<Item[]>(() => JSON.parse(localStorage.getItem('nexus_erp_items') || JSON.stringify(INITIAL_ITEMS)));
  const [vouchers, setVouchers] = useState<Voucher[]>(() => JSON.parse(localStorage.getItem('nexus_erp_vouchers') || JSON.stringify(INITIAL_VOUCHERS)));
  const [taxes, setTaxes] = useState<Tax[]>(() => JSON.parse(localStorage.getItem('nexus_erp_taxes') || '[]'));
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>(() => JSON.parse(localStorage.getItem('nexus_erp_tax_groups') || '[]'));
  
  const [unitMeasures, setUnitMeasures] = useState<string[]>(() => JSON.parse(localStorage.getItem('nexus_erp_unit_measures') || JSON.stringify(DEFAULT_UNITS)));

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
    localStorage.setItem('nexus_erp_unit_measures', JSON.stringify(unitMeasures));
    localStorage.setItem('nexus_erp_current_company_id', currentCompanyId);
    localStorage.setItem('nexus_erp_current_fy', currentFY);
    localStorage.setItem('nexus_erp_fy_locked', isFYLocked.toString());
  }, [companies, users, roles, auditLogs, ledgers, items, vouchers, unitMeasures, currentCompanyId, currentFY, isFYLocked]);

  const activeCompany = companies.find((c: any) => c.id === currentCompanyId) || { name: 'None Selected' };
  const voucherToView = viewingVoucherId ? vouchers.find(v => v.id === viewingVoucherId) : null;

  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp' | 'actor'>) => {
    const newLog: AuditLog = { ...log, id: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, timestamp: new Date().toISOString(), actor: 'System Admin' };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case MainMenuType.DASHBOARD:
        return <Dashboard activeCompany={activeCompany} vouchers={vouchers} onViewVoucher={setViewingVoucherId} />;
      case MainMenuType.COMPANY:
        return <CompanyModule companies={companies} setCompanies={setCompanies} currentCompanyId={currentCompanyId} setCurrentCompanyId={setCurrentCompanyId} currentFY={currentFY} setCurrentFY={setCurrentFY} addAuditLog={addAuditLog} />;
      case MainMenuType.ADMINISTRATION:
        return (
          <AdministrationModule 
            users={users} setUsers={setUsers} roles={roles} setRoles={setRoles} auditLogs={auditLogs} addAuditLog={addAuditLog} 
            activeCompany={activeCompany} currentFY={currentFY} activeSubAction={activeAdminSubMenu} setActiveSubAction={setActiveAdminSubMenu} setCurrentFY={(fy, locked) => {
              setCurrentFY(fy);
              if (locked !== undefined) setIsFYLocked(locked);
            }}
            ledgers={ledgers} setLedgers={setLedgers} items={items} setItems={setItems}
            taxes={taxes} setTaxes={setTaxes} taxGroups={taxGroups} setTaxGroups={setTaxGroups}
            vouchers={vouchers} setVouchers={setVouchers}
            unitMeasures={unitMeasures} setUnitMeasures={setUnitMeasures}
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
            ledgers={ledgers} vouchers={vouchers} items={items} taxes={taxes} taxGroups={taxGroups}
          />
        );
      case MainMenuType.COMMUNICATION:
        return <CommunicationModule activeCompany={activeCompany} activeSubAction={activeCommSubMenu} setActiveSubAction={setActiveCommSubMenu} vouchers={vouchers} ledgers={ledgers} />;
      case MainMenuType.HOUSE_KEEPING:
        return <HouseKeepingModule activeCompany={activeCompany} activeSubAction={activeHouseKeepingSubMenu} setActiveSubAction={setActiveHouseKeepingSubMenu} auditLogs={auditLogs} ledgers={ledgers} vouchers={vouchers} />;
      default:
        return <ModulePlaceholder type={activeMenu} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-all duration-300" onClick={() => setIsSidebarOpen(false)} />}
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
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} title={activeMenu} activeCompanyName={activeCompany.name} currentFY={currentFY} isFYLocked={isFYLocked} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6 bg-slate-50/50 custom-scrollbar scroll-smooth">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Global Document Viewer Modal */}
      {voucherToView && (
        <VoucherModal 
          voucher={voucherToView} 
          activeCompany={activeCompany} 
          onClose={() => setViewingVoucherId(null)} 
        />
      )}
    </div>
  );
};

export default App;