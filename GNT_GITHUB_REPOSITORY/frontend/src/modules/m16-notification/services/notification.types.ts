/**
 * GNT M16 — Notification Engine Frontend Types
 */

export type NotificationChannel = 'in_app' | 'whatsapp' | 'sms' | 'email';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
export type NotificationEntityType = 
  | 'sales_invoice'
  | 'purchase_invoice'
  | 'payment'
  | 'stock'
  | 'gst_return'
  | 'employee_salary'
  | 'general';

export interface Notification {
  id: string;
  userId: string;
  companyId: string;
  title: string;
  message: string;
  type: NotificationChannel;
  entityType: NotificationEntityType;
  entityId?: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilter {
  type?: NotificationChannel;
  status?: NotificationStatus;
  entityType?: NotificationEntityType;
  priority?: NotificationPriority;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  userId: string;
  count: number;
}

export interface MarkReadPayload {
  notificationIds?: string[];
  markAll?: boolean;
}

export interface DeliveryLog {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: string;
  providerResponse?: string;
  attemptedAt: string;
  deliveredAt?: string;
  failedAt?: string;
  errorMessage?: string;
}

export interface DeliveryTrackingResponse {
  notificationId: string;
  logs: DeliveryLog[];
  overallStatus: NotificationStatus;
}
