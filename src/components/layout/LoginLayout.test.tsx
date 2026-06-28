import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { BrandingPublic } from '@/services/api/tenants/types'
import LoginLayout from './LoginLayout'

const branding: BrandingPublic = {
  layout: 'centered',
  company_name: 'Acme',
  logo_url: '',
  favicon_url: '',
  support_url: 'https://example.com/support',
  privacy_policy_url: '',
  terms_of_service_url: '',
  metadata: null,
}

describe('LoginLayout', () => {
  it.each(['centered', 'full_page', 'split'] as const)('renders the %s layout', (layout) => {
    render(
      <LoginLayout branding={{ ...branding, layout }}>
        <span>Authentication form</span>
      </LoginLayout>,
    )

    expect(screen.getByRole('main')).toHaveAttribute('data-layout', layout)
    expect(screen.getByText('Authentication form')).toBeInTheDocument()
  })

  it('renders the split brand panel only for split layout', () => {
    const { rerender } = render(
      <LoginLayout branding={{ ...branding, layout: 'split' }}>
        <span>Authentication form</span>
      </LoginLayout>,
    )
    expect(screen.getByTestId('split-brand-panel')).toBeInTheDocument()

    rerender(
      <LoginLayout branding={{ ...branding, layout: 'centered' }}>
        <span>Authentication form</span>
      </LoginLayout>,
    )
    expect(screen.queryByTestId('split-brand-panel')).not.toBeInTheDocument()
  })

  it('defaults to centered when branding is absent', () => {
    render(
      <LoginLayout>
        <span>Setup form</span>
      </LoginLayout>,
    )

    expect(screen.getByRole('main')).toHaveAttribute('data-layout', 'centered')
  })
})
