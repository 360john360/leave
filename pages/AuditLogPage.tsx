
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, UserRole } from '../hooks/useAuth';
import { AuditLogEntry, User } from '../types';
import { getMockAuditLogs, getMockUsers } from '../services/api';
import Table, { Column } from '../components/common/Table';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { ROWS_PER_PAGE_OPTIONS } from '../constants';
import { ArchiveBoxIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const AuditLogPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [allUsersForFilter, setAllUsersForFilter] = useState<User[]>([]); // Renamed to avoid conflict
  const [isLoading, setIsLoading] = useState(false);
  
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterActionType, setFilterActionType] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]); // Default 25

  const fetchAuditLogsAndUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [logs, usersData] = await Promise.all([
          getMockAuditLogs({ 
            userId: filterUserId || undefined, 
            actionType: filterActionType || undefined 
          }),
          getMockUsers()
      ]);
      setAuditLogs(logs); // API already sorts by timestamp desc
      setAllUsersForFilter([{id: '', name: 'All Users', email: '', role: UserRole.ADMIN, team: 'NONE' as any}, ...usersData]);
    } catch (error) {
      console.error("Failed to fetch audit logs or users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterUserId, filterActionType]); // Dependencies for refetching when filters change

  useEffect(() => {
    fetchAuditLogsAndUsers();
  }, [fetchAuditLogsAndUsers]);

  const handleFilter = () => {
      setCurrentPage(1); 
      // fetchAuditLogsAndUsers will be called due to filter state change effect
  };
  
  // Client-side pagination (as mock API doesn't support it)
  const paginatedLogs = auditLogs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(auditLogs.length / rowsPerPage);

  const auditLogColumns: Column<AuditLogEntry>[] = [
    { 
        header: 'Timestamp', 
        accessor: (item) => new Date(item.timestamp).toLocaleString(),
        cellClassName: 'text-sm text-brand-text-secondary whitespace-nowrap'
    },
    { 
        header: 'User', 
        accessor: (item) => item.userName || item.userId || <span className="italic text-gray-500">System</span>,
        cellClassName: 'font-medium'
    },
    { 
        header: 'Action Type', 
        accessor: (item) => <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200">{item.actionType}</span>
    },
    { 
        header: 'Details', 
        accessor: (item) => <span className="text-xs text-brand-text-secondary whitespace-pre-wrap block max-w-md overflow-x-auto">{item.details}</span> 
    },
  ];

  if (currentUser?.role !== UserRole.ADMIN) {
    return <div className="bg-red-50 text-brand-error p-4 rounded-md shadow">Access Denied. This page is for administrators only.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">System Audit Log</h1>
        <p className="mt-1 text-sm text-brand-text-secondary">Review key actions and events performed within the system.</p>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-lg shadow-lg border border-brand-border">
        <h2 className="text-lg font-semibold text-brand-text mb-1 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2 text-brand-primary"/>
            Filter Logs
        </h2>
        <p className="text-xs text-brand-text-secondary mb-4">Refine the audit log view by user or action type.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <Select
            label="Filter by User"
            options={allUsersForFilter.map(u => ({ value: u.id, label: u.name }))}
            value={filterUserId}
            onChange={(e) => {setFilterUserId(e.target.value); setCurrentPage(1);}}
            placeholder="All Users"
          />
          <Input
            label="Filter by Action Type"
            type="text"
            value={filterActionType}
            onChange={(e) => {setFilterActionType(e.target.value); setCurrentPage(1);}}
            placeholder="e.g., LEAVE_APPROVED, USER_CREATED"
          />
          {/* Automatic filtering on change, or keep button for explicit action
          <Button onClick={handleFilter} isLoading={isLoading} disabled={isLoading} className="h-10" leftIcon={<MagnifyingGlassIcon className="h-5 w-5"/>}>
            Apply Filters
          </Button> */}
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg border border-brand-border overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-brand-border">
             <h2 className="text-lg font-semibold text-brand-text">Log Entries</h2>
        </div>
        <Table
            columns={auditLogColumns}
            data={paginatedLogs}
            isLoading={isLoading && paginatedLogs.length === 0}
            emptyMessage={
                <div className="text-center py-10">
                    <ArchiveBoxIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <h3 className="font-medium text-brand-text">No Audit Logs Found</h3>
                    <p className="text-sm text-brand-text-secondary">There are no audit logs matching your current filter criteria.</p>
                </div>
            }
            rowKeyAccessor="id"
        />
      </div>

      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 bg-white p-3 sm:p-4 rounded-lg shadow-md border border-brand-border text-sm">
            <div>
                <span className="text-brand-text-secondary">
                    Page {currentPage} of {totalPages} <span className="hidden sm:inline">| Total {auditLogs.length} logs</span>
                </span>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                 <Select
                    options={ROWS_PER_PAGE_OPTIONS.map(r => ({value: String(r), label: `${r} rows`}))}
                    value={String(rowsPerPage)}
                    onChange={(e) => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}}
                    wrapperClassName="mb-0 inline-block w-28"
                    className="text-xs"
                    labelSrOnly
                />
                <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoading} size="sm" variant="ghost">Prev</Button>
                {/* Consider adding page number inputs or a more complex pagination component for many pages */}
                <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || isLoading} size="sm" variant="ghost">Next</Button>
            </div>
        </div>
      )}

    </div>
  );
};

export default AuditLogPage;
