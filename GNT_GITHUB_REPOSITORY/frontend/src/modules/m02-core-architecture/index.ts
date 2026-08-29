// Pages
export { LoginPage } from './pages/LoginPage';
export { OTPVerifyPage } from './pages/OTPVerifyPage';
export { RoleSelectPage } from './pages/RoleSelectPage';
export { SessionLockPage } from './pages/SessionLockPage';

// Components
export { AuthGuard } from './components/AuthGuard';
export { PermissionGate } from './components/PermissionGate';
export { UserAvatar } from './components/UserAvatar';
export { SessionTimeoutWarning } from './components/SessionTimeoutWarning';

// Services
export { authService } from './services/auth.service';
export type {
  LoginRequest,
  LoginResponse,
  OTPVerifyRequest,
  OTPVerifyResponse,
  UserProfile,
  Role,
} from './services/auth.types';

// State
export { useAuthStore } from './state/auth.store';

// Routes
export { authRoutes } from './routes/auth.routes';

// Validators
export {
  loginSchema,
  otpSchema,
  roleSelectSchema,
  passwordChangeSchema,
} from './validators/auth.schema';
export type {
  LoginInput,
  OTPInput,
  RoleSelectInput,
  PasswordChangeInput,
} from './validators/auth.schema';
