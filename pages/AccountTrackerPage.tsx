
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Customer, Environment, AccountAccess, AccountAccessStatusValue, User, UserRole as AppUserRole, LeaveRequest, LeaveRequestStatus, Shift, ShiftPeriod } from '../types';
import { 
    getMockCustomers, getMockEnvironments, getMockAccountAccess, updateMockAccountAccessStatus, 
    getMockUsers, getMockLeaveRequests, getShiftsForUsersOnDate
} from '../services/api';
import Select from '../components/common/Select';
import Table, { Column } from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { ACCOUNT_ACCESS_STATUS_DISPLAY } from '../constants';
import Modal from '../components/common/Modal';
import { ClipboardDocumentCheckIcon, InformationCircleIcon, UserGroupIcon, UserCircleIcon as UserIconSolid, MagnifyingGlassIcon, CalendarDaysIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { formatISODate, todayISO } from '../utils/dateUtils';

interface UserAccessForEnvironment {
  envId: string;
  envName: string;
  customerName: string;
  status: AccountAccessStatusValue;
  lastUpdatedAt: string;
  requestInstructions: string;
}

interface PasAvailabilityResult {
  userId: string;
  userName: string;
  overallAvailability: 'Available' | 'Unavailable' | 'Unknown';
  availabilityReason: string;
  onLeave: boolean;
  leaveType?: string;
  hasAccess: boolean;
  accountStatus: AccountAccessStatusValue;
  onShift: boolean; // Relevant for shift workers
  shiftPeriod?: ShiftPeriod | 'OFF';
}

const generateTimeSlots = (): {value: string, label: string}[] => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            slots.push({ value: `${hour}:${minute}`, label: `${hour}:${minute}` });
        }
    }
    return slots;
};
const timeSlots = generateTimeSlots();


