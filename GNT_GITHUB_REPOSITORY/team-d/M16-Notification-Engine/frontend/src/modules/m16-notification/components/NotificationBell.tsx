/**
 * GNT M16 — NotificationBell
 * Navbar bell icon: unread-count badge + dropdown of latest notifications
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '../state/notification.store';
import { NotificationCard } from './NotificationCard';

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, fetchUnreadCount, fetchNotifications, markAsRead } =
    useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) fetchNotifications(true);
  }, [open, fetchNotifications]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-blue-600">{unreadCount} unread</span>
            )}
          </div>

          <div className="mt-1 max-h-80 space-y-1.5 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-slate-400">No notifications yet.</p>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <NotificationCard key={n.id} notification={n} onMarkRead={markAsRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
