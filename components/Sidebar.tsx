import React from 'react';
import { MainMenuType, AdminSubMenu, TransactionSubMenu, DisplaySubMenu, CommunicationSubMenu, HouseKeepingSubMenu } from '../types';
import { MENU_ITEMS, ADMINISTRATION_SUB_MENUS, TRANSACTION_SUB_MENUS, DISPLAY_SUB_MENUS, COMMUNICATION_SUB_MENUS, HOUSE_KEEPING_SUB_MENUS } from '../constants';

interface SidebarProps {
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
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeCompany?: any;
}

const SubMenuItem: React.FC<{ label: string, id: string, activeId: string | null, onClick: () => void }> = ({ label, id, activeId, onClick }) => {
  const isActive = activeId === id;
  return (
    <button 
      onClick={onClick} 
      className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all relative group/sub flex items-center ${
        isActive 
          ? 'text-indigo-700 bg-indigo-100/80 font-black ring-1 ring-indigo-200' 
          : 'text-slate-500 font-bold hover:text-indigo-600 hover:bg-slate-50'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full mr-3 transition-all ${isActive ? 'bg-indigo-600 scale-125 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-300'}`} />
      <span className="truncate">{label}</span>
      {isActive && <div className="absolute right-3 w-1 h-1 rounded-full bg-indigo-400" />}
    </button>
  );
};

const SubMenuContainer: React.FC<{ children: React.ReactNode, isOpen: boolean }> = ({ children, isOpen }) => (
  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2 mb-3' : 'grid-rows-[0fr] opacity-0'}`}>
    <div className="overflow-hidden ml-6 border-l-2 border-slate-100 pl-3 space-y-1">
      {children}
    </div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ 
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
  isOpen, 
  setIsOpen, 
  activeCompany 
}) => {
  const SUB_MENU_MAP: Record<string, any[]> = {
    [MainMenuType.ADMINISTRATION]: ADMINISTRATION_SUB_MENUS,
    [MainMenuType.TRANSACTION]: TRANSACTION_SUB_MENUS,
    [MainMenuType.DISPLAY]: DISPLAY_SUB_MENUS,
    [MainMenuType.COMMUNICATION]: COMMUNICATION_SUB_MENUS,
    [MainMenuType.HOUSE_KEEPING]: HOUSE_KEEPING_SUB_MENUS,
  };

  const getActiveSubId = (type: MainMenuType) => {
    switch(type) {
      case MainMenuType.ADMINISTRATION: return activeAdminSubMenu;
      case MainMenuType.TRANSACTION: return activeTransactionSubMenu;
      case MainMenuType.DISPLAY: return activeDisplaySubMenu;
      case MainMenuType.COMMUNICATION: return activeCommSubMenu;
      case MainMenuType.HOUSE_KEEPING: return activeHouseKeepingSubMenu;
      default: return null;
    }
  };

  const getSubSetter = (type: MainMenuType) => {
    switch(type) {
      case MainMenuType.ADMINISTRATION: return setActiveAdminSubMenu;
      case MainMenuType.TRANSACTION: return setActiveTransactionSubMenu;
      case MainMenuType.DISPLAY: return setActiveDisplaySubMenu;
      case MainMenuType.COMMUNICATION: return setActiveCommSubMenu;
      case MainMenuType.HOUSE_KEEPING: return setActiveHouseKeepingSubMenu;
      default: return () => {};
    }
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white text-slate-900 transition-all duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 border-r border-slate-200 flex flex-col h-screen overflow-hidden shadow-sm`}>
      <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 shrink-0 bg-slate-50/50">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-100">
            N
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black tracking-tight truncate text-slate-800 uppercase italic">Nexus Core</span>
            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest leading-none">Enterprise ERP</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {MENU_ITEMS.map((item) => {
          const isParentActive = activeMenu === item.id;
          const subItems = SUB_MENU_MAP[item.id];
          const hasSub = !!subItems;
          const activeSubId = getActiveSubId(item.id);
          const subSetter = getSubSetter(item.id) as (id: any) => void;
          
          return (
            <div key={item.id}>
              <button
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all group relative border-l-4 ${
                  isParentActive 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 border-indigo-900' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600 border-transparent'
                }`}
              >
                <span className={`${isParentActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} transition-colors w-5 h-5 flex items-center justify-center shrink-0`}>
                  {item.icon}
                </span>
                <span className={`text-[11px] font-black uppercase tracking-widest flex-1 text-left truncate ${isParentActive ? 'italic' : ''}`}>
                  {item.label}
                </span>
                {hasSub && (
                  <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isParentActive ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {hasSub && (
                <SubMenuContainer isOpen={isParentActive}>
                  {subItems.map(sub => (
                    <SubMenuItem 
                      key={sub.id} 
                      label={sub.label} 
                      id={sub.id} 
                      activeId={activeSubId} 
                      onClick={() => subSetter(sub.id)} 
                    />
                  ))}
                </SubMenuContainer>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white rounded-2xl p-3.5 flex items-center space-x-3 border border-slate-200 shadow-sm">
           <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">👤</div>
           <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-slate-800 uppercase truncate">Vance Alexander</div>
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Admin Shard</div>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;