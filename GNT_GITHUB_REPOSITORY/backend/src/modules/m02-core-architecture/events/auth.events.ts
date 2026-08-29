export const AUTH_EVENTS = {
  LOGIN_SUCCESS: "user.login.success",
  LOGIN_FAILED: "user.login.failed",
  LOGOUT: "user.logout",
} as const;

export type AuthEventName = (typeof AUTH_EVENTS)[keyof typeof AUTH_EVENTS];
