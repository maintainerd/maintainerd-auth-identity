/**
 * API Configuration
 *
 * This app targets the PUBLIC port (:8081) of maintainerd-auth — the same
 * port external clients and end-users talk to. The internal management port
 * (:8080) is used exclusively by the admin console.
 *
 * Required backend endpoints on the public port:
 *   Auth:  GET /account, POST /login, POST /register, POST /register/invite,
 *          POST /logout, POST /refresh-token, POST /magic-link/*,
 *          POST /forgot-password, POST /reset-password, GET /profile,
 *          POST /profile, login MFA endpoints
 *   OAuth2/OIDC: GET /oauth/authorize, GET /oauth/consent/{challenge_id},
 *          POST /oauth/consent, POST /oauth/device, POST /oauth/device/deny,
 *          POST /oauth/ciba/approve, POST /oauth/ciba/deny,
 *          GET /oauth/consent/grants, DELETE /oauth/consent/grants/{grant_uuid},
 *          GET/POST /oauth/end_session, plus protocol endpoints for token,
 *          PAR, device authorization, CIBA, revocation, DCR, and backchannel logout
 *   Discovery: GET /client?client_id=..., then GET /tenant/{derivedIdentifier}
 *   Setup:  GET /setup/status, POST /setup/*
 */

// Get base URL from environment variables
// This app targets the public-facing API port (8081) of maintainerd-auth,
// as opposed to the internal management port (8080) used by the admin console.
// In development, use relative path to go through Vite proxy
// In production, use the full API URL
const getBaseUrl = () => {
  if (import.meta.env.DEV) {
    // Development: use relative path to go through Vite proxy
    return '/api/v1'
  }
  // Production: use environment variable or fallback
  return import.meta.env.VITE_AUTH_API_BASE_URL || 'https://public-api.auth.maintainerd.local/api/v1'
}

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const

// Token delivery mode for this app. Sent on every token-issuing request
// (login, register, refresh) so the backend delivers tokens as httpOnly cookies
// instead of in the response body. Single source of truth — reuse everywhere.
export const TOKEN_DELIVERY_HEADER = { 'X-Token-Delivery': 'cookie' } as const

// API Endpoints
export const API_ENDPOINTS = {
  SETUP: {
    STATUS: '/setup/status',
    CREATE_TENANT: '/setup/create_tenant',
    CREATE_ADMIN: '/setup/create_admin',
    CREATE_PROFILE: '/setup/create_profile',
    COMPLETE: '/setup/complete',
  },
  AUTH: {
    LOGIN: '/login',
    // Login MFA second step (issues an acr=2 session on success).
    LOGIN_MFA_VERIFY: '/login/mfa/verify',
    LOGIN_MFA_SEND_SMS: '/login/mfa/send-sms',
    LOGIN_MFA_SEND_EMAIL_OTP: '/login/mfa/send-email-otp',
    LOGIN_MFA_WEBAUTHN_BEGIN: '/login/mfa/webauthn/begin',
    SMS_LOGIN_SEND: '/sms-login/send',
    SMS_LOGIN_VERIFY: '/sms-login/verify',
    REGISTER: '/register',
    REGISTER_INVITE: '/register/invite',
    LOGOUT: '/logout',
    // POST /api/v1/refresh-token — rotates the session using the httpOnly
    // refresh-token cookie (scoped to this path) and Set-Cookies fresh tokens
    // when called with `X-Token-Delivery: cookie`.
    REFRESH: '/refresh-token',
    PROFILE: '/profile',
    ACCOUNT: '/account',
    ACCOUNT_IDENTITIES: '/account/identities',
    ACCOUNT_IDENTITIES_LINK: '/account/identities/link',
    RECOVERY_BACKUP_CODE: '/recovery/backup-code',
    MAGIC_LINK_SEND: '/magic-link/send',
    MAGIC_LINK_VERIFY: '/magic-link/verify',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  TENANT: '/tenant',
  SERVICE: '/services',
  API: '/apis',
  PERMISSION: '/permissions',
  POLICY: '/policies',
  IDENTITY_PROVIDER: '/identity_providers',
  CLIENT: '/clients',
  API_KEY: '/api_keys',
  ROLE: '/roles',
  USER: '/users',
  REGISTRATION_FLOW: '/registration_flows',
  INVITE: '/invite',
  BRANDING: '/branding',
  EMAIL_TEMPLATE: '/email_templates',
  SMS_TEMPLATE: '/sms_templates',
  LOGIN_TEMPLATE: '/login_templates',
  AUTH_EVENTS: '/auth-events',
  WEBHOOK_ENDPOINT: '/webhook-endpoints',
  WEBHOOK_REPLAY: '/webhook-replay',
  EVENT_TYPE: '/event-types',
  TENANT_EVENT_TYPE: '/tenant-event-types',
  EVENT_ROUTE: '/event-routes',
  DASHBOARD: '/dashboard',
} as const
