import { 
  User, UserRole, ShiftTeam, 
  LeaveRequest, LeaveTypeId, LeaveRequestStatus, 
  Shift, ShiftPeriod, CalendarEvent, 
  Customer, Environment, AccountAccess, AccountAccessStatusValue,
  NotificationMessage, ShiftSwapRequest, AuditLogEntry, TeamShiftAssignment
} from '../types';
import { LEAVE_TYPES, ROLES_CONFIG, SHIFT_TEAMS_CONFIG } from '../constants';
import { generateMockId, getDaysInMonth, addDays, formatISODate } from '../utils/dateUtils';

const API_BASE_URL = 'http://localhost:8000/api';


// --- LocalStorage Helpers ---
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setToStorage = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// --- Initial Mock Data Setup ---
const initialMockUsers: User[] = [
  { id: 'user1', name: 'Admin User', email: 'admin@example.com', role: UserRole.ADMIN, team: ShiftTeam.NONE },
  { id: 'user2', name: 'Manager Mike', email: 'manager@example.com', role: UserRole.MANAGER, team: ShiftTeam.NONE },
  { id: 'user3', name: 'Pat Coordinator', email: 'pas@example.com', role: UserRole.PAS, team: ShiftTeam.NONE },
  { id: 'user4', name: 'Alice Engineer (Shift A)', email: 'alice@example.com', role: UserRole.VAR_SHIFT, team: ShiftTeam.A },
  { id: 'user5', name: 'Bob Engineer (Shift B)', email: 'bob@example.com', role: UserRole.VAR_SHIFT, team: ShiftTeam.B },
  { id: 'user6', name: 'Charlie Engineer (Shift C)', email: 'charlie@example.com', role: UserRole.VAR_SHIFT, team: ShiftTeam.C },
  { id: 'user7', name: 'Diana Engineer (Shift D)', email: 'diana@example.com', role: UserRole.VAR_SHIFT, team: ShiftTeam.D },
  { id: 'user8', name: 'Eve Engineer (BAU)', email: 'eve@example.com', role: UserRole.VAR_BAU, team: ShiftTeam.BAU },
];

const initialMockCustomers: Customer[] = [
  { id: 'cust1', name: 'Acme Corp' },
  { id: 'cust2', name: 'Beta Solutions' },
];

const initialMockEnvironments: Environment[] = [
  { id: 'env1', customerId: 'cust1', customerName: 'Acme Corp', name: 'Production', requestInstructions: 'Submit ticket to IT with justification.' },
  { id: 'env2', customerId: 'cust1', customerName: 'Acme Corp', name: 'UAT', requestInstructions: 'Contact project manager for access.' },
  { id: 'env3', customerId: 'cust2', customerName: 'Beta Solutions', name: 'Development', requestInstructions: 'Self-service portal: dev-access.betasolutions.com' },
];

// --- API Functions ---

// Users
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: User[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: User = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    throw error;
  }
};

export const loginUser = async (email: string, password?: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }), // Include password if backend requires it
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 404) return null; // Unauthorized or Not Found
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: User = await response.json(); // Or { user: User, token: string }
    // If backend returns a token, it should be handled here or in useAuth
    return data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const addUser = async (userData: Omit<User, 'id'>, token?: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const newUser: User = await response.json();
    // Logging should ideally be handled by the backend or a separate logging service
    // await logAuditEventMock(null, 'USER_CREATED', `Admin created user: ${newUser.name} (Role: ${ROLES_CONFIG[newUser.role].name})`);
    return newUser;
  } catch (error) {
    console.error("Failed to add user:", error);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>, token?: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const updatedUser: User = await response.json();
    // Logging should ideally be handled by the backend
    // await logAuditEventMock(null, 'USER_UPDATED', `Admin updated user: ${updatedUser.name}. Changes: ${JSON.stringify(updates)}`);
    return updatedUser;
  } catch (error) {
    console.error(`Failed to update user ${userId}:`, error);
    throw error;
  }
};

// Leave Requests
export const getLeaveRequests = async (filters?: { userId?: string, status?: LeaveRequestStatus, teamId?: ShiftTeam }, token?: string): Promise<LeaveRequest[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (filters?.userId) queryParams.append('userId', filters.userId);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.teamId) queryParams.append('teamId', filters.teamId);

    const response = await fetch(`${API_BASE_URL}/leave-requests?${queryParams.toString()}`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const requests: LeaveRequest[] = await response.json();
    // userName should be populated by the backend or handled by joining with user data on frontend if necessary
    return requests.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Failed to fetch leave requests:", error);
    throw error;
  }
};

