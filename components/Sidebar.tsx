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
      className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all relative group/sub ${
        isActive 
          ? 'text-indigo-400 bg-indigo-500/10 shadow-sm' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
    >
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-all ${
        isActive ? 'bg-indigo-500 scale-100 opacity-100 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-700 scale-50 opacity-0'
      }`} />
      <span className="ml-2 truncate block">{label}</span>
    </button>
  );
};

const SubMenuContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ml-7 mt-0.5 mb-2 space-y-0.5 border-l border-slate-800/40 pl-2 animate-in fade-in slide-in-from-top-1 duration-200">
    {children}
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
  const logo = activeCompany?.logo;
  const companyName = activeCompany?.name || 'Nexus ERP';

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-slate-950 text-white transition-all duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 border-r border-slate-900 flex flex-col h-screen overflow-hidden`}>
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl shrink-0">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-8 h-8 shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-lg overflow-hidden shadow-lg border border-indigo-500/30 transform -rotate-2">
            {logo && logo.startsWith('data:image') ? (
              <img src={logo} alt={companyName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs">{logo || companyName.charAt(0)}</span>
            )}
          </div>
          <span className="text-sm font-black tracking-tight truncate italic uppercase text-slate-200">Nexus Core</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500 hover:text-white transition-colors p-1.5 hover:bg-slate-900 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
        </button>
      </div>

      <nav className="flex-1 mt-4 px-2.5 space-y-1 overflow-y-auto custom-scrollbar pb-6 scroll-smooth">
        {MENU_ITEMS.map((item) => {
          const isParentActive = activeMenu === item.id;
          const hasSub = [MainMenuType.ADMINISTRATION, MainMenuType.TRANSACTION, MainMenuType.DISPLAY, MainMenuType.COMMUNICATION, MainMenuType.HOUSE_KEEPING].includes(item.id);
          
          return (
            <div key={item.id} className="space-y-0.5">
              <button
                onClick={() => {
                  setActiveMenu(item.id);
                  if (window.innerWidth < 768 && !hasSub) setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all relative group ${
                  isParentActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50' 
                    : 'text-slate-500 hover:bg-slate-900/50 hover:text-slate-200'
                }`}
              >
                <span className={`${isParentActive ? 'text-indigo-100 scale-110' : 'text-slate-600 group-hover:text-indigo-400'} transition-transform duration-300 w-5 h-5 flex items-center justify-center`}>
                  {React.cloneElement(item.icon as React.ReactElement, { className: 'w-4 h-4' })}
                </span>
                
                <span className={`font-bold text-[10px] uppercase tracking-wider flex-1 text-left truncate ${isParentActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>

                {hasSub && (
                  <svg className={`w-3 h-3 transition-transform duration-300 ${isParentActive ? 'rotate-180 text-white' : 'text-slate-700 group-hover:text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {isParentActive && (
                <>
                  {item.id === MainMenuType.ADMINISTRATION && (
                    <SubMenuContainer>
                      {ADMINISTRATION_SUB_MENUS.map(sub => (
                        <SubMenuItem 
                          key={sub.id} 
                          label={sub.label} 
                          id={sub.id} 
                          activeId={activeAdminSubMenu} 
                          onClick={() => { setActiveAdminSubMenu(sub.id as AdminSubMenu); if (window.innerWidth < 768) setIsOpen(false); }} 
                        />
                      ))}
                    </SubMenuContainer>
                  )}

                  {item.id === MainMenuType.TRANSACTION && (
                    <SubMenuContainer>
                      {TRANSACTION_SUB_MENUS.map(sub => (
                        <SubMenuItem 
                          key={sub.id} 
                          label={sub.label} 
                          id={sub.id} 
                          activeId={activeTransactionSubMenu} 
                          onClick={() => { setActiveTransactionSubMenu(sub.id as TransactionSubMenu); if (window.innerWidth < 768) setIsOpen(false); }} 
                        />
                      ))}
                    </SubMenuContainer>
                  )}

                  {item.id === MainMenuType.DISPLAY && (
                    <SubMenuContainer>
                      {DISPLAY_SUB_MENUS.map(sub => (
                        <SubMenuItem 
                          key={sub.id} 
                          label={sub.label} 
                          id={sub.id} 
                          activeId={activeDisplaySubMenu} 
                          onClick={() => { setActiveDisplaySubMenu(sub.id as DisplaySubMenu); if (window.innerWidth < 768) setIsOpen(false); }} 
                        />
                      ))}
                    </SubMenuContainer>
                  )}

                  {item.id === MainMenuType.COMMUNICATION && (
                    <SubMenuContainer>
                      {COMMUNICATION_SUB_MENUS.map(sub => (
                        <SubMenuItem 
                          key={sub.id} 
                          label={sub.label} 
                          id={sub.id} 
                          activeId={activeCommSubMenu} 
                          onClick={() => { setActiveCommSubMenu(sub.id as CommunicationSubMenu); if (window.innerWidth < 768) setIsOpen(false); }} 
                        />
                      ))}
                    </SubMenuContainer>
                  )}

                  {item.id === MainMenuType.HOUSE_KEEPING && (
                    <SubMenuContainer>
                      {HOUSE_KEEPING_SUB_MENUS.map(sub => (
                        <SubMenuItem 
                          key={sub.id} 
                          label={sub.label} 
                          id={sub.id} 
                          activeId={activeHouseKeepingSubMenu} 
                          onClick={() => { setActiveHouseKeepingSubMenu(sub.id as HouseKeepingSubMenu); if (window.innerWidth < 768) setIsOpen(false); }} 
                        />
                      ))}
                    </SubMenuContainer>
                  )}
                </>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-900 bg-slate-950 shrink-0">
        <div className="flex items-center space-x-2.5 p-2 bg-slate-900/40 rounded-xl border border-slate-800/40">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shadow-inner group cursor-pointer hover:border-indigo-500/50 transition-all">
            <img src="https://picsum.photos/64/64?random=1" alt="User" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] font-black truncate text-slate-100 uppercase tracking-tighter italic leading-none">Sys Admin</span>
            <span className="text-[8px] text-slate-600 truncate font-bold uppercase tracking-widest mt-1">Core Cluster</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;