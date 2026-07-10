import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Mail, AtSign, KeyRound } from 'lucide-react'
import AccountLayout from '@/components/layout/AccountLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { changeUsername, initiateEmailChange, fetchAccountInfo } from '@/services/api/account'
import { forgotPassword } from '@/services/api/auth'

interface UsernameForm {
  username: string
}

interface EmailForm {
  new_email: string
}

export default function AccountSecurityPage() {
  const { showError } = useToast()
  const [emailSent, setEmailSent] = useState(false)
  const [passwordResetSent, setPasswordResetSent] = useState(false)

  const { data: account } = useQuery({
    queryKey: ['account', 'info'],
    queryFn: fetchAccountInfo,
  })

  const usernameForm = useForm<UsernameForm>()
  const emailForm = useForm<EmailForm>()

  const usernameMutation = useMutation({
    mutationFn: (data: UsernameForm) => changeUsername(data.username),
    onSuccess: () => usernameForm.reset(),
    onError: (err) => showError(err, 'Could not update username'),
  })

  const emailMutation = useMutation({
    mutationFn: (data: EmailForm) => initiateEmailChange(data.new_email),
    onSuccess: () => {
      setEmailSent(true)
      emailForm.reset()
    },
    onError: (err) => {
      const status = (err as { status?: number }).status
      if (status === 403) {
        showError(new Error('Step-up authentication required. Please verify your identity first.'))
      } else {
        showError(err, 'Could not initiate email change')
      }
    },
  })

  const passwordResetMutation = useMutation({
    mutationFn: () => forgotPassword({ email: account?.email ?? '' }),
    onSuccess: () => setPasswordResetSent(true),
    onError: (err) => showError(err, 'Could not send password reset'),
  })

  return (
    <AccountLayout title="Security">
      <div className="space-y-4">
        {/* Username */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AtSign className="size-4" />
              Username
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={usernameForm.handleSubmit((data) => usernameMutation.mutate(data))}
              className="flex gap-2"
            >
              <div className="flex-1">
                <Label htmlFor="username" className="sr-only">
                  New username
                </Label>
                <Input
                  id="username"
                  placeholder="New username"
                  {...usernameForm.register('username', { required: true })}
                />
              </div>
              <Button type="submit" disabled={usernameMutation.isPending}>
                Save
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4" />
              Email address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <p className="text-sm text-muted-foreground">
                Check your new inbox for a verification link to confirm the change.
              </p>
            ) : (
              <form
                onSubmit={emailForm.handleSubmit((data) => emailMutation.mutate(data))}
                className="flex gap-2"
              >
                <div className="flex-1">
                  <Label htmlFor="new_email" className="sr-only">
                    New email address
                  </Label>
                  <Input
                    id="new_email"
                    type="email"
                    placeholder="New email address"
                    {...emailForm.register('new_email', { required: true })}
                  />
                </div>
                <Button type="submit" disabled={emailMutation.isPending}>
                  Send link
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4" />
              Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              To change your password, we&apos;ll send you a password reset link to your current email address.
            </p>
            {passwordResetSent ? (
              <p className="text-sm text-green-600">
                Check your email for a password reset link.
              </p>
            ) : (
              <Button
                variant="outline"
                disabled={passwordResetMutation.isPending || !account?.email}
                onClick={() => passwordResetMutation.mutate()}
              >
                Send password reset link
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  )
}
