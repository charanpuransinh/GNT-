# GNT M01–M20 Full Project Integration Map

## Current module coverage
- m01-foundation: 13 files
- m02-core-architecture: 25 files
- m03-device-platform: 15 files
- m04-company-management: 16 files
- m06-inventory: 30 files
- m07-purchase: 13 files
- m08-sales: 25 files
- m09-gst: 18 files
- m10-accounting: 21 files
- m11-payment: 40 files
- m12-hr: 15 files
- m13-automation: 60 files
- m14-import-export: 56 files
- m15-sync: 69 files
- m16-notification: 14 files
- m17-reporting: 13 files
- m18-external-integration: 13 files
- m20-international-trade: 21 files

## Team D integration
- M16 Notification
- M17 Reporting
- M18 External Integration
- M19 Production Monitoring
- M20 International Trade

## Immediate cross-module test groups
1. Identity/Company: M01 → M02 → M04
2. Inventory/Purchase/Sales: M06 → M07 → M08 → M10
3. GST/Accounting: M08 → M09 → M10
4. Payments: M08/M09/M10 → M11 → M12/M13/M16 where contracts declare events
5. Reporting: source modules → M17
6. External integration: M09/M10/M11 → M18
7. Monitoring: all services → M19
8. International trade: M06/M08/M09/M10/M18 → M20 where canonical contracts permit

## Highest-risk areas found in Team D source (not silently treated as production-ready)
### explicit unfinished marker (42)
- `team-d/M19-Production-Monitoring/frontend/pages/ActivityLogPage.tsx`
- `team-d/M19-Production-Monitoring/frontend/pages/LoginHistoryPage.tsx`
- `team-d/M19-Production-Monitoring/frontend/pages/PermissionTrackerPage.tsx`
- `team-d/M16-Notification-Engine/database/notification_master.sql`
- `team-d/M16-Notification-Engine/api-contracts/v1/M16-notification.contract.yaml`
- `team-d/M16-Notification-Engine/backend/src/modules/m16-notification/services/notification.service.ts`
- `team-d/M16-Notification-Engine/backend/src/modules/m16-notification/repositories/notification.repository.ts`
- `team-d/M16-Notification-Engine/backend/src/modules/m16-notification/models/notification.model.ts`
- `team-d/M16-Notification-Engine/backend/src/modules/m16-notification/validators/notification.schema.ts`
- `team-d/M16-Notification-Engine/backend/src/modules/m16-notification/types/notification.types.ts`
- `team-d/M16-Notification-Engine/frontend/src/modules/m16-notification/services/notification.types.ts`
- `team-d/M16-Notification-Engine/frontend/src/modules/m16-notification/pages/NotificationSettingsPage.tsx`
- `team-d/M16-Notification-Engine/frontend/src/modules/m16-notification/pages/NotificationCenterPage.tsx`
- `team-d/M16-Notification-Engine/frontend/src/modules/m16-notification/validators/notification.schema.ts`
- `team-d/M20-International-Trade/frontend/src/modules/m20-international-trade/components/HSNSelector.tsx`
- `team-d/M17-Reporting/backend/src/modules/m17-reporting/services/report.generator.ts`
- `team-d/M17-Reporting/frontend/src/modules/m17-reporting/pages/PurchaseReportsPage.tsx`
- `team-d/M17-Reporting/frontend/src/modules/m17-reporting/components/ReportFilterPanel.tsx`
- `team-d/M18-External-Integration/api-contracts/v1/M18-integration.contract.yaml`
- `team-d/M18-External-Integration/backend/src/modules/m18-external-integration/services/integration.service.ts`
- `team-d/M18-External-Integration/backend/src/modules/m18-external-integration/types/integration.types.ts`
- `team-d/M18-External-Integration/frontend/src/modules/m18-external-integration/services/integration.types.ts`
- `team-d/M18-External-Integration/frontend/src/modules/m18-external-integration/pages/APIKeyManagerPage.tsx`
- `team-d/M18-External-Integration/frontend/src/modules/m18-external-integration/components/GatewayStatusCard.tsx`
- `backend/src/modules/m17-reporting/services/report.generator.ts`
- `backend/src/modules/m18-external-integration/services/integration.service.ts`
- `backend/src/modules/m18-external-integration/types/integration.types.ts`
- `backend/src/modules/m16-notification/services/notification.service.ts`
- `backend/src/modules/m16-notification/repositories/notification.repository.ts`
- `backend/src/modules/m16-notification/models/notification.model.ts`
- `backend/src/modules/m16-notification/validators/notification.schema.ts`
- `backend/src/modules/m16-notification/types/notification.types.ts`
- `frontend/src/modules/m17-reporting/pages/PurchaseReportsPage.tsx`
- `frontend/src/modules/m17-reporting/components/ReportFilterPanel.tsx`
- `frontend/src/modules/m20-international-trade/components/HSNSelector.tsx`
- `frontend/src/modules/m18-external-integration/services/integration.types.ts`
- `frontend/src/modules/m18-external-integration/pages/APIKeyManagerPage.tsx`
- `frontend/src/modules/m18-external-integration/components/GatewayStatusCard.tsx`
- `frontend/src/modules/m16-notification/services/notification.types.ts`
- `frontend/src/modules/m16-notification/pages/NotificationSettingsPage.tsx`
### mock/demo marker (10)
- `team-d/M19-Production-Monitoring/frontend/pages/ActivityLogPage.tsx`
- `team-d/M19-Production-Monitoring/frontend/pages/SystemHealthPage.tsx`
- `team-d/M19-Production-Monitoring/frontend/pages/LoginHistoryPage.tsx`
- `team-d/M19-Production-Monitoring/frontend/pages/PermissionTrackerPage.tsx`
- `team-d/M16-Notification-Engine/backend/src/modules/m16-notification/services/sms.service.ts`
- `team-d/M16-Notification-Engine/backend/src/modules/m16-notification/services/email.service.ts`
- `team-d/M16-Notification-Engine/backend/src/modules/m16-notification/services/whatsapp.service.ts`
- `backend/src/modules/m16-notification/services/sms.service.ts`
- `backend/src/modules/m16-notification/services/email.service.ts`
- `backend/src/modules/m16-notification/services/whatsapp.service.ts`

## Conflicting files
None detected during merge.

## Production gate note
This is the full M01–M20 integrated source candidate. A genuine production PASS still requires installing the actual Node dependencies, compiling the entire monorepo, applying a real PostgreSQL migration, running integration/E2E tests, and validating external service credentials/endpoints. No missing module business behavior has been invented.
