
import React, { useState, useEffect, useCallback } from 'react';
import { Customer, Environment } from '../../types';
import { getMockCustomers, addMockCustomer, getMockEnvironments, addMockEnvironment, updateMockEnvironment } from '../../services/api';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Table, { Column } from '../common/Table';
import { PlusCircleIcon, PencilSquareIcon, BuildingStorefrontIcon, ServerStackIcon, EyeIcon } from '@heroicons/react/24/outline'; // Updated icons

interface EnvFormData extends Partial<Omit<Environment, 'id' | 'customerName' | 'customerId'>> {
    customerId?: string; 
    name?: string;
    requestInstructions?: string;
}

const AdminCustomerEnvManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingEnvs, setIsLoadingEnvs] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  
  const [customerFormData, setCustomerFormData] = useState<Partial<Customer>>({ name: '' });
  const [envFormData, setEnvFormData] = useState<EnvFormData>({ name: '', requestInstructions: ''});
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [formError, setFormError] = useState(''); // Shared form error

  const fetchCustomers = useCallback(async (selectFirst = false) => {
    setIsLoadingCustomers(true);
    try {
      const custData = await getMockCustomers();
      setCustomers(custData.sort((a,b)=>a.name.localeCompare(b.name)));
      if (selectFirst && custData.length > 0) {
        handleSelectCustomer(custData[0]);
      } else if (!selectedCustomer && custData.length > 0) {
        // If no customer is selected but customers exist, select the first one.
        // This handles initial load if selectedCustomer wasn't set by fetchCustomersAndEnvs.
        handleSelectCustomer(custData[0]);
      } else if (selectedCustomer) {
        // Refresh environments for the currently selected customer if it still exists
        const currentCustomerStillExists = custData.find(c => c.id === selectedCustomer.id);
        if (currentCustomerStillExists) {
            handleSelectCustomer(currentCustomerStillExists); // re-select to refresh its envs
        } else {
            setSelectedCustomer(null); // current customer was deleted
            setEnvironments([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setFormError("Could not load customer data.");
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [selectedCustomer]); // Add selectedCustomer to dependencies

  useEffect(() => {
    fetchCustomers(true); // Select first customer on initial load
  }, []); // Empty dependency array for initial load

  
  const handleSelectCustomer = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsLoadingEnvs(true);
    setEnvironments([]); // Clear previous envs
    try {
        const envData = await getMockEnvironments(customer.id);
        setEnvironments(envData.sort((a,b)=>a.name.localeCompare(b.name)));
    } catch (error) {
        console.error("Failed to fetch environments for customer:", error);
        setFormError(`Could not load environments for ${customer.name}.`);
    } finally {
        setIsLoadingEnvs(false);
    }
  }, []);


  // Customer Modal
  const handleOpenCustomerModal = () => {
    setCustomerFormData({ name: '' });
    setFormError('');
    setIsCustomerModalOpen(true);
  };
  const handleCustomerSubmit = async () => {
    if (!customerFormData.name?.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    setFormError('');
    // Use a specific loading state for this modal if it becomes slow
    setIsLoadingCustomers(true); 
    try {
      const newCustomer = await addMockCustomer({ name: customerFormData.name });
      await fetchCustomers(); // Refetch all customers
      if (newCustomer) handleSelectCustomer(newCustomer); // Select the newly added customer
      setIsCustomerModalOpen(false);
    } catch (error) {
      console.error("Failed to add customer:", error);
      setFormError('An error occurred while adding the customer.');
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Environment Modal
  const handleOpenEnvModal = (env?: Environment) => {
    if (!selectedCustomer) {
        setFormError("Please select a customer before adding an environment.");
        return;
    }
    if (env) {
      setEditingEnv(env);
      setEnvFormData({ name: env.name, requestInstructions: env.requestInstructions });
    } else {
      setEditingEnv(null);
      setEnvFormData({ name: '', requestInstructions: ''});
    }
    setFormError('');
    setIsEnvModalOpen(true);
  };

  const handleEnvSubmit = async () => {
    if (!envFormData.name?.trim() || !selectedCustomer) {
      setFormError('Environment name is required and a customer must be selected.');
      return;
    }
    setFormError('');
    setIsLoadingEnvs(true); // Use env loading state
    try {
      if (editingEnv) {
        await updateMockEnvironment(editingEnv.id, { name: envFormData.name, requestInstructions: envFormData.requestInstructions });
      } else {
        await addMockEnvironment({ 
            customerId: selectedCustomer.id, 
            name: envFormData.name!, 
            requestInstructions: envFormData.requestInstructions! 
        });
      }
      if(selectedCustomer) handleSelectCustomer(selectedCustomer); // Refresh environments for current customer
      setIsEnvModalOpen(false);
    } catch (error) {
      console.error("Failed to save environment:", error);
      setFormError('An error occurred while saving the environment.');
    } finally {
      setIsLoadingEnvs(false);
    }
  };

  const customerColumns: Column<Customer>[] = [
    { header: 'Customer Name', accessor: 'name', cellClassName: 'font-medium' },
    { 
      header: 'Actions', 
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      accessor: (item) => (
        <Button 
            onClick={() => handleSelectCustomer(item)} 
            variant={selectedCustomer?.id === item.id ? "primary" : "ghost"} 
            size="sm"
            leftIcon={<EyeIcon className="h-4 w-4"/>}
            disabled={isLoadingCustomers || isLoadingEnvs}
        >
            {selectedCustomer?.id === item.id ? "Viewing" : "View Envs"}
        </Button>
      )
    },
  ];

  const envColumns: Column<Environment>[] = [
    { header: 'Environment Name', accessor: 'name', cellClassName: 'font-medium' },
    { 
        header: 'Access Instructions', 
        accessor: 'requestInstructions', 
        cellClassName: "text-sm text-brand-text-secondary max-w-md truncate",
        render: (item) => item.requestInstructions || <span className="text-gray-400 italic">N/A</span>
    },
    { 
        header: 'Actions', 
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        accessor: (item) => (
            <Button onClick={() => handleOpenEnvModal(item)} variant="ghost" size="sm" leftIcon={<PencilSquareIcon className="h-4 w-4"/>} disabled={isLoadingEnvs}>
                Edit
            </Button>
      )
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
                <h3 className="text-lg font-semibold text-brand-text">Customers</h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">Select a customer to manage their environments.</p>
            </div>
            <Button onClick={handleOpenCustomerModal} variant="secondary" size="sm" leftIcon={<PlusCircleIcon className="h-5 w-5"/>} className="w-full sm:w-auto">
                Add Customer
            </Button>
        </div>
        <Table 
            columns={customerColumns} 
            data={customers} 
            isLoading={isLoadingCustomers && customers.length === 0} 
            rowKeyAccessor="id" 
            emptyMessage={
                <div className="text-center py-6">
                    <BuildingStorefrontIcon className="h-10 w-10 text-gray-300 mx-auto mb-1" />
                    <p className="text-sm text-brand-text-secondary">No customers found.</p>
                </div>
            }
        />
      </div>

      <div className="lg:col-span-2 space-y-4">
        {selectedCustomer ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-brand-text">Environments for: <span className="text-brand-primary">{selectedCustomer.name}</span></h3>
                    <p className="text-xs text-brand-text-secondary mt-0.5">Manage environments associated with the selected customer.</p>
                </div>
                <Button onClick={() => handleOpenEnvModal()} variant="secondary" size="sm" leftIcon={<PlusCircleIcon className="h-5 w-5"/>} className="w-full sm:w-auto" disabled={!selectedCustomer}>
                    Add Environment
                </Button>
            </div>
            <Table 
                columns={envColumns} 
                data={environments} 
                isLoading={isLoadingEnvs && environments.length === 0} 
                rowKeyAccessor="id" 
                emptyMessage={
                    <div className="text-center py-6">
                         <ServerStackIcon className="h-10 w-10 text-gray-300 mx-auto mb-1" />
                        <p className="text-sm text-brand-text-secondary">No environments found for {selectedCustomer.name}.</p>
                    </div>
                }
            />
          </>
        ) : (
          <div className="text-center text-brand-text-secondary py-10 border border-dashed border-brand-border rounded-lg h-full flex flex-col justify-center items-center">
            <BuildingStorefrontIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <h3 className="font-medium text-brand-text">No Customer Selected</h3>
            <p className="text-sm">Please select a customer from the list to view and manage their environments.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
        title="Add New Customer"
        size="md"
        footer={
             <div className="flex w-full justify-between items-center">
                {formError && !customerFormData.name && <p className="text-xs text-brand-error flex-grow mr-3">{formError}</p>}
                 <div className="flex space-x-3 ml-auto">
                    <Button variant="ghost" onClick={() => setIsCustomerModalOpen(false)} disabled={isLoadingCustomers}>Cancel</Button>
                    <Button variant="primary" onClick={handleCustomerSubmit} isLoading={isLoadingCustomers} disabled={isLoadingCustomers || !customerFormData.name?.trim()}>Add Customer</Button>
                </div>
            </div>
        }
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCustomerSubmit();}}>
            <Input label="Customer Name" value={customerFormData.name || ''} onChange={(e) => setCustomerFormData({ name: e.target.value })} required placeholder="Enter customer name" />
            {formError && customerFormData.name && <p className="text-brand-error text-sm bg-red-50 p-2 rounded-md">{formError}</p>}
        </form>
      </Modal>

      <Modal 
        isOpen={isEnvModalOpen} 
        onClose={() => setIsEnvModalOpen(false)} 
        title={editingEnv ? `Edit Environment: ${editingEnv.name}` : `Add Environment for ${selectedCustomer?.name}`}
        size="lg"
        footer={
            <div className="flex w-full justify-between items-center">
                {formError && !envFormData.name && <p className="text-xs text-brand-error flex-grow mr-3">{formError}</p>}
                 <div className="flex space-x-3 ml-auto">
                    <Button variant="ghost" onClick={() => setIsEnvModalOpen(false)} disabled={isLoadingEnvs}>Cancel</Button>
                    <Button variant="primary" onClick={handleEnvSubmit} isLoading={isLoadingEnvs} disabled={isLoadingEnvs || !envFormData.name?.trim()}>
                        {editingEnv ? 'Save Changes' : 'Add Environment'}
                    </Button>
                </div>
            </div>
        }
        >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEnvSubmit();}}>
            <Input label="Environment Name" value={envFormData.name || ''} onChange={(e) => setEnvFormData(prev => ({ ...prev, name: e.target.value }))} required placeholder="e.g., Production, UAT, Development"/>
            <Textarea label="Account Request Instructions" value={envFormData.requestInstructions || ''} onChange={(e) => setEnvFormData(prev => ({ ...prev, requestInstructions: e.target.value }))} rows={4} placeholder="Provide instructions for requesting access to this environment."/>
            {formError && envFormData.name && <p className="text-brand-error text-sm bg-red-50 p-2 rounded-md">{formError}</p>}
        </form>
      </Modal>
    </div>
  );
};

export default AdminCustomerEnvManagement;
