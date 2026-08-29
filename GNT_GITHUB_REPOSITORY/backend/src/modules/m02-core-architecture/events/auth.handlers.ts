import { EventBus } from "../../../common/events/event-bus";
import { AuditLogger } from "../../../common/logging/audit-logger";
import { AUTH_EVENTS } from "./auth.events";

export class AuthEventHandlers {
  constructor(private readonly eventBus: EventBus, private readonly audit: AuditLogger) {}

  register() {
    this.eventBus.subscribe(AUTH_EVENTS.LOGIN_SUCCESS, (payload) => {
      this.audit.log({ action: "AUDIT_LOGIN_SUCCESS", target: payload.userId });
    });
    this.eventBus.subscribe(AUTH_EVENTS.LOGIN_FAILED, (payload) => {
      this.audit.log({ action: "AUDIT_LOGIN_FAILED", target: payload.username });
    });
    this.eventBus.subscribe(AUTH_EVENTS.LOGOUT, (payload) => {
      this.audit.log({ action: "AUDIT_LOGOUT", target: payload.userId });
    });
  }
}
