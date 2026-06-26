import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import LoginLayout from '@/components/layout/LoginLayout'
import { Button } from '@/components/ui/button'
import { authorizeOAuth } from '@/services/api/oauth'
import { useTenant } from '@/hooks/useTenant'
import { normalizeOAuthAuthorizeSearch, oauthLoginRoute } from '@/utils/oauthRedirect'

export default function OAuthAuthorizePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentTenant } = useTenant()
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function run() {
      try {
        const result = await authorizeOAuth(normalizeOAuthAuthorizeSearch(searchParams.toString()))
        if (result.redirect_uri) {
          window.location.assign(result.redirect_uri)
          return
        }
        if (result.consent_challenge) {
          navigate(`/oauth/consent/${encodeURIComponent(result.consent_challenge)}`, { replace: true })
          return
        }
        setError('Authorization could not continue.')
      } catch (err) {
        if (err instanceof Error && err.message === 'login_required') {
          navigate(oauthLoginRoute(window.location.pathname, window.location.search, currentTenant?.identifier), { replace: true })
          return
        }
        setError(err instanceof Error ? err.message : 'Authorization failed.')
      }
    }

    run()
  }, [currentTenant?.identifier, navigate, searchParams])

  return (
    <LoginLayout branding={currentTenant?.branding}>
      <div className="flex flex-col gap-8 text-center" role={error ? 'alert' : 'status'} aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className={`flex size-14 items-center justify-center rounded-full ${error ? 'bg-destructive/10' : 'bg-blue-100'}`}>
            {error ? (
              <AlertCircle className="size-7 text-destructive" />
            ) : (
              <Loader2 className="size-7 animate-spin text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {error ? 'Authorization unavailable' : 'Authorizing'}
          </h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            {error || 'Preparing the secure redirect.'}
          </p>
        </div>

        {error && (
          <Button className="w-full" onClick={() => navigate('/login', { replace: true })}>
            Back to sign in
          </Button>
        )}
      </div>
    </LoginLayout>
  )
}
