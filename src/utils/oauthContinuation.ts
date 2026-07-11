/**
 * OAuth2 continuation — the single, shared rule for resuming a pending authorize
 * request after any interactive step (login, signup, email verification, profile
 * creation) completes.
 *
 * The industry-standard server-handle pattern (Ory `login_challenge`, Keycloak
 * auth-session, Auth0 transaction): the pending authorize request lives
 * server-side; a short opaque `request_id` is carried through each interactive
 * step in the URL and resumed via `/oauth/authorize/continue` (`continueOAuth`).
 *
 * The continueOAuth-vs-dashboard branching lives ONLY in `resumeOAuthContinuation`
 * (used by the single convergence point, LoginSuccessPage). Interactive steps use
 * `finishAuthStep`, which either routes to the next required registration detour
 * (threading the handle) or converges on LoginSuccessPage — it never calls
 * `continueOAuth` itself, so there is exactly one continuation attempt and no
 * double-consume race with the route guard.
 */
import type { NavigateFunction } from 'react-router-dom'
import type { AccountEntity } from '@/services/api/auth/types'
import type { TenantEntity } from '@/services/api/tenants/types'
import { continueOAuth } from '@/services/api/oauth'
import { ACCOUNT_ROUTE, LOGIN_SUCCESS_ROUTE, resolvePostAuthRoute } from '@/utils/postAuthRoute'
import {
  clearInviteCallback,
  clearOAuthReturnTo,
  consumeInviteCallback,
  consumeOAuthReturnTo,
  withRequestId,
} from '@/utils/oauthRedirect'

export type AuthStepOutcome = 'continued' | 'detour' | 'dashboard'

export interface FinishAuthStepInput {
  account: AccountEntity | null | undefined
  tenant?: TenantEntity | null
  requestId?: string
  verificationRequired?: boolean
  navigate: NavigateFunction
}

/**
 * Apply the single continuation rule when an interactive step completes:
 *  - account NOT yet fully registered → next required detour step, with the
 *    request_id threaded into the URL (so the handle survives each hop);
 *  - account fully registered → converge on LoginSuccessPage (threading the
 *    handle), which performs the one OAuth continuation or lands on the
 *    dashboard. When there is no pending handle, the legacy sessionStorage
 *    return-to is cleared here so a stale entry can't hijack a direct login.
 *
 * Returns the outcome so callers can react (e.g. a success toast on 'dashboard').
 */
export function finishAuthStep(input: FinishAuthStepInput): AuthStepOutcome {
  const { account, tenant, requestId, verificationRequired, navigate } = input
  const dest = resolvePostAuthRoute(account, tenant, verificationRequired ? { verificationRequired } : undefined)

  if (dest !== LOGIN_SUCCESS_ROUTE) {
    navigate(withRequestId(dest, requestId), { replace: true })
    return 'detour'
  }

  if (requestId) {
    navigate(withRequestId(LOGIN_SUCCESS_ROUTE, requestId), { replace: true })
    return 'continued'
  }

  // Direct completion (no pending OAuth handle): drop any stale continuation
  // markers so LoginSuccessPage lands on the dashboard rather than resuming a
  // stale request, then converge on LoginSuccessPage.
  clearOAuthReturnTo()
  clearInviteCallback()
  navigate(LOGIN_SUCCESS_ROUTE, { replace: true })
  return 'dashboard'
}

/**
 * The sole OAuth continuation attempt (called only by LoginSuccessPage). Resumes
 * the server-side authorize request with the opaque handle + the httpOnly session
 * cookie (sent automatically). Returns true when it initiated a redirect or
 * navigation (the caller must stop); false when there is nothing to continue.
 *
 * Primary mechanism = `request_id` in the URL. The sessionStorage return-to /
 * invite callback are kept ONLY as a defensive fallback (e.g. a mid-flight
 * refresh before the handle was threaded).
 */
export async function resumeOAuthContinuation(
  requestId: string | undefined,
  navigate: NavigateFunction,
): Promise<boolean> {
  if (requestId) {
    try {
      const result = await continueOAuth(requestId)
      if (result.redirect_uri) {
        window.location.assign(result.redirect_uri)
        return true
      }
      if (result.consent_challenge) {
        navigate(`/oauth/consent/${encodeURIComponent(result.consent_challenge)}`, { replace: true })
        return true
      }
    } catch {
      // Continuation failed → fall through to the defensive fallbacks / dashboard.
    }
  }

  const returnTo = consumeOAuthReturnTo()
  if (returnTo) {
    navigate(returnTo, { replace: true })
    return true
  }

  const inviteCallback = consumeInviteCallback()
  if (inviteCallback) {
    window.location.assign(inviteCallback)
    return true
  }

  return false
}

/** Convenience terminal destination for a finished user with nothing to resume. */
export { ACCOUNT_ROUTE }
