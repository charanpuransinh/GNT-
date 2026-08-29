/**
 * GNT M16 — NotificationCenterPage
 * User's full notification inbox with filters and mark-read actions
 */
import React, { useEffect } from 'react';
import { useNotificationStore } from '../state/notification.store';
import { NotificationCard } from '../components/NotificationCard';
import { NotificationChannel, NotificationStatus } from '../services/notification.types';

const channelOptions: { value: NotificationChannel | ''; label: string }[] = [
  { value: '', label: 'All channels' },
  { value: 'in_app', label: 'In-App' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
];

const statusOptions: { value: NotificationStatus | ''; label: string }[] = [
  { value: '', label: 'All status' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'read', label: 'Read' },
];

export const NotificationCenterPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    filter,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setFilter,
    clearError,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={clearError} className="text-xs underline">Dismiss</button>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <select
          value={filter.type ?? ''}
          onChange={(e) => setFilter({ type: (e.target.value || undefined) as NotificationChannel | undefined })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {channelOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filter.status ?? ''}
          onChange={(e) => setFilter({ status: (e.target.value || undefined) as NotificationStatus | undefined })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-sm text-slate-500">No notifications found.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationCard key={n.id} notification={n} onMarkRead={markAsRead} />
          ))
        )}
      </div>

      {hasMore && notifications.length > 0 && (
        <button
          onClick={() => fetchNotifications(false)}
          disabled={isLoadingMore}
          className="mt-4 w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {isLoadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
};

export default NotificationCenterPage;
