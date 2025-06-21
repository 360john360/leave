
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  PAS = 'PAS', // Coordinator
  VAR_SHIFT = 'VAR_SHIFT', // Shift Engineer
  VAR_BAU = 'VAR_BAU', // Business As Usual Engineer
}

export enum ShiftTeam {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  BAU = 'BAU',
  NONE = 'NONE' // For PAS, Managers, Admin if not part of a specific team
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team: ShiftTeam; 
  // password property should not be in frontend models for security
}

export enum LeaveTypeId {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  TRAINING = 'TRAINING',
  HALF_DAY_AM = 'HALF_DAY_AM',
  HALF_DAY_PM = 'HALF_DAY_PM',
  COMPASSIONATE = 'COMPASSIONATE',
  MATERNITY_PATERNITY = 'MATERNITY_PATERNITY',
  UNPAID = 'UNPAID',
  TOIL = 'TOIL' // Time Off In Lieu
}

export interface LeaveType {
  id: LeaveTypeId;
  name: string;
  shortCode: string;
  color: string; // Tailwind color class e.g. 'bg-green-500'
}

export enum LeaveRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName?: string; // Denormalized for display
  leaveTypeId: LeaveTypeId;
  startDate: string; // ISO Date string e.g. "2024-12-25"
  endDate: string; // ISO Date string
  isHalfDay: boolean; // True if HALF_DAY_AM or HALF_DAY_PM
  reason?: string;
  status: LeaveRequestStatus;
  managerId?: string; // User ID of manager who actioned
  createdAt: string; // ISO DateTime string
  retrospective?: boolean;
}

export enum ShiftPeriod {
  AM = 'AM', // Day shift
  PM = 'PM'  // Night shift
}

export interface Shift {
  id: string;
  date: string; // ISO Date string
  userId?: string; // Assigned user
  userName?: string; // Denormalized
  teamId?: ShiftTeam; // Assigned team
  shiftPeriod: ShiftPeriod | 'OFF'; // AM, PM, or OFF
  isSwapPending?: boolean;
}

export interface CalendarEvent {
  id: string;
  date: string; // ISO Date string for the specific day of the event
  type: 'leave' | 'shift' | 'holiday';
  title: string; // e.g. "John Doe - Annual Leave", "Team A - Day Shift"
  description?: string;
  color: string; // Tailwind CSS color class
  userId?: string; // if user-specific
  leaveRequest?: LeaveRequest; // if it's a leave event
  shift?: Shift; // if it's a shift event
}

export interface Customer {
  id: string;
  name: string;
}

export interface Environment {
  id: string;
  customerId: string;
  customerName?: string; // Denormalized
  name: string;
  requestInstructions: string;
}

export enum AccountAccessStatusValue {
  NONE = 'NONE',
  REQUESTED = 'REQUESTED',
  GRANTED = 'GRANTED',
  REVOKED = 'REVOKED'
}

export interface AccountAccess {
  userId: string;
  userName?: string; // Denormalized
  environmentId: string;
  status: AccountAccessStatusValue;
  lastUpdatedAt: string; // ISO DateTime string
}

export interface NotificationMessage {
  id: string;
  userId: string; // Target user
  message: string;
  link?: string; // e.g. /leave/approve/123
  isRead: boolean;
  createdAt: string; // ISO DateTime string
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  requesterName?: string;
  responderId: string;
  responderName?: string;
  requesterShiftId: string; // Shift ID
  requesterShiftDate: string; // Date of requester's shift
  responderShiftId: string; // Shift ID
  responderShiftDate: string; // Date of responder's shift
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  reason?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO DateTime string
  userId?: string; // User who performed the action
  userName?: string; // Denormalized
  actionType: string; // e.g., 'LEAVE_REQUEST_CREATED', 'USER_UPDATED'
  details: string; // e.g., "User John Doe requested annual leave for 2024-12-25"
  targetEntityId?: string; // e.g., LeaveRequest ID, User ID
}

// For Rota Generation
export interface TeamShiftAssignment {
  date: string; // YYYY-MM-DD
  dayShiftTeam: ShiftTeam | null;
  nightShiftTeam: ShiftTeam | null;
}
