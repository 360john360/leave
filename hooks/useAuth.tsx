
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, ShiftTeam } from '../types';
import { getMockUsers, loginMockUser, getMockUserById } from '../services/api'; // Assuming you'll have these in api.ts

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>; // Pass is unused for mock
  logout: () => void;
  // For demo: function to switch user
  switchUser: (userId: string) => Promise<void>; 
  allUsers: User[]; // For user switching demo
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const initializeAuth = useCallback(async () => {
    setLoading(true);
    try {
      const users = await getMockUsers(); // Fetch all mock users
      setAllUsers(users);

      const storedUserId = localStorage.getItem('currentUser');
      if (storedUserId && users.find(u => u.id === storedUserId)) {
        const user = await getMockUserById(storedUserId);
        setCurrentUser(user);
      } else if (users.length > 0) {
        // Default to the first user if no stored user or stored user is invalid
        // For a real app, this would be a redirect to login
        setCurrentUser(users[0]); 
        localStorage.setItem('currentUser', users[0].id);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      // Handle error, maybe clear localStorage
      localStorage.removeItem('currentUser');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email: string, _pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      // In a real app, _pass would be used. Here, we find by email.
      const user = await loginMockUser(email); // loginMockUser should find user by email
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('currentUser', user.id);
        return user;
      }
      return null;
    } catch (error) {
      console.error("Login failed:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    // In a real app, navigate to login page
    // window.location.hash = '/login'; // Or use useNavigate if available here
  };

  const switchUser = async (userId: string) => {
    setLoading(true);
    try {
        const userToSwitch = allUsers.find(u => u.id === userId);
        if (userToSwitch) {
            setCurrentUser(userToSwitch);
            localStorage.setItem('currentUser', userToSwitch.id);
        } else {
            console.warn(`User with id ${userId} not found for switching.`);
        }
    } catch (error) {
        console.error("Error switching user:", error);
    } finally {
        setLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, switchUser, allUsers }}>
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
