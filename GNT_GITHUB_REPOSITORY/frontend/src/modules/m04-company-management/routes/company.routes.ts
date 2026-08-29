import { lazy } from "react";
export const companyRoutes = [
  { path: "/company/profile", component: lazy(() => import("../pages/CompanyProfilePage")), exact: true, meta: { title: "Company Profile", module: "M04" } },
  { path: "/company/branches", component: lazy(() => import("../pages/BranchManagementPage")), exact: true, meta: { title: "Branches", module: "M04" } },
  { path: "/company/financial-year", component: lazy(() => import("../pages/FinancialYearPage")), exact: true, meta: { title: "Financial Year", module: "M04" } },
  { path: "/company/roles", component: lazy(() => import("../pages/RolePermissionPage")), exact: true, meta: { title: "Roles", module: "M04" } },
  { path: "/company/users", component: lazy(() => import("../pages/UserManagementPage")), exact: true, meta: { title: "Users", module: "M04" } },
  { path: "/company/theme", component: lazy(() => import("../pages/ThemeSettingsPage")), exact: true, meta: { title: "Theme", module: "M04" } },
];