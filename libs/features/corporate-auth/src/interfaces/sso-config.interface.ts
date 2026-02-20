/**
 * SSO Configuration Interface
 * Supports SAML 2.0 and OIDC providers
 */
export interface ISSOConfig {
  provider: SSOProviderType;
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  discoveryUrl?: string; // For OIDC
  entityId?: string; // For SAML
  ssoUrl?: string; // For SAML
  certificateUrl?: string; // For SAML
  redirectUri: string;
  logoutUrl?: string;
  scopes?: string[];
  attributeMapping?: SSOAttributeMapping;
}

export type SSOProviderType = 'okta' | 'azure_ad' | 'google_workspace';

/**
 * SAML 2.0 Specific Configuration
 */
export interface ISAMLConfig extends ISSOConfig {
  provider: 'okta' | 'azure_ad';
  entityId: string;
  ssoUrl: string;
  certificateUrl: string;
  assertionConsumerServiceUrl: string;
  nameIdFormat?: string;
}

/**
 * OIDC Specific Configuration
 */
export interface IOIDCConfig extends ISSOConfig {
  provider: 'google_workspace' | 'okta' | 'azure_ad';
  discoveryUrl: string;
  responseType?: string;
  grantType?: string;
}

/**
 * Attribute Mapping for SSO Responses
 * Maps SSO provider attributes to our user fields
 */
export interface SSOAttributeMapping {
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  roles?: string;
  [key: string]: string | undefined;
}

/**
 * SSO User from Provider
 */
export interface SSOUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  roles?: string[];
  picture?: string;
  rawProfile: Record<string, any>;
}

/**
 * SAML Assertion (parsed)
 */
export interface SAMLAssertion {
  issuer: string;
  subject: string;
  nameId: string;
  sessionIndex: string;
  attributes: Record<string, string[]>;
  signature?: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * OIDC Token Response
 */
export interface OIDCTokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * Configuration for MFA
 */
export interface IMFAConfig {
  required: boolean;
  requireForAdmins: boolean;
  tolerance: number; // Time window for TOTP in seconds
  issuer: string; // For TOTP QR code
}
