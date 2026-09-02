/**
 * GNT M16 — Notification Engine Types
 * DTOs & Interfaces for cross-module consumption
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

export interface NotificationMaster {
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
  toAddress?: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDeliveryLog {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: 'attempted' | 'delivered' | 'failed' | 'bounced';
  providerResponse?: string;
  attemptedAt: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
}

export interface SendNotificationPayload {
  userId: string;
  companyId: string;
  title: string;
  message: string;
  type: NotificationChannel;
  entityType: NotificationEntityType;
  entityId?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[]; // Multi-channel support
  toAddress?: string; // recipient का असली पता (phone/email) — userId नहीं
}

export interface NotificationFilter {
  userId?: string;
  companyId?: string;
  type?: NotificationChannel;
  status?: NotificationStatus;
  entityType?: NotificationEntityType;
  priority?: NotificationPriority;
  startDate?: Date | string;
  endDate?: Date | string;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationListResponse {
  data: NotificationMaster[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export interface DeliveryTrackingResponse {
  notificationId: string;
  logs: NotificationDeliveryLog[];
  overallStatus: NotificationStatus;
}

export interface UnreadCountResponse {
  userId: string;
  count: number;
}

export interface MarkReadPayload {
  notificationIds?: string[];
  markAll?: boolean;
}

export interface ChannelConfig {
  channel: NotificationChannel;
  enabled: boolean;
  provider?: string;
  config?: Record<string, unknown>;
}

export interface EventNotificationPayload {
  eventName: string;
  payload: Record<string, unknown>;
  targetUserIds?: string[];
  targetRoles?: string[];
  companyId: string;
}
