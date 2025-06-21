
import { LeaveType, LeaveTypeId, UserRole, ShiftTeam } from './types';

export const APP_NAME = "Workforce Management System";

export const ROLES_CONFIG: Record<UserRole, { name: string; description: string }> = {
  [UserRole.ADMIN]: { name: 'Administrator', description: 'Manages users, customers, and system settings.' },
  [UserRole.MANAGER]: { name: 'Manager', description: 'Approves leave, generates rotas, manages team schedules.' },
  [UserRole.PAS]: { name: 'PAS Coordinator', description: 'Coordinates OS patching, views schedules and account access.' },
  [UserRole.VAR_SHIFT]: { name: 'VAR Shift Engineer', description: 'Works on a 4-on/4-off shift rota.' },
  [UserRole.VAR_BAU]: { name: 'VAR BAU Engineer', description: 'Works standard business hours (Mon-Fri).' },
};

// Using Tailwind JIT, direct color classes are fine.
// For CalendarEvent, actual color values might be derived or fixed there.
// These are primarily for UI elements like badges or legends that might not be on the calendar itself.
export const LEAVE_TYPES: Record<LeaveTypeId, LeaveType> = {
  [LeaveTypeId.ANNUAL]: { id: LeaveTypeId.ANNUAL, name: 'Annual Leave', shortCode: 'AL', color: 'bg-leave-annual text-white' },
  [LeaveTypeId.SICK]: { id: LeaveTypeId.SICK, name: 'Sick Leave', shortCode: 'SL', color: 'bg-leave-sick text-white' },
  [LeaveTypeId.TRAINING]: { id: LeaveTypeId.TRAINING, name: 'Training', shortCode: 'T', color: 'bg-leave-training text-white' },
  [LeaveTypeId.HALF_DAY_AM]: { id: LeaveTypeId.HALF_DAY_AM, name: 'Half Day (AM)', shortCode: 'HL AM', color: 'bg-leave-halfday text-brand-text' }, // Adjusted text color
  [LeaveTypeId.HALF_DAY_PM]: { id: LeaveTypeId.HALF_DAY_PM, name: 'Half Day (PM)', shortCode: 'HL PM', color: 'bg-leave-halfday text-brand-text' }, // Adjusted text color
  [LeaveTypeId.COMPASSIONATE]: { id: LeaveTypeId.COMPASSIONATE, name: 'Compassionate Leave', shortCode: 'CL', color: 'bg-leave-compassionate text-white' },
  [LeaveTypeId.MATERNITY_PATERNITY]: { id: LeaveTypeId.MATERNITY_PATERNITY, name: 'Maternity/Paternity Leave', shortCode: 'ML/PL', color: 'bg-leave-maternity text-white' },
  [LeaveTypeId.UNPAID]: { id: LeaveTypeId.UNPAID, name: 'Unpaid Leave', shortCode: 'UL', color: 'bg-gray-400 text-brand-text' },
  [LeaveTypeId.TOIL]: { id: LeaveTypeId.TOIL, name: 'Time Off In Lieu', shortCode: 'TOIL', color: 'bg-indigo-500 text-white' }, // Keep indigo for TOIL for now or map to brand.
};

export const SHIFT_TEAMS_CONFIG: Record<ShiftTeam, { name: string }> = {
    [ShiftTeam.A]: { name: 'Team A' },
    [ShiftTeam.B]: { name: 'Team B' },
    [ShiftTeam.C]: { name: 'Team C' },
    [ShiftTeam.D]: { name: 'Team D' },
    [ShiftTeam.BAU]: { name: 'BAU Team' },
    [ShiftTeam.NONE]: { name: 'N/A' }
};

export const REQUEST_STATUS_COLORS: { [key: string]: string } = {
  PENDING: 'bg-status-pending text-amber-800', // Adjusted text for better contrast on amber
  APPROVED: 'bg-status-approved text-white',
  REJECTED: 'bg-status-rejected text-white',
  CANCELLED: 'bg-gray-400 text-brand-text'
};

export const ACCOUNT_ACCESS_STATUS_DISPLAY: { [key: string]: { text: string, color: string, badgeClass: string} } = {
  NONE: { text: 'None', color: 'text-gray-500', badgeClass: 'bg-gray-100 text-gray-600 ring-gray-200'},
  REQUESTED: { text: 'Requested', color: 'text-brand-warning', badgeClass: 'bg-amber-50 text-amber-700 ring-amber-600/20'},
  GRANTED: { text: 'Granted', color: 'text-brand-success', badgeClass: 'bg-green-50 text-green-700 ring-green-600/20'},
  REVOKED: { text: 'Revoked', color: 'text-brand-error', badgeClass: 'bg-red-50 text-red-700 ring-red-600/20'},
};

export const DATE_FORMAT_DISPLAY = "MMM dd, yyyy"; 
export const DATE_FORMAT_INPUT = "yyyy-MM-dd";

export const SENSITIVE_LEAVE_TYPES: LeaveTypeId[] = [LeaveTypeId.SICK, LeaveTypeId.COMPASSIONATE, LeaveTypeId.MATERNITY_PATERNITY];

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
