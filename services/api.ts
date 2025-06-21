import { 
  User, UserRole, ShiftTeam, 
  LeaveRequest, LeaveTypeId, LeaveRequestStatus, 
  Shift, ShiftPeriod, CalendarEvent, 
  Customer, Environment, AccountAccess, AccountAccessStatusValue,
  NotificationMessage, ShiftSwapRequest, AuditLogEntry, TeamShiftAssignment
} from '../types';
import { LEAVE_TYPES, ROLES_CONFIG, SHIFT_TEAMS_CONFIG } from '../constants';
import { generateMockId, getDaysInMonth, addDays, formatISODate } from '../utils/dateUtils';


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

// Initialize storage if empty
if (!localStorage.getItem('users')) {
  setToStorage('users', initialMockUsers);
}
if (!localStorage.getItem('customers')) {
  setToStorage('customers', initialMockCustomers);
}
if (!localStorage.getItem('environments')) {
  setToStorage('environments', initialMockEnvironments.map(env => ({
    ...env,
    customerName: initialMockCustomers.find(c => c.id === env.customerId)?.name || 'Unknown Customer'
  })));
}
if (!localStorage.getItem('leaveRequests')) {
  setToStorage('leaveRequests', []);
}
if (!localStorage.getItem('shifts')) {
  // Add some initial shifts for shift users
  const today = new Date();
  const initialShifts: Shift[] = [];
  const shiftUsers = initialMockUsers.filter(u => u.role === UserRole.VAR_SHIFT);
  
  shiftUsers.forEach((user, userIndex) => {
    for (let i = -5; i < 15; i++) { // Generate shifts for a range of days around today
        const shiftDate = addDays(today, i);
        let shiftPeriod: ShiftPeriod | 'OFF' = 'OFF';
        
        // Simple alternating shift pattern for demo
        if (user.team === ShiftTeam.A || user.team === ShiftTeam.C) { // Teams A & C
            if ((i + userIndex*2) % 8 < 4) shiftPeriod = (i % 2 === 0) ? ShiftPeriod.AM : ShiftPeriod.PM; // 4 days on
            else shiftPeriod = 'OFF'; // 4 days off
        } else if (user.team === ShiftTeam.B || user.team === ShiftTeam.D) { // Teams B & D
             if ((i + userIndex*2 + 4) % 8 < 4) shiftPeriod = (i % 2 === 0) ? ShiftPeriod.AM : ShiftPeriod.PM; // 4 days on (offset)
             else shiftPeriod = 'OFF'; // 4 days off
        }

        if (shiftPeriod !== 'OFF') {
            initialShifts.push({
                id: generateMockId(),
                date: formatISODate(shiftDate),
                userId: user.id,
                userName: user.name,
                teamId: user.team,
                shiftPeriod: shiftPeriod,
            });
        }
    }
  });
   const bauUser = initialMockUsers.find(u => u.role === UserRole.VAR_BAU);
    if(bauUser){
        for(let i = -5; i < 15; i++){
            const shiftDate = addDays(today, i);
            const dayOfWeek = shiftDate.getDay();
            if(dayOfWeek !== 0 && dayOfWeek !== 6){ // Mon-Fri
                 initialShifts.push({
                    id: generateMockId(),
                    date: formatISODate(shiftDate),
                    userId: bauUser.id,
                    userName: bauUser.name,
                    teamId: bauUser.team,
                    shiftPeriod: ShiftPeriod.AM, // BAU works AM shifts
                });
            }
        }
    }


  setToStorage('shifts', initialShifts);
}
if (!localStorage.getItem('accountAccess')) {
  // Add some initial account access for Alice on Acme Corp Prod
  const alice = initialMockUsers.find(u => u.email === 'alice@example.com');
  const acmeProd = initialMockEnvironments.find(e => e.name === 'Production' && e.customerId === 'cust1');
  if (alice && acmeProd) {
    setToStorage('accountAccess', [{
        userId: alice.id,
        userName: alice.name,
        environmentId: acmeProd.id,
        status: AccountAccessStatusValue.GRANTED,
        lastUpdatedAt: new Date().toISOString()
    }]);
  } else {
    setToStorage('accountAccess', []);
  }
}
if (!localStorage.getItem('notifications')) {
  setToStorage('notifications', []);
}
if (!localStorage.getItem('shiftSwapRequests')) {
  setToStorage('shiftSwapRequests', []);
}
if (!localStorage.getItem('auditLogs')) {
  setToStorage('auditLogs', []);
}
if (!localStorage.getItem('generatedRota')) {
  setToStorage('generatedRota', []);
}


