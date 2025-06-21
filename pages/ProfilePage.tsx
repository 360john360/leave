import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ROLES_CONFIG, SHIFT_TEAMS_CONFIG } from '../constants';
import { UserCircleIcon, BriefcaseIcon, UserGroupIcon, ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface ProfileDetailItemProps {
    label: string;
    value: React.ReactNode;
    icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
}

const ProfileDetailItem: React.FC<ProfileDetailItemProps> = ({ label, value, icon }) => (
    <div>
        <dt className="flex items-center text-sm font-medium text-brand-text-secondary mb-0.5">
            {React.cloneElement(icon, { className: 'h-4 w-4 mr-1.5 flex-shrink-0' })}
            {label}
        </dt>
        <dd className="text-sm sm:text-base text-brand-text">{value}</dd>
    </div>
);

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
        <div className="flex justify-center items-center h-full p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
            <span className="ml-3 text-brand-text-secondary">Loading profile...</span>
        </div>
    );
  }

  const initials = currentUser.name.split(' ').map(n=>n[0]).join('').toUpperCase();

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">My Profile</h1>
        <p className="mt-1 text-sm text-brand-text-secondary">View your personal information and work details.</p>
      </div>
      
      <div className="bg-white shadow-xl rounded-lg border border-brand-border overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-5 sm:space-y-0 sm:space-x-6">
            <div className="flex-shrink-0">
                <div className="h-24 w-24 sm:h-28 sm:w-28 bg-brand-primary text-white rounded-full flex items-center justify-center text-3xl sm:text-4xl font-semibold shadow-md">
                    {initials || <UserCircleIcon className="h-16 w-16" />}
                </div>
            </div>
            <div className="flex-grow space-y-1 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-text">{currentUser.name}</h2>
              <div className="flex items-center justify-center sm:justify-start text-sm text-brand-text-secondary">
                  <EnvelopeIcon className="h-4 w-4 mr-1.5" />
                  <span>{currentUser.email}</span>
              </div>
            </div>
            {/* Future: Edit Profile Button
            <Button variant="secondary" size="sm" className="sm:ml-auto">
                Edit Profile
            </Button> */}
          </div>
        </div>

        <div className="border-t border-brand-border p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-brand-text mb-4">Work Details</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <ProfileDetailItem label="Role" value={ROLES_CONFIG[currentUser.role]?.name || currentUser.role} icon={<BriefcaseIcon />} />
                <ProfileDetailItem label="Team" value={SHIFT_TEAMS_CONFIG[currentUser.team]?.name || currentUser.team} icon={<UserGroupIcon />} />
                
                {currentUser.role.toString().startsWith('VAR_SHIFT') && (
                    <ProfileDetailItem 
                        label="Shift Pattern" 
                        value={`4-on / 4-off Rotation (${SHIFT_TEAMS_CONFIG[currentUser.team]?.name})`}
                        icon={<ClockIcon />} 
                    />
                )}
                 {currentUser.role.toString() === 'VAR_BAU' && (
                    <ProfileDetailItem 
                        label="Work Pattern" 
                        value="Standard Business Hours (Mon-Fri)" 
                        icon={<ClockIcon />}
                    />
                )}
            </dl>
        </div>
      </div>
      
      {/* Placeholder for future detailed sections like "Leave Entitlement" or "Performance" */}
      {/* <div className="bg-white shadow-xl rounded-lg border border-brand-border p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-brand-text mb-3">Leave Entitlement</h3>
            <p className="text-brand-text-secondary text-sm">Annual Leave Remaining: 15 days</p>
            <p className="text-brand-text-secondary text-sm">Sick Leave Taken (Year): 2 days</p>
        </div> */}
    </div>
  );
};

export default ProfilePage;