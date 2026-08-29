/**
 * GNT M16 — Notification Engine Zustand Store
 * Global notification state management
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Notification, NotificationFilter } from '../services/notification.types';
import { notificationService } from '../services/notification.service';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  filter: NotificationFilter;
  total: number;
  page: number;
  hasMore: boolean;

  // Actions
  fetchNotifications: (reset?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setFilter: (filter: Partial<NotificationFilter>) => void;
  clearError: () => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (notificationId: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        filter: { limit: 20 },
        total: 0,
        page: 1,
        hasMore: true,

        fetchNotifications: async (reset = false) => {
          const { filter, page, notifications } = get();
          const currentPage = reset ? 1 : page;

          set({ isLoading: reset, isLoadingMore: !reset, error: null });

          try {
            const response = await notificationService.getNotifications({
              ...filter,
              page: currentPage,
            });

            const newNotifications = reset
              ? response.data
              : [...notifications, ...response.data];

            set({
              notifications: newNotifications,
              unreadCount: response.unreadCount,
              total: response.total,
              page: currentPage + 1,
              hasMore: newNotifications.length < response.total,
              isLoading: false,
              isLoadingMore: false,
            });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to fetch notifications',
              isLoading: false,
              isLoadingMore: false,
            });
          }
        },

        fetchUnreadCount: async () => {
          try {
            const response = await notificationService.getUnreadCount();
            set({ unreadCount: response.count });
          } catch (err) {
            console.error('[M16] Failed to fetch unread count:', err);
          }
        },

        markAsRead: async (notificationId: string) => {
          try {
            await notificationService.markSingleAsRead(notificationId);
            set((state) => ({
              notifications: state.notifications.map((n) =>
                n.id === notificationId ? { ...n, status: 'read' as const, readAt: new Date().toISOString() } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            }));
          } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to mark as read' });
          }
        },

        markAllAsRead: async () => {
          try {
            await notificationService.markAsRead({ markAll: true });
            set((state) => ({
              notifications: state.notifications.map((n) =>
                n.status !== 'read' ? { ...n, status: 'read' as const, readAt: new Date().toISOString() } : n
              ),
              unreadCount: 0,
            }));
          } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to mark all as read' });
          }
        },

        setFilter: (filter) => {
          set((state) => ({
            filter: { ...state.filter, ...filter },
            page: 1,
            hasMore: true,
          }));
          get().fetchNotifications(true);
        },

        clearError: () => set({ error: null }),

        addNotification: (notification) => {
          set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));
        },

        removeNotification: (notificationId) => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== notificationId),
          }));
        },
      }),
      {
        name: 'm16-notification-store',
        partialize: (state) => ({
          filter: state.filter,
        }),
      }
    ),
    { name: 'NotificationStore' }
  )
);
