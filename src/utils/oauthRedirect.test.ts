import { beforeEach, describe, expect, it } from 'vitest'
import {
  brokerHintFromParams,
  consumeOAuthReturnTo,
  isBrokerAuthorizeRoute,
  isOAuthInteractionRoute,
  normalizeOAuthAuthorizeSearch,
  oauthLoginRoute,
  rememberOAuthReturnTo,
  safeOAuthReturnTo,
} from './oauthRedirect'

describe('oauthRedirect', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('recognizes short and namespaced OAuth interaction routes', () => {
    expect(isOAuthInteractionRoute('/authorize')).toBe(true)
    expect(isOAuthInteractionRoute('/oauth/authorize')).toBe(true)
    expect(isOAuthInteractionRoute('/oauth/consent/challenge-1')).toBe(true)
    expect(isOAuthInteractionRoute('/oauth/end_session')).toBe(true)
    expect(isOAuthInteractionRoute('/login')).toBe(false)
  })

  it('recognizes and normalizes broker authorize hints', () => {
    expect(isBrokerAuthorizeRoute('/authorize', '?client_id=external&idp_hint=google')).toBe(true)
    expect(isBrokerAuthorizeRoute('/oauth/authorize', '?client_id=external&provider_hint=google')).toBe(true)
    expect(isBrokerAuthorizeRoute('/oauth/consent/challenge-1', '?idp_hint=google')).toBe(false)
    expect(brokerHintFromParams(new URLSearchParams('identity_provider=okta'))).toBe('okta')

    const normalized = new URLSearchParams(normalizeOAuthAuthorizeSearch('client_id=external&provider_hint=google'))
    expect(normalized.get('idp_hint')).toBe('google')
    expect(normalized.has('provider_hint')).toBe(false)
  })

  it('accepts only same-origin OAuth return paths', () => {
    expect(safeOAuthReturnTo('/authorize?client_id=external')).toBe('/authorize?client_id=external')
    expect(safeOAuthReturnTo('/oauth/consent/challenge-1')).toBe('/oauth/consent/challenge-1')
    expect(safeOAuthReturnTo('/dashboard')).toBeNull()
    expect(safeOAuthReturnTo('//evil.example/authorize')).toBeNull()
    expect(safeOAuthReturnTo('https://evil.example/authorize')).toBeNull()
  })

  it('stores and consumes OAuth return targets once', () => {
    expect(rememberOAuthReturnTo('/device?user_code=ABCD-EFGH')).toBe('/device?user_code=ABCD-EFGH')
    expect(consumeOAuthReturnTo()).toBe('/device?user_code=ABCD-EFGH')
    expect(consumeOAuthReturnTo()).toBeNull()
  })

  it('builds a login URL that preserves OAuth query and stores return_to', () => {
    const route = oauthLoginRoute('/authorize', '?client_id=external&scope=openid', 'acme')
    const url = new URL(route, window.location.origin)

    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('client_id')).toBe('external')
    expect(url.searchParams.get('tenant_id')).toBeNull()
    expect(url.searchParams.get('return_to')).toBe('/authorize?client_id=external&scope=openid')
    expect(consumeOAuthReturnTo()).toBe('/authorize?client_id=external&scope=openid')
  })

  it('adds tenant context for first-party OAuth URLs without an explicit client or tenant', () => {
    const route = oauthLoginRoute('/device', '?user_code=ABCD-EFGH', 'acme')
    const url = new URL(route, window.location.origin)

    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('tenant_id')).toBe('acme')
    expect(url.searchParams.get('return_to')).toBe('/device?user_code=ABCD-EFGH')
  })
})
