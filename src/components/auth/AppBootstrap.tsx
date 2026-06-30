import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTenant } from '@/hooks/useTenant'
import { SERVICE_UNAVAILABLE_ROUTE } from '@/utils/postAuthRoute'
import AppLoadingScreen from '@/components/layout/AppLoadingScreen'
import { RouteGuard } from './RouteGuard'
import { fetchPublicClient } from '@/services/api/public-client'
import { rememberPublicAuthContext } from '@/utils/clientContext'
import { isOAuthInteractionRoute } from '@/utils/oauthRedirect'
import { applyBranding, getBrandingBackground } from '@/utils/branding'
import { fetchOAuthConnections } from '@/services/api/oauth'
import type { BrandingPublic } from '@/services/api/tenants/types'

/**
 * App initialization gate.
 *
 * Runs once on first load / reload / direct-URL entry: kicks off auth and tenant
 * initialization and shows a single full-screen loading splash until both have
 * settled. Only then does it render the route tree (wrapped in RouteGuard, which
 * decides where the user actually belongs).
 *
 * It is NOT re-shown during in-app navigation — once the app has booted, the
 * splash never returns; runtime gating is handled instantly by RouteGuard.
 */
export function AppBootstrap({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { initializeAuth, isInitialized } = useAuth()
  const { initializeTenant, currentTenant, error: tenantError } = useTenant()

  const authStartedRef = useRef(false)
  const lastTenantIdentifierRef = useRef<string | null | undefined>(undefined)
  const [tenantSettled, setTenantSettled] = useState(false)
  const [clientBranding, setClientBranding] = useState<BrandingPublic | null>(null)

  // Tenant branding is a document-level concern: every auth route consumes the
  // same semantic CSS tokens, and cleanup prevents one tenant's theme leaking
  // into the next tenant after an in-app context switch.
  useLayoutEffect(() => {
    const resolvedBranding = clientBranding ?? currentTenant?.branding
    const metadata = resolvedBranding?.metadata
    return applyBranding(
      metadata?.colors,
      metadata?.font,
      getBrandingBackground(metadata),
    )
  }, [clientBranding, currentTenant?.branding])

  // Initialize auth once on mount (fetches /account if a session cookie exists).
  useEffect(() => {
    if (authStartedRef.current) return
    authStartedRef.current = true
    initializeAuth().catch(() => {
      /* handled inside initializeAuth */
    })
  }, [initializeAuth])

  // Initialize tenant from the current URL. Re-runs on tenant switches but never
  // un-settles, so the splash only appears for the very first resolution.
  useEffect(() => {
    const run = async () => {
      const { clientId, tenantId } = rememberPublicAuthContext(location.search)
      setClientBranding(null)
      if (!clientId && !tenantId) {
        setTenantSettled(true)
        return
      }
      try {
        const tenantIdentifier = tenantId || (await fetchPublicClient(clientId!)).tenant_id
        if (lastTenantIdentifierRef.current !== tenantIdentifier) {
          lastTenantIdentifierRef.current = tenantIdentifier
          await initializeTenant(tenantIdentifier)
        }
        if (clientId) {
          try {
            const connections = await fetchOAuthConnections(clientId)
            setClientBranding(connections.branding
              ? { ...connections.branding, layout: connections.branding.layout as BrandingPublic['layout'] }
              : null)
          } catch {
            setClientBranding(null)
          }
        }
      } catch {
        /* discovery or tenant initialization failed */
      } finally {
        setTenantSettled(true)
      }
    }
    run()
  }, [location.search, initializeTenant])

  const ready = isInitialized && tenantSettled
  if (!ready) {
    return <AppLoadingScreen branding={currentTenant?.branding} />
  }

  const isExemptFromServiceCheck =
    location.pathname === SERVICE_UNAVAILABLE_ROUTE ||
    location.pathname.startsWith('/setup') ||
    location.pathname === '/login' ||
    location.pathname === '/magic-link' ||
    location.pathname === '/reset-password' ||
    isOAuthInteractionRoute(location.pathname) ||
    location.pathname.startsWith('/register') ||
    /^\/[^/]+\/login$/.test(location.pathname)

  if (!currentTenant && tenantError && !isExemptFromServiceCheck) {
    return <Navigate to={SERVICE_UNAVAILABLE_ROUTE} replace />
  }

  return <RouteGuard>{children}</RouteGuard>
}

export default AppBootstrap
