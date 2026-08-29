import { EventBus } from "../../../common/events/event-bus";
import { AuditLogger } from "../../../common/logging/audit-logger";

export class CompanyEventHandlers {
  constructor(private readonly eventBus: EventBus, private readonly audit: AuditLogger) {}

  register() {
    this.eventBus.subscribe("company.profile.updated", (payload) => {
      this.audit.log({ action: "AUDIT_PROFILE_UPDATE", target: payload.companyId });
    });
    this.eventBus.subscribe("company.fy.switched", (payload) => {
      this.audit.log({ action: "AUDIT_FY_SWITCH", target: payload.fyId });
    });
  }
}