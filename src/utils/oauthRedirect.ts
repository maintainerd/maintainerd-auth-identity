const OAUTH_RETURN_KEY = 'maintainerd_auth_oauth_return_to'
const INVITE_CALLBACK_KEY = 'maintainerd_auth_invite_callback'
const AUTHORIZE_ROUTES = ['/authorize', '/oauth/authorize']
const BROKER_HINT_PARAMS = ['idp_hint', 'provider_hint', 'identity_provider', 'connection']

const OAUTH_INTERACTION_ROUTES = [
  ...AUTHORIZE_ROUTES,
  '/device',
  '/ciba',
  '/oauth/consent',
  '/oauth/device',
  '/oauth/ciba',
  '/oauth/grants',
  '/oauth/end_session',
  '/oauth/end-session',
]

export function isOAuthInteractionRoute(pathname: string): boolean {
  return OAUTH_INTERACTION_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function isOAuthAuthorizeRoute(pathname: string): boolean {
  return AUTHORIZE_ROUTES.includes(pathname)
}

export function brokerHintFromParams(params: URLSearchParams): string | null {
  for (const key of BROKER_HINT_PARAMS) {
    const value = params.get(key)?.trim()
    if (value) return value
  }
  return null
}

export function isBrokerAuthorizeRoute(pathname: string, search: string): boolean {
  if (!isOAuthAuthorizeRoute(pathname)) return false
  return brokerHintFromParams(new URLSearchParams(search)) !== null
}

export function normalizeOAuthAuthorizeSearch(search: string): string {
  const params = new URLSearchParams(search)
  const hint = brokerHintFromParams(params)
  if (hint) {
    params.set('idp_hint', hint)
    for (const key of BROKER_HINT_PARAMS) {
      if (key !== 'idp_hint') params.delete(key)
    }
  }
  return params.toString()
}

export function safeOAuthReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin) return null
    if (!isOAuthInteractionRoute(url.pathname)) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function rememberOAuthReturnTo(value: string | null | undefined): string | null {
  const safe = safeOAuthReturnTo(value)
  if (safe) sessionStorage.setItem(OAUTH_RETURN_KEY, safe)
  return safe
}

export function consumeOAuthReturnTo(): string | null {
  const safe = safeOAuthReturnTo(sessionStorage.getItem(OAUTH_RETURN_KEY))
  sessionStorage.removeItem(OAUTH_RETURN_KEY)
  return safe
}

export function clearOAuthReturnTo(): void {
  sessionStorage.removeItem(OAUTH_RETURN_KEY)
}

export function oauthLoginRoute(pathname: string, search: string): string {
  const current = `${pathname}${search}`
  const params = new URLSearchParams(search)
  params.set('return_to', current)
  // The tenant is resolved from the subdomain (utils/tenant), so it is never
  // injected into the login URL. Any OAuth `client_id` already present in the
  // authorize search is preserved as-is.
  rememberOAuthReturnTo(current)
  const query = params.toString()
  return query ? `/login?${query}` : '/login'
}

function safeExternalRedirect(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('https://')) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return null
    return url
  } catch {
    return null
  }
}

export function rememberInviteCallback(url: string | null | undefined): string | null {
  const safe = safeExternalRedirect(url)
  if (safe) sessionStorage.setItem(INVITE_CALLBACK_KEY, safe)
  return safe
}

export function consumeInviteCallback(): string | null {
  const value = sessionStorage.getItem(INVITE_CALLBACK_KEY)
  sessionStorage.removeItem(INVITE_CALLBACK_KEY)
  return safeExternalRedirect(value)
}

export function clearInviteCallback(): void {
  sessionStorage.removeItem(INVITE_CALLBACK_KEY)
}