export const createLeaveRequest = async (requestData: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'userName'>, requesterId: string, token?: string): Promise<LeaveRequest> => {
  try {
    const response = await fetch(`${API_BASE_URL}/leave-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ ...requestData, userId: requesterId }), // Ensure userId is part of the payload
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const newRequest: LeaveRequest = await response.json();
    // Logging and notifications should be handled by the backend
    return newRequest;
  } catch (error) {
    console.error("Failed to create leave request:", error);
    throw error;
  }
};

export const updateLeaveRequestStatus = async (requestId: string, status: LeaveRequestStatus, managerId: string, token?: string): Promise<LeaveRequest | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/leave-requests/${requestId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ status, managerId }),
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const updatedRequest: LeaveRequest = await response.json();
    // Logging and notifications should be handled by the backend
    return updatedRequest;
  } catch (error) {
    console.error(`Failed to update leave request ${requestId}:`, error);
    throw error;
  }
};


// Calendar Events (combines leaves and shifts)
export const getCalendarEvents = async (year: number, month: number, teamId?: string, token?: string): Promise<CalendarEvent[]> => {
  try {
    const queryParams = new URLSearchParams({
      year: year.toString(),
      month: (month + 1).toString(), // Assuming backend expects 1-indexed month
    });
    if (teamId) queryParams.append('teamId', teamId);

    const response = await fetch(`${API_BASE_URL}/calendar-events?${queryParams.toString()}`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const events: CalendarEvent[] = await response.json();
    // Backend should provide all necessary fields including color, title, etc.
    // Or, additional client-side processing might be needed if backend returns raw data.
    return events;
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    throw error;
  }
};


// Shift Rota
export const generateRota = async (year: number, startingTeamAOnDayShift: Date, token?: string): Promise<TeamShiftAssignment[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rota/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ year, startingTeamAOnDayShift: formatISODate(startingTeamAOnDayShift) }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rota: TeamShiftAssignment[] = await response.json();
    // Logging handled by backend
    return rota;
  } catch (error) {
    console.error("Failed to generate rota:", error);
    throw error;
  }
};

export const getGeneratedRota = async (year: number, token?: string): Promise<TeamShiftAssignment[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rota?year=${year}`, { // Assuming endpoint /rota for GET
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to get generated rota for year ${year}:`, error);
    throw error;
  }
};

// Shift Swaps
export const getShiftSwapRequests = async (userId: string, token?: string): Promise<ShiftSwapRequest[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/shift-swaps?userId=${userId}`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const swaps: ShiftSwapRequest[] = await response.json();
    // Names should be populated by backend or joined on client-side
    return swaps.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Failed to fetch shift swap requests:", error);
    throw error;
  }
};

export const createShiftSwapRequest = async (data: Omit<ShiftSwapRequest, 'id' | 'status' | 'createdAt' | 'requesterName' | 'responderName'>, token?: string): Promise<ShiftSwapRequest> => {
  try {
    const response = await fetch(`${API_BASE_URL}/shift-swaps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const newSwap: ShiftSwapRequest = await response.json();
    // Logging and notifications handled by backend
    return newSwap;
  } catch (error) {
    console.error("Failed to create shift swap request:", error);
    throw error;
  }
};

export const respondShiftSwapRequest = async (swapId: string, responderId: string, accepted: boolean, token?: string): Promise<ShiftSwapRequest | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/shift-swaps/${swapId}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ responderId, accepted }),
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const updatedSwap: ShiftSwapRequest = await response.json();
    // Shift updates, logging, and notifications handled by backend
    return updatedSwap;
  } catch (error) {
    console.error(`Failed to respond to shift swap request ${swapId}:`, error);
    throw error;
  }
};


// Customers & Environments
export const getCustomers = async (token?: string): Promise<Customer[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    throw error;
  }
};

export const addCustomer = async (customerData: Omit<Customer, 'id'>, token?: string): Promise<Customer> => {
  try {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(customerData),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const newCustomer: Customer = await response.json();
    // Logging by backend
    return newCustomer;
  } catch (error) {
    console.error("Failed to add customer:", error);
    throw error;
  }
};

export const getEnvironments = async (customerId?: string, token?: string): Promise<Environment[]> => {
  try {
    let url = `${API_BASE_URL}/environments`;
    if (customerId) { // Assuming backend can filter by customerId if provided as query param
      url = `${API_BASE_URL}/customers/${customerId}/environments`;
    }
    const response = await fetch(url, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const environments: Environment[] = await response.json();
    // customerName should be populated by backend
    return environments;
  } catch (error) {
    console.error("Failed to fetch environments:", error);
    throw error;
  }
};

export const addEnvironment = async (envData: Omit<Environment, 'id' | 'customerName'>, token?: string): Promise<Environment> => {
  try {
    // POST to /api/customers/{customerId}/environments as per README
    const response = await fetch(`${API_BASE_URL}/customers/${envData.customerId}/environments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(envData),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const newEnv: Environment = await response.json();
    // Logging by backend
    return newEnv;
  } catch (error) {
    console.error("Failed to add environment:", error);
    throw error;
  }
};

export const updateEnvironment = async (envId: string, updates: Partial<Omit<Environment, 'id' | 'customerId' | 'customerName'>>, token?: string): Promise<Environment | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/environments/${envId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const updatedEnv: Environment = await response.json();
    // Logging by backend
    return updatedEnv;
  } catch (error) {
    console.error(`Failed to update environment ${envId}:`, error);
    throw error;
  }
};


// Account Access
export const getAccountAccess = async (params: { environmentId?: string; userId?: string }, token?: string): Promise<AccountAccess[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.append('userId', params.userId);
    // Endpoint from README: GET /api/environments/{environmentId}/access-status?userId={optionalUserId}
    // This implies environmentId is mandatory path param if filtering by it.
    // If only userId is given, we might need a different endpoint or backend logic.
    // For now, let's assume if environmentId is present, we use that endpoint.
    let url = `${API_BASE_URL}/account-access`; // General endpoint, needs backend definition
    if (params.environmentId) {
        url = `${API_BASE_URL}/environments/${params.environmentId}/access-status?${queryParams.toString()}`;
    } else if(params.userId) {
        // This case needs a defined backend endpoint, e.g. /users/{userId}/account-access
        // Or the backend /account-access needs to support userId query param
         url = `${API_BASE_URL}/account-access?${queryParams.toString()}`;
    }


    const response = await fetch(url, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const accessList: AccountAccess[] = await response.json();
    // userName should be populated by backend
    return accessList;
  } catch (error) {
    console.error("Failed to fetch account access:", error);
    throw error;
  }
};


export const updateAccountAccessStatus = async (userId: string, environmentId: string, status: AccountAccessStatusValue, token?: string): Promise<AccountAccess> => {
  try {
    // PUT /api/users/{userId}/environments/{environmentId}/access-status
    const response = await fetch(`${API_BASE_URL}/users/${userId}/environments/${environmentId}/access-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const updatedAccess: AccountAccess = await response.json();
    // Logging by backend
    return updatedAccess;
  } catch (error) {
    console.error(`Failed to update account access for user ${userId} on env ${environmentId}:`, error);
    throw error;
  }
};

// Notifications
export const getNotificationsForUser = async (userId: string, token?: string): Promise<NotificationMessage[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications?userId=${userId}`, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const notifications: NotificationMessage[] = await response.json();
    return notifications.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error(`Failed to fetch notifications for user ${userId}:`, error);
    throw error;
  }
};

// addNotification is typically a backend-driven action, not directly called by client unless it's a specific use case.
// Notifications are usually created by other actions (e.g. new leave request -> notify manager).
// If client needs to create a notification (e.g. custom user alert), an endpoint would be needed.
// For now, this function might not be directly replaceable if it was for mock data generation.
// Assuming a POST /notifications endpoint if client-side creation is needed.
export const addNotification = async (data: Omit<NotificationMessage, 'id' | 'createdAt' | 'isRead'>, token?: string): Promise<NotificationMessage> => {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to add notification:", error);
        throw error;
    }
};


export const markNotificationAsRead = async (notificationId: string, token?: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
    });
    if (!response.ok) {
        if(response.status === 404) return false;
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Assuming backend returns success status or the updated notification.
    // For boolean, we can check response.ok or specific success payload.
    return true;
  } catch (error) {
    console.error(`Failed to mark notification ${notificationId} as read:`, error);
    throw error;
  }
};

