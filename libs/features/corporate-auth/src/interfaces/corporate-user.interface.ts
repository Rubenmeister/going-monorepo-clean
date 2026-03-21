/**
 * Corporate User Interface
 * Represents a user within a corporate account
 */
export interface ICorporateUser {
  userId: string;
  companyId: string;
  email: string;
  fullName: string;
  role: CorporateUserRole;
  department?: string;
  status: UserStatus;
  mfaEnabled: boolean;
  mfaSecret?: string;
  ssoProvider: SSOProvider;
  ssoId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CorporateUserRole {
  SUPER_ADMIN = 'super_admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum SSOProvider {
  OKTA = 'okta',
  AZURE_AD = 'azure_ad',
  GOOGLE_WORKSPACE = 'google_workspace',
  NONE = 'none',
}

/**
 * Corporate User DTO for API responses
 */
export interface CorporateUserDTO {
  userId: string;
  email: string;
  fullName: string;
  role: CorporateUserRole;
  department?: string;
  status: UserStatus;
  mfaEnabled: boolean;
}

/**
 * JWT Payload for corporate users
 */
export interface CorporateJWTPayload {
  userId: string;
  companyId: string;
  email: string;
  role: CorporateUserRole;
  ssoProvider: SSOProvider;
  iat?: number;
  exp?: number;
}

/**
 * Login Request DTO
 */
export interface LoginRequestDTO {
  email: string;
  password?: string; // Only used for non-SSO logins
  mfaCode?: string;
}

/**
 * Login Response DTO
 */
export interface LoginResponseDTO {
  accessToken: string;
  refreshToken?: string;
  user: CorporateUserDTO;
  requiresMFA?: boolean;
}

/**
 * MFA Setup Response
 */
export interface MFASetupResponse {
  secret: string;
  qrCode: string;
}

/**
 * Verify MFA Request
 */
export interface VerifyMFARequest {
  userId: string;
  code: string;
}
