
import React, { useState } from 'react';
import { useAuth, UserRole } from '../hooks/useAuth';
import AdminUserManagement from '../components/admin/AdminUserManagement';
import AdminCustomerEnvManagement from '../components/admin/AdminCustomerEnvManagement';
import Button from '../components/common/Button'; // Re-using Button for tab-like appearance
import { UsersIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

type AdminTab = 'users' | 'customers';

const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  if (currentUser?.role !== UserRole.ADMIN) {
    return <div className="bg-red-50 text-brand-error p-4 rounded-md shadow">Access Denied. This page is for administrators only.</div>;
  }

  const TabButton: React.FC<{
    tabName: AdminTab;
    currentTab: AdminTab;
    onClick: (tab: AdminTab) => void;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ tabName, currentTab, onClick, icon, children }) => (
    <button
      role="tab"
      aria-selected={currentTab === tabName}
      onClick={() => onClick(tabName)}
      className={`
        flex items-center space-x-2 py-3 px-4 sm:px-5 font-medium text-sm
        border-b-2 transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary
        ${currentTab === tabName 
            ? 'border-brand-primary text-brand-primary' 
            : 'border-transparent text-brand-text-secondary hover:text-brand-text hover:border-gray-300'
        }
      `}
    >
      {icon}
      <span>{children}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Administrator Console</h1>
        <p className="mt-1 text-sm text-brand-text-secondary">Manage users, customers, environments, and other system settings.</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-brand-border">
        <div className="flex border-b border-brand-border" role="tablist" aria-label="Admin Management Tabs">
          <TabButton
            tabName="users"
            currentTab={activeTab}
            onClick={setActiveTab}
            icon={<UsersIcon className="h-5 w-5" />}
          >
            User Management
          </TabButton>
          <TabButton
            tabName="customers"
            currentTab={activeTab}
            onClick={setActiveTab}
            icon={<BuildingOffice2Icon className="h-5 w-5" />}
          >
            Customer & Environments
          </TabButton>
        </div>
        
        <div className="p-4 sm:p-6" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'users' && <AdminUserManagement />}
            {activeTab === 'customers' && <AdminCustomerEnvManagement />}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
