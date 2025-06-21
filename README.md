
# Workforce Management System

## Overview

This project is a full-stack Workforce Management System designed to replace manual, spreadsheet-driven processes with a streamlined web platform. It integrates leave management, shift scheduling, account access tracking, and team coordination into one application. The goal is to eliminate the inefficiencies of Excel-based schedules, providing real-time visibility into team availability and automating routine tasks.

This frontend application is built with React, TypeScript, and Tailwind CSS. It features mocked API calls to simulate backend interactions, allowing for full UI and workflow testing.

## Features

*   **Calendar & Team Availability View:** Color-coded display of team schedules, leaves, and shifts.
*   **Leave Request & Approval Workflow:** Employees request leave; managers approve/reject.
*   **Shift Rota Generation:** Automated 4-on/4-off shift rota generation for shift teams.
*   **Shift Swap Functionality:** Engineers can request and accept shift swaps.
*   **Environment Account Access Tracker:** 
    *   Engineers can view and update their own access status.
    *   Managers/Admins can view team-wide access status for specific environments.
    *   PAS (Coordinators) have a dedicated view to check engineer availability based on leave, account access, and shift status for a selected customer, environment, date, and time.
*   **Admin Management Console:** Manage users, customers, and environments.
*   **Notifications & Alerts:** In-app notifications for key events.
*   **User Profile Pages:** View user information and shift patterns.
*   **User Settings & Preferences:** Manage personal settings like password and notification preferences.
*   **Reporting and Exports:** Generate and export reports (e.g., leave summary, availability).
*   **Audit Logging:** Track key actions within the system.
*   **Responsive Design:** Accessible on desktops, tablets, and smartphones.

## User Roles

*   **VAR Members (Engineers):**
    *   BAU Engineers: Standard business hours.
    *   Shift Engineers: 4-on/4-off rotating schedule (Teams A-D).
    *   Permissions: View team calendar, request leave, update own environment account access, request/respond to shift swaps.
*   **PAS Members (Coordinators):**
    *   Permissions: View all calendars, request leave for themselves, use the advanced Account Access Tracker to check engineer availability for specific customer environments, dates, and times.
*   **Managers:**
    *   Permissions: Approve/reject leave, generate rota, monitor swaps, view all availability, access reports, view team account access.
*   **Administrators (Admin Role):**
    *   Permissions: Global settings, manage customers/environments, user accounts, review audit log, view team account access.

## Getting Started

### Prerequisites

*   Node.js (v16 or later)
*   npm or yarn

### Installation & Running

1.  **Clone the repository (or extract the provided files).**
2.  **Navigate to the project directory:**
    ```bash
    cd workforce-management-system
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    # OR
    # yarn install
    ```
4.  **Set up Environment Variables (Optional - for Gemini API if used):**
    If you were to integrate Gemini API features (not part of the current core system but for future extension), you would need an API key. Create a `.env` file in the root of your project and add your API key:
    ```
    REACT_APP_GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
    The application code would then access it via `process.env.REACT_APP_GEMINI_API_KEY`.
    **Note:** For the current application version, this step is not strictly necessary as it primarily uses mocked data and does not call external AI services.

5.  **Start the development server:**
    ```bash
    npm start
    # OR
    # yarn start
    ```
    This will open the application in your default web browser, usually at `http://localhost:3000`.

## Connecting to a Backend (e.g., SQLite)

The current version of this application uses a mock API implemented in `src/services/api.ts`. This file simulates backend responses and uses `localStorage` for some persistence during a browser session. To connect this frontend to a real backend (e.g., one using a SQLite database), you will need to replace these mock functions with actual API calls.

### 1. Backend Development

You'll need to create a backend server (e.g., using Node.js with Express, Python with Flask/Django, or any other preferred stack) that exposes RESTful API endpoints. This backend will interact with your SQLite database.

**Suggested Data Models for SQLite Tables:**

*   **Users:** `id` (PK), `name`, `email`, `password_hash`, `role` (TEXT, e.g., 'VAR_SHIFT', 'VAR_BAU', 'PAS', 'MANAGER', 'ADMIN'), `team` (TEXT, e.g., 'A', 'B', 'C', 'D', 'BAU'), `is_active` (BOOLEAN).
*   **Customers:** `id` (PK), `name`.
*   **Environments:** `id` (PK), `customer_id` (FK to Customers), `name`, `request_instructions` (TEXT).
*   **AccountAccess:** `id` (PK), `user_id` (FK to Users), `environment_id` (FK to Environments), `status` (TEXT, e.g., 'NONE', 'REQUESTED', 'GRANTED'), `last_updated_at` (DATETIME).
*   **LeaveRequests:** `id` (PK), `user_id` (FK to Users), `leave_type` (TEXT, e.g., 'ANNUAL', 'SICK', 'TRAINING'), `start_date` (DATE), `end_date` (DATE), `is_half_day` (BOOLEAN), `half_day_period` (TEXT, e.g., 'AM', 'PM', NULL), `reason` (TEXT), `status` (TEXT, e.g., 'PENDING', 'APPROVED', 'REJECTED'), `manager_id` (FK to Users, nullable), `approved_at` (DATETIME, nullable), `created_at` (DATETIME).
*   **Shifts:** `id` (PK), `user_id` (FK to Users, nullable), `team_id` (TEXT, nullable, e.g., 'A', 'B'), `date` (DATE), `shift_type` (TEXT, e.g., 'DAY', 'NIGHT', 'OFF', 'BAU_DAY'), `start_time` (TIME, e.g., '07:00:00'), `end_time` (TIME, e.g., '19:00:00'), `original_user_id` (FK to Users, nullable, for swaps).
    *   **Note for Shifts Table:** For accurate time-based availability checking (especially for the PAS view), `start_time` and `end_time` columns are crucial. The current mock uses `shiftPeriod` ('AM'/'PM') as a proxy.
*   **ShiftSwaps:** `id` (PK), `requester_id` (FK to Users), `responder_id` (FK to Users), `requester_shift_id` (FK to Shifts), `responder_shift_id` (FK to Shifts), `status` (TEXT, e.g., 'PENDING', 'ACCEPTED', 'REJECTED'), `reason` (TEXT, nullable), `created_at` (DATETIME).
*   **Notifications:** `id` (PK), `user_id` (FK to Users), `message` (TEXT), `is_read` (BOOLEAN), `link` (TEXT, nullable), `created_at` (DATETIME).
*   **AuditLogs:** `id` (PK), `user_id` (FK to Users, nullable), `action_type` (TEXT), `details` (TEXT), `timestamp` (DATETIME).

### 2. API Endpoints

Your backend should expose endpoints corresponding to the placeholder functions in `src/services/api.ts`. Here are some examples:

*   **Authentication (Example):**
    *   `POST /api/auth/login`
    *   `GET /api/auth/me` (to get current user)
*   **Users:**
    *   `GET /api/users`
    *   `GET /api/users/{userId}`
    *   `POST /api/users`
    *   `PUT /api/users/{userId}`
*   **Leave Requests:**
    *   `GET /api/leave-requests?userId={userId}&teamId={teamId}&status={status}`
    *   `POST /api/leave-requests`
    *   `PUT /api/leave-requests/{requestId}/status` (for approval/rejection)
*   **Calendar/Shifts:**
    *   `GET /api/calendar-events?teamId={teamId}&startDate={startDate}&endDate={endDate}` (This endpoint would aggregate leaves and shifts)
    *   `GET /api/shifts?userIds={id1,id2}&date={date}` (More specific for fetching shifts for multiple users on a date, used by PAS mock)
    *   `POST /api/rota/generate`
*   **Shift Swaps:**
    *   `GET /api/shift-swaps?userId={userId}`
    *   `POST /api/shift-swaps`
    *   `PUT /api/shift-swaps/{swapId}/respond`
