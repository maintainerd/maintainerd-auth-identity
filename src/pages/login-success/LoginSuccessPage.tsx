import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LoginLayout from '@/components/layout/LoginLayout'
import { useAuth } from '@/hooks/useAuth'
import { useTenant } from '@/hooks/useTenant'
import { useToast } from '@/hooks/useToast'

export default function LoginSuccessPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { currentTenant } = useTenant()
  const { showError } = useToast()

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
            You are now authenticated. OAuth2 callback handling will be configured separately.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </LoginLayout>
  )
}
