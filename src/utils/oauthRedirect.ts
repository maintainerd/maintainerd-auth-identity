const OAUTH_RETURN_KEY = 'maintainerd_auth_oauth_return_to'
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

export function oauthLoginRoute(pathname: string, search: string, tenantIdentifier?: string | null): string {
  const current = `${pathname}${search}`
  const params = new URLSearchParams(search)
  params.set('return_to', current)
  if (!params.get('client_id') && !params.get('tenant_id') && tenantIdentifier) {
    params.set('tenant_id', tenantIdentifier)
  }
  rememberOAuthReturnTo(current)
  const query = params.toString()
  return query ? `/login?${query}` : '/login'
}
