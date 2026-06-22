import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTenant } from '@/hooks/useTenant'
import { SERVICE_UNAVAILABLE_ROUTE } from '@/utils/postAuthRoute'
import AppLoadingScreen from '@/components/layout/AppLoadingScreen'
import { RouteGuard } from './RouteGuard'
import { fetchPublicClient } from '@/services/api/public-client'
import { rememberClientId } from '@/utils/clientContext'

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
      const clientId = rememberClientId(location.search)
      if (!clientId) {
        setTenantSettled(true)
        return
      }
      try {
        const client = await fetchPublicClient(clientId)
        const tenantIdentifier = client.tenant_id
        if (lastTenantIdentifierRef.current === tenantIdentifier) return
        lastTenantIdentifierRef.current = tenantIdentifier
        await initializeTenant(tenantIdentifier)
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
    location.pathname.startsWith('/register') ||
    /^\/[^/]+\/login$/.test(location.pathname)

  if (!currentTenant && tenantError && !isExemptFromServiceCheck) {
    return <Navigate to={SERVICE_UNAVAILABLE_ROUTE} replace />
  }

  return <RouteGuard>{children}</RouteGuard>
}

export default AppBootstrap
