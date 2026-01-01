import React, { useState, useRef, useEffect } from 'react';

export interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'primary' | 'success';
}

interface ActionMenuProps {
  actions: ActionItem[];
  label?: string;
  align?: 'left' | 'right';
}

const ActionMenu: React.FC<ActionMenuProps> = ({ actions, label = 'Action', align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case 'danger': return 'text-rose-600 hover:bg-rose-50';
      case 'primary': return 'text-indigo-600 hover:bg-indigo-50';
      case 'success': return 'text-emerald-600 hover:bg-emerald-50';
      default: return 'text-slate-600 hover:bg-slate-50';
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all transform active:scale-95 ${
          isOpen 
            ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 shadow-sm'
        }`}
      >
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute z-[100] mt-2 w-56 rounded-2xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="py-1">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-xs font-bold transition-colors ${getVariantStyles(action.variant)}`}
              >
                <span className="mr-3 opacity-70">{action.icon}</span>
                <span className="uppercase tracking-wider">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;