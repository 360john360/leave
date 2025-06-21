
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBell from '../NotificationBell';
import { APP_NAME, ROLES_CONFIG } from '../../constants';
import { Bars3Icon, UserCircleIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, Cog8ToothIcon, IdentificationIcon } from '@heroicons/react/24/outline'; // Updated import path

interface HeaderProps {
  toggleSidebar: () => void;
}

const UserSwitcher: React.FC = () => {
    const { currentUser, switchUser, allUsers, loading } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState(currentUser?.id || '');

    React.useEffect(() => {
        if (currentUser) {
            setSelectedUserId(currentUser.id);
        }
    }, [currentUser]);

    const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = event.target.value;
        setSelectedUserId(userId);
        if (userId) {
            switchUser(userId);
        }
    };

    if (loading || !allUsers.length) return null;

    return (
        <div className="relative ml-4">
            <select
                value={selectedUserId}
                onChange={handleUserChange}
                className="py-1.5 pl-3 pr-8 text-xs bg-brand-secondary text-white rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-brand-accent border border-transparent hover:bg-brand-secondary-hover"
                aria-label="Switch user"
            >
                {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                        {user.name} ({ROLES_CONFIG[user.role].name})
                    </option>
                ))}
            </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
                <ChevronDownIcon className="h-3 w-3" />
            </div>
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setProfileDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white text-brand-text p-3 shadow-md flex items-center justify-between fixed top-0 left-0 right-0 z-40 h-16 border-b border-brand-border">
      <div className="flex items-center">
        <button 
            onClick={toggleSidebar} 
            className="mr-3 p-2 rounded-full text-brand-text-secondary hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary md:hidden"
            aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <Link to="/dashboard" className="text-xl font-semibold text-brand-primary hover:opacity-80 transition-opacity">
          {APP_NAME}
        </Link>
        {process.env.NODE_ENV === 'development' && <UserSwitcher />} 
      </div>
      <div className="flex items-center space-x-3 sm:space-x-4">
        <NotificationBell />
        {currentUser && (
          <div className="relative" ref={profileDropdownRef}>
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-expanded={profileDropdownOpen}
              aria-haspopup="true"
              aria-label="User menu"
            >
              {currentUser.name.split(' ').map(n=>n[0]).join('').toUpperCase() || <UserCircleIcon className="h-8 w-8 text-brand-secondary"/>}
              <span className="hidden sm:inline text-sm font-medium">{currentUser.name}</span>
              <ChevronDownIcon className={`h-4 w-4 text-brand-text-secondary transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50 origin-top-right"
                role="menu" 
                aria-orientation="vertical" 
                aria-labelledby="user-menu-button"
              >
                <div className="px-4 py-3 border-b border-brand-border">
                    <p className="text-sm font-semibold text-brand-text" role="none">{currentUser.name}</p>
                    <p className="text-xs text-brand-text-secondary" role="none">{ROLES_CONFIG[currentUser.role].name}</p>
                </div>
                <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-brand-text hover:bg-slate-100 w-full" role="menuitem" onClick={() => setProfileDropdownOpen(false)}>
                    <IdentificationIcon className="h-5 w-5 mr-2 text-brand-text-secondary" /> My Profile
                </Link>
                <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-brand-text hover:bg-slate-100 w-full" role="menuitem" onClick={() => setProfileDropdownOpen(false)}>
                    <Cog8ToothIcon className="h-5 w-5 mr-2 text-brand-text-secondary" /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-brand-error hover:bg-slate-100"
                  role="menuitem"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
