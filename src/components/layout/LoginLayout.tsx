import { useEffect, type ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { BrandingLayout, BrandingPublic } from '@/services/api/tenants/types'
import MaintainedAuthIcon from '../icon/MaintainedAuthIcon'

type Props = {
  children: ReactNode
  branding?: BrandingPublic
}

type BrandMarkProps = {
  companyName: string
  logoUrl?: string
  panel?: boolean
}

type FooterProps = {
  companyName: string
  legalLinks: { label: string; href: string }[]
  panel?: boolean
}

function resolvedLayout(layout: BrandingPublic['layout'] | undefined): BrandingLayout {
  return layout === 'full_page' || layout === 'split' ? layout : 'centered'
}

function BrandMark({ companyName, logoUrl, panel = false }: BrandMarkProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {logoUrl ? (
        <img src={logoUrl} alt={companyName || 'Logo'} className="h-11 w-auto max-w-full object-contain" />
      ) : panel ? (
        <div className="rounded-2xl bg-white/95 p-3 shadow-sm">
          <MaintainedAuthIcon width={48} height={48} />
        </div>
      ) : (
        <MaintainedAuthIcon width={48} height={48} />
      )}
      {companyName && (
        <span className={panel ? 'text-xl font-semibold tracking-tight' : 'text-foreground text-lg font-semibold tracking-tight'}>
          {companyName}
        </span>
      )}
    </div>
  )
}

function Footer({ companyName, legalLinks, panel = false }: FooterProps) {
  if (legalLinks.length === 0 && !companyName) return null

  return (
    <div className={panel ? 'flex flex-col items-center gap-3 text-center text-current/75' : 'text-muted-foreground flex flex-col items-center gap-3 text-center'}>
      {legalLinks.length > 0 && (
        <div className="flex flex-wrap justify-center gap-5 text-sm">
          {legalLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-current"
            >
              {link.label} <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      )}
      {companyName && (
        <span className={panel ? 'text-xs' : 'text-muted-foreground/70 text-xs'}>
          © {new Date().getFullYear()} {companyName}
        </span>
      )}
    </div>
  )
}

function CenteredLayout({
  children,
  companyName,
  logoUrl,
  legalLinks,
}: {
  children: ReactNode
  companyName: string
  logoUrl?: string
  legalLinks: FooterProps['legalLinks']
}) {
  return (
    <main data-layout="centered" className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="auth-page-background pointer-events-none absolute inset-0" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8">
          <BrandMark companyName={companyName} logoUrl={logoUrl} />
        </div>
        <Card className="border-border/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-20px_rgba(15,23,42,0.25)]">
          <CardContent className="p-7 sm:p-9">{children}</CardContent>
        </Card>
        <div className="mt-8">
          <Footer companyName={companyName} legalLinks={legalLinks} />
        </div>
      </div>
    </main>
  )
}

function FullPageLayout({
  children,
  companyName,
  logoUrl,
  legalLinks,
}: {
  children: ReactNode
  companyName: string
  logoUrl?: string
  legalLinks: FooterProps['legalLinks']
}) {
  return (
    <main data-layout="full_page" className="relative min-h-svh overflow-hidden p-0 sm:p-6 lg:p-10">
      <div className="auth-page-background pointer-events-none absolute inset-0" />
      <div className="auth-full-page-panel relative z-10 mx-auto flex min-h-svh w-full max-w-4xl flex-col px-6 py-8 shadow-2xl sm:min-h-[calc(100svh-3rem)] sm:rounded-3xl sm:px-12 lg:min-h-[calc(100svh-5rem)] lg:px-20">
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <BrandMark companyName={companyName} logoUrl={logoUrl} />
            </div>
            {children}
          </div>
        </div>
        <Footer companyName={companyName} legalLinks={legalLinks} />
      </div>
    </main>
  )
}

function SplitLayout({
  children,
  companyName,
  logoUrl,
  legalLinks,
}: {
  children: ReactNode
  companyName: string
  logoUrl?: string
  legalLinks: FooterProps['legalLinks']
}) {
  return (
    <main data-layout="split" className="bg-card grid min-h-svh lg:grid-cols-[minmax(0,1.1fr)_minmax(30rem,0.9fr)]">
      <section data-testid="split-brand-panel" className="auth-split-brand-panel relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-black/10" />
        <div className="relative flex flex-1 items-center justify-center">
          <BrandMark companyName={companyName} logoUrl={logoUrl} panel />
        </div>
        <div className="relative">
          <Footer companyName={companyName} legalLinks={legalLinks} panel />
        </div>
      </section>

      <section className="bg-card text-card-foreground flex min-h-svh items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark companyName={companyName} logoUrl={logoUrl} />
          </div>
          <Card className="border-border/70 shadow-[0_16px_50px_-28px_rgba(15,23,42,0.35)]">
            <CardContent className="p-7 sm:p-9">{children}</CardContent>
          </Card>
          <div className="mt-8 lg:hidden">
            <Footer companyName={companyName} legalLinks={legalLinks} />
          </div>
        </div>
      </section>
    </main>
  )
}

const LoginLayout = ({ children, branding }: Props) => {
  const companyName = branding?.company_name || 'Maintainerd-Auth'
  const logoUrl = branding?.logo_url
  const layout = resolvedLayout(branding?.layout)
  const legalLinks = [
    branding?.support_url && { label: 'Support', href: branding.support_url },
    branding?.privacy_policy_url && { label: 'Privacy', href: branding.privacy_policy_url },
    branding?.terms_of_service_url && { label: 'Terms', href: branding.terms_of_service_url },
  ].filter(Boolean) as FooterProps['legalLinks']

  useEffect(() => {
    if (branding?.favicon_url) {
      const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']")
      if (link) link.href = branding.favicon_url
    }
  }, [branding?.favicon_url])

  const layoutProps = { children, companyName, logoUrl, legalLinks }
  if (layout === 'full_page') return <FullPageLayout {...layoutProps} />
  if (layout === 'split') return <SplitLayout {...layoutProps} />
  return <CenteredLayout {...layoutProps} />
}

export default LoginLayout
