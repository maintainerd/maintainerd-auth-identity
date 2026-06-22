import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import LoginForm from './LoginForm'

const { sendMagicLinkMock, loginMock, navigateMock } = vi.hoisted(() => ({
  sendMagicLinkMock: vi.fn(),
  loginMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('@/services/api/auth', async () => {
  const actual = await vi.importActual<typeof import('@/services/api/auth')>('@/services/api/auth')
  return { ...actual, sendMagicLink: sendMagicLinkMock }
})

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ login: loginMock }),
}))

vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    getCurrentTenant: () => ({
      identifier: 'acme',
      registration_config: { self_registration_enabled: true },
    }),
  }),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showSuccess: vi.fn() }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

describe('LoginForm passwordless sign-in', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires a valid email without requiring a password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginForm />, { route: '/login?client_id=identity', path: '/login' })

    await user.click(screen.getByRole('button', { name: 'Email me a sign-in link' }))

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(sendMagicLinkMock).not.toHaveBeenCalled()
  })

  it('shows progress and a check-email state for a client-scoped request', async () => {
    const user = userEvent.setup()
    let finishSending!: () => void
    sendMagicLinkMock.mockReturnValueOnce(new Promise<void>((resolve) => { finishSending = resolve }))
    renderWithProviders(<LoginForm />, { route: '/login?client_id=identity', path: '/login' })

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'user@example.com')
    await user.click(screen.getByRole('button', { name: 'Email me a sign-in link' }))

    expect(await screen.findByRole('button', { name: 'Sending sign-in link...' })).toBeDisabled()
    expect(sendMagicLinkMock).toHaveBeenCalledWith('user@example.com', {
      clientId: 'identity',
    })

    finishSending()
    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Back to password sign in' })).toBeEnabled())
  })

  it('shows the backend error when no account exists for the email', async () => {
    const user = userEvent.setup()
    sendMagicLinkMock.mockRejectedValueOnce(new Error('no account found with that email address'))
    renderWithProviders(<LoginForm />, { route: '/login?client_id=identity', path: '/login' })

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'missing@example.com')
    await user.click(screen.getByRole('button', { name: 'Email me a sign-in link' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('no account found with that email address')
    expect(screen.queryByRole('heading', { name: 'Check your email' })).not.toBeInTheDocument()
  })
})
