upstream:
  M01-Foundation: TenantContext, BaseEntity, ErrorHandling
  M02-Auth: JWT validation, RBAC checks, user resolution
  M03-Core: API Gateway routing, request validation, rate limiting
  M04-Events: EventBus publish/subscribe, event schema validation
  M05-Users: User lookup actions, role-based routing
  M06-Notifications: SendEmail action, SendSMS action, InApp notification

downstream:
  M07-Transactions: Trigger on transaction create/update
  M08-Inventory: Trigger on stock level changes
  M09-Orders: Trigger on order status changes
  M10-Finance: Trigger on invoice/payment events
  M11-Payment: Trigger on payment gateway webhooks
  M12-HR: Trigger on employee onboarding events
  M14-ImportExport: Workflow action to export data
  M15-Sync: Workflow action to sync external systems
  M19-Monitoring: Metrics, alerts, execution dashboards

bidirectional:
  M04-Events: Consumes events as triggers, publishes execution events
