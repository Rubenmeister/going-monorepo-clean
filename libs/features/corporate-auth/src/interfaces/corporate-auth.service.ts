import {
  ICorporateUser,
  LoginRequestDTO,
  LoginResponseDTO,
  MFASetupResponse,
  VerifyMFARequest,
  CorporateUserRole,
  SSOProvider,
} from './corporate-user.interface';
import {
  ISSOConfig,
  SSOUserProfile,
  SAMLAssertion,
  OIDCTokenResponse,
} from './sso-config.interface';

/**
 * Corporate Authentication Service Interface
 * Handles SSO, RBAC, and MFA for corporate users
 */
export interface ICorporateAuthService {
  /**
   * Login with email and password (for non-SSO)
   */
  login(request: LoginRequestDTO): Promise<LoginResponseDTO>;

  /**
   * Initiate SSO flow (SAML or OIDC)
   */
  initiateSSOFlow(
    companyId: string,
    provider: SSOProvider
  ): Promise<{ redirectUrl: string; state: string }>;

  /**
   * Handle SSO callback
   */
  handleSSOCallback(
    companyId: string,
    code: string,
    state: string
  ): Promise<LoginResponseDTO>;

  /**
   * Handle SAML assertion
   */
  handleSAMLAssertion(
    companyId: string,
    assertion: SAMLAssertion
  ): Promise<LoginResponseDTO>;

  /**
   * Verify user MFA code
   */
  verifyMFA(
    request: VerifyMFARequest
  ): Promise<{ valid: boolean; token?: string }>;

  /**
   * Setup MFA for a user
   */
  setupMFA(userId: string): Promise<MFASetupResponse>;

  /**
   * Validate JWT token
   */
  validateToken(token: string): Promise<{ valid: boolean; payload?: any }>;

  /**
   * Create or update corporate user from SSO profile
   */
  syncSSOUser(
    companyId: string,
    profile: SSOUserProfile
  ): Promise<ICorporateUser>;

  /**
   * Get user by ID
   */
  getUserById(userId: string): Promise<ICorporateUser | null>;

  /**
   * Get SSO configuration for company
   */
  getSSOConfig(companyId: string): Promise<ISSOConfig | null>;

  /**
   * Configure SSO for company
   */
  configureSSOAsync(
    companyId: string,
    config: ISSOConfig
  ): Promise<{ success: boolean; message: string }>;

  /**
   * Check user permissions
   */
  hasPermission(
    userId: string,
    action: string,
    resource?: string
  ): Promise<boolean>;

  /**
   * Logout user
   */
  logout(userId: string, token: string): Promise<void>;
}

/**
 * RBAC (Role-Based Access Control) interface
 */
export interface IRBACService {
  /**
   * Check if user has a specific role
   */
  hasRole(userId: string, role: CorporateUserRole): Promise<boolean>;

  /**
   * Check if user can perform action on resource
   */
  canAccess(userId: string, action: string, resource: string): Promise<boolean>;

  /**
   * Get user's permissions
   */
  getPermissions(userId: string): Promise<string[]>;

  /**
   * Assign role to user
   */
  assignRole(userId: string, role: CorporateUserRole): Promise<void>;

  /**
   * Revoke role from user
   */
  revokeRole(userId: string, role: CorporateUserRole): Promise<void>;
}

/**
 * MFA (Multi-Factor Authentication) Service Interface
 */
export interface IMFAService {
  /**
   * Generate MFA secret for user
   */
  generateSecret(userId: string): Promise<{ secret: string; qrCode: string }>;

  /**
   * Verify TOTP code
   */
  verifyTOTP(secret: string, code: string): Promise<boolean>;

  /**
   * Enable MFA for user
   */
  enableMFA(userId: string, secret: string): Promise<void>;

  /**
   * Disable MFA for user
   */
  disableMFA(userId: string): Promise<void>;

  /**
   * Check if MFA is enabled for user
   */
  isMFAEnabled(userId: string): Promise<boolean>;

  /**
   * Generate backup codes for user
   */
  generateBackupCodes(userId: string): Promise<string[]>;

  /**
   * Verify backup code
   */
  verifyBackupCode(userId: string, code: string): Promise<boolean>;
}

/**
 * Token Service Interface
 */
export interface ITokenService {
  /**
   * Generate JWT token
   */
  generateToken(payload: any, expiresIn?: string): string;

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any;

  /**
   * Decode JWT token without verification
   */
  decodeToken(token: string): any;

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string): string;

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): any;
}
