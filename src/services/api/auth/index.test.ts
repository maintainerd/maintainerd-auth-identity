import { beforeEach, describe, expect, it, vi } from 'vitest'
import { post } from '../client'
import { TOKEN_DELIVERY_HEADER } from '../config'
import { sendMagicLink, verifyMagicLink, verifyMFALogin } from './index'

vi.mock('../client', () => ({
  get: vi.fn(),
  post: vi.fn(),
}))

describe('verifyMagicLink', () => {
  beforeEach(() => {
    vi.mocked(post).mockReset()
  })

  it('forwards the complete signed query to the verification endpoint', async () => {
    const signedQuery = 'token=opaque&client_id=identity&expires=1234567890&sig=signed-value%3D'
    vi.mocked(post).mockResolvedValue({ success: true })

    await verifyMagicLink(signedQuery)

    expect(post).toHaveBeenCalledWith(
      `/magic-link/verify?${signedQuery}`,
      {},
      { headers: TOKEN_DELIVERY_HEADER },
    )
  })
})

describe('sendMagicLink', () => {
  beforeEach(() => {
    vi.mocked(post).mockReset()
    vi.mocked(post).mockResolvedValue({ success: true })
  })

  it('uses only the public client context', async () => {
    await sendMagicLink('user@example.com', { clientId: 'identity' })

    expect(post).toHaveBeenCalledWith('/magic-link/send?client_id=identity', {
      email: 'user@example.com',
    })
  })
})

describe('verifyMFALogin', () => {
  it('preserves client context for a magic-link MFA challenge', async () => {
    vi.mocked(post).mockResolvedValueOnce({ success: true })
    const request = { mfa_challenge_token: 'challenge', method: 'totp', code: '123456' }

    await verifyMFALogin(request, undefined, 'identity-client')

    expect(post).toHaveBeenCalledWith(
      '/login/mfa/verify?client_id=identity-client',
      request,
      { headers: TOKEN_DELIVERY_HEADER },
    )
  })
})
