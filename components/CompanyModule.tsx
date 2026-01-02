import React, { useState } from 'react';
import { COMPANY_SUB_MENUS } from '../constants';
import { CompanySubMenu, Company, AuditLog } from '../types';
import CreateCompanyForm from './CreateCompanyForm';
import EditCompanyForm from './EditCompanyForm';
import OpenCompanyForm from './OpenCompanyForm';
import SplitYearForm from './SplitYearForm';
import DeleteCompanyForm from './DeleteCompanyForm';
import AddYearForm from './AddYearForm';
import RestoreCompanyForm from './RestoreCompanyForm';

interface CompanyModuleProps {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  currentCompanyId: string;
  setCurrentCompanyId: (id: string) => void;
  currentFY: string;
  setCurrentFY: (fy: string) => void;
  addAuditLog?: (log: Omit<AuditLog, 'id' | 'timestamp' | 'actor'>) => void;
}

const CompanyModule: React.FC<CompanyModuleProps> = ({ 
  companies, 
  setCompanies, 
  currentCompanyId, 
  setCurrentCompanyId, 
  currentFY, 
  setCurrentFY,
  addAuditLog
}) => {
  const [activeSubAction, setActiveSubAction] = useState<CompanySubMenu | null>(null);

  const activeCompany = companies.find(c => c.id === currentCompanyId) || { name: 'None Selected' } as Company;

  const handleActionClick = (id: CompanySubMenu) => {
    setActiveSubAction(id);
  };

  const handleCreateSubmit = (data: any) => {
    const startYear = new Date(data.fyStartDate).getFullYear();
    const endYear = startYear + 1;
    const fyString = `${startYear} - ${endYear}`;

    const newCompany: Company = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      years: [fyString],
      country: data.country,
      state: data.state,
      currency: data.currency,
      taxLaw: data.taxLaw,
      logo: data.logo || data.name.charAt(0).toUpperCase(),
      lastAccessed: new Date().toISOString(),
      dataPath: data.dataPath,
      address: data.address,
      taxId: data.taxId,
      email: data.email,
      website: data.website,
      fyStartDate: data.fyStartDate,
      booksBeginDate: data.booksBeginDate
    };
    
    setCompanies(prev => [...prev, newCompany]);
    setCurrentCompanyId(newCompany.id);
    setCurrentFY(fyString);
    
    if (addAuditLog) {
      addAuditLog({
        action: 'CREATE',
        entityType: 'COMPANY',
        entityName: data.name,
        details: `INITIALIZATION: New corporate node created for ${data.name}.`
      });
    }

    alert(`Company "${data.name}" created successfully.\nAccounting Year Starts: ${data.fyStartDate}`);
    setActiveSubAction(null);
  };

  const handleEditSubmit = (data: any) => {
    setCompanies(prev => prev.map(c => 
      c.id === currentCompanyId ? { ...c, ...data } : c
    ));

    if (addAuditLog) {
      addAuditLog({
        action: 'UPDATE',
        entityType: 'COMPANY',
        entityName: data.name,
        details: `RECONFIGURATION: Modified statutory profile and financial formatting preferences.`
      });
    }

    alert(`Company "${data.name}" updated successfully.`);
    setActiveSubAction(null);
  };

  const handleRestoreSubmit = (data: any) => {
    const restoredCompany: Company = {
      id: data.id,
      name: data.name,
      years: ['2023 - 2024'],
      country: 'USA',
      state: 'NY',
      currency: 'USD ($)',
      logo: 'R',
      lastAccessed: new Date().toISOString(),
      dataPath: data.dataPath,
      fyStartDate: '2023-04-01',
      booksBeginDate: '2023-04-01'
    };
    
    setCompanies(prev => [...prev, restoredCompany]);
    setCurrentCompanyId(restoredCompany.id);
    setCurrentFY('2023 - 2024');

    if (addAuditLog) {
      addAuditLog({
        action: 'UPDATE',
        entityType: 'COMPANY',
        entityName: data.name,
        details: `RECOVERY SEQUENCE: Successfully restored corporate data from external vault.`
      });
    }

    alert(`System Recovery Successful: ${data.name} is now the active context.`);
    setActiveSubAction(null);
  };

  const handleLoadCompany = (company: Company) => {
    const timestamp = new Date().toISOString();
    
    setCompanies(prev => prev.map(c => 
      c.id === company.id ? { ...c, lastAccessed: timestamp } : c
    ));
    
    setCurrentCompanyId(company.id);
    if (company.years && company.years.length > 0) {
      setCurrentFY(company.years[company.years.length - 1]);
    }
    setActiveSubAction(null);
  };

  const handleAddYearSubmit = (yearString: string) => {
    setCompanies(prev => prev.map(c => 
      c.id === currentCompanyId ? { ...c, years: [...(c.years || []), yearString] } : c
    ));
    setCurrentFY(yearString);

    if (addAuditLog) {
      addAuditLog({
        action: 'UPDATE',
        entityType: 'COMPANY',
        entityName: activeCompany.name,
        details: `PERIOD PROVISIONING: Added new financial year ${yearString}.`
      });
    }

    alert(`New Financial Year "${yearString}" added successfully.`);
    setActiveSubAction(null);
  };

  const handleSplitYear = (data: any) => {
    const newYear = data.newYearStartDate.substring(0, 4);
    const nextYear = (parseInt(newYear) + 1).toString();
    const period = `${newYear} - ${nextYear}`;
    
    setCompanies(prev => prev.map(c => 
      c.id === currentCompanyId ? { ...c, years: [...c.years, period] } : c
    ));
    
    setCurrentFY(period);

    if (addAuditLog) {
      addAuditLog({
        action: 'UPDATE',
        entityType: 'COMPANY',
        entityName: activeCompany.name,
        details: `ARCHIVAL SPLIT: Current data archived. New session initiated for ${period}.`
      });
    }

    alert(`Financial Year Split Successful!\nNew Period Active: ${period}`);
    setActiveSubAction(null);
  };

  const handleDeleteData = (data: any) => {
    if (data.scope === 'COMPLETE') {
      const remainingCompanies = companies.filter(c => c.id !== data.companyId);
      setCompanies(remainingCompanies);
      
      if (addAuditLog) {
        addAuditLog({
          action: 'DELETE',
          entityType: 'COMPANY',
          entityName: data.companyName,
          details: `PURGE SEQUENCE: Complete corporate node and all associated years removed from registry.`
        });
      }

      if (data.companyId === currentCompanyId) {
        if (remainingCompanies.length > 0) {
          setCurrentCompanyId(remainingCompanies[0].id);
          setCurrentFY(remainingCompanies[0].years?.[remainingCompanies[0].years.length - 1] || 'N/A');
        } else {
          setCurrentCompanyId('');
          setCurrentFY('N/A');
        }
      }
      alert(`Company purged.`);
    } else {
      setCompanies(prev => prev.map(c => 
        c.id === data.companyId ? { ...c, years: c.years.filter((y: string) => y !== data.year) } : c
      ));

      if (addAuditLog) {
        addAuditLog({
          action: 'DELETE',
          entityType: 'COMPANY',
          entityName: activeCompany.name,
          details: `SELECTIVE PURGE: Financial year ${data.year} removed from company history.`
        });
      }
    }
    setActiveSubAction(null);
  };

  const BackButton = () => (
    <button 
      onClick={() => setActiveSubAction(null)}
      className="mb-6 flex items-center text-slate-500 hover:text-indigo-600 font-medium transition-colors group"
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-indigo-50 transition-colors mr-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
      Back to Overview
    </button>
  );

  if (activeSubAction === CompanySubMenu.CREATE_COMPANY) {
    return (
      <div className="animate-in fade-in duration-500">
        <BackButton />
        <CreateCompanyForm onCancel={() => setActiveSubAction(null)} onSubmit={handleCreateSubmit} />
      </div>
    );
  }

  if (activeSubAction === CompanySubMenu.EDIT_COMPANY) {
    return (
      <div className="animate-in fade-in duration-500">
        <BackButton />
        <EditCompanyForm initialData={activeCompany} onCancel={() => setActiveSubAction(null)} onSubmit={handleEditSubmit} />
      </div>
    );
  }

  if (activeSubAction === CompanySubMenu.RESTORE_COMPANY) {
    return (
      <div className="animate-in fade-in duration-500">
        <BackButton />
        <RestoreCompanyForm onCancel={() => setActiveSubAction(null)} onSubmit={handleRestoreSubmit} />
      </div>
    );
  }

  if (activeSubAction === CompanySubMenu.OPEN_COMPANY) {
    return (
      <div className="animate-in fade-in duration-500">
        <BackButton />
        <OpenCompanyForm companies={companies} onCancel={() => setActiveSubAction(null)} onLoad={handleLoadCompany} />
      </div>
    );
  }

  if (activeSubAction === CompanySubMenu.ADD_YEAR) {
    return (
      <div className="animate-in fade-in duration-500">
        <BackButton />
        <AddYearForm 
          currentCompany={activeCompany.name} 
          existingYears={activeCompany.years || []}
          onCancel={() => setActiveSubAction(null)} 
          onSubmit={handleAddYearSubmit} 
        />
      </div>
    );
  }

  if (activeSubAction === CompanySubMenu.SPLIT_YEAR) {
    return (
      <div className="animate-in fade-in duration-500">
        <BackButton />
        <SplitYearForm currentCompany={activeCompany.name} onCancel={() => setActiveSubAction(null)} onConfirm={handleSplitYear} />
      </div>
    );
  }

  if (activeSubAction === CompanySubMenu.DELETE_COMPANY) {
    return (
      <div className="animate-in fade-in duration-500">
        <BackButton />
        <DeleteCompanyForm companies={companies} onCancel={() => setActiveSubAction(null)} onDelete={handleDeleteData} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Company Management</h2>
          <p className="text-slate-500">Manage business profiles, financial periods, and organizational data.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => handleActionClick(CompanySubMenu.CREATE_COMPANY)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all transform active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create New Company</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COMPANY_SUB_MENUS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleActionClick(item.id as CompanySubMenu)}
            className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 text-left overflow-hidden"
          >
            <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
              {item.icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase">
              {item.label}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-slate-400 text-sm font-medium mb-1">Active Entity</div>
            <div className="text-xl font-bold truncate">{activeCompany.name}</div>
          </div>
          <div>
            <div className="text-slate-400 text-sm font-medium mb-1">Fiscal Cycle</div>
            <div className="text-xl font-bold">{currentFY}</div>
          </div>
          <div>
            <div className="text-slate-400 text-sm font-medium mb-1">System Node</div>
            <div className="text-xl font-bold flex items-center text-emerald-400">
              Operational
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyModule;