
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, ShiftTeam } from '../types';
// Updated imports from services/api.ts
import { loginUser, getUserById, getUsers } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  token: string | null; // Added to store auth token
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
  getToken: () => string | null; // Utility to get current token
  // switchUser and allUsers might be deprecated or changed depending on how user management is handled with a real backend
  switchUser: (userId: string) => Promise<void>; 
  allUsers: User[]; // For user switching demo - might need re-evaluation
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'authToken';
const USER_ID_KEY = 'currentUserId'; // To store user ID separately from token if needed

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [allUsers, setAllUsers] = useState<User[]>([]); // This might be removed or fetched differently
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = useCallback(async (userId: string, userToken: string) => {
    try {
      // Prefer a /api/auth/me endpoint that uses the token implicitly
      // For now, using getUserById as a placeholder if /me is not available
      // Backend should ideally have an endpoint like /api/auth/me to get current user from token
      const user = await getUserById(userId, userToken);
      setCurrentUser(user);
      if (user) localStorage.setItem(USER_ID_KEY, user.id);
      else throw new Error("User not found with stored ID");
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    setLoading(true);
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUserId = localStorage.getItem(USER_ID_KEY); // Or get from token payload if JWT

    if (storedToken && storedUserId) {
      setToken(storedToken);
      await fetchUserDetails(storedUserId, storedToken);
    } else {
        // For development, could fetch all users for the switcher.
        // In production, this is usually not done; user switching is an admin feature or not present.
        try {
            const users = await getUsers(); // No token needed if this is a public/admin endpoint
            setAllUsers(users);
        } catch (error) {
            console.error("Failed to fetch initial user list for switcher:", error);
        }
    }
    setLoading(false);
  }, [fetchUserDetails]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      // loginUser from api.ts should ideally return { user: User, token: string }
      // For now, assuming it returns User and we handle token separately or it's included.
      // This part needs to align with what your backend's /api/auth/login returns.
      // Let's assume loginUser returns an object like { user: User, token: string }

      // const loginResponse = await loginUser(email, pass); // This is the actual call
      // For the purpose of this exercise, let's assume loginUser is modified or we have a wrapper:

      // Mocking the backend response structure for now
      const backendLoginUser = async (emailVal: string, passwordVal: string): Promise<{user: User, token: string} | null> => {
          const userAttempt = await loginUser(emailVal, passwordVal); // This calls the actual /api/auth/login
          if (userAttempt) {
              // If loginUser only returns User, generate/retrieve token some other way or expect it in user object
              // For this example, let's assume a dummy token is generated or part of userAttempt for now
              // In a real scenario, the backend sends the token.
              const dummyToken = `fake-token-for-${userAttempt.id}`;
              return { user: userAttempt, token: userAttempt.token || dummyToken }; // Prefer userAttempt.token if backend provides
          }
          return null;
      }

      const response = await backendLoginUser(email, pass);

      if (response && response.user && response.token) {
        setCurrentUser(response.user);
        setToken(response.token);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_ID_KEY, response.user.id);
        // Optionally, fetch all users again if needed for the switcher
        // const users = await getUsers(response.token);
        // setAllUsers(users);
        return response.user;
      }
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
      return null;
    } catch (error) {
      console.error("Login failed:", error);
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    // In a real app, navigate to login page
    // window.location.hash = '/login';
  };

  const getToken = (): string | null => {
    return token || localStorage.getItem(TOKEN_KEY);
  }

  // switchUser needs to be re-evaluated.
  // If it's a dev tool, it might just refetch a user by ID without real auth.
  // If it's a feature, it needs proper backend support (e.g. admin impersonation).
  const switchUser = async (userId: string) => {
    setLoading(true);
    const currentToken = getToken(); // Use current token for fetching
    if (!currentToken) {
        console.warn("No token available for switching user. Please log in.");
        setLoading(false);
        return;
    }
    try {
        // This assumes getUsers returns all users and is accessible.
        // Or, if allUsers state is populated, use that.
        // For simplicity, refetching user by ID.
        const userToSwitch = await getUserById(userId, currentToken);
        if (userToSwitch) {
            setCurrentUser(userToSwitch);
            localStorage.setItem(USER_ID_KEY, userToSwitch.id); // Keep same token, just switch user context for demo
        } else {
            console.warn(`User with id ${userId} not found for switching.`);
        }
    } catch (error) {
        console.error("Error switching user:", error);
    } finally {
        setLoading(false);
    }
  };

  // Fetch allUsers for the switcher demo - consider if this is needed in production
  useEffect(() => {
    const fetchAllUsersForSwitcher = async () => {
      const currentToken = getToken();
      if (currentToken && allUsers.length === 0) { // Only fetch if token exists and not already fetched
        try {
          // This assumes getUsers can be called (e.g. by an admin)
          // Or it's a public list for demo purposes
          const users = await getUsers(currentToken);
          setAllUsers(users);
        } catch (error) {
          console.error("Failed to fetch user list for switcher:", error);
        }
      }
    };
    if (!loading && token) { // Fetch after initial auth load and if logged in
       // fetchAllUsersForSwitcher(); // Uncomment if switcher is a key feature and needs fresh data
    }
  }, [loading, token, allUsers.length]);


  return (
    <AuthContext.Provider value={{ currentUser, token, loading, login, logout, getToken, switchUser, allUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Re-export UserRole and ShiftTeam for convenience if they are defined here or imported from types.ts
export { UserRole, ShiftTeam };