const AccountTrackerPage: React.FC = () => {
  const { currentUser } = useAuth();

  // State for Admin/Manager/PAS view (Team Access Tracker)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [adminEnvironments, setAdminEnvironments] = useState<Environment[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
  const [tableAccountAccessList, setTableAccountAccessList] = useState<AccountAccess[]>([]);
  const [allRelevantUsers, setAllRelevantUsers] = useState<User[]>([]); 
  const [filterByUserId, setFilterByUserId] = useState<string>('');

  // State for Engineer view (My Access Overview)
  const [myAccessByCustomer, setMyAccessByCustomer] = useState<Record<string, UserAccessForEnvironment[]>>({});
  
  // State for PAS View (Availability Checker)
  const [pasSelectedCustomerId, setPasSelectedCustomerId] = useState<string>('');
  const [pasSelectedEnvironmentId, setPasSelectedEnvironmentId] = useState<string>('');
  const [pasEnvironments, setPasEnvironments] = useState<Environment[]>([]);
  const [pasSelectedDate, setPasSelectedDate] = useState<string>(todayISO());
  const [pasSelectedTime, setPasSelectedTime] = useState<string>('09:00');
  const [pasAvailabilityResults, setPasAvailabilityResults] = useState<PasAvailabilityResult[]>([]);
  const [isLoadingPasView, setIsLoadingPasView] = useState(false); // For initial PAS filters loading
  const [isLoadingPasResults, setIsLoadingPasResults] = useState(false); // For availability check loading
  const [pasEngineers, setPasEngineers] = useState<User[]>([]);


  const [selectedEnvironmentForInstructions, setSelectedEnvironmentForInstructions] = useState<Environment | UserAccessForEnvironment | null>(null);
  
  const [isLoading, setIsLoading] = useState(false); 
  const [isLoadingAccessDetails, setIsLoadingAccessDetails] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const isEngineerView = currentUser?.role === AppUserRole.VAR_SHIFT || currentUser?.role === AppUserRole.VAR_BAU;
  const isPasView = currentUser?.role === AppUserRole.PAS;

  // --- Functions for Admin/Manager View (Team Access Tracker - non-PAS, non-Engineer) ---
  const fetchCustomersForAdminView = useCallback(async () => {
    if (isEngineerView || isPasView) return;
    setIsLoading(true);
    try {
      const [custData, usersData] = await Promise.all([
        getMockCustomers(),
        getMockUsers()
      ]);
      setCustomers(custData);
      if (custData.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custData[0].id);
      }
      const relevantUsers = usersData.filter(u => 
        u.role === AppUserRole.VAR_SHIFT || 
        u.role === AppUserRole.VAR_BAU ||
        u.role === AppUserRole.PAS
      );
      setAllRelevantUsers([{id: '', name: 'All Relevant Users', email: '', role: AppUserRole.ADMIN, team: 'NONE' as any}, ...relevantUsers]);

    } catch (error) { console.error("Failed to fetch customers/users for admin view:", error); } 
    finally { setIsLoading(false); }
  }, [isEngineerView, isPasView, selectedCustomerId]);

  const fetchEnvironmentsForAdminView = useCallback(async () => {
    if (isEngineerView || isPasView || !selectedCustomerId) {
      setAdminEnvironments([]); setSelectedEnvironmentId(''); setTableAccountAccessList([]);
      return;
    }
    setIsLoading(true);
    try {
      const envData = await getMockEnvironments(selectedCustomerId);
      setAdminEnvironments(envData);
      if (envData.length > 0) {
        setSelectedEnvironmentId(prevEnvId => envData.find(e => e.id === prevEnvId) ? prevEnvId : envData[0].id);
      } else {
        setSelectedEnvironmentId(''); setTableAccountAccessList([]);
      }
    } catch (error) { console.error("Failed to fetch environments for admin view:", error); } 
    finally { setIsLoading(false); }
  }, [isEngineerView, isPasView, selectedCustomerId]);

  const fetchAccessForAdminViewTable = useCallback(async () => {
    if (isEngineerView || isPasView || !selectedEnvironmentId || allRelevantUsers.length <=1 ) { 
      setTableAccountAccessList([]); return;
    }
    setIsLoadingAccessDetails(true);
    try {
      const accessData = await getMockAccountAccess({ environmentId: selectedEnvironmentId });
      const usersToDisplay = filterByUserId ? allRelevantUsers.filter(u => u.id === filterByUserId) : allRelevantUsers.filter(u => u.id !== ''); 

      const fullAccessList = usersToDisplay.map(user => {
            const existingAccess = accessData.find(acc => acc.userId === user.id);
            return existingAccess || {
                userId: user.id,
                userName: user.name,
                environmentId: selectedEnvironmentId,
                status: AccountAccessStatusValue.NONE,
                lastUpdatedAt: new Date(0).toISOString()
            };
        }).sort((a,b) => (a.userName || '').localeCompare(b.userName || ''));
      setTableAccountAccessList(fullAccessList);
    } catch (error) { console.error("Failed to fetch account access for table:", error); } 
    finally { setIsLoadingAccessDetails(false); }
  }, [isEngineerView, isPasView, selectedEnvironmentId, allRelevantUsers, filterByUserId]);

  // --- Functions for Engineer View (My Access Overview) ---
  const fetchMyAccessOverview = useCallback(async () => {
    if (!isEngineerView || !currentUser) return;
    setIsLoadingAccessDetails(true);
    try {
        const [allCustomers, allEnvs, myAccessRecordsResponse] = await Promise.all([
            getMockCustomers(),
            getMockEnvironments(), 
            getMockAccountAccess({ userId: currentUser.id })
        ]);

        const myAccessRecords = myAccessRecordsResponse;
        const accessMap: Record<string, UserAccessForEnvironment[]> = {};

        allCustomers.forEach(cust => {
            accessMap[cust.name] = []; 
        });

        allEnvs.forEach(env => {
            const customer = allCustomers.find(c => c.id === env.customerId);
            if (customer) {
                const accessRecord = myAccessRecords.find(acc => acc.environmentId === env.id);
                accessMap[customer.name].push({
                    envId: env.id,
                    envName: env.name,
                    customerName: customer.name, 
                    status: accessRecord ? accessRecord.status : AccountAccessStatusValue.NONE,
                    lastUpdatedAt: accessRecord ? accessRecord.lastUpdatedAt : new Date(0).toISOString(),
                    requestInstructions: env.requestInstructions,
                });
            }
        });
        
        for (const custName in accessMap) {
            accessMap[custName].sort((a, b) => a.envName.localeCompare(b.envName));
        }
        setMyAccessByCustomer(accessMap);

    } catch (error) { console.error("Failed to fetch my access overview:", error); } 
    finally { setIsLoadingAccessDetails(false); }
  }, [isEngineerView, currentUser]);

  // --- Functions for PAS View (Availability Checker) ---
  const fetchInitialDataForPasView = useCallback(async () => {
    if (!isPasView) return;
    setIsLoadingPasView(true);
    try {
        const [custData, usersData] = await Promise.all([
            getMockCustomers(),
            getMockUsers()
        ]);
        setCustomers(custData); // Reuse customers state
        if (custData.length > 0 && !pasSelectedCustomerId) {
            setPasSelectedCustomerId(custData[0].id);
        }
        setPasEngineers(usersData.filter(u => u.role === AppUserRole.VAR_SHIFT || u.role === AppUserRole.VAR_BAU));
    } catch (error) { console.error("Failed to load initial data for PAS view:", error); } 
    finally { setIsLoadingPasView(false); }
  }, [isPasView, pasSelectedCustomerId]);

  const fetchEnvironmentsForPasView = useCallback(async () => {
    if (!isPasView || !pasSelectedCustomerId) {
        setPasEnvironments([]); setPasSelectedEnvironmentId('');
        return;
    }
    setIsLoadingPasView(true); // Can use the same loading state for simplicity here
    try {
        const envData = await getMockEnvironments(pasSelectedCustomerId);
        setPasEnvironments(envData);
        if (envData.length > 0) {
            setPasSelectedEnvironmentId(prevEnvId => envData.find(e => e.id === prevEnvId) ? prevEnvId : envData[0].id);
        } else {
            setPasSelectedEnvironmentId('');
        }
    } catch (error) { console.error("Failed to fetch environments for PAS view:", error); } 
    finally { setIsLoadingPasView(false); }
  }, [isPasView, pasSelectedCustomerId]);
  
  const handleCheckPasAvailability = useCallback(async () => {
    if (!isPasView || !pasSelectedEnvironmentId || !pasSelectedDate || !pasSelectedTime || pasEngineers.length === 0) return;
    setIsLoadingPasResults(true);
    setPasAvailabilityResults([]);
    try {
        const engineerIds = pasEngineers.map(e => e.id);
        const [leaveRequests, accountAccessData, shiftsData] = await Promise.all([
            getMockLeaveRequests({ status: LeaveRequestStatus.APPROVED }), // All approved leaves
            getMockAccountAccess({ environmentId: pasSelectedEnvironmentId }),
            getShiftsForUsersOnDate(engineerIds, pasSelectedDate)
        ]);

        const results: PasAvailabilityResult[] = pasEngineers.map(engineer => {
            const isOnLeave = leaveRequests.some(lr => 
                lr.userId === engineer.id &&
                pasSelectedDate >= lr.startDate && pasSelectedDate <= lr.endDate
            );
            const leaveRecord = leaveRequests.find(lr => 
                lr.userId === engineer.id &&
                pasSelectedDate >= lr.startDate && pasSelectedDate <= lr.endDate
            );

            const access = accountAccessData.find(acc => acc.userId === engineer.id);
            const hasAccess = access?.status === AccountAccessStatusValue.GRANTED;

            const shift = shiftsData.find(s => s.userId === engineer.id);
            let onShift = false;
            let availabilityReason = "";
            
            if (engineer.role === AppUserRole.VAR_BAU) { // BAU Engineers
                const dayOfWeek = new Date(pasSelectedDate).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const selectedHour = parseInt(pasSelectedTime.split(':')[0]);
                onShift = !isWeekend && selectedHour >= 8 && selectedHour < 18; // Assume 8 AM to 6 PM work hours
            } else if (engineer.role === AppUserRole.VAR_SHIFT) { // Shift Engineers
                if (shift && shift.shiftPeriod !== 'OFF') {
                    const selectedHour = parseInt(pasSelectedTime.split(':')[0]);
                    if (shift.shiftPeriod === ShiftPeriod.AM && selectedHour >= 7 && selectedHour < 19) {
                        onShift = true;
                    } else if (shift.shiftPeriod === ShiftPeriod.PM && (selectedHour >= 19 || selectedHour < 7)) {
                        onShift = true;
                    }
                }
            }


            let overallAvailability: PasAvailabilityResult['overallAvailability'] = 'Unknown';
            if (isOnLeave) {
                availabilityReason = `On Leave (${leaveRecord?.leaveTypeId || ''})`;
                overallAvailability = 'Unavailable';
            } else if (!hasAccess) {
                availabilityReason = "No Access to Environment";
                overallAvailability = 'Unavailable';
            } else if (!onShift && (engineer.role === AppUserRole.VAR_SHIFT || engineer.role === AppUserRole.VAR_BAU)) {
                availabilityReason = "Off Shift / Not Working Hours";
                overallAvailability = 'Unavailable';
            } else {
                availabilityReason = "Available";
                overallAvailability = 'Available';
            }


            return {
                userId: engineer.id,
                userName: engineer.name,
                overallAvailability,
                availabilityReason,
                onLeave: isOnLeave,
                leaveType: isOnLeave ? leaveRecord?.leaveTypeId : undefined,
                hasAccess,
                accountStatus: access?.status || AccountAccessStatusValue.NONE,
                onShift,
                shiftPeriod: shift?.shiftPeriod || 'OFF'
            };
        });
        setPasAvailabilityResults(results.sort((a,b)=> a.userName.localeCompare(b.userName)));

    } catch (error) { console.error("Error checking PAS availability:", error); } 
    finally { setIsLoadingPasResults(false); }
  }, [isPasView, pasSelectedEnvironmentId, pasSelectedDate, pasSelectedTime, pasEngineers]);


  // --- Common Functions & Effects ---
  useEffect(() => {
    if (isEngineerView) {
      fetchMyAccessOverview();
    } else if (isPasView) {
      fetchInitialDataForPasView();
    }
    else {
      fetchCustomersForAdminView();
    }
  }, [isEngineerView, isPasView, fetchMyAccessOverview, fetchInitialDataForPasView, fetchCustomersForAdminView]);

  useEffect(() => {
    if (!isEngineerView && !isPasView) {
      fetchEnvironmentsForAdminView();
    } else if (isPasView) {
      fetchEnvironmentsForPasView();
    }
  }, [selectedCustomerId, pasSelectedCustomerId, fetchEnvironmentsForAdminView, fetchEnvironmentsForPasView, isEngineerView, isPasView]);

  useEffect(() => {
    if (!isEngineerView && !isPasView) {
      fetchAccessForAdminViewTable();
    }
  }, [selectedEnvironmentId, filterByUserId, fetchAccessForAdminViewTable, isEngineerView, isPasView]);


  const handleStatusChange = async (userId: string, environmentId: string, newStatus: AccountAccessStatusValue) => {
    if (!currentUser) return;
    setUpdateError('');
    if (currentUser.id !== userId && !(currentUser.role === AppUserRole.ADMIN || currentUser.role === AppUserRole.MANAGER || currentUser.role === AppUserRole.PAS)) {
      setUpdateError("Permission Denied: You can only update your own access status or you lack privileges.");
      setTimeout(() => setUpdateError(''), 3000);
      return;
    }
    setIsLoadingAccessDetails(true); 
    try {
      await updateMockAccountAccessStatus(userId, environmentId, newStatus);
      if (isEngineerView) {
        fetchMyAccessOverview(); 
      } else if (!isPasView) { 
        fetchAccessForAdminViewTable();
      }
      // PAS view doesn't directly update status, it's informational.
    } catch (error) {
      console.error("Failed to update account access status:", error);
      setUpdateError("Failed to update status. Please try again.");
      setTimeout(() => setUpdateError(''), 3000);
    } finally {
      setIsLoadingAccessDetails(false);
    }
  };

  const adminTableColumns: Column<AccountAccess>[] = [
    { header: 'User Name', accessor: (item) => item.userName || item.userId, cellClassName: 'font-medium' },
    { 
        header: 'Status', 
        accessor: (item) => (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-block ring-1 ring-inset ${ACCOUNT_ACCESS_STATUS_DISPLAY[item.status]?.badgeClass || ACCOUNT_ACCESS_STATUS_DISPLAY.NONE.badgeClass}`}>
                {ACCOUNT_ACCESS_STATUS_DISPLAY[item.status]?.text || item.status}
            </span>
        )
    },
    { 
        header: 'Last Updated', 
        accessor: (item) => item.status !== AccountAccessStatusValue.NONE ? new Date(item.lastUpdatedAt).toLocaleDateString() : <span className="text-gray-400 italic">N/A</span>,
        cellClassName: 'text-sm text-brand-text-secondary'
    },
    { 
        header: 'Update Status', 
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        accessor: (item) => (
          (currentUser?.id === item.userId || currentUser?.role === AppUserRole.ADMIN || currentUser?.role === AppUserRole.MANAGER || currentUser?.role === AppUserRole.PAS) ? (
            <Select
                options={Object.values(AccountAccessStatusValue).map(s => ({ value: s, label: ACCOUNT_ACCESS_STATUS_DISPLAY[s]?.text || s }))}
                value={item.status}
                onChange={(e) => handleStatusChange(item.userId, item.environmentId, e.target.value as AccountAccessStatusValue)}
                className="text-xs py-1"
                wrapperClassName="mb-0 min-w-[150px] mx-auto"
                disabled={isLoadingAccessDetails}
            />
          ) : <span className="text-xs text-gray-400 italic">-</span>
      )
    },
  ];

  const pasTableColumns: Column<PasAvailabilityResult>[] = [
    { header: 'Engineer', accessor: 'userName', cellClassName: 'font-medium' },
    { 
        header: 'Availability', 
        accessor: (item) => (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-block ring-1 ring-inset ${
                item.overallAvailability === 'Available' ? 'bg-green-100 text-green-700 ring-green-600/20' : 
                item.overallAvailability === 'Unavailable' ? 'bg-red-100 text-red-700 ring-red-600/20' :
                'bg-gray-100 text-gray-700 ring-gray-600/20'
            }`}>
                {item.overallAvailability}
            </span>
        ) 
    },
    { header: 'Reason', accessor: 'availabilityReason', cellClassName: 'text-xs text-brand-text-secondary' },
    { header: 'On Leave', accessor: (item) => item.onLeave ? `Yes (${item.leaveType})` : 'No', cellClassName: 'text-xs' },
    { header: 'Env. Access', accessor: (item) => ACCOUNT_ACCESS_STATUS_DISPLAY[item.accountStatus]?.text || item.accountStatus, cellClassName: 'text-xs' },
    { header: 'On Shift', accessor: (item) => (item.onShift && item.shiftPeriod !== 'OFF') ? `Yes (${item.shiftPeriod})` : (item.shiftPeriod === 'OFF' && item.overallAvailability !== 'Available' ? 'No (Day Off)' : 'N/A'), cellClassName: 'text-xs' },
  ];


