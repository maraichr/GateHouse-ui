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
        className="relative p-2 rounded-lg transition-colors"
        style={{ color: 'var(--color-text-faint)' }}
        aria-label={count > 0 ? `Notifications (${count} unread)` : 'Notifications'}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-danger)' }} aria-hidden="true">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-lg shadow-lg border" role="menu" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="p-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Notifications</h4>
            </div>
            <div className="p-4 text-sm text-center" style={{ color: 'var(--color-text-faint)' }}>
              No new notifications
            </div>
          </div>
        </>
      )}
    </div>
  );
}