// --- API Mock Functions ---

// Users
export const getMockUsers = async (): Promise<User[]> => {
  return new Promise(resolve => setTimeout(() => resolve(getFromStorage<User[]>('users', [])), 200));
};

export const getMockUserById = async (userId: string): Promise<User | null> => {
  const users = await getMockUsers();
  return users.find(u => u.id === userId) || null;
};

export const loginMockUser = async (email: string): Promise<User | null> => {
    const users = await getMockUsers();
    // In a real app, password would be checked.
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
};

export const addMockUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  const users = await getMockUsers();
  const newUser: User = { ...userData, id: generateMockId() };
  users.push(newUser);
  setToStorage('users', users);
  await logAuditEventMock(null, 'USER_CREATED', `Admin created user: ${newUser.name} (Role: ${ROLES_CONFIG[newUser.role].name})`);
  return newUser;
};

export const updateMockUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  let users = await getMockUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;
  const originalUser = { ...users[userIndex] };
  users[userIndex] = { ...users[userIndex], ...updates };
  setToStorage('users', users);
  await logAuditEventMock(null, 'USER_UPDATED', `Admin updated user: ${users[userIndex].name}. Changes: ${JSON.stringify(updates)}`);
  return users[userIndex];
};

// Leave Requests
export const getMockLeaveRequests = async (filters?: { userId?: string, status?: LeaveRequestStatus, teamId?: ShiftTeam }): Promise<LeaveRequest[]> => {
  let requests = getFromStorage<LeaveRequest[]>('leaveRequests', []);
  const users = await getMockUsers();

  requests = requests.map(req => ({
      ...req,
      userName: users.find(u => u.id === req.userId)?.name || 'Unknown User'
  }));

  if (filters?.userId) {
    requests = requests.filter(r => r.userId === filters.userId);
  }
  if (filters?.status) {
    requests = requests.filter(r => r.status === filters.status);
  }
  // TODO: Implement teamId filter by fetching users of that team then filtering requests by those userIds
  return new Promise(resolve => setTimeout(() => resolve(requests.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())), 200));
};

export const createMockLeaveRequest = async (requestData: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'userName'>, requesterId: string): Promise<LeaveRequest> => {
  const requests = getFromStorage<LeaveRequest[]>('leaveRequests', []);
  const requester = await getMockUserById(requesterId);
  const newRequest: LeaveRequest = {
    ...requestData,
    id: generateMockId(),
    status: LeaveRequestStatus.PENDING,
    createdAt: new Date().toISOString(),
    userName: requester?.name || 'Unknown User'
  };
  requests.push(newRequest);
  setToStorage('leaveRequests', requests);
  await logAuditEventMock(requesterId, 'LEAVE_REQUEST_CREATED', `User ${newRequest.userName} requested ${LEAVE_TYPES[newRequest.leaveTypeId].name} from ${newRequest.startDate} to ${newRequest.endDate}.`);
  // Notify manager (simplified: find first manager)
  const manager = (await getMockUsers()).find(u => u.role === UserRole.MANAGER);
  if (manager) {
    await addNotificationMock({
        userId: manager.id, // Target manager
        message: `New leave request from ${newRequest.userName} for ${LEAVE_TYPES[newRequest.leaveTypeId].name} (${newRequest.startDate} to ${newRequest.endDate}).`,
        type: 'info',
        link: `/manager/approve-leave` // Could be specific link like /manager/approve-leave?requestId=${newRequest.id}
    });
  }
  return newRequest;
};