// --- Render Logic ---
  if (isLoading && !isEngineerView && !isPasView && customers.length === 0) { 
    return <div className="p-6 text-center text-brand-text-secondary">Loading initial data...</div>;
  }
  if (isLoadingPasView && isPasView && customers.length === 0) {
    return <div className="p-6 text-center text-brand-text-secondary">Loading PAS data...</div>;
  }


  return (
    <div className="space-y-6">
      {isEngineerView ? (
        // Engineer View: My Access Overview
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">My Environment Access</h1>
          <p className="mt-1 text-sm text-brand-text-secondary">View and update your access status for available environments.</p>
          {updateError && <p className="text-sm text-brand-error bg-red-50 p-2 rounded-md my-3">{updateError}</p>}
          {isLoadingAccessDetails && Object.keys(myAccessByCustomer).length === 0 && <p className="text-center py-6 text-brand-text-secondary">Loading your access details...</p>}

          {Object.keys(myAccessByCustomer).length === 0 && !isLoadingAccessDetails && (
            <div className="bg-white p-10 rounded-lg shadow-md border border-brand-border text-center mt-6">
                <UserIconSolid className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-brand-text">No Environments Found</h3>
                <p className="text-sm text-brand-text-secondary mt-1">
                    There are currently no customer environments configured in the system for you to track.
                </p>
            </div>
          )}

          {Object.entries(myAccessByCustomer).map(([customerName, envAccessList]) => (
            envAccessList.length > 0 && ( 
            <div key={customerName} className="mt-6 bg-white shadow-lg rounded-lg border border-brand-border">
              <div className="p-4 sm:p-5 border-b border-brand-border">
                <h2 className="text-lg font-semibold text-brand-text flex items-center">
                    <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-brand-primary" />
                    {customerName}
                </h2>
              </div>
              <ul className="divide-y divide-brand-border">
                {envAccessList.map((envAccess) => (
                  <li key={envAccess.envId} className="p-3 sm:p-4 hover:bg-slate-50">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="flex-grow">
                        <p className="font-medium text-brand-text">{envAccess.envName}</p>
                        <p className="text-xs text-brand-text-secondary">
                          Status last updated: {envAccess.status !== AccountAccessStatusValue.NONE ? new Date(envAccess.lastUpdatedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                        <Select
                          labelSrOnly
                          label={`Status for ${envAccess.envName}`}
                          options={Object.values(AccountAccessStatusValue).map(s => ({ value: s, label: ACCOUNT_ACCESS_STATUS_DISPLAY[s]?.text || s }))}
                          value={envAccess.status}
                          onChange={(e) => handleStatusChange(currentUser!.id, envAccess.envId, e.target.value as AccountAccessStatusValue)}
                          wrapperClassName="mb-0 flex-grow sm:flex-grow-0 sm:w-40"
                          className="text-xs py-1"
                          disabled={isLoadingAccessDetails}
                        />
                        <Button 
                            variant="info" 
                            size="xs" 
                            onClick={() => setSelectedEnvironmentForInstructions(envAccess)}
                            className="p-1.5 sm:p-2"
                            leftIcon={<InformationCircleIcon className="h-4 w-4"/>}
                        >
                           <span className="hidden sm:inline">Info</span>
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            )
          ))}
        </div>
      ) : isPasView ? (
        // PAS View: Availability Checker
        <>
            <div>
                <h1 className="text-2xl font-semibold text-brand-text">Engineer Availability Checker</h1>
                <p className="mt-1 text-sm text-brand-text-secondary">Check engineer availability for specific customers, environments, dates, and times.</p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md border border-brand-border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <Select
                        label="Select Customer"
                        options={customers.map(c => ({ value: c.id, label: c.name }))}
                        value={pasSelectedCustomerId}
                        onChange={(e) => {setPasSelectedCustomerId(e.target.value); setPasSelectedEnvironmentId(''); setPasAvailabilityResults([]);}}
                        disabled={isLoadingPasView || customers.length === 0}
                        placeholder={customers.length === 0 ? "Loading customers..." : "Choose a customer"}
                    />
                     <Select
                        label="Select Environment"
                        options={pasEnvironments.map(e => ({ value: e.id, label: e.name }))}
                        value={pasSelectedEnvironmentId}
                        onChange={(e) => {setPasSelectedEnvironmentId(e.target.value); setPasAvailabilityResults([]);}}
                        disabled={isLoadingPasView || !pasSelectedCustomerId || pasEnvironments.length === 0}
                        placeholder={!pasSelectedCustomerId ? "Select customer first" : (pasEnvironments.length === 0 && !isLoadingPasView ? "No environments" : (isLoadingPasView ? "Loading..." :"Choose an environment"))}
                    />
                    <Input
                        label="Select Date"
                        type="date"
                        value={pasSelectedDate}
                        onChange={(e) => {setPasSelectedDate(e.target.value); setPasAvailabilityResults([]);}}
                    />
                    <Select
                        label="Select Time"
                        options={timeSlots}
                        value={pasSelectedTime}
                        onChange={(e) => {setPasSelectedTime(e.target.value); setPasAvailabilityResults([]);}}
                    />
                </div>
                 <div className="mt-4 flex justify-end">
                    <Button 
                        onClick={handleCheckPasAvailability} 
                        isLoading={isLoadingPasResults} 
                        disabled={isLoadingPasResults || !pasSelectedEnvironmentId || !pasSelectedDate || !pasSelectedTime}
                        leftIcon={<MagnifyingGlassIcon className="h-5 w-5"/>}
                    >
                        Check Availability
                    </Button>
                </div>
            </div>
            {pasAvailabilityResults.length > 0 && (
                 <div className="bg-white shadow-lg rounded-lg border border-brand-border overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-brand-border">
                        <h2 className="text-lg font-semibold text-brand-text">
                            Availability for: {pasEnvironments.find(e=>e.id === pasSelectedEnvironmentId)?.name} on {new Date(pasSelectedDate + 'T' + pasSelectedTime).toLocaleString()}
                        </h2>
                    </div>
                    <Table columns={pasTableColumns} data={pasAvailabilityResults} rowKeyAccessor="userId" isLoading={isLoadingPasResults} />
                 </div>
            )}
            {pasAvailabilityResults.length === 0 && !isLoadingPasResults && pasSelectedEnvironmentId && (
                 <div className="bg-white p-10 rounded-lg shadow-md border border-brand-border text-center mt-6">
                    <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-brand-text">No Results</h3>
                    <p className="text-sm text-brand-text-secondary mt-1">
                        Click "Check Availability" after selecting parameters to see results.
                    </p>
                </div>
            )}
        </>
      ) : (
        // Admin/Manager (non-PAS) View: Team Access Tracker
        <>
          <div>
            <h1 className="text-2xl font-semibold text-brand-text">Team Environment Access Tracker</h1>
            <p className="mt-1 text-sm text-brand-text-secondary">Monitor team members' access status across customer environments.</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md border border-brand-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <Select
                    label="Select Customer"
                    options={customers.map(c => ({ value: c.id, label: c.name }))}
                    value={selectedCustomerId}
                    onChange={(e) => {setSelectedCustomerId(e.target.value); setSelectedEnvironmentId(''); setFilterByUserId('');}}
                    disabled={isLoading || customers.length === 0}
                    placeholder={customers.length === 0 ? "Loading customers..." : "Choose a customer"}
                />
                <Select
                    label="Select Environment"
                    options={adminEnvironments.map(e => ({ value: e.id, label: e.name }))}
                    value={selectedEnvironmentId}
                    onChange={(e) => {setSelectedEnvironmentId(e.target.value); setFilterByUserId('');}}
                    disabled={isLoading || !selectedCustomerId || adminEnvironments.length === 0}
                    placeholder={!selectedCustomerId ? "Select customer first" : (adminEnvironments.length === 0 && !isLoading ? "No environments" : (isLoading ? "Loading..." :"Choose an environment"))}
                />
                 <Select
                    label="Filter by User"
                    options={allRelevantUsers.map(u => ({ value: u.id, label: u.name }))}
                    value={filterByUserId}
                    onChange={(e) => setFilterByUserId(e.target.value)}
                    disabled={isLoading || !selectedEnvironmentId || allRelevantUsers.length <= 1} 
                    placeholder="All Relevant Users"
                />
            </div>
          </div>
          {updateError && <p className="text-sm text-brand-error bg-red-50 p-2 rounded-md my-2">{updateError}</p>}
          
          {selectedEnvironmentId ? (
            <div className="bg-white shadow-lg rounded-lg border border-brand-border overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-brand-border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-brand-text">
                        Access Status for: {adminEnvironments.find(e => e.id === selectedEnvironmentId)?.name}
                        <span className="text-brand-text-secondary font-normal"> ({customers.find(c=>c.id === selectedCustomerId)?.name})</span>
                    </h2>
                    <p className="text-xs text-brand-text-secondary mt-0.5">Engineers and PAS members are listed. Engineers can update their own status. Admins/Managers/PAS can update for others.</p>
                </div>
                <Button 
                    variant="info" 
                    size="sm" 
                    onClick={() => setSelectedEnvironmentForInstructions(adminEnvironments.find(e => e.id === selectedEnvironmentId) || null)}
                    leftIcon={<InformationCircleIcon className="h-4 w-4"/>}
                    disabled={!selectedEnvironmentId}
                >
                    Access Instructions
                </Button>
              </div>
              <Table
                columns={adminTableColumns}
                data={tableAccountAccessList}
                isLoading={isLoadingAccessDetails}
                emptyMessage={
                    <div className="text-center py-10">
                        <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <h3 className="font-medium text-brand-text">No Access Data</h3>
                        <p className="text-sm text-brand-text-secondary">No users or access data for this environment and filter, or relevant users are not configured.</p>
                    </div>
                }
                rowKeyAccessor="userId"
              />
            </div>
          ) : (
            <div className="bg-white p-10 rounded-lg shadow-md border border-brand-border text-center">
                <ClipboardDocumentCheckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-brand-text">Select an Environment</h3>
              <p className="text-sm text-brand-text-secondary mt-1">
                {isLoading ? "Loading..." : "Please select a customer and an environment from the dropdowns above to view team account access details."}
              </p>
            </div>
          )}
        </>
      )}

      {selectedEnvironmentForInstructions && (
        <Modal 
            isOpen={!!selectedEnvironmentForInstructions} 
            onClose={() => setSelectedEnvironmentForInstructions(null)}
            title={`Access Instructions: ${('envName' in selectedEnvironmentForInstructions) ? selectedEnvironmentForInstructions.envName : selectedEnvironmentForInstructions.name}`}
            size="lg"
            footer={<Button onClick={() => setSelectedEnvironmentForInstructions(null)} variant="primary">Close</Button>}
        >
            <div className="prose prose-sm max-w-none text-brand-text-secondary whitespace-pre-wrap">
                {selectedEnvironmentForInstructions.requestInstructions || "No specific instructions provided for this environment."}
            </div>
        </Modal>
      )}
    </div>
  );
};

export default AccountTrackerPage;
