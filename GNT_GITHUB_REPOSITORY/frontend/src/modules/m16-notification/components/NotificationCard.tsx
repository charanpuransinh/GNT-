/**
 * GNT M16 — NotificationCard
 * Reusable single-notification row, used by NotificationCenterPage and NotificationBell
 */
import React from 'react';
import { Notification } from '../services/notification.types';

interface Props {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const priorityDot: Record<Notification['priority'], string> = {
  low: 'bg-slate-400',
  normal: 'bg-blue-500',
  high: 'bg-amber-500',
  urgent: 'bg-red-500',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const NotificationCard: React.FC<Props> = ({ notification, onMarkRead, onClick }) => {
  const isUnread = notification.status !== 'read';

  return (
    <div
      onClick={() => onClick?.(notification)}
      className={`flex items-start gap-3 rounded-xl border p-3 transition cursor-pointer ${
        isUnread ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'
      } hover:shadow-sm`}
    >
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${priorityDot[notification.priority]}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className={`truncate text-sm ${isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'}`}>
            {notification.title}
          </h4>
          <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(notification.createdAt)}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{notification.message}</p>
        <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
          {notification.type}
        </span>
      </div>

      {isUnread && onMarkRead && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(notification.id);
          }}
          className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
        >
          Mark read
        </button>
      )}
    </div>
  );
};