export const updateMockLeaveRequestStatus = async (requestId: string, status: LeaveRequestStatus, managerId: string): Promise<LeaveRequest | null> => {
  const requests = getFromStorage<LeaveRequest[]>('leaveRequests', []);
  const requestIndex = requests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) return null;
  
  const updatedRequest = { ...requests[requestIndex], status, managerId };
  requests[requestIndex] = updatedRequest;
  setToStorage('leaveRequests', requests);
  
  const manager = await getMockUserById(managerId);
  await logAuditEventMock(managerId, `LEAVE_REQUEST_${status}`, `Manager ${manager?.name || 'Unknown'} ${status.toLowerCase()} leave request ID ${requestId} for ${updatedRequest.userName}.`);

  await addNotificationMock({
    userId: updatedRequest.userId,
    message: `Your leave request for ${LEAVE_TYPES[updatedRequest.leaveTypeId].name} (${updatedRequest.startDate} to ${updatedRequest.endDate}) has been ${status.toLowerCase()}.`,
    type: status === LeaveRequestStatus.APPROVED ? 'success' : (status === LeaveRequestStatus.REJECTED ? 'error' : 'info'),
    link: `/leave`
  });
  return updatedRequest;
};


// Calendar Events (combines leaves and shifts)
export const getMockCalendarEvents = async (year: number, month: number, currentUserId: string): Promise<CalendarEvent[]> => {
  const events: CalendarEvent[] = [];
  const allLeaveRequests = getFromStorage<LeaveRequest[]>('leaveRequests', []);
  const allShifts = getFromStorage<Shift[]>('shifts', []);
  const users = await getMockUsers();
  const currentUser = users.find(u => u.id === currentUserId);

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Last day of month

  // Filter leaves for the month
  const monthLeaves = allLeaveRequests.filter(lr => {
    const lrStart = new Date(lr.startDate);
    const lrEnd = new Date(lr.endDate);
    return (lrStart <= endDate && lrEnd >= startDate) && (lr.status === LeaveRequestStatus.APPROVED || lr.status === LeaveRequestStatus.PENDING);
  });

  monthLeaves.forEach(lr => {
    const user = users.find(u => u.id === lr.userId);
    const leaveTypeDetails = LEAVE_TYPES[lr.leaveTypeId];
    const titlePrefix = lr.status === LeaveRequestStatus.PENDING ? "RL: " : `${leaveTypeDetails.shortCode}: `;
    
    // Create event for each day of the leave period within the current month
    let currentDateIter = new Date(lr.startDate > startDate.toISOString() ? lr.startDate : startDate.toISOString().substring(0,10) );
    const leaveEndDate = new Date(lr.endDate < endDate.toISOString() ? lr.endDate : endDate.toISOString().substring(0,10) );

    while(currentDateIter <= leaveEndDate) {
        events.push({
            id: `leave-${lr.id}-${formatISODate(currentDateIter)}`,
            date: formatISODate(currentDateIter),
            type: 'leave',
            title: `${titlePrefix}${user?.name || 'Unknown'}`,
            color: lr.status === LeaveRequestStatus.PENDING ? 'bg-status-pending text-black' : leaveTypeDetails.color,
            userId: lr.userId,
            leaveRequest: lr,
        });
        currentDateIter = addDays(currentDateIter, 1);
    }
  });

  // Filter shifts for the month (simplified, assumes shifts are per user or per team)
  const monthShifts = allShifts.filter(s => {
    const shiftDate = new Date(s.date);
    return shiftDate >= startDate && shiftDate <= endDate;
  });

  monthShifts.forEach(s => {
    let title = '';
    let color = 'bg-gray-200';
    if(s.userId) {
        const user = users.find(u => u.id === s.userId);
        title = `${s.shiftPeriod} Shift: ${user?.name || 'Unknown'}`;
        color = s.shiftPeriod === ShiftPeriod.AM ? 'bg-shift-day text-black' : 'bg-shift-night text-white';
    } else if (s.teamId) {
        title = `${s.shiftPeriod} Shift: ${SHIFT_TEAMS_CONFIG[s.teamId]?.name || 'Unknown Team'}`;
        color = s.shiftPeriod === ShiftPeriod.AM ? 'bg-blue-100 text-blue-800' : 'bg-indigo-200 text-indigo-800';
    }
    events.push({
        id: `shift-${s.id}`,
        date: s.date,
        type: 'shift',
        title: title,
        color: color,
        userId: s.userId,
        shift: s,
    });
  });
  
  return new Promise(resolve => setTimeout(() => resolve(events), 300));
};


