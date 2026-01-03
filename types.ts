import React from 'react';

export enum MainMenuType {
  DASHBOARD = 'Dashboard',
  COMPANY = 'Company',
  ADMINISTRATION = 'Administration',
  TRANSACTION = 'Transaction',
  DISPLAY = 'Display',
  COMMUNICATION = 'Print/Email/SMS',
  HOUSE_KEEPING = 'House-Keeping'
}

export enum CompanySubMenu {
  OPEN_COMPANY = 'Open Company',
  CREATE_COMPANY = 'Create Company',
  EDIT_COMPANY = 'Edit Company',
  RESTORE_COMPANY = 'Restore Company',
  ADD_YEAR = 'Add New Year',
  SPLIT_YEAR = 'Split Financial Year',
  DELETE_COMPANY = 'Delete Company / Year Wise'
}

export enum AdminSubMenu {
  MASTERS = 'Masters',
  USERS = 'Users',
  BACKUP = 'Backup',
  IMPORT_EXPORT = 'Import / Export',
  YEAR_CHANGE = 'Year Change',
  COMMUNICATION = 'Communication'
}

export enum TransactionSubMenu {
  ACCOUNTING_VOUCHERS = 'Accounting Vouchers',
  INVENTORY_VOUCHERS = 'Inventory Vouchers',
  BANK_RECONCILIATION = 'Bank Reconciliation',
  DAY_BOOK = 'Day Book'
}

export enum DisplaySubMenu {
  BALANCE_SHEET = 'Balance Sheet',
  PROFIT_LOSS = 'Profit & Loss',
  BUDGET_VARIANCE = 'Budget vs Actual',
  TRIAL_BALANCE = 'Trial Balance',
  CASH_FLOW = 'Cash Flow',
  INVENTORY_SUMMARY = 'Inventory Summary',
  GST_REPORTS = 'GST Reports'
}

export type GstReportType = 'GSTR-1' | 'GSTR-2' | 'GSTR-3B' | 'HSN-SUMMARY';

export enum CommunicationSubMenu {
  PRINT_CENTER = 'Print Center',
  EMAIL_GATEWAY = 'Email Gateway',
  SMS_ALERTS = 'SMS Alerts',
  DISPATCH_LOGS = 'Dispatch Logs'
}

export enum HouseKeepingSubMenu {
  DATABASE_UTILITY = 'Database Utility',
  INTEGRITY_CHECK = 'Data Integrity',
  SYSTEM_AUDIT = 'Security Audit',
  DATA_PURGE = 'Data Purge Utility',
  PREFERENCES = 'System Preferences'
}

export interface Company {
  id: string;
  name: string;
  years: string[];
  country: string;
  state: string;
  currency: string;
  taxLaw?: string;
  logo: string;
  taxId?: string;
  address?: string;
  email?: string;
  website?: string;
  dataPath: string;
  fyStartDate: string;
  booksBeginDate: string;
  lastAccessed?: string;
}

export interface UserPermissions {
  company: 'none' | 'read' | 'write' | 'all';
  administration: 'none' | 'read' | 'write' | 'all';
  transaction: 'none' | 'read' | 'write' | 'all';
  display: 'none' | 'read' | 'write' | 'all';
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: UserPermissions;
  isSystem?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'Active' | 'Suspended';
  lastLogin: string;
  permissions: UserPermissions;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  entityType: 'USER' | 'ROLE' | 'SYSTEM' | 'COMPANY' | 'VOUCHER' | 'MASTER';
  entityName: string;
  details: string;
  timestamp: string;
}

export interface VoucherItem {
  id: string;
  itemId: string;
  name: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  taxAmount?: number;
}

export interface Adjustment {
  id: string;
  label: string;
  type: 'Add' | 'Less';
  amount: number;
}

export interface LedgerEntry {
  id: string;
  ledgerId: string;
  ledgerName: string;
  type: 'Dr' | 'Cr';
  amount: number;
}

export type VoucherType = 'Sales' | 'Purchase' | 'Sales Return' | 'Purchase Return' | 'Payment' | 'Receipt' | 'Journal' | 'Contra' | 'Delivery Note' | 'Goods Receipt Note (GRN)' | 'Stock Adjustment' | 'Purchase Order';

export interface Voucher {
  id: string;
  type: VoucherType;
  date: string;
  party: string;
  amount: number;
  status: 'Draft' | 'Posted' | 'Cancelled' | 'Pending Approval';
  narration?: string;
  ledgerId?: string;
  secondaryLedgerId?: string;
  entries?: LedgerEntry[];
  reference?: string;
  sourceDocRef?: string; // New: Link to original invoice
  returnReason?: string; // New: Context for return
  items?: VoucherItem[];
  adjustments?: Adjustment[];
  subTotal?: number;
  taxTotal?: number;
  supplyType?: 'Local' | 'Central';
  gstClassification?: 'Input' | 'Output';
  isReconciled?: boolean;
  bankDate?: string;
}

export interface Ledger {
  id: string;
  name: string;
  group: string;
  openingBalance: number;
  type: 'Debit' | 'Credit';
  budget?: number; // Annual budget ceiling
}

export interface Item {
  id: string;
  name: string;
  category: string;
  unit: string;
  salePrice: number;
  hsnCode: string;
  gstRate: number;
  taxGroupId?: string;
}

export interface MenuItem {
  id: MainMenuType;
  label: string;
  icon: React.ReactNode;
}

export interface SubMenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface AccountGroup {
  id: string;
  name: string;
  nature: 'Assets' | 'Liabilities' | 'Income' | 'Expenses';
  isSystem?: boolean;
}

export interface TaxGroup {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  type: string; 
  classification: 'Input' | 'Output';
  supplyType: 'Local' | 'Central';
  groupId?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  status: 'Pending' | 'Completed';
  createdAt: string;
}