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
      className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-[0.12em] transition-all relative group/sub flex items-center ${
        isActive 
          ? 'text-white bg-indigo-600/30 ring-1 ring-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)] font-black italic' 
          : 'text-slate-500 font-bold hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      <div className={`w-2 h-2 rounded-full mr-3 transition-all duration-500 ${
        isActive 
          ? 'bg-indigo-400 scale-110 shadow-[0_0_12px_#818cf8] border border-white/20' 
          : 'bg-slate-800 scale-75 opacity-40 group-hover/sub:bg-slate-500'
      }`} />
      
      <span className="truncate block flex-1">{label}</span>
      
      {isActive && (
        <div className="absolute right-3 w-1 h-3 bg-white/40 rounded-full animate-in fade-in zoom-in duration-500 shadow-[0_0_8px_white]" />
      )}
    </button>
  );
};

const SubMenuContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ml-4 mt-2 mb-4 space-y-1.5 border-l-2 border-slate-900 pl-3 animate-in fade-in slide-in-from-left-3 duration-500">
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
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-white transition-all duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 border-r border-slate-900 flex flex-col h-screen overflow-hidden shadow-2xl`}>
      {/* Brand Node */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-2xl shrink-0">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl overflow-hidden shadow-2xl border border-indigo-500/40 transform -rotate-3 transition-transform hover:rotate-0 cursor-pointer">
            {logo && logo.startsWith('data:image') ? (
              <img src={logo} alt={companyName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm">{logo || companyName.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black tracking-tighter truncate italic uppercase text-slate-100">Nexus Core</span>
            <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-[0.3em] leading-none mt-1">Enterprise OS</span>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500 hover:text-white transition-all p-2 hover:bg-slate-900 rounded-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Navigation Tree */}
      <nav className="flex-1 mt-6 px-3 space-y-2 overflow-y-auto custom-scrollbar pb-8 scroll-smooth">
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
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-500 relative group overflow-hidden border ${
                  isParentActive 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_15px_30px_rgba(79,70,229,0.3)] ring-1 ring-white/10 z-10' 
                    : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-100'
                }`}
              >
                {/* Active Indicator Bar - Neon Effect */}
                {isParentActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r-full shadow-[0_0_12px_#fff] animate-in slide-in-from-left-4 duration-500" />
                )}
                
                <span className={`${isParentActive ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-slate-600 group-hover:text-indigo-400'} transition-all duration-500 w-6 h-6 flex items-center justify-center shrink-0`}>
                  {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}
                </span>
                
                <span className={`font-black text-[11px] uppercase tracking-[0.18em] flex-1 text-left truncate italic ${isParentActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>

                {hasSub && (
                  <div className={`transition-all duration-700 ${isParentActive ? 'rotate-180 scale-110' : 'text-slate-800 group-hover:text-slate-400'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
                
                {/* Visual Depth Overlay */}
                {isParentActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-40" />
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
      <div className="p-4 border-t border-slate-900 bg-slate-950 shrink-0">
        <div className="flex items-center space-x-3 p-3 bg-slate-900/40 rounded-2xl border border-slate-800/40 hover:bg-slate-900 transition-all duration-300 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shadow-2xl group-hover:border-indigo-500/50 transition-all duration-500">
            <img src="https://picsum.photos/64/64?random=1" alt="User" className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-black truncate text-slate-100 uppercase tracking-tighter italic leading-none group-hover:text-indigo-400 transition-colors">Vance Alexander</span>
            <span className="text-[8px] text-slate-500 truncate font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_5px_#10b981]" />
              Super Admin
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;