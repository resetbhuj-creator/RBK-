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
      className={`w-full text-left px-4 py-3 rounded-xl text-[9px] uppercase tracking-[0.2em] transition-all relative group/sub flex items-center border-l-2 ${
        isActive 
          ? 'text-white bg-indigo-600 border-white/40 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] font-black italic translate-x-2' 
          : 'text-slate-500 font-bold border-transparent hover:text-slate-200 hover:bg-white/5 hover:translate-x-1'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full mr-3 transition-all duration-500 ${
        isActive 
          ? 'bg-white scale-125 shadow-[0_0_10px_#fff]' 
          : 'bg-slate-700 scale-75 group-hover/sub:bg-slate-500'
      }`} />
      <span className="truncate block flex-1">{label}</span>
    </button>
  );
};

const SubMenuContainer: React.FC<{ children: React.ReactNode, isOpen: boolean }> = ({ children, isOpen }) => (
  <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2 mb-6' : 'grid-rows-[0fr] opacity-0 mt-0 mb-0'}`}>
    <div className="overflow-hidden ml-7 border-l border-slate-800/60 pl-3 space-y-1.5">
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
    <aside className={`fixed inset-y-0 left-0 z-[100] w-72 bg-slate-950 text-white transition-all duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 border-r border-white/5 flex flex-col h-screen overflow-hidden shadow-2xl`}>
      <div className="flex items-center justify-between px-6 h-20 border-b border-white/5 bg-slate-900 shrink-0">
        <div className="flex items-center space-x-4 overflow-hidden">
          <div className="w-11 h-11 shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-2xl border-2 border-indigo-400/40">
            N
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black tracking-tighter truncate italic uppercase text-white">Nexus Core</span>
            <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-[0.4em] leading-none mt-1">v4.4</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
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
                className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-500 relative group overflow-hidden border ${
                  isParentActive 
                    ? 'bg-white text-slate-900 shadow-[0_15px_30px_-10px_rgba(255,255,255,0.2)] scale-[1.03] border-white' 
                    : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <div className={`absolute left-0 top-3 bottom-3 w-1.5 bg-indigo-600 rounded-r-full transition-all duration-500 ${isParentActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`} />
                <span className={`${isParentActive ? 'text-indigo-600 scale-125' : 'text-slate-600 group-hover:text-indigo-400'} transition-all duration-500 w-6 h-6 flex items-center justify-center shrink-0`}>
                  {item.icon}
                </span>
                <span className={`font-black text-[10px] uppercase tracking-[0.25em] flex-1 text-left truncate transition-all duration-500 ${isParentActive ? 'text-slate-900 italic translate-x-1' : ''}`}>
                  {item.label}
                </span>
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

      <div className="p-4 border-t border-white/5">
        <div className="bg-slate-900 rounded-[1.8rem] p-4 flex items-center space-x-4 border border-white/5">
           <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl shadow-inner border border-white/10 shrink-0">👤</div>
           <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-white uppercase truncate italic">Vance Alexander</div>
              <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate">Authorized Node 04</div>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;