/**
 * GNT — Route registry (ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02)
 *
 * एक ही जगह जहाँ सारे पेज दर्ज होते हैं। lazy() इसलिए कि हर पेज अपनी ज़रूरत पर ही लोड हो।
 * पेजों में named export है, इसलिए `.then(m => ({ default: m.X }))` — यही तरीक़ा टास्क #004 में तय हुआ।
 *
 * ⚠️ अभी सिर्फ़ Team A (M01–M04) के पेज दर्ज हैं — बाक़ी modules के पेज उनके अपने task में जुड़ेंगे,
 * क्योंकि उनमें अभी type errors बाक़ी हैं (उन्हें यहाँ जोड़ने से पूरा shell गिरेगा)।
 */
import { lazy, type LazyExoticComponent, type ComponentType } from 'react';

export interface AppRoute {
  path: string;
  element: LazyExoticComponent<ComponentType<Record<string, never>>>;
  /** login के बिना खुल सकता है? */
  public?: boolean;
  label?: string;
}

const page = <T extends Record<string, unknown>>(loader: () => Promise<T>, name: keyof T) =>
  lazy(() => loader().then((m) => ({ default: m[name] as ComponentType<Record<string, never>> })));

/** जिन pages में `export default` है (M16/M17/M19/M20) — उनके लिए। */
const pageDefault = <T extends { default: unknown }>(loader: () => Promise<T>) =>
  lazy(() => loader().then((m) => ({ default: m.default as ComponentType<Record<string, never>> })));

