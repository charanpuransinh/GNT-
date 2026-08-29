// Controllers
export { authController } from './controllers/auth.controller';
export { userController } from './controllers/user.controller';
export { roleController } from './controllers/role.controller';

// Services
export { authService } from './services/auth.service';
export { userService } from './services/user.service';
export { roleService } from './services/role.service';
export { authInternal } from './services/auth.internal';

// Repositories
export { userRepository } from './repositories/user.repository';
export { roleRepository } from './repositories/role.repository';

// Routes
export { default as authRoutes } from './routes/auth.routes';

// Models
export type { UserWithRoles } from './models/user.model';
export type { RoleWithPermissions } from './models/role.model';
export type { PermissionWithRoles } from './models/permission.model';

// Events
export { AUTH_EVENTS } from './events/auth.events';
export { AuthEventHandlers } from './events/auth.handlers';

// Types
export type {
  LoginRequest,
  LoginResponse,
  OTPVerifyRequest,
  OTPVerifyResponse,
  TokenPair,
  UserProfile,
  Role,
  Permission,
  JWTPayload,
} from './types/auth.types';

// Validators
export {
  loginSchema,
  otpVerifySchema,
  refreshTokenSchema,
  createUserSchema,
  updateUserSchema,
  createRoleSchema,
  updateRoleSchema,
} from './validators/auth.schema';
