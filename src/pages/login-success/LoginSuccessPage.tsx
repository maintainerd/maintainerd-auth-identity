import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LoginLayout from '@/components/layout/LoginLayout'
import { useAuth } from '@/hooks/useAuth'
import { useTenant } from '@/hooks/useTenant'
import { useToast } from '@/hooks/useToast'
import { consumeOAuthReturnTo, consumeInviteCallback } from '@/utils/oauthRedirect'
import { fetchMFAStatus } from '@/services/api/mfa'

export default function LoginSuccessPage() {
  const navigate = useNavigate()
  const { logout, isAuthenticated } = useAuth()
  const { currentTenant } = useTenant()
  const { showError } = useToast()
  const redirectedRef = useRef(false)
  const [mfaNudgeDismissed, setMfaNudgeDismissed] = useState(false)

  // MFA enrollment nudge: after a completed sign-in, if the user has no second
  // factor enrolled we gently prompt them to set one up. Non-blocking — the
  // session is fully usable and the prompt can be dismissed.
  const { data: mfaStatus } = useQuery({
    queryKey: ['mfa', 'status'],
    queryFn: fetchMFAStatus,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })

  const hasNoFactors =
    !!mfaStatus &&
    !mfaStatus.is_totp_enabled &&
    !mfaStatus.is_webauthn_enabled &&
    !mfaStatus.is_sms_available &&
    !mfaStatus.is_email_otp_available
  const showMfaNudge = hasNoFactors && !mfaNudgeDismissed

  useEffect(() => {
    if (redirectedRef.current) return

    const oauthReturnTo = consumeOAuthReturnTo()
    if (oauthReturnTo) {
      redirectedRef.current = true
      navigate(oauthReturnTo, { replace: true })
      return
    }

    const inviteCallback = consumeInviteCallback()
    if (inviteCallback) {
      redirectedRef.current = true
      window.location.assign(inviteCallback)
      return
    }
  }, [navigate])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      showError(error, 'Logout failed')
      navigate('/login')
    }
  }

  return (
    <LoginLayout branding={currentTenant?.branding}>
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-50">
          <Check className="size-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">You&apos;re signed in</h1>
          <p className="text-muted-foreground">
            You can continue from this session or sign out when you are done.
          </p>
        </div>
        {showMfaNudge && (
          <div className="w-full max-w-sm rounded-lg border border-primary/30 bg-primary/5 p-4 text-left">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Add an extra layer of security</p>
                <p className="text-sm text-muted-foreground">
                  Your account has no two-factor authentication set up. Enable it to
                  better protect your account.
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => navigate('/account/mfa')}>
                Set up MFA
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMfaNudgeDismissed(true)}>
                Not now
              </Button>
            </div>
          </div>
        )}
        <Button variant="outline" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </LoginLayout>
  )
}