export const routes: ReadonlyArray<AppRoute> = [
  // M02 — Core (सार्वजनिक)
  { path: '/login',       public: true, label: 'लॉगिन',        element: page(() => import('./modules/m02-core-architecture/pages/LoginPage'), 'LoginPage') },
  { path: '/otp',         public: true, label: 'OTP',           element: page(() => import('./modules/m02-core-architecture/pages/OTPVerifyPage'), 'OTPVerifyPage') },
  { path: '/role-select', label: 'भूमिका चुनें',                element: page(() => import('./modules/m02-core-architecture/pages/RoleSelectPage'), 'RoleSelectPage') },
  { path: '/locked',      public: true, label: 'सत्र बंद',      element: page(() => import('./modules/m02-core-architecture/pages/SessionLockPage'), 'SessionLockPage') },

  // M03 — Device & Platform
  { path: '/devices',            label: 'डिवाइस',        element: page(() => import('./modules/m03-device-platform/pages/DeviceSessionsPage'), 'DeviceSessionsPage') },
  { path: '/settings/deployment', label: 'तैनाती सेटिंग', element: page(() => import('./modules/m03-device-platform/pages/DeploymentSettingsPage'), 'DeploymentSettingsPage') },
  { path: '/app-update',         public: true,            element: page(() => import('./modules/m03-device-platform/pages/AppUpdatePage'), 'AppUpdatePage') },

  // M04 — Company Management
  { path: '/company',           label: 'कंपनी प्रोफ़ाइल', element: page(() => import('./modules/m04-company-management/pages/CompanyProfilePage'), 'CompanyProfilePage') },
  { path: '/company/branches',  label: 'शाखाएँ',          element: page(() => import('./modules/m04-company-management/pages/BranchManagementPage'), 'BranchManagementPage') },
  { path: '/company/users',     label: 'उपयोगकर्ता',      element: page(() => import('./modules/m04-company-management/pages/UserManagementPage'), 'UserManagementPage') },
  { path: '/company/roles',     label: 'भूमिका/अनुमति',   element: page(() => import('./modules/m04-company-management/pages/RolePermissionPage'), 'RolePermissionPage') },
  { path: '/company/fy',        label: 'वित्तीय वर्ष',    element: page(() => import('./modules/m04-company-management/pages/FinancialYearPage'), 'FinancialYearPage') },
  { path: '/company/theme',     label: 'थीम',             element: page(() => import('./modules/m04-company-management/pages/ThemeSettingsPage'), 'ThemeSettingsPage') },

  // M05 — Party Management
  { path: '/parties',      label: 'पार्टी (ग्राहक/सप्लायर)', element: page(() => import('./modules/m05-party-management/pages/PartyListPage'), 'PartyListPage') },
  { path: '/parties/:id',                                element: page(() => import('./modules/m05-party-management/pages/PartyDetailHubPage'), 'PartyDetailHubPage') },

  // M16 — Notification (टास्क: M16–M21 पूरा — Claude, 2026-09-03)
  { path: '/notifications',          label: 'सूचनाएँ',        element: pageDefault(() => import('./modules/m16-notification/pages/NotificationCenterPage')) },
  { path: '/notifications/settings', label: 'सूचना सेटिंग',   element: pageDefault(() => import('./modules/m16-notification/pages/NotificationSettingsPage')) },

  // M17 — Reporting
  { path: '/reports/sales',      label: 'बिक्री रिपोर्ट',   element: pageDefault(() => import('./modules/m17-reporting/pages/SalesReportsPage')) },
  { path: '/reports/purchase',   label: 'ख़रीद रिपोर्ट',    element: pageDefault(() => import('./modules/m17-reporting/pages/PurchaseReportsPage')) },
  { path: '/reports/inventory',  label: 'स्टॉक रिपोर्ट',    element: pageDefault(() => import('./modules/m17-reporting/pages/InventoryReportsPage')) },
  { path: '/reports/gst',        label: 'GST रिपोर्ट',      element: pageDefault(() => import('./modules/m17-reporting/pages/GSTReportsPage')) },
  { path: '/reports/accounting', label: 'लेखा रिपोर्ट',     element: pageDefault(() => import('./modules/m17-reporting/pages/AccountingReportsPage')) },
  { path: '/reports/hr',         label: 'HR रिपोर्ट',       element: pageDefault(() => import('./modules/m17-reporting/pages/HRReportsPage')) },

  // M18 — External Integration
  { path: '/integrations',          label: 'गेटवे सेटिंग',   element: page(() => import('./modules/m18-external-integration/pages/GatewayConfigPage'), 'GatewayConfigPage') },
  { path: '/integrations/status',   label: 'गेटवे स्थिति',   element: page(() => import('./modules/m18-external-integration/pages/IntegrationStatusPage'), 'IntegrationStatusPage') },
  { path: '/integrations/api-keys', label: 'API कुंजियाँ',   element: page(() => import('./modules/m18-external-integration/pages/APIKeyManagerPage'), 'APIKeyManagerPage') },

  // M19 — Production Monitoring
  { path: '/monitoring/health',      label: 'सिस्टम स्वास्थ्य', element: pageDefault(() => import('./modules/m19-production-monitoring/pages/SystemHealthPage')) },
  { path: '/monitoring/activity',    label: 'गतिविधि लॉग',     element: pageDefault(() => import('./modules/m19-production-monitoring/pages/ActivityLogPage')) },
  { path: '/monitoring/logins',      label: 'लॉगिन इतिहास',    element: pageDefault(() => import('./modules/m19-production-monitoring/pages/LoginHistoryPage')) },
  { path: '/monitoring/permissions', label: 'अनुमति बदलाव',    element: pageDefault(() => import('./modules/m19-production-monitoring/pages/PermissionTrackerPage')) },

  // M20 — International Trade
  { path: '/trade',                label: 'निर्यात/आयात',   element: pageDefault(() => import('./modules/m20-international-trade/pages/TradeDashboardPage')) },
  { path: '/trade/bill-of-entry',  label: 'बिल ऑफ़ एंट्री',  element: pageDefault(() => import('./modules/m20-international-trade/pages/BillOfEntryPage')) },

  // M01 — Foundation
  { path: '/maintenance', public: true, element: page(() => import('./modules/m01-foundation/pages/MaintenancePage'), 'MaintenancePage') },
  { path: '/error',       public: true, element: page(() => import('./modules/m01-foundation/pages/ErrorPage'), 'ErrorPage') },
];

/** बाएँ मेन्यू में यही दिखेंगे */
export const navRoutes = routes.filter((r) => r.label);
