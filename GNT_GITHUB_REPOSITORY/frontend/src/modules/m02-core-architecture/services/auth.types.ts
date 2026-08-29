export interface LoginRequest {
  username: string;
  password: string;
  companyCode: string;
}

export interface LoginResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  requiresOtp: boolean;
  roles: Role[];
}

export interface OTPVerifyRequest {
  userId: string;
  otp: string;
}

export interface OTPVerifyResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  roles: Role[];
  permissions: string[];
  companyId: string;
  branchId?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}
