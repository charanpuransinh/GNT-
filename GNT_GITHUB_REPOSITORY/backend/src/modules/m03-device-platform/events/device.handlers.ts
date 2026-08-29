import { EventBus } from "../../../common/events/event-bus";
import { AuditLogger } from "../../../common/logging/audit-logger";
import { DEVICE_EVENTS } from "./device.events";

export class DeviceEventHandlers {
  constructor(private readonly eventBus: EventBus, private readonly audit: AuditLogger) {}

  register() {
    this.eventBus.subscribe(DEVICE_EVENTS.DEVICE_REGISTERED, (payload) => {
      this.audit.log({ action: "AUDIT_DEVICE_REGISTERED", target: payload.deviceId });
    });
    this.eventBus.subscribe(DEVICE_EVENTS.SESSION_TERMINATED, (payload) => {
      this.audit.log({ action: "AUDIT_SESSION_TERMINATED", target: payload.sessionId });
    });
  }
}