// Shift Rota
export const generateMockRota = async (year: number, startingTeamAOnDayShift: Date): Promise<TeamShiftAssignment[]> => {
  const rota: TeamShiftAssignment[] = [];
  // Basic 4-on/4-off logic (simplified)
  // Team A (Day), Team B (Night) for 4 days
  // Team C (Day), Team D (Night) for next 4 days
  let currentDateIter = new Date(year, 0, 1); // Start from Jan 1st of the year
  const rotaEndDate = new Date(year, 11, 31);
  
  let cycleDay = 0; // Day within the 8-day cycle (0-7)
  
  currentDateIter = new Date(startingTeamAOnDayShift);


  while (currentDateIter <= rotaEndDate) {
    let dayTeam: ShiftTeam | null = null;
    let nightTeam: ShiftTeam | null = null;

    if (cycleDay >= 0 && cycleDay <= 3) { // Days 1-4 of cycle
      dayTeam = ShiftTeam.A;
      nightTeam = ShiftTeam.B;
    } else { // Days 5-8 of cycle
      dayTeam = ShiftTeam.C;
      nightTeam = ShiftTeam.D;
    }
    
    rota.push({
      date: formatISODate(currentDateIter),
      dayShiftTeam: dayTeam,
      nightShiftTeam: nightTeam,
    });

    currentDateIter = addDays(currentDateIter, 1);
    cycleDay = (cycleDay + 1) % 8;
  }
  setToStorage('generatedRota', rota);
  await logAuditEventMock(null, 'ROTA_GENERATED', `Generated shift rota for ${year}.`);
  return rota;
};

export const getGeneratedRotaMock = async (year: number): Promise<TeamShiftAssignment[]> => {
    return getFromStorage<TeamShiftAssignment[]>('generatedRota', []);
};

