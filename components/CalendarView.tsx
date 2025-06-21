
import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, LeaveRequest, Shift, UserRole } from '../types';
import { getMockCalendarEvents, updateMockLeaveRequestStatus } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { MONTH_NAMES, DAY_NAMES_SHORT, LEAVE_TYPES, REQUEST_STATUS_COLORS } from '../constants';
import { addMonths, formatISODate, parseISODate, displayDateRange, isSameDay } from '../utils/dateUtils';
import Button from './common/Button';
import Modal from './common/Modal';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'; // Updated for solid icons

interface CalendarViewProps {
  onDateClick?: (date: Date, events: CalendarEvent[]) => void;
  onEventClick?: (event: CalendarEvent) => void;
  initialDate?: Date;
  highlightDate?: Date; // New prop to highlight a specific date
}

interface EventDetailModalState {
  isOpen: boolean;
  date: Date | null;
  events: CalendarEvent[];
}

const CalendarGridHeader: React.FC = () => (
  <div className="grid grid-cols-7 border-b border-l border-brand-border">
    {DAY_NAMES_SHORT.map(day => (
      <div key={day} className="py-2 px-1 text-center text-xs font-semibold text-brand-text-secondary uppercase border-r border-brand-border">
        {day}
      </div>
    ))}
  </div>
);

