import { EventBus } from "../../../common/events/event-bus";
import { AuditLogger } from "../../../common/logging/audit-logger";
import { APP_EVENTS } from "./app.events";

export class AppEventHandlers {
  constructor(private readonly eventBus: EventBus, private readonly audit: AuditLogger) {}

  register() {
    this.eventBus.subscribe(APP_EVENTS.HEALTH_DEGRADED, (payload) => {
      this.audit.log({ action: "AUDIT_HEALTH_DEGRADED", target: payload.check });
    });
    this.eventBus.subscribe(APP_EVENTS.MAINTENANCE_TOGGLED, (payload) => {
      this.audit.log({ action: "AUDIT_MAINTENANCE_TOGGLE", target: String(payload.maintenanceMode) });
    });
  }
}
