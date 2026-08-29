import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const OTPVerifyPage = lazy(() => import('../pages/OTPVerifyPage').then((m) => ({ default: m.OTPVerifyPage })));
const RoleSelectPage = lazy(() => import('../pages/RoleSelectPage').then((m) => ({ default: m.RoleSelectPage })));
const SessionLockPage = lazy(() => import('../pages/SessionLockPage').then((m) => ({ default: m.SessionLockPage })));

export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/otp-verify',
    element: <OTPVerifyPage />,
  },
  {
    path: '/role-select',
    element: <RoleSelectPage />,
  },
  {
    path: '/session-lock',
    element: <SessionLockPage />,
  },
];
