
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { BellIcon, CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'; // Solid for unread indicator
import { CheckCircleIcon as CheckCircleIconOutline } from '@heroicons/react/24/outline'; // Outline for mark as read
import { Link } from 'react-router-dom';
import { parseISODate } from '../utils/dateUtils'; 

const TimeAgo: React.FC<{ dateString: string }> = ({ dateString }) => {
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        const date = parseISODate(dateString);
        const now = new Date();
        const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
        
        if (seconds < 5) {
            setTimeAgo('just now');
            return;
        }
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);

        if (seconds < 60) setTimeAgo(`${seconds}s ago`);
        else if (minutes < 60) setTimeAgo(`${minutes}m ago`);
        else if (hours < 24) setTimeAgo(`${hours}h ago`);
        else if (days === 1) setTimeAgo(`yesterday`);
        else if (days < 7) setTimeAgo(`${days}d ago`);
        else setTimeAgo(date.toLocaleDateString());
        
    }, [dateString]);
    return <span className="text-xs text-brand-text-secondary">{timeAgo}</span>;
};


const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    markAsRead(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full text-brand-text-secondary hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 block h-2.5 w-2.5 transform rounded-full bg-brand-error ring-2 ring-white">
            <span className="sr-only">{unreadCount} unread notifications</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div 
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 origin-top-right"
            role="dialog"
            aria-modal="false" 
        >
          <div className="py-2.5 px-3.5 border-b border-brand-border flex justify-between items-center">
            <h3 className="text-base font-semibold text-brand-text">Notifications</h3>
            {notifications.length > 0 && unreadCount > 0 && (
                 <button onClick={handleMarkAllAsRead} className="text-xs font-medium text-brand-primary hover:underline focus:outline-none">Mark all as read</button>
            )}
          </div>
          {loading ? (
             <div className="p-6 text-center text-sm text-brand-text-secondary">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-brand-text-secondary">No new notifications.</div>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-brand-border">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`p-3 group hover:bg-slate-50 ${!notification.isRead ? 'bg-sky-50' : ''}`}
                >
                  <Link 
                    to={notification.link || '#'} 
                    onClick={() => { 
                        if (!notification.isRead) markAsRead(notification.id); 
                        setIsOpen(false);
                    }} 
                    className="block"
                  >
                    <div className="flex justify-between items-start space-x-2">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-brand-text' : 'text-brand-text-secondary'}`}>
                            {notification.message}
                        </p>
                        {!notification.isRead && (
                            <button 
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                title="Mark as read"
                                className="ml-2 text-brand-secondary hover:text-brand-primary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                aria-label="Mark notification as read"
                            >
                                <CheckCircleIconOutline className="h-5 w-5"/>
                            </button>
                        )}
                         {notification.isRead && (
                             <CheckCircleIconSolid className="h-4 w-4 text-brand-success flex-shrink-0" />
                         )}
                    </div>
                    <TimeAgo dateString={notification.createdAt} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
           {notifications.length > 0 && (
             <div className="p-2 text-center border-t border-brand-border">
                {/* Could add a "View All Notifications" link here if there's a dedicated page */}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
