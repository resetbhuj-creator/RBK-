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
      className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all relative group/sub flex items-center border-l-2 ${
        isActive 
          ? 'text-white bg-indigo-600 border-indigo-400 shadow-md font-black italic translate-x-1' 
          : 'text-slate-500 font-bold border-transparent hover:text-slate-800 hover:bg-slate-100'
      }`}
    >
      <div className={`w-1 h-1 rounded-full mr-3 transition-all ${isActive ? 'bg-white scale-150 shadow-[0_0_8px_#fff]' : 'bg-slate-300 group-hover/sub:bg-slate-500'}`} />
      <span className="truncate">{label}</span>
    </button>
  );
};

const SubMenuContainer: React.FC<{ children: React.ReactNode, isOpen: boolean }> = ({ children, isOpen }) => (
  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2 mb-4' : 'grid-rows-[0fr] opacity-0'}`}>
    <div className="overflow-hidden ml-7 border-l-2 border-slate-100 pl-3 space-y-1">
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
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-all duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col h-screen overflow-hidden shadow-2xl md:shadow-none`}>
      <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-xl shadow-indigo-100 transform -rotate-3">
            N
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-slate-800">NEXUS CORE</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Enterprise ERP</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
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
                className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl transition-all relative group overflow-hidden border ${
                  isParentActive 
                    ? 'bg-indigo-600 text-white shadow-lg border-indigo-400 scale-[1.02] font-black' 
                    : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className={`absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full transition-transform ${isParentActive ? 'scale-y-100' : 'scale-y-0'}`} />
                <span className={`${isParentActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'} transition-colors w-5 h-5 flex items-center justify-center`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] flex-1 text-left ${isParentActive ? 'text-white italic' : ''}`}>
                  {item.label}
                </span>
                {hasSub && (
                  <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isParentActive ? 'rotate-90 text-white' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-[1.8rem] p-4 flex items-center space-x-4 border border-slate-100">
           <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl shadow-inner">👤</div>
           <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-slate-800 uppercase truncate">Vance Alexander</div>
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">Super Admin Node</div>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
