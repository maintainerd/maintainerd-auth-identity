import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearTenantBootstrapContext,
  currentPublicAuthContext,
  publicAuthQuery,
  rememberPublicAuthContext,
  resolvePublicAuthContext,
  setTenantBootstrapContext,
} from './clientContext'

beforeEach(() => {
  sessionStorage.clear()
  clearTenantBootstrapContext()
})

afterEach(() => {
  sessionStorage.clear()
  clearTenantBootstrapContext()
})

describe('rememberPublicAuthContext', () => {
  it('reads the explicit client_id and sources tenant_id from the bootstrap', () => {
    setTenantBootstrapContext({ tenantSlug: 'acme', defaultClientId: 'acme-identity' })
    expect(rememberPublicAuthContext('?client_id=external')).toEqual({
      clientId: 'external',
      tenantId: 'acme',
    })
  })

  it('ignores a user-supplied tenant_id and uses the bootstrap slug', () => {
    setTenantBootstrapContext({ tenantSlug: 'acme' })
    const ctx = rememberPublicAuthContext('?tenant_id=evil')
    expect(ctx.tenantId).toBe('acme')
    expect(ctx.clientId).toBeUndefined()
  })

  it('reports the bootstrap tenant slug through the ambient context', () => {
    setTenantBootstrapContext({ tenantSlug: 'acme' })
    expect(currentPublicAuthContext().tenantId).toBe('acme')
  })
})

describe('resolvePublicAuthContext — ambient (first-party direct navigation)', () => {
  it('uses the tenant default identity client when nothing is supplied', () => {
    setTenantBootstrapContext({ tenantSlug: 'acme', defaultClientId: 'acme-identity' })
    expect(resolvePublicAuthContext()).toEqual({ clientId: 'acme-identity' })
  })

  it('falls back to the bootstrap tenant slug when no client is available', () => {
    setTenantBootstrapContext({ tenantSlug: 'acme' })
    expect(resolvePublicAuthContext()).toEqual({ tenantId: 'acme' })
  })

  it('prefers a persisted/explicit client_id over the default client', () => {
    setTenantBootstrapContext({ tenantSlug: 'acme', defaultClientId: 'acme-identity' })
    rememberPublicAuthContext('?client_id=external') // persists to sessionStorage
    expect(resolvePublicAuthContext()).toEqual({ clientId: 'external' })
  })
})

describe('resolvePublicAuthContext — explicit signed-flow context', () => {
  it('forwards an explicit tenant_id verbatim, without the default-client fallback', () => {
    setTenantBootstrapContext({ tenantSlug: 'acme', defaultClientId: 'acme-identity' })
    expect(resolvePublicAuthContext({ tenantId: 'acme' })).toEqual({ tenantId: 'acme' })
  })

  it('forwards an explicit client_id verbatim', () => {
    setTenantBootstrapContext({ tenantSlug: 'acme', defaultClientId: 'acme-identity' })
    expect(resolvePublicAuthContext({ clientId: 'reset-client' })).toEqual({ clientId: 'reset-client' })
  })
})

describe('publicAuthQuery', () => {
  it('emits client_id for the tenant default first-party client', () => {
    setTenantBootstrapContext({ tenantSlug: 'acme', defaultClientId: 'acme-identity' })
    expect(publicAuthQuery()).toBe('client_id=acme-identity')
  })

  it('emits tenant_id from an explicit first-party context', () => {
    expect(publicAuthQuery({ tenantId: 'acme' })).toBe('tenant_id=acme')
  })
})
