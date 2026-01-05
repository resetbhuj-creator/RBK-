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
      className={`w-full text-left px-4 py-3 rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all relative group/sub flex items-center border-l-4 ${
        isActive 
          ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500 shadow-[inset_15px_0_30px_rgba(99,102,241,0.05)] font-black italic translate-x-2' 
          : 'text-slate-500 font-bold border-transparent hover:text-slate-200 hover:bg-white/5 hover:translate-x-1'
      }`}
    >
      <div className={`w-2 h-2 rounded-full mr-3 transition-all duration-500 ${
        isActive 
          ? 'bg-indigo-400 scale-125 shadow-[0_0_12px_#818cf8] ring-4 ring-indigo-500/20 animate-pulse' 
          : 'bg-slate-800 scale-75 group-hover/sub:bg-slate-500'
      }`} />
      
      <span className="truncate block flex-1">{label}</span>
      
      {isActive && (
        <div className="absolute right-3 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]" />
      )}
    </button>
  );
};

const SubMenuContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ml-6 mt-1 mb-6 space-y-1.5 border-l border-slate-800/40 pl-2 animate-in fade-in slide-in-from-left-4 duration-500">
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
    <aside className={`fixed inset-y-0 left-0 z-[100] w-72 bg-slate-950 text-white transition-all duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 border-r border-white/5 flex flex-col h-screen overflow-hidden shadow-2xl`}>
      {/* Brand Node */}
      <div className="flex items-center justify-between px-6 h-20 border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl shrink-0">
        <div className="flex items-center space-x-4 overflow-hidden">
          <div className="w-12 h-12 shrink-0 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl overflow-hidden shadow-2xl border-2 border-indigo-400/40 transform -rotate-3 transition-transform hover:rotate-0 cursor-pointer group/logo">
            {logo && logo.startsWith('data:image') ? (
              <img src={logo} alt={companyName} className="w-full h-full object-cover group-hover/logo:scale-110 transition-transform" />
            ) : (
              <span className="text-white text-base">{logo || companyName.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black tracking-tighter truncate italic uppercase text-white">Nexus Core</span>
            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-[0.4em] leading-none mt-1">v4.4 Enterprise</span>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500 hover:text-white transition-all p-2 hover:bg-white/5 rounded-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Navigation Tree */}
      <nav className="flex-1 mt-8 px-4 space-y-3 overflow-y-auto custom-scrollbar pb-10 scroll-smooth">
        {MENU_ITEMS.map((item) => {
          const isParentActive = activeMenu === item.id;
          const hasSub = [MainMenuType.ADMINISTRATION, MainMenuType.TRANSACTION, MainMenuType.DISPLAY, MainMenuType.COMMUNICATION, MainMenuType.HOUSE_KEEPING].includes(item.id);
          
          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  setActiveMenu(item.id);
                  if (window.innerWidth < 768 && !hasSub) setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-500 relative group overflow-hidden border ${
                  isParentActive 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_15px_35px_rgba(79,70,229,0.4)] z-10 scale-[1.03]' 
                    : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-100'
                }`}
              >
                {/* Active Indicator Bar - Vertical Neon */}
                {isParentActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-white rounded-r-full shadow-[0_0_15px_#fff] animate-in slide-in-from-left-4 duration-700" />
                )}
                
                <span className={`${isParentActive ? 'text-white scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'text-slate-600 group-hover:text-indigo-400'} transition-all duration-500 w-6 h-6 flex items-center justify-center shrink-0`}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
                </span>
                
                <span className={`font-black text-[11px] uppercase tracking-[0.25em] flex-1 text-left truncate italic transition-all ${isParentActive ? 'text-white translate-x-2' : 'group-hover:translate-x-1'}`}>
                  {item.label}
                </span>

                {hasSub && (
                  <div className={`transition-all duration-700 ${isParentActive ? 'rotate-180 scale-125 text-white' : 'text-slate-800 group-hover:text-slate-400'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
                
                {/* Dynamic Surface Highlight */}
                {isParentActive && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none opacity-40" />
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

      {/* Identity Node Footer */}
      <div className="p-5 border-t border-white/5 bg-slate-950 shrink-0">
        <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer group shadow-inner">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl group-hover:border-indigo-500/50 transition-all duration-500">
            <img src="https://picsum.photos/64/64?random=vance" alt="User" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-black truncate text-white uppercase tracking-tighter italic leading-none group-hover:text-indigo-400 transition-colors">Vance Alexander</span>
            <span className="text-[9px] text-slate-500 truncate font-bold uppercase tracking-[0.25em] mt-2 flex items-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_8px_#10b981]" />
              Super Admin
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;