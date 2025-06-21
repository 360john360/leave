import React from 'react';
import CalendarView from '../components/CalendarView';
import { useAuth, UserRole } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { ArrowPathIcon, CalendarDaysIcon, CheckBadgeIcon, UserGroupIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'; // Updated icons

interface QuickActionCardProps {
    title: string;
    to: string;
    icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
    description: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, to, icon, description }) => (
    <Link to={to} className="block group">
        <div className="bg-white hover:shadow-xl transition-shadow duration-200 rounded-lg p-5 border border-brand-border h-full flex flex-col">
            <div className="flex items-center text-brand-primary mb-2">
                {React.cloneElement(icon, { className: 'h-7 w-7 mr-3 group-hover:scale-110 transition-transform' })}
                <h3 className="text-lg font-semibold text-brand-text group-hover:text-brand-primary">{title}</h3>
            </div>
            <p className="text-sm text-brand-text-secondary flex-grow">{description}</p>
            <span className="mt-3 text-xs text-brand-primary font-medium group-hover:underline self-start">
                Go to {title.toLowerCase()} &rarr;
            </span>
        </div>
    </Link>
);


const CalendarLegend: React.FC = () => (
    <div className="mb-4 p-3 border border-brand-border rounded-md bg-slate-50 text-xs">
        <h3 className="text-xs font-semibold text-brand-text mb-1.5">Calendar Legend:</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-status-pending mr-1.5 ring-1 ring-inset ring-amber-600/10"></span>Requested Leave</span>
            <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-leave-annual mr-1.5 ring-1 ring-inset ring-green-600/10"></span>Approved Annual</span>
            <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-leave-sick mr-1.5 ring-1 ring-inset ring-red-600/10"></span>Sick Leave</span>
            <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-shift-day mr-1.5 ring-1 ring-inset ring-amber-600/20"></span>AM Shift</span>
            <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-shift-night mr-1.5 ring-1 ring-inset ring-gray-600/20"></span>PM Shift</span>
            {/* Add more key legend items if needed */}
        </div>
    </div>
);


const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg rounded-lg p-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {currentUser?.name}!</h1>
        <p className="mt-1 text-sm sm:text-base opacity-90">Here's your overview for today. Let's make it a productive one.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <QuickActionCard 
            title="Request Leave" 
            to="/leave" 
            icon={<CalendarDaysIcon />}
            description="Submit new leave requests or view your existing applications."
        />
        <QuickActionCard 
            title="Account Access" 
            to="/account-tracker" 
            icon={<CheckBadgeIcon />}
            description="Track and update your access status for various environments."
        />
        {(currentUser?.role.toString().startsWith('VAR')) && 
            <QuickActionCard 
                title="Shift Swaps" 
                to="/shift-swaps" 
                icon={<ArrowsRightLeftIcon />}
                description="Manage or request shift swaps with your colleagues."
            />
        }
      </div>
      
      <div className="bg-white shadow-xl rounded-lg border border-brand-border">
        <div className="p-4 sm:p-5 border-b border-brand-border">
            <h2 className="text-xl font-semibold text-brand-text">Team Availability Calendar</h2>
            <p className="text-sm text-brand-text-secondary mt-0.5">View upcoming shifts, approved leaves, and pending requests for your team.</p>
        </div>
        <div className="p-4 sm:p-5">
            <CalendarLegend />
            <CalendarView />
        </div>
      </div>
      
      {/* Example of another potential section */}
      {/* <div className="bg-white shadow-xl rounded-lg p-6 border border-brand-border">
        <h2 className="text-xl font-semibold text-brand-text mb-3">Pending Tasks</h2>
        <p className="text-brand-text-secondary">You have 2 pending leave approvals.</p>
        <Button variant="secondary" size="sm" className="mt-3">View Tasks</Button>
      </div> */}

    </div>
  );
};

export default DashboardPage;