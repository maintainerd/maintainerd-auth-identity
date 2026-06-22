import { useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { FormInputField, FormPasswordField, FormSubmitButton } from "@/components/form"
import { buildLoginSchema, type LoginFormData } from "@/lib/validations"
import { useToast } from "@/hooks/useToast"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useTenant } from "@/hooks/useTenant"
import { LoginMFAStep } from "./LoginMFAStep"
import { resolvePostAuthRoute, loginSuccessRoute } from "@/utils/postAuthRoute"
import type { AccountEntity } from '@/services/api/auth/types'
import { sendMagicLink } from '@/services/api/auth'
import { Button } from '@/components/ui/button'

const LoginForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const { getCurrentTenant } = useTenant()
  const { showSuccess } = useToast()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [mfaChallenge, setMfaChallenge] = useState<{ token: string; methods: string[] } | null>(null)
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const currentTenant = getCurrentTenant()
  const loginSchema = buildLoginSchema()
  const showSignUp = currentTenant?.registration_config?.self_registration_enabled !== false

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit'
  })

const finishLogin = (account: AccountEntity | null | undefined) => {
    const dest = resolvePostAuthRoute(account, currentTenant)
    // Only celebrate a completed sign-in; the verify/profile detours are
    // continuations of an incomplete registration, not a finished login.
    if (dest === loginSuccessRoute()) {
      showSuccess("Login successful!")
    }
    navigate(dest, { replace: true })
  }

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null)
    try {
      const response = await login(data.email, data.password)
      // MFA enrolled — show the second step; the session is issued there.
      if (response.mfaRequired) {
        setMfaChallenge({ token: response.challengeToken ?? '', methods: response.allowedMethods ?? [] })
        return
      }
      finishLogin(response.account)
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error ? err.message : (err as { message?: string })?.message) || "Invalid email or password"

      if (errorMessage === 'email is not verified') {
        localStorage.setItem('register_email', data.email)
        navigate('/email-verification', { replace: true })
        return
      }

      setLoginError(errorMessage)
    }
  }

  const handleMagicLink = async () => {
    const emailIsValid = await trigger('email')
    if (!emailIsValid) return

    setLoginError(null)
    setIsSendingMagicLink(true)
    try {
      await sendMagicLink(getValues('email'), {
        clientId: searchParams.get('client_id') || undefined,
      })
      setMagicLinkSent(true)
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Failed to send sign-in link. Please try again.')
    } finally {
      setIsSendingMagicLink(false)
    }
  }

  if (mfaChallenge) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Two-step verification</h1>
          <p className="text-sm text-muted-foreground">
            Confirm your second factor to finish signing in.
          </p>
        </div>
        <LoginMFAStep
          challengeToken={mfaChallenge.token}
          allowedMethods={mfaChallenge.methods}
          clientId={searchParams.get('client_id') || undefined}
          onVerified={(result) => finishLogin(result.account)}
          onCancel={() => setMfaChallenge(null)}
        />
      </div>
    )
  }

  if (magicLinkSent) {
    return (
      <div className="flex flex-col gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="size-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            A secure sign-in link will arrive shortly.
          </p>
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={() => setMagicLinkSent(false)}>
          Back to password sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(onSubmit)(e)
        }}
      >
        <FieldGroup>
          {loginError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}
          <FormInputField
            label="Email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            disabled={isSubmitting}
            error={errors.email?.message}
            required
            {...register("email")}
          />
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">
                Password
                <span className="text-red-500 ml-1">*</span>
              </FieldLabel>
              <Link
                to="/forgot-password"
                className="ml-auto text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <FormPasswordField
              id="password"
              label=""
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isSubmitting}
              error={errors.password?.message}
              containerClassName="space-y-0"
              labelClassName="sr-only"
              required
              {...register("password")}
            />
          </Field>
          <FormSubmitButton
            isSubmitting={isSubmitting}
            submitText="Sign in"
            submittingText="Signing in..."
            className="mt-1 w-full"
          />

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isSubmitting || isSendingMagicLink}
            onClick={handleMagicLink}
          >
            {isSendingMagicLink ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Mail className="mr-2 size-4" />
            )}
            {isSendingMagicLink ? 'Sending sign-in link...' : 'Email me a sign-in link'}
          </Button>
        </FieldGroup>
      </form>

      {showSignUp && (
      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </div>
      )}
    </div>
  )
}

export default LoginForm