*   **Customers & Environments:**
    *   `GET /api/customers`
    *   `POST /api/customers`
    *   `GET /api/customers/{customerId}/environments`
    *   `POST /api/customers/{customerId}/environments`
    *   `PUT /api/environments/{environmentId}`
*   **Account Access:**
    *   `GET /api/environments/{environmentId}/access-status?userId={optionalUserId}` (Can fetch for all or specific user)
    *   `PUT /api/users/{userId}/environments/{environmentId}/access-status`
    *   **PAS Availability Check Endpoint (Recommended for Backend):**
        *   `GET /api/pas/availability?customerId={id}&environmentId={id}&dateTime={isoDateTimeString}`
        *   This endpoint would perform the complex logic of checking leave, account access, and shift status for all relevant engineers, returning a consolidated availability list. The current frontend mock simulates this by making multiple calls.
*   **Notifications:**
    *   `GET /api/notifications?userId={userId}`
    *   `PUT /api/notifications/{notificationId}/read`
*   **Audit Logs:**
    *   `GET /api/audit-logs?userId={userId}&actionType={actionType}`
*   **Reports:**
    *   `GET /api/reports/leave-summary?startDate={startDate}&endDate={endDate}`
    *   `GET /api/reports/availability?teamId={teamId}&startDate={startDate}&endDate={endDate}`

### 3. Modifying Frontend API Calls

Open `src/services/api.ts`. For each mock function, you'll replace its implementation:

**Current Mock (Example):**
```typescript
// src/services/api.ts
export const getMockUsers = async (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      resolve(users);
    }, 500);
  });
};
```

**New Implementation with `fetch` (Example):**
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:8000/api'; // Your backend URL

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
    throw error; // Or handle more gracefully
  }
};
```

You will need to:
1.  Define your `API_BASE_URL`.
2.  Update each function to use `fetch` (or a library like `axios`) to call the corresponding backend endpoint.
3.  Handle request methods (GET, POST, PUT, DELETE), headers (e.g., `Content-Type: application/json`, Authorization tokens), and request bodies appropriately.
4.  Implement error handling for API calls.
5.  Ensure data types match between frontend (`src/types.ts`) and backend responses.

### 4. Authentication

The mock authentication is handled in `src/hooks/useAuth.tsx`. You'll need to integrate this with your backend's authentication system (e.g., JWT tokens).
*   On login, store the token (e.g., in `localStorage`).
*   Include the token in the `Authorization` header for protected API calls.
*   Implement logout functionality to clear the token.
*   The `useAuth` hook should be updated to check token validity and fetch user details from a `/api/auth/me` endpoint.

By following these steps, you can transition the frontend from using mock data to interacting with your live SQLite-powered backend. The modular design of the services layer (`src/services/api.ts`) is intended to make this transition straightforward.

## Project Structure

*   `public/`: Contains `index.html` and static assets.
*   `src/`: Contains the application's source code.
    *   `App.tsx`: Main application component, sets up routing.
    *   `index.tsx`: Entry point of the React application.
    *   `types.ts`: TypeScript type definitions for the application.
    *   `constants.ts`: Global constants (roles, leave types, etc.).
    *   `components/`: Reusable UI components.
        *   `common/`: Basic reusable UI elements (Button, Modal, Table, etc.).
        *   `layout/`: Layout components (Header, Sidebar, etc.).
        *   `admin/`: Components specific to the Admin section.
        *   Specific feature components (CalendarView, LeaveRequestForm, etc.).
    *   `pages/`: Top-level page components corresponding to routes.
    *   `hooks/`: Custom React hooks (e.g., `useAuth`, `useNotifications`).
    *   `services/`:
        *   `api.ts`: Mock API service for backend interactions.
        *   `rotaService.ts`: Logic for shift rota generation (currently used by mock, but designed for backend logic).
    *   `utils/`: Utility functions.

## Contributing

This is a blueprint application. Feel free to expand upon it. Pull requests are welcome if this were an open-source project. For now, use this as a starting point for your development.

## License

This project is provided as a blueprint. Refer to any specific licensing if this code is part of a larger distribution.