const CalendarView: React.FC<CalendarViewProps> = ({ onDateClick, onEventClick, initialDate, highlightDate }) => {
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventDetailModal, setEventDetailModal] = useState<EventDetailModalState>({ isOpen: false, date: null, events: [] });
  const [selectedLeaveRequestForAction, setSelectedLeaveRequestForAction] = useState<LeaveRequest | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const fetchedEvents = await getMockCalendarEvents(year, month, currentUser.id);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Failed to fetch calendar events:", error);
      // Consider user-facing error notification
    } finally {
      setLoading(false);
    }
  }, [currentDate, currentUser]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handlePrevMonth = () => setCurrentDate(prev => addMonths(prev, -1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 

  const calendarDays: (Date | null)[] = Array(firstDayOfMonth).fill(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(year, month, i));
  while ((calendarDays.length % 7) !== 0) calendarDays.push(null);

  const handleDayCellClick = (date: Date) => {
    const dayEvents = events.filter(e => e.date === formatISODate(date));
    if (onDateClick) onDateClick(date, dayEvents);
    setEventDetailModal({ isOpen: true, date, events: dayEvents });
  };
  
  const handleEventClickInternal = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventClick) onEventClick(event);

    if (event.type === 'leave' && event.leaveRequest && currentUser?.role === UserRole.MANAGER && event.leaveRequest.status === 'PENDING') {
        setSelectedLeaveRequestForAction(event.leaveRequest);
    } else {
        const dayEvents = events.filter(eFilter => eFilter.date === event.date);
        setEventDetailModal({isOpen: true, date: parseISODate(event.date), events: dayEvents});
    }
  };

  const handleLeaveAction = async (action: 'APPROVE' | 'REJECT') => { // Typo 'REJECTE' fixed
    if (!selectedLeaveRequestForAction || !currentUser || currentUser.role !== UserRole.MANAGER) return;
    
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    try {
        await updateMockLeaveRequestStatus(selectedLeaveRequestForAction.id, newStatus as any, currentUser.id);
        fetchEvents(); 
    } catch (error) {
        console.error(`Failed to ${action.toLowerCase()} leave request:`, error);
    } finally {
        setSelectedLeaveRequestForAction(null);
    }
  };

  const getEventDisplayColor = (event: CalendarEvent) => {
    if (event.type === 'leave' && event.leaveRequest) {
      return LEAVE_TYPES[event.leaveRequest.leaveTypeId]?.color.replace('bg-', 'border-') + ' ' + LEAVE_TYPES[event.leaveRequest.leaveTypeId]?.color.replace('text-', 'text-') + ' ' + LEAVE_TYPES[event.leaveRequest.leaveTypeId]?.color.replace('bg-', 'bg-opacity-10 hover:bg-opacity-20');
    }
    if(event.type === 'shift' && event.shift) {
        return event.shift.shiftPeriod === 'AM' ? 'border-shift-day text-shift-day-text bg-shift-day bg-opacity-50 hover:bg-opacity-75' : 'border-shift-night text-shift-night-text bg-shift-night bg-opacity-50 hover:bg-opacity-75';
    }
    return event.color.replace('bg-', 'border-') + ' ' + event.color.replace('text-', 'text-') + ' ' + event.color.replace('bg-', 'bg-opacity-10 hover:bg-opacity-20');
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl border border-brand-border">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-1">
          <Button onClick={handlePrevMonth} size="sm" variant="ghost" aria-label="Previous month" className="p-2"><ChevronLeftIcon className="h-5 w-5" /></Button>
          <h2 className="text-xl sm:text-2xl font-semibold text-brand-text w-48 text-center tabular-nums">{`${MONTH_NAMES[month]} ${year}`}</h2>
          <Button onClick={handleNextMonth} size="sm" variant="ghost" aria-label="Next month" className="p-2"><ChevronRightIcon className="h-5 w-5" /></Button>
        </div>
        <Button onClick={handleToday} size="sm" variant="secondary">Today</Button>
      </div>

      {loading && <div className="text-center py-10 text-brand-text-secondary">Loading events...</div>}
      
      {!loading && (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]"> {/* Ensure min width for proper display */}
            <CalendarGridHeader />
            <div className="grid grid-cols-7 border-l border-brand-border">
              {calendarDays.map((day, index) => {
                const isToday = day && isSameDay(day, new Date());
                const isHighlighted = day && highlightDate && isSameDay(day, highlightDate);
                const dayEvents = day ? events.filter(e => e.date === formatISODate(day)) : [];

                return (
                  <div
                    key={index}
                    className={`
                      p-1.5 min-h-[7rem] sm:min-h-[8rem] relative 
                      border-r border-b border-brand-border
                      ${day ? 'bg-white hover:bg-slate-50 transition-colors duration-150' : 'bg-slate-50 cursor-default'}
                      ${day && onDateClick ? 'cursor-pointer' : ''}
                      ${isHighlighted ? 'ring-2 ring-brand-accent ring-inset' : ''}
                    `}
                    onClick={() => day && handleDayCellClick(day)}
                    role={day ? "button" : undefined}
                    tabIndex={day ? 0 : -1}
                    aria-label={day ? `Events for ${day.toLocaleDateString()}` : "Empty calendar cell"}
                  >
                    {day && (
                      <>
                        <span className={`
                          text-xs sm:text-sm font-medium absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-full
                          ${isToday ? 'bg-brand-primary text-white' : 'text-brand-text-secondary'}
                        `}>
                          {day.getDate()}
                        </span>
                        <div className="mt-1 space-y-0.5 overflow-hidden max-h-[calc(100%-2rem)]">
                          {dayEvents
                            .slice(0, 3) 
                            .map(event => (
                              <div
                                key={event.id}
                                className={`p-1 border-l-4 rounded-r text-[10px] sm:text-xs truncate cursor-pointer ${getEventDisplayColor(event)}`}
                                title={event.title}
                                onClick={(e) => handleEventClickInternal(event, e)}
                              >
                                {event.title}
                              </div>
                            ))}
                          {dayEvents.length > 3 && (
                            <div className="text-brand-secondary text-center text-[10px] sm:text-xs hover:underline pt-0.5">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <Modal
        isOpen={eventDetailModal.isOpen && !!eventDetailModal.date}
        onClose={() => setEventDetailModal({ isOpen: false, date: null, events: [] })}
        title={`Events for ${eventDetailModal.date?.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        size="lg"
      >
        {eventDetailModal.events.length === 0 ? (
          <p className="text-brand-text-secondary">No events scheduled for this day.</p>
        ) : (
          <ul className="space-y-3">
            {eventDetailModal.events.map(event => (
              <li key={event.id} className={`p-3 rounded-md border-l-4 ${getEventDisplayColor(event)}`}>
                <p className="font-semibold text-sm">{event.title}</p>
                {event.description && <p className="text-xs mt-0.5">{event.description}</p>}
                {event.type === 'leave' && event.leaveRequest && (
                  <div className="mt-1 text-xs space-y-0.5">
                      <p>Status: <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${REQUEST_STATUS_COLORS[event.leaveRequest.status] || 'bg-gray-200 text-gray-800'}`}>{event.leaveRequest.status}</span></p>
                      {event.leaveRequest.reason && <p className="italic">Reason: {event.leaveRequest.reason}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        isOpen={!!selectedLeaveRequestForAction}
        onClose={() => setSelectedLeaveRequestForAction(null)}
        title={`Action Leave: ${selectedLeaveRequestForAction?.userName}`}
        size="md"
        footer={
            currentUser?.role === UserRole.MANAGER && selectedLeaveRequestForAction?.status === 'PENDING' && (
             <div className="flex justify-end space-x-2">
                <Button onClick={() => setSelectedLeaveRequestForAction(null)} variant="ghost" size="sm">Cancel</Button>
                <Button onClick={() => handleLeaveAction('REJECT')} variant="danger" size="sm">Reject</Button>
                <Button onClick={() => handleLeaveAction('APPROVE')} variant="success" size="sm">Approve</Button>
             </div>
          )
        }
      >
        {selectedLeaveRequestForAction && (
          <div className="space-y-3 text-sm">
            <p><strong>Employee:</strong> {selectedLeaveRequestForAction.userName}</p>
            <p><strong>Type:</strong> {LEAVE_TYPES[selectedLeaveRequestForAction.leaveTypeId].name}</p>
            <p><strong>Dates:</strong> {displayDateRange(selectedLeaveRequestForAction.startDate, selectedLeaveRequestForAction.endDate)}</p>
            {selectedLeaveRequestForAction.reason && <p><strong>Reason:</strong> {selectedLeaveRequestForAction.reason}</p>}
            <p><strong>Current Status:</strong> <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${REQUEST_STATUS_COLORS[selectedLeaveRequestForAction.status]}`}>{selectedLeaveRequestForAction.status}</span></p>
            { currentUser?.role !== UserRole.MANAGER || selectedLeaveRequestForAction.status !== 'PENDING' && <p className="mt-3 text-brand-text-secondary">This request has already been actioned or cannot be actioned by you.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CalendarView;
