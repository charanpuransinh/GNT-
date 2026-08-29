/**
 * M16 — Notification Engine Module (Public Exports)
 */

// Types
export * from './services/notification.types';

// Services
export { notificationService } from './services/notification.service';

// State
export { useNotificationStore } from './state/notification.store';

// Validators
export * from './validators/notification.schema';

// Components
export { NotificationBell } from './components/NotificationBell';
export { NotificationCard } from './components/NotificationCard';

// Pages
export { NotificationCenterPage } from './pages/NotificationCenterPage';
export { NotificationSettingsPage } from './pages/NotificationSettingsPage';

// Routes
export { notificationRoutes } from './routes/notification.routes';
