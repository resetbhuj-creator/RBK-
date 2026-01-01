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
  const logo = activeCompany?.logo;
  const companyName = activeCompany?.name || 'Nexus ERP';

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      <div className="flex items-center justify-between px-6 h-16 border-b border-slate-800">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg overflow-hidden">
            {logo && logo.startsWith('data:image') ? (
              <img src={logo} alt={companyName} className="w-full h-full object-cover" />
            ) : (
              <span>{logo || companyName.charAt(0)}</span>
            )}
          </div>
          <span className="text-lg font-bold tracking-tight truncate">{companyName}</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
        </button>
      </div>

      <nav className="mt-6 px-3 space-y-1 overflow-y-auto h-[calc(100vh-140px)] custom-scrollbar">
        {MENU_ITEMS.map((item) => (
          <div key={item.id} className="space-y-1">
            <button
              onClick={() => {
                setActiveMenu(item.id);
                if (window.innerWidth < 768 && ![MainMenuType.ADMINISTRATION, MainMenuType.TRANSACTION, MainMenuType.DISPLAY, MainMenuType.COMMUNICATION, MainMenuType.HOUSE_KEEPING].includes(item.id)) setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeMenu === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <span className={`${activeMenu === item.id ? 'text-white' : 'text-slate-500'} transition-colors`}>{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
              {[MainMenuType.ADMINISTRATION, MainMenuType.TRANSACTION, MainMenuType.DISPLAY, MainMenuType.COMMUNICATION, MainMenuType.HOUSE_KEEPING].includes(item.id) && (
                <svg className={`ml-auto w-3.5 h-3.5 transition-transform duration-300 ${activeMenu === item.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              )}
            </button>

            {item.id === MainMenuType.ADMINISTRATION && activeMenu === MainMenuType.ADMINISTRATION && (
              <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-800 pl-4 animate-in slide-in-from-top-2 duration-300">
                {ADMINISTRATION_SUB_MENUS.map(sub => (
                  <button key={sub.id} onClick={() => { setActiveAdminSubMenu(sub.id as AdminSubMenu); if (window.innerWidth < 768) setIsOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeAdminSubMenu === sub.id ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>{sub.label}</button>
                ))}
              </div>
            )}

            {item.id === MainMenuType.TRANSACTION && activeMenu === MainMenuType.TRANSACTION && (
              <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-800 pl-4 animate-in slide-in-from-top-2 duration-300">
                {TRANSACTION_SUB_MENUS.map(sub => (
                  <button key={sub.id} onClick={() => { setActiveTransactionSubMenu(sub.id as TransactionSubMenu); if (window.innerWidth < 768) setIsOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTransactionSubMenu === sub.id ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>{sub.label}</button>
                ))}
              </div>
            )}

            {item.id === MainMenuType.DISPLAY && activeMenu === MainMenuType.DISPLAY && (
              <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-800 pl-4 animate-in slide-in-from-top-2 duration-300">
                {DISPLAY_SUB_MENUS.map(sub => (
                  <button key={sub.id} onClick={() => { setActiveDisplaySubMenu(sub.id as DisplaySubMenu); if (window.innerWidth < 768) setIsOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeDisplaySubMenu === sub.id ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>{sub.label}</button>
                ))}
              </div>
            )}

            {item.id === MainMenuType.COMMUNICATION && activeMenu === MainMenuType.COMMUNICATION && (
              <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-800 pl-4 animate-in slide-in-from-top-2 duration-300">
                {COMMUNICATION_SUB_MENUS.map(sub => (
                  <button key={sub.id} onClick={() => { setActiveCommSubMenu(sub.id as CommunicationSubMenu); if (window.innerWidth < 768) setIsOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeCommSubMenu === sub.id ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>{sub.label}</button>
                ))}
              </div>
            )}

            {item.id === MainMenuType.HOUSE_KEEPING && activeMenu === MainMenuType.HOUSE_KEEPING && (
              <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-800 pl-4 animate-in slide-in-from-top-2 duration-300">
                {HOUSE_KEEPING_SUB_MENUS.map(sub => (
                  <button key={sub.id} onClick={() => { setActiveHouseKeepingSubMenu(sub.id as HouseKeepingSubMenu); if (window.innerWidth < 768) setIsOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeHouseKeepingSubMenu === sub.id ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>{sub.label}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-600">
            <img src="https://picsum.photos/100/100?random=1" alt="User" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold truncate text-slate-200 leading-tight">System Admin</span>
            <span className="text-[10px] text-slate-500 truncate leading-tight">admin@nexus.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;