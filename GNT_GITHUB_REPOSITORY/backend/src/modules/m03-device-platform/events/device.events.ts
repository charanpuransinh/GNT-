export const DEVICE_EVENTS = {
  DEVICE_REGISTERED: "device.registered",
  SESSION_TERMINATED: "session.terminated",
} as const;

export type DeviceEventName = (typeof DEVICE_EVENTS)[keyof typeof DEVICE_EVENTS];
