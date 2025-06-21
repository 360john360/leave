import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, UserRole } from '../../hooks/useAuth';
import { 
  HomeIcon, 
  CalendarDaysIcon, // Updated
  UserCircleIcon, 
  Cog8ToothIcon, // Updated
  ClipboardDocumentCheckIcon, // Updated
  UsersIcon, 
  DocumentChartBarIcon, // Updated
  ShieldCheckIcon, 
  AdjustmentsHorizontalIcon, // Updated
  ArrowsRightLeftIcon, // Updated for swaps
  BuildingOffice2Icon, // Updated
  ArchiveBoxIcon, // Updated for Audit Log
  RectangleStackIcon // Updated for Audit Log (alternative)
} from '@heroicons/react/24/outline'; // Updated import paths

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  label: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150
      ${isActive 
        ? 'bg-brand-secondary text-white shadow-sm' 
        : 'text-slate-100 hover:bg-brand-primary-hover hover:text-white'
      }`
    }
  >
    {React.cloneElement(icon, { className: 'h-5 w-5' })}
    <span>{label}</span>
  </NavLink>
);

const NavGroupLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{children}</p>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { currentUser } = useAuth();

  const handleLinkClick = () => {
    if (isOpen && window.innerWidth < 768) { // md breakpoint
        toggleSidebar();
    }
  };

  const commonLinks = [
    { to: '/dashboard', icon: <HomeIcon />, label: 'Dashboard' },
    { to: '/leave', icon: <CalendarDaysIcon />, label: 'My Leave' },
    { to: '/account-tracker', icon: <ClipboardDocumentCheckIcon />, label: 'Account Access' },
  ];

  if (currentUser?.role === UserRole.VAR_SHIFT || currentUser?.role === UserRole.VAR_BAU) {
    commonLinks.push({ to: '/shift-swaps', icon: <ArrowsRightLeftIcon />, label: 'Shift Swaps'});
  }

  const managerLinks = [
    { to: '/manager/approve-leave', icon: <ShieldCheckIcon />, label: 'Approve Leave' },
    { to: '/manager/shift-rota', icon: <AdjustmentsHorizontalIcon />, label: 'Shift Rota' },
    { to: '/manager/reports', icon: <DocumentChartBarIcon />, label: 'Reports' },
  ];

  const adminLinks = [
    { to: '/admin', icon: <UsersIcon />, label: 'Management' },
    { to: '/admin/audit-log', icon: <ArchiveBoxIcon />, label: 'Audit Log' },
  ];
  
  const profileLinks = [
      { to: '/profile', icon: <UserCircleIcon />, label: 'My Profile' },
      { to: '/settings', icon: <Cog8ToothIcon />, label: 'Settings' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}
      <aside
        className={`fixed top-0 left-0 z-40 w-60 h-full bg-brand-primary text-white flex flex-col transform ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        } md:translate-x-0 md:shadow-lg transition-transform duration-300 ease-in-out pt-16`} // pt-16 for header height
        aria-label="Main navigation"
      >
        <nav className="flex-grow p-3 space-y-1 overflow-y-auto">
          {commonLinks.map(link => <NavItem key={link.to} {...link} onClick={handleLinkClick} />)}

          {(currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN) && (
            <>
              <NavGroupLabel>Manager Tools</NavGroupLabel>
              {managerLinks.map(link => <NavItem key={link.to} {...link} onClick={handleLinkClick} />)}
            </>
          )}

          {currentUser?.role === UserRole.ADMIN && (
            <>
              <NavGroupLabel>Admin Console</NavGroupLabel>
              {adminLinks.map(link => <NavItem key={link.to} {...link} onClick={handleLinkClick} />)}
            </>
          )}
          
          <div className="pt-2"> {/* Spacer or use for bottom aligned items */}
            <NavGroupLabel>Account</NavGroupLabel>
            {profileLinks.map(link => <NavItem key={link.to} {...link} onClick={handleLinkClick} />)}
          </div>
        </nav>
        {/* Optional: Footer in sidebar */}
        {/* <div className="p-4 border-t border-brand-primary-hover">
            <p className="text-xs text-slate-300">© {new Date().getFullYear()} WFM</p>
        </div> */}
      </aside>
    </>
  );
};

export default Sidebar;