// Shift Swaps
export const getMockShiftSwapRequests = async (userId: string): Promise<ShiftSwapRequest[]> => {
  const swaps = getFromStorage<ShiftSwapRequest[]>('shiftSwapRequests', []);
  const users = await getMockUsers();
  return swaps
    .filter(s => s.requesterId === userId || s.responderId === userId)
    .map(s => ({
        ...s,
        requesterName: users.find(u => u.id === s.requesterId)?.name,
        responderName: users.find(u => u.id === s.responderId)?.name,
    }))
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const createMockShiftSwapRequest = async (data: Omit<ShiftSwapRequest, 'id' | 'status' | 'createdAt' | 'requesterName' | 'responderName'>): Promise<ShiftSwapRequest> => {
  const swaps = getFromStorage<ShiftSwapRequest[]>('shiftSwapRequests', []);
  const users = await getMockUsers();
  const newSwap: ShiftSwapRequest = {
    ...data,
    id: generateMockId(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    requesterName: users.find(u => u.id === data.requesterId)?.name,
    responderName: users.find(u => u.id === data.responderId)?.name,
  };
  swaps.push(newSwap);
  setToStorage('shiftSwapRequests', swaps);
  await logAuditEventMock(data.requesterId, 'SHIFT_SWAP_REQUESTED', `User ${newSwap.requesterName} requested shift swap with ${newSwap.responderName}.`);
  await addNotificationMock({
      userId: newSwap.responderId,
      message: `${newSwap.requesterName} has requested a shift swap with you.`,
      type: 'info',
      link: `/shift-swaps?swapId=${newSwap.id}`
  });
  return newSwap;
};

export const respondMockShiftSwapRequest = async (swapId: string, responderId: string, accepted: boolean): Promise<ShiftSwapRequest | null> => {
  const swaps = getFromStorage<ShiftSwapRequest[]>('shiftSwapRequests', []);
  const swapIndex = swaps.findIndex(s => s.id === swapId && s.responderId === responderId);
  if (swapIndex === -1) return null;

  swaps[swapIndex].status = accepted ? 'ACCEPTED' : 'REJECTED';
  setToStorage('shiftSwapRequests', swaps);

  const updatedSwap = swaps[swapIndex];
  
  if (accepted) {
    let allShifts = getFromStorage<Shift[]>('shifts', []);
    const reqShiftIndex = allShifts.findIndex(s => s.id === updatedSwap.requesterShiftId);
    const resShiftIndex = allShifts.findIndex(s => s.id === updatedSwap.responderShiftId);

    if (reqShiftIndex !== -1 && resShiftIndex !== -1) {
      const tempUserId = allShifts[reqShiftIndex].userId;
      allShifts[reqShiftIndex].userId = allShifts[resShiftIndex].userId;
      allShifts[resShiftIndex].userId = tempUserId;
      const tempUserName = allShifts[reqShiftIndex].userName;
      allShifts[reqShiftIndex].userName = allShifts[resShiftIndex].userName;
      allShifts[resShiftIndex].userName = tempUserName;
      setToStorage('shifts', allShifts);
    }
  }

  await logAuditEventMock(responderId, `SHIFT_SWAP_${accepted ? 'ACCEPTED' : 'REJECTED'}`, `User ${updatedSwap.responderName} ${accepted ? 'accepted' : 'rejected'} shift swap with ${updatedSwap.requesterName}.`);
  
  await addNotificationMock({
    userId: updatedSwap.requesterId,
    message: `Your shift swap request with ${updatedSwap.responderName} was ${accepted ? 'accepted' : 'rejected'}.`,
    type: accepted ? 'success' : 'error',
    link: `/shift-swaps`
  });
  const manager = (await getMockUsers()).find(u => u.role === UserRole.MANAGER);
  if (manager && accepted) {
     await addNotificationMock({
        userId: manager.id,
        message: `Shift swap between ${updatedSwap.requesterName} and ${updatedSwap.responderName} completed.`,
        type: 'info',
    });
  }
  return updatedSwap;
};


// Customers & Environments
export const getMockCustomers = async (): Promise<Customer[]> => {
  return getFromStorage<Customer[]>('customers', []);
};

export const addMockCustomer = async (customerData: Omit<Customer, 'id'>): Promise<Customer> => {
  const customers = getFromStorage<Customer[]>('customers', []);
  const newCustomer: Customer = { ...customerData, id: generateMockId() };
  customers.push(newCustomer);
  setToStorage('customers', customers);
  await logAuditEventMock(null, 'CUSTOMER_CREATED', `Admin created customer: ${newCustomer.name}.`);
  return newCustomer;
};

export const getMockEnvironments = async (customerId?: string): Promise<Environment[]> => {
  let environments = getFromStorage<Environment[]>('environments', []);
  const customers = await getMockCustomers();
  environments = environments.map(env => ({
      ...env,
      customerName: customers.find(c => c.id === env.customerId)?.name || 'Unknown Customer'
  }));
  if (customerId) {
    return environments.filter(e => e.customerId === customerId);
  }
  return environments;
};

export const addMockEnvironment = async (envData: Omit<Environment, 'id' | 'customerName'>): Promise<Environment> => {
  const environments = getFromStorage<Environment[]>('environments', []);
  const customers = await getMockCustomers();
  const newEnv: Environment = { 
      ...envData, 
      id: generateMockId(),
      customerName: customers.find(c => c.id === envData.customerId)?.name || 'Unknown Customer'
  };
  environments.push(newEnv);
  setToStorage('environments', environments);
  await logAuditEventMock(null, 'ENVIRONMENT_CREATED', `Admin created environment: ${newEnv.name} for customer ${newEnv.customerName}.`);
  return newEnv;
};

export const updateMockEnvironment = async (envId: string, updates: Partial<Omit<Environment, 'id' | 'customerId' | 'customerName'>>): Promise<Environment | null> => {
    let environments = getFromStorage<Environment[]>('environments', []);
    const envIndex = environments.findIndex(e => e.id === envId);
    if (envIndex === -1) return null;
    environments[envIndex] = { ...environments[envIndex], ...updates };
    setToStorage('environments', environments);
    await logAuditEventMock(null, 'ENVIRONMENT_UPDATED', `Admin updated environment: ${environments[envIndex].name}. Changes: ${JSON.stringify(updates)}`);
    return environments[envIndex];
};


// Account Access
export const getMockAccountAccess = async (params: { environmentId?: string; userId?: string }): Promise<AccountAccess[]> => {
  const allAccess = getFromStorage<AccountAccess[]>('accountAccess', []);
  const users = await getMockUsers();
  let filteredAccess = allAccess;

  if (params.userId) {
    filteredAccess = filteredAccess.filter(a => a.userId === params.userId);
  }
  if (params.environmentId) {
    filteredAccess = filteredAccess.filter(a => a.environmentId === params.environmentId);
  }
  
  return filteredAccess.map(acc => ({
    ...acc,
    userName: users.find(u => u.id === acc.userId)?.name || 'Unknown User'
  }));
};


export const updateMockAccountAccessStatus = async (userId: string, environmentId: string, status: AccountAccessStatusValue): Promise<AccountAccess> => {
  let allAccess = getFromStorage<AccountAccess[]>('accountAccess', []);
  const accessIndex = allAccess.findIndex(a => a.userId === userId && a.environmentId === environmentId);
  const user = await getMockUserById(userId);
  const environment = (await getMockEnvironments()).find(e => e.id === environmentId);

  const updatedAccess: AccountAccess = {
    userId,
    userName: user?.name,
    environmentId,
    status,
    lastUpdatedAt: new Date().toISOString(),
  };

  if (accessIndex !== -1) {
    allAccess[accessIndex] = updatedAccess;
  } else {
    allAccess.push(updatedAccess);
  }
  setToStorage('accountAccess', allAccess);
  await logAuditEventMock(userId, 'ACCOUNT_ACCESS_UPDATED', `User ${user?.name} updated access for environment ${environment?.name} (${environment?.customerName}) to ${status}.`);
  return updatedAccess;
};

// Notifications
export const getNotificationsForUserMock = async (userId: string): Promise<NotificationMessage[]> => {
  const allNotifications = getFromStorage<NotificationMessage[]>('notifications', []);
  return allNotifications.filter(n => n.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addNotificationMock = async (data: Omit<NotificationMessage, 'id' | 'createdAt' | 'isRead'>): Promise<NotificationMessage> => {
  const notifications = getFromStorage<NotificationMessage[]>('notifications', []);
  const newNotification: NotificationMessage = {
    ...data,
    id: generateMockId(),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  notifications.push(newNotification);
  setToStorage('notifications', notifications);
  return newNotification;
};

export const markNotificationAsReadMock = async (notificationId: string): Promise<boolean> => {
  const notifications = getFromStorage<NotificationMessage[]>('notifications', []);
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    notifications[index].isRead = true;
    setToStorage('notifications', notifications);
    return true;
  }
  return false;
};

// Audit Log
export const logAuditEventMock = async (userId: string | null, actionType: string, details: string): Promise<AuditLogEntry> => {
  const logs = getFromStorage<AuditLogEntry[]>('auditLogs', []);
  const user = userId ? await getMockUserById(userId) : null;
  const newLog: AuditLogEntry = {
    id: generateMockId(),
    timestamp: new Date().toISOString(),
    userId: userId || undefined,
    userName: user?.name || (userId === null ? 'System' : 'Unknown User'),
    actionType,
    details,
  };
  logs.push(newLog);
  setToStorage('auditLogs', logs);
  return newLog;
};

export const getMockAuditLogs = async (filters?: { userId?: string, actionType?: string, dateFrom?: string, dateTo?: string }): Promise<AuditLogEntry[]> => {
  let logs = getFromStorage<AuditLogEntry[]>('auditLogs', []);
  if (filters?.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }
  if (filters?.actionType) {
    logs = logs.filter(log => log.actionType.toLowerCase().includes(filters.actionType!.toLowerCase()));
  }
  // TODO: Add date filters
  return logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Reports
export const getMockLeaveSummaryReport = async (startDate: string, endDate: string): Promise<any[]> => {
  // This is a complex aggregation. Mock a simplified version.
  const leaveRequests = (await getMockLeaveRequests()).filter(lr => 
    lr.status === LeaveRequestStatus.APPROVED && lr.startDate >= startDate && lr.endDate <= endDate
  );
  const users = await getMockUsers();
  
  const summary: {[userId: string]: { userName: string, totalDays: number, [leaveType: string]: number | string }} = {};

  for (const lr of leaveRequests) {
    if (!summary[lr.userId]) {
      summary[lr.userId] = { userName: users.find(u => u.id === lr.userId)?.name || 'Unknown', totalDays: 0 };
    }
    const days = (new Date(lr.endDate).getTime() - new Date(lr.startDate).getTime()) / (1000 * 3600 * 24) + 1;
    summary[lr.userId].totalDays += days;
    const leaveTypeName = LEAVE_TYPES[lr.leaveTypeId].shortCode;
    summary[lr.userId][leaveTypeName] = (summary[lr.userId][leaveTypeName] || 0) as number + days;
  }
  return Object.values(summary);
};

export const getMockAvailabilityReport = async (teamId: ShiftTeam | 'ALL', startDate: string, endDate: string): Promise<any[]> => {
    // Mock: list users and their status (On Leave, Working Shift, Available) for each day in range.
    const users = (await getMockUsers()).filter(u => teamId === 'ALL' || u.team === teamId);
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const report: any[] = [];
    
    for (let d = new Date(sDate); d <= eDate; d = addDays(d,1)) {
        const dateStr = formatISODate(d);
        for (const user of users) {
            // Check leave
            const isOnLeave = (await getMockLeaveRequests({userId: user.id, status: LeaveRequestStatus.APPROVED}))
                .some(lr => dateStr >= lr.startDate && dateStr <= lr.endDate);
            // Check shift (simplified)
            const shift = getFromStorage<Shift[]>('shifts', [])
                .find(s => s.userId === user.id && s.date === dateStr);

            let status = 'Available';
            if (isOnLeave) status = 'On Leave';
            else if (shift) status = `Working Shift (${shift.shiftPeriod})`;
            // Could add BAU working hours check here too

            report.push({ date: dateStr, userName: user.name, team: SHIFT_TEAMS_CONFIG[user.team]?.name, status });
        }
    }
    return report;
};


// PAS Availability - Helper to get shifts for multiple users on a date
export const getShiftsForUsersOnDate = async (userIds: string[], date: string): Promise<Shift[]> => {
    const allShifts = getFromStorage<Shift[]>('shifts', []);
    return allShifts.filter(shift => userIds.includes(shift.userId!) && shift.date === date);
};

// Initial data load for notifications as an example
if (getFromStorage<NotificationMessage[]>('notifications', []).length === 0) {
    const adminUser = initialMockUsers.find(u => u.role === UserRole.ADMIN);
    if (adminUser) {
        addNotificationMock({
            userId: adminUser.id,
            message: 'Welcome to the Workforce Management System! Set up your teams and users.',
            type: 'info',
            link: '/admin'
        });
    }
}
// Ensure environments have customerName populated from initial customers on first load.
const storedEnvironments = getFromStorage<Environment[]>('environments', []);
if (storedEnvironments.length > 0 && !storedEnvironments[0].customerName) {
    const customers = getFromStorage<Customer[]>('customers', initialMockCustomers);
    const updatedEnvironments = storedEnvironments.map(env => ({
        ...env,
        customerName: customers.find(c => c.id === env.customerId)?.name || 'Unknown Customer'
    }));
    setToStorage('environments', updatedEnvironments);
}

// Ensure accountAccess has userName populated for existing entries if not already.
const storedAccountAccess = getFromStorage<AccountAccess[]>('accountAccess', []);
if (storedAccountAccess.length > 0 && !storedAccountAccess[0].userName) {
    const users = getFromStorage<User[]>('users', initialMockUsers);
    const updatedAccess = storedAccountAccess.map(acc => {
        if (!acc.userName) {
            return {
                ...acc,
                userName: users.find(u => u.id === acc.userId)?.name || 'Unknown User'
            };
        }
        return acc;
    });
    setToStorage('accountAccess', updatedAccess);
}