// Audit Log
// logAuditEvent is purely a backend concern. Client should not directly log audits.
// Audits are typically logged by the backend upon successful completion of an action.
// This function will be removed from the client-side API service.

export const getAuditLogs = async (filters?: { userId?: string, actionType?: string, dateFrom?: string, dateTo?: string }, token?: string): Promise<AuditLogEntry[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (filters?.userId) queryParams.append('userId', filters.userId);
    if (filters?.actionType) queryParams.append('actionType', filters.actionType);
    if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);

    const response = await fetch(`${API_BASE_URL}/audit-logs?${queryParams.toString()}`, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const logs: AuditLogEntry[] = await response.json();
    return logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    throw error;
  }
};

// Reports
export const getLeaveSummaryReport = async (startDate: string, endDate: string, token?: string): Promise<any[]> => {
  try {
    const queryParams = new URLSearchParams({ startDate, endDate });
    const response = await fetch(`${API_BASE_URL}/reports/leave-summary?${queryParams.toString()}`, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch leave summary report:", error);
    throw error;
  }
};

export const getAvailabilityReport = async (teamId: ShiftTeam | 'ALL', startDate: string, endDate: string, token?: string): Promise<any[]> => {
  try {
    const queryParams = new URLSearchParams({ teamId, startDate, endDate });
    const response = await fetch(`${API_BASE_URL}/reports/availability?${queryParams.toString()}`, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch availability report:", error);
    throw error;
  }
};


// PAS Availability - Helper to get shifts for multiple users on a date
// This is more specific and might be part of a larger PAS availability check on the backend.
// GET /api/shifts?userIds={id1,id2}&date={date}
export const getShiftsForUsersOnDate = async (userIds: string[], date: string, token?: string): Promise<Shift[]> => {
    try {
        const queryParams = new URLSearchParams({ date });
        userIds.forEach(id => queryParams.append('userIds', id));

        const response = await fetch(`${API_BASE_URL}/shifts?${queryParams.toString()}`, {
            headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch shifts for users on date ${date}:`, error);
        throw error;
    }
};

// These sections were for initializing mock data in localStorage and are no longer needed.
