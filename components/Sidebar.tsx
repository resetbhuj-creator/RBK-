
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
      className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all relative group/sub flex items-center border-l-4 ${
        isActive 
          ? 'text-white bg-gradient-to-r from-indigo-600 to-indigo-800 border-indigo-400 shadow-[0_4px_12px_rgba(79,70,229,0.3)] font-black italic translate-x-1.5' 
          : 'text-slate-500 font-bold border-transparent hover:text-slate-200 hover:bg-white/5 hover:translate-x-1'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full mr-3 transition-all duration-500 ${
        isActive 
          ? 'bg-white scale-125 shadow-[0_0_8px_#fff] ring-2 ring-indigo-400' 
          : 'bg-slate-700 scale-75 group-hover/sub:bg-slate-500'
      }`} />
      
      <span className={`truncate block flex-1 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''}`}>{label}</span>
      
      {isActive && (
        <div className="absolute right-2 w-1 h-2 bg-indigo-300 rounded-full animate-pulse shadow-[0_0_8px_#a5b4fc]" />
      )}
    </button>
  );
};

const SubMenuContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ml-7 mt-2 mb-4 space-y-1 border-l border-slate-800 pl-3 animate-in fade-in slide-in-from-left-2 duration-300">
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
          <div className="w-11 h-11 shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-2xl overflow-hidden shadow-2xl border-2 border-indigo-400/40 transform -rotate-3 transition-transform hover:rotate-0 cursor-pointer group/logo">
            {logo && logo.length > 1 ? (
              <img src={logo} alt={companyName} className="w-full h-full object-cover group-hover/logo:scale-110 transition-transform" />
            ) : (
              <span className="text-white text-base">{logo || companyName.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black tracking-tighter truncate italic uppercase text-white">Nexus Core</span>
            <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-[0.4em] leading-none mt-1">Enterprise v4.4</span>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500 hover:text-white transition-all p-2 hover:bg-white/5 rounded-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="px-4 mt-6 mb-2">
         <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer">
            <div className="flex items-center space-x-3">
               <svg className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] group-hover:text-white">Quick Find</span>
            </div>
            <kbd className="px-2 py-0.5 bg-slate-900 text-[8px] font-black text-slate-500 rounded border border-white/5 group-hover:border-indigo-500/50">⌘K</kbd>
         </div>
      </div>

      {/* Navigation Tree */}
      <nav className="flex-1 mt-2 px-4 space-y-2 overflow-y-auto custom-scrollbar pb-10 scroll-smooth">
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
                className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden border ${
                  isParentActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-900 border-indigo-500/50 text-white shadow-[0_12px_24px_rgba(79,70,229,0.4)] z-10 scale-[1.02]' 
                    : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {/* Active Indicator Bar */}
                {isParentActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400 shadow-[0_0_12px_#818cf8]" />
                )}
                
                <span className={`${isParentActive ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-600 group-hover:text-indigo-400'} transition-all duration-300 w-6 h-6 flex items-center justify-center shrink-0`}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
                </span>
                
                <span className={`font-black text-[10px] uppercase tracking-[0.2em] flex-1 text-left truncate transition-all ${isParentActive ? 'text-white translate-x-1' : 'group-hover:translate-x-1'}`}>
                  {item.label}
                </span>

                {hasSub && (
                  <div className={`transition-all duration-500 ${isParentActive ? 'rotate-180 scale-110 text-white' : 'text-slate-800 group-hover:text-slate-400'}`}>
                    {/* Fixed missing quote after h-4 and fixed attribute separation on line 136 */}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
                
                {/* Glow Overlay */}
                {isParentActive && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
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
      <div className="p-4 border-t border-white/5 bg-slate-950 shrink-0">
        <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl group-hover:border-indigo-50/50 transition-all">
            <img src="https://picsum.photos/64/64?random=vance" alt="User" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-black truncate text-white uppercase tracking-tighter italic leading-none group-hover:text-indigo-400 transition-colors">Vance Alexander</span>
            <span className="text-[8px] text-slate-500 truncate font-bold uppercase tracking-widest mt-1.5 flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              Super Admin
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
