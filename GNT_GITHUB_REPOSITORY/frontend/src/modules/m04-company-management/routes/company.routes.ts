import { lazy } from "react";
export const companyRoutes = [
  { path: "/company/profile", component: lazy(() => import("../pages/CompanyProfilePage").then(m => ({ default: m.CompanyProfilePage }))), exact: true, meta: { title: "Company Profile", module: "M04" } },
  { path: "/company/branches", component: lazy(() => import("../pages/BranchManagementPage").then(m => ({ default: m.BranchManagementPage }))), exact: true, meta: { title: "Branches", module: "M04" } },
  { path: "/company/financial-year", component: lazy(() => import("../pages/FinancialYearPage").then(m => ({ default: m.FinancialYearPage }))), exact: true, meta: { title: "Financial Year", module: "M04" } },
  { path: "/company/roles", component: lazy(() => import("../pages/RolePermissionPage").then(m => ({ default: m.RolePermissionPage }))), exact: true, meta: { title: "Roles", module: "M04" } },
  { path: "/company/users", component: lazy(() => import("../pages/UserManagementPage").then(m => ({ default: m.UserManagementPage }))), exact: true, meta: { title: "Users", module: "M04" } },
  { path: "/company/theme", component: lazy(() => import("../pages/ThemeSettingsPage").then(m => ({ default: m.ThemeSettingsPage }))), exact: true, meta: { title: "Theme", module: "M04" } },
];
