// Controllers
export { deviceController } from './controllers/device.controller';

// Services
export { deviceService } from './services/device.service';
export { deviceInternal } from './services/device.internal';

// Repositories
export { deviceRepository } from './repositories/device.repository';

// Routes
export { default as deviceRoutes } from './routes/device.routes';

// Models
export type { DeviceWithSessions } from './models/device.model';
export type { SessionWithDevice } from './models/session.model';

// Events
export { DEVICE_EVENTS } from './events/device.events';
export { DeviceEventHandlers } from './events/device.handlers';

// Types
export type {
  DeviceSession,
  DeviceInfo,
  UpdateInfo,
  DeploymentSettings,
  ApiResponse,
} from './types/device.types';

// Validators
export {
  registerDeviceSchema,
  updateDeviceSchema,
  deploymentSettingsSchema,
  checkUpdateQuerySchema,
} from './validators/device.schema';
