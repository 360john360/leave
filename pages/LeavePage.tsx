
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LeaveRequest, LeaveRequestStatus, LeaveTypeId } from '../types';
import { createLeaveRequest, getLeaveRequests } from '../services/api'; // Updated imports
import { LEAVE_TYPES, REQUEST_STATUS_COLORS } from '../constants';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Table, { Column } from '../components/common/Table';
import { displayDateRange, formatISODate, parseISODate, formatDateForInput, todayISO } from '../utils/dateUtils';
import { PlusCircleIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const LeaveRequestForm: React.FC<{ onSubmitSuccess: () => void, onCancel: () => void }> = ({ onSubmitSuccess, onCancel }) => {
  const { currentUser, getToken } = useAuth(); // Added getToken
  const [leaveTypeId, setLeaveTypeId] = useState<LeaveTypeId>(LeaveTypeId.ANNUAL);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'AM' | 'PM'>('AM');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const leaveTypeOptions = Object.values(LEAVE_TYPES)
    .filter(lt => lt.id !== LeaveTypeId.HALF_DAY_AM && lt.id !== LeaveTypeId.HALF_DAY_PM)
    .map(lt => ({ value: lt.id, label: lt.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("User not authenticated.");
      return;
    }
    const token = getToken();
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be before start date.");
      return;
    }

    let finalLeaveTypeId = leaveTypeId;
    // isHalfDay and halfDayPeriod are used to determine the finalLeaveTypeId
    // The backend will receive the finalLeaveTypeId (e.g. HALF_DAY_AM)
    // and does not need separate isHalfDay/halfDayPeriod fields in the API payload itself.
    // The reason for this is that the type (e.g. HALF_DAY_AM) already implies these details.
    if (isHalfDay) {
        if (startDate !== endDate) {
            setError("For half-day leave, start and end dates must be the same.");
            return;
        }
        finalLeaveTypeId = halfDayPeriod === 'AM' ? LeaveTypeId.HALF_DAY_AM : LeaveTypeId.HALF_DAY_PM;
    }

    setSubmitting(true);
    setError('');
    try {
      // createLeaveRequest expects: (requestData: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'userName'>, requesterId: string, token?: string)
      // The Omit type means we don't send id, status, createdAt, userName.
      // The backend will determine/set these. `userId` is part of `requestData`.
      await createLeaveRequest({
        userId: currentUser.id, // This is the requesterId, also part of the main payload
        leaveTypeId: finalLeaveTypeId,
        startDate,
        endDate,
        // isHalfDay: isHalfDay, // Backend derives this from leaveTypeId if needed
        // halfDayPeriod: isHalfDay ? halfDayPeriod : undefined, // Backend derives this from leaveTypeId if needed
        reason,
      }, currentUser.id, token); // Pass token
      onSubmitSuccess();
    } catch (err) {
      setError("Failed to submit leave request. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (isHalfDay) {
        setEndDate(startDate); 
    }
  }, [isHalfDay, startDate]);


  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <Select
        label="Leave Type"
        options={leaveTypeOptions}
        value={leaveTypeId}
        onChange={(e) => setLeaveTypeId(e.target.value as LeaveTypeId)}
        required
        wrapperClassName="sm:col-span-2"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          min={formatDateForInput(new Date(new Date().setFullYear(new Date().getFullYear() -1)))}
          onChange={(e) => {
            setStartDate(e.target.value);
            if (isHalfDay) setEndDate(e.target.value); // Keep end date same if half day
            if (new Date(e.target.value) > new Date(endDate)) setEndDate(e.target.value); // Ensure end date is not before start
          }}
          required
        />
        <Input
          label="End Date"
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
          disabled={isHalfDay}
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
        <div className="flex items-center">
            <input
                type="checkbox"
                id="isHalfDay"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="h-4 w-4 text-brand-primary border-brand-border rounded focus:ring-brand-primary"
            />
            <label htmlFor="isHalfDay" className="ml-2 text-sm text-brand-text">
            Request as half-day?
            </label>
        </div>
        {isHalfDay && (
            <Select
                options={[{value: 'AM', label: 'Morning (AM)'}, {value: 'PM', label: 'Afternoon (PM)'}]}
                value={halfDayPeriod}
                onChange={(e) => setHalfDayPeriod(e.target.value as 'AM' | 'PM')}
                wrapperClassName="flex-grow sm:max-w-xs"
                labelSrOnly // No visible label as context is clear
            />
        )}
      </div>
      <Textarea
        label="Reason (Optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Provide a brief reason for your leave request."
      />
      {error && <p className="text-brand-error text-sm bg-red-50 p-2 rounded-md">{error}</p>}
      <div className="flex justify-end space-x-3 pt-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" variant="primary" isLoading={submitting} disabled={submitting} leftIcon={<PlusCircleIcon className="h-5 w-5"/>}>Submit Request</Button>
      </div>
    </form>
  );
};


const LeavePage: React.FC = () => {
  const { currentUser, getToken } = useAuth(); // Added getToken
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeaveRequests = useCallback(async () => {
    if (!currentUser) return;
    const token = getToken();
    if (!token) {
      console.warn("No token for fetching leave requests.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const requests = await getLeaveRequests({ userId: currentUser.id }, token); // Pass token
      setLeaveRequests(requests);
    } catch (error) {
      console.error("Failed to fetch leave requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleSubmitSuccess = () => {
    setIsModalOpen(false);
    fetchLeaveRequests(); 
  };

  const columns: Column<LeaveRequest>[] = [
    { 
        header: 'Leave Type', 
        accessor: (item) => LEAVE_TYPES[item.leaveTypeId]?.name || item.leaveTypeId,
        cellClassName: 'font-medium'
    },
    { 
        header: 'Dates', 
        accessor: (item) => displayDateRange(item.startDate, item.endDate) 
    },
    { 
        header: 'Reason', 
        accessor: 'reason', 
        cellClassName: 'max-w-xs truncate text-sm text-brand-text-secondary',
        render: (item) => item.reason || <span className="text-gray-400 italic">N/A</span>
    },
    { 
        header: 'Status', 
        accessor: (item) => (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center ${REQUEST_STATUS_COLORS[item.status] || 'bg-gray-200 text-gray-800'}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()}
        </span>
    )},
    { 
        header: 'Requested On', 
        accessor: (item) => parseISODate(item.createdAt).toLocaleDateString(),
        cellClassName: 'text-sm text-brand-text-secondary'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-semibold text-brand-text">My Leave Requests</h1>
            <p className="mt-1 text-sm text-brand-text-secondary">Manage your leave applications and view their status.</p>
        </div>
        <Button 
            onClick={() => setIsModalOpen(true)} 
            variant="primary" 
            leftIcon={<PlusCircleIcon className="h-5 w-5" />}
            className="w-full sm:w-auto"
        >
          Request New Leave
        </Button>
      </div>

      <div className="bg-white shadow-lg rounded-lg border border-brand-border overflow-hidden">
        <Table
            columns={columns}
            data={leaveRequests}
            isLoading={isLoading}
            emptyMessage={
                <div className="text-center py-10">
                    <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <h3 className="font-medium text-brand-text">No Leave Requests Yet</h3>
                    <p className="text-sm text-brand-text-secondary">Click "Request New Leave" to get started.</p>
                </div>
            }
            rowKeyAccessor="id"
        />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="New Leave Application"
        size="lg"
      >
        <LeaveRequestForm 
            onSubmitSuccess={handleSubmitSuccess}
            onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default LeavePage;
