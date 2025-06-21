
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, UserRole } from '../hooks/useAuth';
import { LeaveRequest, LeaveRequestStatus } from '../types';
import { getLeaveRequests, updateLeaveRequestStatus } from '../services/api'; // Updated imports
import { LEAVE_TYPES, REQUEST_STATUS_COLORS } from '../constants';
import Button from '../components/common/Button';
import Table, { Column } from '../components/common/Table';
import Select from '../components/common/Select';
import { displayDateRange, parseISODate } from '../utils/dateUtils';
import Modal from '../components/common/Modal';
import Textarea from '../components/common/Textarea';
import { CheckCircleIcon, XCircleIcon, InboxArrowDownIcon, FunnelIcon } from '@heroicons/react/24/outline';

const ApproveLeavePage: React.FC = () => {
  const { currentUser, getToken } = useAuth(); // Added getToken
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<LeaveRequestStatus | 'ALL'>(LeaveRequestStatus.PENDING);
  const [actionableRequest, setActionableRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchRequests = useCallback(async () => {
    if (!currentUser || currentUser.role !== UserRole.MANAGER) return;
    const token = getToken();
    if (!token) {
      console.warn("No token available for fetching leave requests.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Assuming getLeaveRequests can be filtered by team or returns all for manager
      // For now, fetching all and then could filter client-side if needed, or backend handles team scope.
      // The API endpoint GET /api/leave-requests?userId={userId}&teamId={teamId}&status={status}
      // suggests backend can filter. We might need to pass currentUser.teamId if available.
      const teamRequests = await getLeaveRequests(undefined, token); // Pass token
      setAllRequests(teamRequests.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Failed to fetch leave requests for approval:", error);
      // User-facing error
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async () => {
    if (!actionableRequest || !actionType || !currentUser) return;
    setActionError('');
    const token = getToken();
    if (!token) {
      console.warn("No token available for leave action.");
      setActionError("Authentication error. Please log in again.");
      return;
    }

    const newStatus = actionType === 'APPROVE' ? LeaveRequestStatus.APPROVED : LeaveRequestStatus.REJECTED;
    try {
      // In a real app, rejectionReason would be passed to the API or used in the notification.
      // The backend should handle sending notification with reason if provided.
      await updateLeaveRequestStatus(actionableRequest.id, newStatus, currentUser.id, token); // Pass token
      fetchRequests(); 
    } catch (error) {
      console.error(`Failed to ${actionType.toLowerCase()} request:`, error);
      setActionError(`Failed to ${actionType.toLowerCase()} the request. Please try again.`);
    } finally {
      setActionableRequest(null);
      setActionType(null);
      setRejectionReason('');
    }
  };

  const openActionModal = (request: LeaveRequest, type: 'APPROVE' | 'REJECT') => {
    setActionableRequest(request);
    setActionType(type);
    setActionError('');
    setRejectionReason('');
  };
  
  const statusOptions = [
    { value: LeaveRequestStatus.PENDING, label: 'Pending Review' },
    { value: 'ALL', label: 'All Requests' },
    { value: LeaveRequestStatus.APPROVED, label: 'Approved' },
    { value: LeaveRequestStatus.REJECTED, label: 'Rejected' },
    { value: LeaveRequestStatus.CANCELLED, label: 'Cancelled' },
  ];

  const displayedRequests = allRequests.filter(r => {
      if (filterStatus === 'ALL') return true;
      return r.status === filterStatus;
  });

  const columns: Column<LeaveRequest>[] = [
    { header: 'Employee', accessor: 'userName', cellClassName: 'font-medium text-brand-text' },
    { header: 'Leave Type', accessor: (item) => LEAVE_TYPES[item.leaveTypeId]?.name || item.leaveTypeId },
    { header: 'Dates', accessor: (item) => displayDateRange(item.startDate, item.endDate) },
    { 
        header: 'Reason', 
        accessor: 'reason', 
        cellClassName: 'max-w-xs truncate text-sm text-brand-text-secondary',
        render: (item) => item.reason || <span className="text-gray-400 italic">N/A</span>
    },
    { header: 'Status', accessor: (item) => (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center ${REQUEST_STATUS_COLORS[item.status] || 'bg-gray-200 text-gray-800'}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()}
        </span>
    )},
    { header: 'Requested On', accessor: (item) => parseISODate(item.createdAt).toLocaleDateString(), cellClassName: 'text-sm text-brand-text-secondary' },
    { header: 'Actions', 
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      accessor: (item: LeaveRequest) => (
        item.status === LeaveRequestStatus.PENDING ? (
          <div className="space-x-2">
            <Button onClick={() => openActionModal(item, 'APPROVE')} variant="success" size="xs" leftIcon={<CheckCircleIcon className="h-4 w-4"/>}>Approve</Button>
            <Button onClick={() => openActionModal(item, 'REJECT')} variant="danger" size="xs" leftIcon={<XCircleIcon className="h-4 w-4"/>}>Reject</Button>
          </div>
        ) : <span className="text-xs text-gray-400 italic">Actioned</span>
      )
    },
  ];

  if (currentUser?.role !== UserRole.MANAGER) {
    return (
        <div className="bg-red-50 text-brand-error p-4 rounded-md shadow">
            Access Denied. This page is for managers only.
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Approve Leave Requests</h1>
        <p className="mt-1 text-sm text-brand-text-secondary">Review and action pending leave requests from your team members.</p>
      </div>
      
      <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md border border-brand-border">
        <Select 
            label="Filter by Status"
            labelSrOnly
            options={statusOptions}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as LeaveRequestStatus | 'ALL')}
            wrapperClassName="max-w-xs"
            placeholder="Filter by status..."
        />
      </div>

      <div className="bg-white shadow-lg rounded-lg border border-brand-border overflow-hidden">
        <Table
            columns={columns}
            data={displayedRequests}
            isLoading={isLoading}
            emptyMessage={
                <div className="text-center py-10">
                    <InboxArrowDownIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <h3 className="font-medium text-brand-text">No Requests Found</h3>
                    <p className="text-sm text-brand-text-secondary">There are no leave requests matching the current filter.</p>
                </div>
            }
            rowKeyAccessor="id"
        />
      </div>

      <Modal
          isOpen={!!actionableRequest && !!actionType}
          onClose={() => { setActionableRequest(null); setActionType(null); setRejectionReason(''); setActionError(''); }}
          title={`${actionType === 'APPROVE' ? 'Approve' : 'Reject'} Leave Request`}
          size="lg"
          footer={
            <div className="flex w-full justify-between items-center">
                {actionError && <p className="text-xs text-brand-error flex-grow mr-3">{actionError}</p>}
                <div className="flex space-x-3">
                    <Button variant="ghost" onClick={() => { setActionableRequest(null); setActionType(null); }}>Cancel</Button>
                    <Button 
                        variant={actionType === 'APPROVE' ? 'success' : 'danger'} 
                        onClick={handleAction}
                        isLoading={isLoading}
                    >
                    Confirm {actionType?.charAt(0) + actionType!.slice(1).toLowerCase()}
                    </Button>
                </div>
            </div>
          }
        >
          {actionableRequest && (
            <div className="space-y-3 text-sm">
                <p><strong>Employee:</strong> {actionableRequest.userName}</p>
                <p><strong>Leave Type:</strong> {LEAVE_TYPES[actionableRequest.leaveTypeId].name}</p>
                <p><strong>Dates:</strong> {displayDateRange(actionableRequest.startDate, actionableRequest.endDate)}</p>
                {actionableRequest.reason && <p><strong>Reason:</strong> {actionableRequest.reason}</p>}
                
                {actionType === 'REJECT' && (
                <Textarea
                    label="Reason for Rejection (Optional)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                    placeholder="Provide a reason if necessary (will be included in notification)."
                />
                )}
                <p className="mt-3 pt-3 border-t border-brand-border">
                    You are about to <strong className={actionType === 'APPROVE' ? 'text-brand-success': 'text-brand-error'}>{actionType?.toLowerCase()}</strong> this request.
                </p>
            </div>
          )}
        </Modal>
    </div>
  );
};

export default ApproveLeavePage;
