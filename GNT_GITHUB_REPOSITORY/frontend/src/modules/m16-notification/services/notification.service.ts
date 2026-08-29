/**
 * GNT M16 — Notification Engine Frontend Service
 * API client for notification endpoints
 */

import { apiClient } from '../../../core/api-client';
import {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
  MarkReadPayload,
  DeliveryTrackingResponse,
  NotificationFilter,
} from './notification.types';

const BASE_URL = '/api/v1/notifications';

export const notificationService = {
  /**
   * Fetch notifications with filters
   */
  async getNotifications(filter: NotificationFilter = {}): Promise<NotificationListResponse> {
    const params = new URLSearchParams();
    if (filter.type) params.append('type', filter.type);
    if (filter.status) params.append('status', filter.status);
    if (filter.priority) params.append('priority', filter.priority);
    if (filter.isRead !== undefined) params.append('isRead', String(filter.isRead));
    if (filter.page) params.append('page', String(filter.page));
    if (filter.limit) params.append('limit', String(filter.limit));

    const response = await apiClient.get<NotificationListResponse>(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get unread count for bell badge
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>(`${BASE_URL}/unread-count`);
    return response.data;
  },

  /**
   * Mark notification(s) as read
   */
  async markAsRead(payload: MarkReadPayload): Promise<{ markedCount: number }> {
    const response = await apiClient.patch<{ markedCount: number }>(`${BASE_URL}/batch/read`, payload);
    return response.data;
  },

  /**
   * Mark single notification as read
   */
  async markSingleAsRead(notificationId: string): Promise<{ markedCount: number }> {
    const response = await apiClient.patch<{ markedCount: number }>(`${BASE_URL}/${notificationId}/read`, {});
    return response.data;
  },

  /**
   * Get delivery tracking log
   */
  async getDeliveryLog(notificationId: string): Promise<DeliveryTrackingResponse> {
    const response = await apiClient.get<DeliveryTrackingResponse>(`${BASE_URL}/delivery-log/${notificationId}`);
    return response.data;
  },

  /**
   * Send notification (admin use)
   */
  async sendNotification(payload: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority?: string;
  }): Promise<{ notificationId: string; status: string }> {
    const response = await apiClient.post<{ notificationId: string; status: string }>(`${BASE_URL}/send`, payload);
    return response.data;
  },
};
