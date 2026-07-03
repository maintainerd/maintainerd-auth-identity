/**
 * Post-authentication routing
 *
 * Single source of truth for "where should this user go now?" once we have a
 * session (after login, MFA, registration, or email verification). All callers
 * — LoginForm, RegisterForm, VerifyEmailPage, RegisterProfilePage —
 * must use this so the registration/verification flow stays consistent.
 *
 * Decision order (mirrors the backend gating):
 *   1. tenant requires email verification AND email not verified → /email-verification
 *   2. no profile yet                                            → /register/profile
 *   3. otherwise                                                 → /login-success
 */

import type { AccountEntity } from '@/services/api/auth/types'
import type { TenantEntity } from '@/services/api/tenants/types'
import { getTenantIdentifierFromPath } from '@/utils/tenant'
import { isBrokerAuthorizeRoute, isOAuthInteractionRoute, oauthLoginRoute } from '@/utils/oauthRedirect'

export const VERIFY_EMAIL_ROUTE = '/email-verification'
export const REGISTER_PROFILE_ROUTE = '/register/profile'
export const REGISTER_ROUTE = '/register'
export const REGISTER_INVITE_ROUTE = '/register/invite'
export const LOGIN_ROUTE = '/login'
export const MAGIC_LINK_ROUTE = '/magic-link'
export const NO_ACCESS_ROUTE = '/no-access'
export const SERVICE_UNAVAILABLE_ROUTE = '/service-unavailable'
export const LOGIN_SUCCESS_ROUTE = '/login-success'

// Public auth pages an authenticated, fully-registered user should never sit on.
const AUTH_PAGES = [
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  REGISTER_INVITE_ROUTE,
  '/forgot-password',
  '/reset-password',
  MAGIC_LINK_ROUTE,
]

function isAuthPage(pathname: string): boolean {
  if (AUTH_PAGES.includes(pathname)) return true
  return /^\/[^/]+\/login$/.test(pathname)
}

export function loginSuccessRoute(): string {
  return LOGIN_SUCCESS_ROUTE
}

export function resolvePostAuthRoute(
  account: AccountEntity | null | undefined,
  tenant?: TenantEntity | null,
  registration?: { verificationRequired?: boolean },
): string {
  if (!account) {
    return REGISTER_PROFILE_ROUTE
  }

  if ((tenant?.registration_config?.require_email_verification || registration?.verificationRequired) && !account.email_verified) {
    return VERIFY_EMAIL_ROUTE
  }

  if (!account.profiles?.length) {
    return REGISTER_PROFILE_ROUTE
  }

  return LOGIN_SUCCESS_ROUTE
}

export interface GuardContext {
  pathname: string
  search?: string
  isAuthenticated: boolean
  account: AccountEntity | null | undefined
  tenant: TenantEntity | null | undefined
  registrationEnabled?: boolean
  verificationRequired?: boolean
}

/**
 * The single source of truth for "should this URL be allowed to render, and if
 * not, where should we send the user?" — given the current path and session.
 *
 * Returns a path to redirect to, or `null` to render the requested route.
 * Used by the app bootstrap gate on first load/reload and by the runtime route
 * guard, so all of login / register / email-verification / profile / success
 * gating lives here instead of being scattered across pages.
 *
 * Callers must only invoke this once auth+tenant initialization has completed
 * (otherwise account/tenant are not yet known).
 */
export function resolveGuardRedirect(ctx: GuardContext): string | null {
  const { pathname, search = '', isAuthenticated, account, tenant, registrationEnabled, verificationRequired } = ctx

  if (pathname === NO_ACCESS_ROUTE || pathname === SERVICE_UNAVAILABLE_ROUTE) {
    return null
  }

  const home = isAuthenticated ? resolvePostAuthRoute(account, tenant, { verificationRequired }) : LOGIN_ROUTE

  if (pathname === '/') {
    return home
  }

  if (
    pathname === REGISTER_ROUTE &&
    !isAuthenticated &&
    (registrationEnabled === false || tenant?.registration_config?.self_registration_enabled === false)
  ) {
    return LOGIN_ROUTE
  }

  if (isAuthPage(pathname)) {
    return isAuthenticated ? home : null
  }

  if (pathname === VERIFY_EMAIL_ROUTE) {
    if (!isAuthenticated) return null
    return home === VERIFY_EMAIL_ROUTE ? null : home
  }

  if (pathname === REGISTER_PROFILE_ROUTE) {
    if (!isAuthenticated) return LOGIN_ROUTE
    return home === REGISTER_PROFILE_ROUTE ? null : home
  }

  if (pathname === LOGIN_SUCCESS_ROUTE) {
    if (!isAuthenticated) return LOGIN_ROUTE
    return null
  }

  if (!isAuthenticated) {
    if (isBrokerAuthorizeRoute(pathname, search)) {
      return null
    }
    if (isOAuthInteractionRoute(pathname)) {
      return oauthLoginRoute(pathname, search, tenant?.identifier)
    }
    return LOGIN_ROUTE
  }
  if (home !== LOGIN_SUCCESS_ROUTE) return home

  if (isOAuthInteractionRoute(pathname)) {
    return null
  }

  const urlTenant = getTenantIdentifierFromPath(pathname)
  const ownTenant = account?.tenant?.identifier
  if (urlTenant && ownTenant && urlTenant !== ownTenant) return NO_ACCESS_ROUTE

  return null
}
