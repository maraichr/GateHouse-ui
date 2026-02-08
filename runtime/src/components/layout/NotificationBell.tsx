import { useState } from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  count?: number;
}

export function NotificationBell({ count = 0 }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        aria-label={count > 0 ? `Notifications (${count} unread)` : 'Notifications'}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-white rounded-lg shadow-lg border border-gray-200" role="menu">
            <div className="p-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700">Notifications</h4>
            </div>
            <div className="p-4 text-sm text-gray-400 text-center">
              No new notifications
            </div>
          </div>
        </>
      )}
    </div>
  );
}
