import { describe, expect, it } from 'vitest'
import { resolveGuardRedirect } from './postAuthRoute'

describe('resolveGuardRedirect OAuth broker routing', () => {
  const unauthenticated = {
    isAuthenticated: false,
    account: null,
    tenant: null,
  }
  const authenticated = {
    isAuthenticated: true,
    account: {
      user_id: 'user-1',
      email: 'user@example.com',
      phone: '',
      email_verified: true,
      phone_verified: false,
      profiles: [{ profile_id: 'profile-1', first_name: 'Test', last_name: null, display_name: 'Test', default: true }],
      roles: [],
      permissions: [],
      tenant: { tenant_id: 'tenant-1', name: 'system', display_name: 'System', identifier: 'system' },
    },
    tenant: {
      tenant_id: 'tenant-1',
      name: 'system',
      display_name: 'System',
      description: '',
      identifier: 'system',
      status: 'active' as const,
      is_default: true,
      is_system: true,
      created_at: '',
      updated_at: '',
    },
  }

  it('allows broker authorize requests with a hint to reach the backend before login', () => {
    expect(resolveGuardRedirect({
      ...unauthenticated,
      pathname: '/authorize',
      search: '?client_id=external&response_type=code&idp_hint=google',
    })).toBeNull()
  })

  it('routes regular authorize requests through the built-in login flow', () => {
    const redirect = resolveGuardRedirect({
      ...unauthenticated,
      pathname: '/authorize',
      search: '?client_id=external&response_type=code',
    })

    expect(redirect).toBe('/login?client_id=external&response_type=code&return_to=%2Fauthorize%3Fclient_id%3Dexternal%26response_type%3Dcode')
  })

  it('allows authenticated users to resume authorize instead of no-access', () => {
    expect(resolveGuardRedirect({
      ...authenticated,
      pathname: '/authorize',
      search: '?client_id=external&response_type=code',
    })).toBeNull()
  })

  it('allows authenticated users to complete OAuth consent instead of no-access', () => {
    expect(resolveGuardRedirect({
      ...authenticated,
      pathname: '/oauth/consent/challenge-1',
      search: '',
    })).toBeNull()
  })

  it('blocks direct registration when the client registration gate is disabled', () => {
    expect(resolveGuardRedirect({
      ...unauthenticated,
      pathname: '/register',
      registrationEnabled: false,
    })).toBe('/login')
  })

  it('routes unverified accounts through verification when the client flow requires it', () => {
    expect(resolveGuardRedirect({
      ...authenticated,
      account: { ...authenticated.account, email_verified: false },
      pathname: '/register/profile',
      verificationRequired: true,
    })).toBe('/email-verification')
  })
})
