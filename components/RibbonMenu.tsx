import React, { useState, useMemo } from 'react';
import { MainMenuType, CompanySubMenu, AdminSubMenu, TransactionSubMenu, DisplaySubMenu, CommunicationSubMenu, HouseKeepingSubMenu } from '../types';
import { MENU_ITEMS, COMPANY_SUB_MENUS, ADMINISTRATION_SUB_MENUS, TRANSACTION_SUB_MENUS, DISPLAY_SUB_MENUS, COMMUNICATION_SUB_MENUS, HOUSE_KEEPING_SUB_MENUS } from '../constants';

interface RibbonMenuProps {
  activeMenu: MainMenuType;
  setActiveMenu: (menu: MainMenuType) => void;
  activeAdminSubMenu: AdminSubMenu | null;
  setActiveAdminSubMenu: (sub: AdminSubMenu | null) => void;
  activeTransactionSubMenu: TransactionSubMenu | null;
  setActiveTransactionSubMenu: (sub: TransactionSubMenu | null) => void;
  activeDisplaySubMenu: DisplaySubMenu | null;
  setActiveDisplaySubMenu: (sub: DisplaySubMenu | null) => void;
  activeCommSubMenu: CommunicationSubMenu | null;
  setActiveCommSubMenu: (sub: CommunicationSubMenu | null) => void;
  activeHouseKeepingSubMenu: HouseKeepingSubMenu | null;
  setActiveHouseKeepingSubMenu: (sub: HouseKeepingSubMenu | null) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const RibbonMenu: React.FC<RibbonMenuProps> = ({
  activeMenu,
  setActiveMenu,
  activeAdminSubMenu,
  setActiveAdminSubMenu,
  activeTransactionSubMenu,
  setActiveTransactionSubMenu,
  activeDisplaySubMenu,
  setActiveDisplaySubMenu,
  activeCommSubMenu,
  setActiveCommSubMenu,
  activeHouseKeepingSubMenu,
  setActiveHouseKeepingSubMenu,
  isCollapsed,
  setIsCollapsed
}) => {
  
  const renderSubMenus = () => {
    let items: any[] = [];
    let activeId: string | null = null;
    let setter: (id: any) => void = () => {};
    let groups: { label: string, items: any[] }[] = [];

    switch (activeMenu) {
      case MainMenuType.COMPANY:
        groups = [{ label: 'Organization', items: COMPANY_SUB_MENUS.slice(0, 3) }, { label: 'Maintenance', items: COMPANY_SUB_MENUS.slice(3) }];
        break;
      case MainMenuType.ADMINISTRATION:
        activeId = activeAdminSubMenu;
        setter = setActiveAdminSubMenu;
        groups = [
          { label: 'System Masters', items: ADMINISTRATION_SUB_MENUS.filter(m => [AdminSubMenu.MASTERS, AdminSubMenu.USERS].includes(m.id as AdminSubMenu)) },
          { label: 'Data Flow', items: ADMINISTRATION_SUB_MENUS.filter(m => [AdminSubMenu.IMPORT_EXPORT, AdminSubMenu.BACKUP].includes(m.id as AdminSubMenu)) },
          { label: 'Utilities', items: ADMINISTRATION_SUB_MENUS.filter(m => [AdminSubMenu.YEAR_CHANGE, AdminSubMenu.COMMUNICATION].includes(m.id as AdminSubMenu)) }
        ];
        break;
      case MainMenuType.TRANSACTION:
        activeId = activeTransactionSubMenu;
        setter = setActiveTransactionSubMenu;
        groups = [
          { label: 'Vouchers', items: TRANSACTION_SUB_MENUS.filter(m => [TransactionSubMenu.ACCOUNTING_VOUCHERS, TransactionSubMenu.INVENTORY_VOUCHERS].includes(m.id as TransactionSubMenu)) },
          { label: 'Reconciliation', items: TRANSACTION_SUB_MENUS.filter(m => [TransactionSubMenu.BANK_RECONCILIATION, TransactionSubMenu.DAY_BOOK].includes(m.id as TransactionSubMenu)) }
        ];
        break;
      case MainMenuType.DISPLAY:
        activeId = activeDisplaySubMenu;
        setter = setActiveDisplaySubMenu;
        groups = [
          { label: 'Financial Statements', items: DISPLAY_SUB_MENUS.slice(0, 2) },
          { label: 'Audit & Analysis', items: DISPLAY_SUB_MENUS.slice(2, 5) },
          { label: 'Statutory', items: DISPLAY_SUB_MENUS.slice(5) }
        ];
        break;
      case MainMenuType.COMMUNICATION:
        activeId = activeCommSubMenu;
        setter = setActiveCommSubMenu;
        groups = [{ label: 'Outbound Channels', items: COMMUNICATION_SUB_MENUS }];
        break;
      case MainMenuType.HOUSE_KEEPING:
        activeId = activeHouseKeepingSubMenu;
        setter = setActiveHouseKeepingSubMenu;
        groups = [{ label: 'Maintenance Protocols', items: HOUSE_KEEPING_SUB_MENUS }];
        break;
      default:
        return null;
    }

    return (
      <div className="flex h-full items-center px-4 space-x-0 animate-in fade-in slide-in-from-top-2 duration-300">
        {groups.map((group, idx) => (
          <React.Fragment key={group.label}>
            <div className="flex flex-col h-full justify-between py-2 px-4 border-r border-slate-200/60 last:border-0">
              <div className="flex items-center space-x-1">
                {group.items.map((item) => {
                  const isActive = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setter(item.id)}
                      className={`flex flex-col items-center justify-center w-24 h-20 rounded-xl transition-all group/cmd ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-lg scale-105 z-10' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
                      }`}
                    >
                      <div className={`transition-transform group-hover/cmd:scale-110 mb-1 ${isActive ? 'text-white' : 'text-slate-400 group-hover/cmd:text-indigo-500'}`}>
                        {React.cloneElement(item.icon as React.ReactElement, { className: 'w-6 h-6' })}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tight text-center leading-tight px-1">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] text-center mt-1">
                {group.label}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm flex flex-col shrink-0 z-40 relative">
      {/* Ribbon Tabs */}
      <div className="flex items-center px-4 bg-slate-50/50 border-b border-slate-100">
        <div 
          onClick={() => setActiveMenu(MainMenuType.COMPANY)}
          className={`px-8 py-2.5 text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all ${
            activeMenu === MainMenuType.COMPANY 
              ? 'bg-indigo-700 text-white shadow-inner' 
              : 'bg-indigo-600/10 text-indigo-700 hover:bg-indigo-600/20'
          }`}
        >
          Company
        </div>
        <div className="flex flex-1 overflow-x-auto no-scrollbar">
          {MENU_ITEMS.filter(m => m.id !== MainMenuType.COMPANY).map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveMenu(item.id); if(isCollapsed) setIsCollapsed(false); }}
              className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
                activeMenu === item.id 
                  ? 'text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
              {activeMenu === item.id && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-600 animate-in fade-in zoom-in duration-300" />
              )}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Ribbon Content Panel */}
      <div className={`transition-all duration-300 overflow-hidden bg-white ${isCollapsed ? 'h-0' : 'h-28'}`}>
        {renderSubMenus()}
      </div>
    </div>
  );
};

export default RibbonMenu;