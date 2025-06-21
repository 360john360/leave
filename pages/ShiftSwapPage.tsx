
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, UserRole } from '../hooks/useAuth';
import { ShiftSwapRequest, Shift, User } from '../types';
import { 
    getShiftSwapRequests, createShiftSwapRequest, respondShiftSwapRequest,
    getCalendarEvents,
    getUsers
} from '../services/api'; // Updated imports
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Table, { Column } from '../components/common/Table';
import { parseISODate, todayISO } from '../utils/dateUtils';
import { ArrowsRightLeftIcon, PlusCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const ShiftSwapPage: React.FC = () => {
  const { currentUser, getToken } = useAuth(); // Added getToken
  const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>([]);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [colleagueShifts, setColleagueShifts] = useState<Shift[]>([]);
  const [allShiftUsers, setAllShiftUsers] = useState<User[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResponding, setIsResponding] = useState(false); // For accept/decline loading
  
  const [selectedMyShiftId, setSelectedMyShiftId] = useState('');
  const [selectedColleagueId, setSelectedColleagueId] = useState('');
  const [selectedColleagueShiftId, setSelectedColleagueShiftId] = useState('');
  const [swapReason, setSwapReason] = useState('');
  const [formError, setFormError] = useState('');

  const fetchInitialData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    const token = getToken();
    if (!token) {
      console.warn("No token for fetching initial shift swap data.");
      setIsLoading(false);
      return;
    }
    try {
      const [reqs, users] = await Promise.all([
        getShiftSwapRequests(currentUser.id, token), // Pass token
        getUsers(token) // Pass token
      ]);
      setSwapRequests(reqs);

      const shiftUsers = users.filter(u => (u.role === UserRole.VAR_SHIFT || u.role === UserRole.VAR_BAU) && u.id !== currentUser.id);
      setAllShiftUsers(shiftUsers);

      const today = new Date();
      // Fetch shifts for current month and next month to give more options
      // getCalendarEvents(year, month, teamId (optional), token)
      // Here, teamId is not directly applicable; we need shifts for a specific user (currentUser.id)
      // The getCalendarEvents in services/api.ts was defined as getCalendarEvents(year, month, teamId, token)
      // It needs to be flexible enough or we need another endpoint/logic for user-specific shifts.
      // For now, assuming getCalendarEvents can work if teamId is undefined and it implicitly uses the token's user or fetches broadly.
      // This might need refinement based on the actual API's capabilities for getCalendarEvents.
      // A more direct `getShiftsForUser(userId, fromDate, toDate, token)` would be better.
      // Let's use current getCalendarEvents and filter client-side as per mock logic.
      const currentMonthEvents = await getCalendarEvents(today.getFullYear(), today.getMonth(), undefined, token); // Pass token
      const nextMonthEvents = await getCalendarEvents(today.getFullYear(), today.getMonth() + 1, undefined, token); // Pass token
      
      const userShifts = [...currentMonthEvents, ...nextMonthEvents]
        .filter(event => event.type === 'shift' && event.shift && event.shift.userId === currentUser.id)
        .map(event => event.shift!)
        .filter(shift => parseISODate(shift.date) >= parseISODate(todayISO())) // Only future/today's shifts
        .sort((a,b) => parseISODate(a.date).getTime() - parseISODate(b.date).getTime()); // Sort by date
      setMyShifts(userShifts);

    } catch (error) {
      console.error("Failed to fetch shift swap data:", error);
      // User-facing error message
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const fetchColleagueShifts = async () => {
        if (!selectedColleagueId || !currentUser) {
            setColleagueShifts([]);
            return;
        }
        setIsLoading(true);
        const token = getToken();
        if (!token) {
            console.warn("No token for fetching colleague shifts.");
            setIsLoading(false);
            return;
        }
        try {
            const today = new Date();
            // Fetch shifts for current month and next month for colleague
            // Similar to above, using getCalendarEvents and filtering.
            // Ideally, backend provides a more direct way to get a user's shifts.
            const currentMonthEvents = await getCalendarEvents(today.getFullYear(), today.getMonth(), undefined, token); // Pass token
            const nextMonthEvents = await getCalendarEvents(today.getFullYear(), today.getMonth() + 1, undefined, token); // Pass token

            const colleagueUserShifts = [...currentMonthEvents, ...nextMonthEvents]
                .filter(event => event.type === 'shift' && event.shift && event.shift.userId === selectedColleagueId)
                .map(event => event.shift!)
                .filter(shift => parseISODate(shift.date) >= parseISODate(todayISO()))
                .sort((a,b) => parseISODate(a.date).getTime() - parseISODate(b.date).getTime());
            setColleagueShifts(colleagueUserShifts);
        } catch (error) {
            console.error("Failed to fetch colleague shifts:", error);
            setColleagueShifts([]); // Clear on error
        } finally {
            setIsLoading(false);
        }
    };
    if (selectedColleagueId) {
        fetchColleagueShifts();
    } else {
        setColleagueShifts([]);
    }
  }, [selectedColleagueId, currentUser]);


  const handleCreateSwap = async () => {
    if (!currentUser || !selectedMyShiftId || !selectedColleagueId || !selectedColleagueShiftId) {
        setFormError('All shift and colleague selections are required.');
        return;
    }
    setFormError('');
    setIsLoading(true);
    const token = getToken();
    if (!token) {
        setFormError('Authentication error. Please log in again.');
        setIsLoading(false);
        return;
    }
    try {
        const myShift = myShifts.find(s => s.id === selectedMyShiftId);
        const colleagueShift = colleagueShifts.find(s => s.id === selectedColleagueShiftId);

        if (!myShift || !colleagueShift) {
            setFormError('One or both selected shifts could not be found. Please re-select.');
            setIsLoading(false);
            return;
        }

      await createShiftSwapRequest({ // Use new function
        requesterId: currentUser.id,
        responderId: selectedColleagueId,
        requesterShiftId: selectedMyShiftId,
        requesterShiftDate: myShift.date, // Backend might re-verify or just use IDs
        responderShiftId: selectedColleagueShiftId,
        responderShiftDate: colleagueShift.date, // Backend might re-verify or just use IDs
        reason: swapReason,
      }, token); // Pass token
      setIsModalOpen(false);
      fetchInitialData(); 
      setSelectedMyShiftId('');
      setSelectedColleagueId('');
      setSelectedColleagueShiftId('');
      setSwapReason('');
    } catch (error) {
      console.error("Failed to create shift swap:", error);
      setFormError('An error occurred while creating the swap request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToSwap = async (swapId: string, accepted: boolean) => {
    if (!currentUser) return;
    setIsResponding(true);
    const token = getToken();
    if (!token) {
      console.warn("No token for responding to shift swap.");
      // Optionally set an error message for the user
      setIsResponding(false);
      return;
    }
    try {
      await respondShiftSwapRequest(swapId, currentUser.id, accepted, token); // Pass token
      fetchInitialData(); 
    } catch (error) {
      console.error("Failed to respond to shift swap:", error);
      // User-facing error for this specific action
    } finally {
      setIsResponding(false);
    }
  };
  
  const getStatusBadge = (status: ShiftSwapRequest['status']) => {
    switch (status) {
        case 'PENDING': return 'bg-amber-100 text-amber-700 ring-amber-600/20';
        case 'ACCEPTED': return 'bg-green-100 text-green-700 ring-green-600/20';
        case 'REJECTED': return 'bg-red-100 text-red-700 ring-red-600/20';
        case 'CANCELLED': return 'bg-gray-100 text-gray-700 ring-gray-600/20';
        default: return 'bg-gray-100 text-gray-700 ring-gray-600/20';
    }
  }

  const swapColumns: Column<ShiftSwapRequest>[] = [
    { header: 'Requester', accessor: (item) => item.requesterName || item.requesterId, cellClassName: 'font-medium' },
    { header: 'Responder', accessor: (item) => item.responderName || item.responderId, cellClassName: 'font-medium' },
    { header: 'Requester\'s Shift', accessor: (item) => `${parseISODate(item.requesterShiftDate).toLocaleDateString()} (${myShifts.find(s=>s.id === item.requesterShiftId)?.shiftPeriod || 'N/A'})` },
    { header: 'Responder\'s Shift', accessor: (item) => `${parseISODate(item.responderShiftDate).toLocaleDateString()} (${allShiftUsers.length > 0 && colleagueShifts.find(s=>s.id === item.responderShiftId)?.shiftPeriod || 'N/A'})` }, // This needs better data source for shift period
    { 
        header: 'Status', 
        accessor: (item) => <span className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-block ring-1 ring-inset ${getStatusBadge(item.status)}`}>{item.status}</span> 
    },
    { 
        header: 'Reason', 
        accessor: (item) => item.reason || <span className="text-gray-400 italic">N/A</span>,
        cellClassName: 'text-sm text-brand-text-secondary max-w-xs truncate'
    },
    { 
        header: 'Actions', 
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        accessor: (item) => (
        item.status === 'PENDING' && item.responderId === currentUser?.id ? (
          <div className="space-x-2">
            <Button onClick={() => handleRespondToSwap(item.id, true)} variant="success" size="xs" isLoading={isResponding} leftIcon={<CheckCircleIcon className="h-4 w-4"/>}>Accept</Button>
            <Button onClick={() => handleRespondToSwap(item.id, false)} variant="danger" size="xs" isLoading={isResponding} leftIcon={<XCircleIcon className="h-4 w-4"/>}>Decline</Button>
          </div>
        ) : item.status === 'PENDING' && item.requesterId === currentUser?.id ? (
            <span className="text-xs text-gray-400 italic">Awaiting response</span>
        ) : <span className="text-xs text-gray-400 italic">-</span>
      )
    },
  ];

  if (!currentUser || !(currentUser.role.toString().startsWith('VAR'))) {
    return <div className="bg-red-50 text-brand-error p-4 rounded-md shadow">Access Denied. This page is for VAR engineers only.</div>;
  }

  const formatShiftOptionLabel = (shift: Shift) => {
    return `${parseISODate(shift.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} (${shift.shiftPeriod})`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-semibold text-brand-text">Shift Swaps</h1>
            <p className="mt-1 text-sm text-brand-text-secondary">Manage your shift swap requests or respond to requests from colleagues.</p>
        </div>
        <Button 
            onClick={() => { setIsModalOpen(true); setFormError(''); }} 
            variant="primary" 
            disabled={isLoading}
            leftIcon={<PlusCircleIcon className="h-5 w-5"/>}
            className="w-full sm:w-auto"
        >
          Request New Swap
        </Button>
      </div>

      <div className="bg-white shadow-lg rounded-lg border border-brand-border overflow-hidden">
        <Table
            columns={swapColumns}
            data={swapRequests}
            isLoading={isLoading && !swapRequests.length} // Show loading only if no data yet
            emptyMessage={
                <div className="text-center py-10">
                    <ArrowsRightLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <h3 className="font-medium text-brand-text">No Shift Swaps</h3>
                    <p className="text-sm text-brand-text-secondary">You have no pending or historical shift swap requests.</p>
                </div>
            }
            rowKeyAccessor="id"
        />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Request New Shift Swap"
        size="lg"
        footer={
            <div className="flex w-full justify-between items-center">
                {formError && <p className="text-xs text-brand-error flex-grow mr-3">{formError}</p>}
                <div className="flex space-x-3">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isLoading}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreateSwap} isLoading={isLoading} disabled={isLoading || isResponding}>Submit Request</Button>
                </div>
            </div>
        }
      >
        <div className="space-y-4 sm:space-y-5">
          <Select
            label="Your Shift to Swap Out"
            options={myShifts.map(s => ({ value: s.id, label: formatShiftOptionLabel(s) }))}
            value={selectedMyShiftId}
            onChange={(e) => setSelectedMyShiftId(e.target.value)}
            placeholder="Select your shift..."
            required
            disabled={myShifts.length === 0 || isLoading}
          />
          <Select
            label="Colleague to Swap With"
            options={allShiftUsers.map(u => ({ value: u.id, label: u.name }))}
            value={selectedColleagueId}
            onChange={(e) => {setSelectedColleagueId(e.target.value); setSelectedColleagueShiftId('');}}
            placeholder="Select a colleague..."
            required
            disabled={allShiftUsers.length === 0 || isLoading}
          />
          {selectedColleagueId && (
            <Select
              label="Colleague's Shift to Take"
              options={colleagueShifts.map(s => ({ value: s.id, label: formatShiftOptionLabel(s) }))}
              value={selectedColleagueShiftId}
              onChange={(e) => setSelectedColleagueShiftId(e.target.value)}
              placeholder={isLoading ? "Loading shifts..." : "Select colleague's shift..."}
              required
              disabled={isLoading || colleagueShifts.length === 0}
            />
          )}
          <Textarea
            label="Reason for Swap (Optional)"
            value={swapReason}
            onChange={(e) => setSwapReason(e.target.value)}
            rows={2}
            placeholder="Provide a brief reason for your request."
          />
        </div>
      </Modal>
    </div>
  );
};

export default ShiftSwapPage;
