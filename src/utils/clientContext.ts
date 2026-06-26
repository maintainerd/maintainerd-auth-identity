const CLIENT_STORAGE_KEY = 'maintainerd_auth_client_id'
const TENANT_STORAGE_KEY = 'maintainerd_auth_tenant_id'

export interface PublicAuthContext {
  clientId?: string
  tenantId?: string
}

function trimParam(params: URLSearchParams, key: string): string | undefined {
  return params.get(key)?.trim() || undefined
}

function storedContext(): PublicAuthContext {
  return {
    clientId: sessionStorage.getItem(CLIENT_STORAGE_KEY)?.trim() || undefined,
    tenantId: sessionStorage.getItem(TENANT_STORAGE_KEY)?.trim() || undefined,
  }
}

export function rememberPublicAuthContext(search: string): PublicAuthContext {
  const params = new URLSearchParams(search)
  const clientId = trimParam(params, 'client_id')
  const tenantId = trimParam(params, 'tenant_id')

  if (clientId || tenantId) {
    if (clientId) {
      sessionStorage.setItem(CLIENT_STORAGE_KEY, clientId)
    } else {
      sessionStorage.removeItem(CLIENT_STORAGE_KEY)
    }
    if (tenantId) {
      sessionStorage.setItem(TENANT_STORAGE_KEY, tenantId)
    } else {
      sessionStorage.removeItem(TENANT_STORAGE_KEY)
    }
    return { clientId, tenantId }
  }

  return storedContext()
}

export function rememberClientId(search: string): string | null {
  return rememberPublicAuthContext(search).clientId ?? null
}

export function currentPublicAuthContext(): PublicAuthContext {
  return rememberPublicAuthContext(window.location.search)
}

export function requirePublicAuthContext(context: PublicAuthContext = currentPublicAuthContext()): PublicAuthContext {
  const clientId = context.clientId?.trim() || undefined
  const tenantId = context.tenantId?.trim() || undefined
  if ((clientId ? 1 : 0) + (tenantId ? 1 : 0) !== 1) {
    throw new Error('Exactly one of client_id or tenant_id is required')
  }
  return { clientId, tenantId }
}

export function publicAuthQuery(context?: PublicAuthContext): string {
  const resolved = requirePublicAuthContext(
    context?.clientId || context?.tenantId ? context : currentPublicAuthContext(),
  )
  const params = new URLSearchParams()
  if (resolved.clientId) params.set('client_id', resolved.clientId)
  if (resolved.tenantId) params.set('tenant_id', resolved.tenantId)
  return params.toString()
}

export function appendPublicAuthContext(params: URLSearchParams, context?: PublicAuthContext): URLSearchParams {
  const resolved = requirePublicAuthContext(
    context?.clientId || context?.tenantId ? context : currentPublicAuthContext(),
  )
  if (resolved.clientId) params.set('client_id', resolved.clientId)
  if (resolved.tenantId) params.set('tenant_id', resolved.tenantId)
  return params
}

export function requireClientId(): string {
  const clientId = currentPublicAuthContext().clientId
  if (!clientId) throw new Error('client_id is required')
  return clientId
}
