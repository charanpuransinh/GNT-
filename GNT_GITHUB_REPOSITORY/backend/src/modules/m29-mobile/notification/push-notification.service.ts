/**
 * M29 — notification/push-notification.service.ts
 * OWN: Mobile push delivery.
 *
 * VERIFICATION NEEDED: real push provider (FCM/APNs). Depends on an
 * injected PushProvider adapter.
 */

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushProvider {
  sendToDevice(deviceToken: string, message: PushMessage): Promise<{ delivered: boolean; error?: string }>;
}

class UnconfiguredPushProvider implements PushProvider {
  async sendToDevice(): Promise<{ delivered: boolean; error?: string }> {
    return { delivered: false, error: 'PUSH_PROVIDER_NOT_CONFIGURED' };
  }
}

export class PushNotificationService {
  constructor(private readonly provider: PushProvider = new UnconfiguredPushProvider()) {}

  async send(deviceToken: string, message: PushMessage): Promise<{ delivered: boolean }> {
    if (!deviceToken) return { delivered: false };
    const result = await this.provider.sendToDevice(deviceToken, message);
    return { delivered: result.delivered };
  }
}

export const pushNotificationService = new PushNotificationService();
