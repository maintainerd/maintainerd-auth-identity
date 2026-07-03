import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { AlertCircle, Mail } from "lucide-react"
import { FormSubmitButton, FormInputField, FormPasswordField, PasswordRequirements } from "@/components/form"
import { FieldGroup } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useTenant } from "@/hooks/useTenant"
import { useToast } from "@/hooks/useToast"
import { resolvePostAuthRoute, loginSuccessRoute } from "@/utils/postAuthRoute"
import { rememberOAuthReturnTo, clearOAuthReturnTo, rememberInviteCallback } from "@/utils/oauthRedirect"
import { fetchInviteContext } from "@/services/api/auth"
import * as yup from "yup"
import { buildPasswordValidation } from "@/lib/validations/authSchema"
import type { PasswordConfigPublic } from "@/services/api/tenants/types"

interface InviteFormData {
  fullname: string
  phone: string
  password: string
  confirmPassword: string
}

function buildInviteSchema(cfg?: PasswordConfigPublic) {
  return yup.object({
    fullname: yup.string().default(''),
    phone: yup.string().default(''),
    // Reuse the shared tenant password policy so invite registration enforces
    // exactly the same rules as standard registration and reset-password.
    password: buildPasswordValidation(cfg),
    confirmPassword: yup
      .string()
      .required('Please confirm your password')
      .oneOf([yup.ref('password')], 'Passwords must match'),
  })
}

const RegisterInviteForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { registerInvite, refreshAccount } = useAuth()
  const { getCurrentTenant } = useTenant()
  const { showSuccess } = useToast()
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [inviteCallback, setInviteCallback] = useState<string | null>(null)

  const invitedEmail = searchParams.get('email') || ''
  const inviteToken = searchParams.get('invite_token') || ''

  useEffect(() => {
    if (!inviteToken) return
    let cancelled = false
    fetchInviteContext(inviteToken).then((ctx) => {
      if (cancelled || !ctx?.callback_url) return
      setInviteCallback(ctx.callback_url)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [inviteToken])

  const passwordConfig = getCurrentTenant()?.password_config
  const inviteSchema = useMemo(() => buildInviteSchema(passwordConfig), [passwordConfig])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<InviteFormData>({
    resolver: yupResolver(inviteSchema),
    defaultValues: {
      fullname: "",
      phone: "",
      password: "",
      confirmPassword: ""
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit'
  })

  const passwordValue = watch("password") || ""

  const [passwordTyped, setPasswordTyped] = useState(false)
  useEffect(() => {
    if (passwordValue.length > 0) setPasswordTyped(true)
  }, [passwordValue])

  const onSubmit = async (data: InviteFormData) => {
    setRegisterError(null)
    try {
      await registerInvite(invitedEmail, data.password, data.fullname?.trim() || undefined, data.phone?.trim() || undefined)

      if (invitedEmail) {
        sessionStorage.setItem('register_email', invitedEmail)
      }
      showSuccess('Account created successfully!')

      if (inviteCallback) {
        rememberInviteCallback(inviteCallback)
      }

      const account = await refreshAccount()
      const dest = resolvePostAuthRoute(account, getCurrentTenant())
      if (dest === loginSuccessRoute() && inviteCallback) {
        const safe = rememberInviteCallback(inviteCallback)
        if (safe) {
          window.location.assign(safe)
          return
        }
      }
      const oauthReturnTo = dest === loginSuccessRoute()
        ? rememberOAuthReturnTo(searchParams.get('return_to'))
        : null
      if (dest === loginSuccessRoute() && !oauthReturnTo) {
        clearOAuthReturnTo()
      }
      navigate(oauthReturnTo || dest, { replace: true })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again."
      setRegisterError(errorMessage)
    }
  }

  if (!invitedEmail) {
    return (
      <div className="flex flex-col gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Invalid invite link</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            This invite link is missing the email parameter. Please request a new invitation.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Accept your invitation</h1>
        <p className="text-sm text-muted-foreground">
          Set up your password to complete registration.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          {registerError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{registerError}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Email</label>
            <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
              <Mail className="size-4 shrink-0" />
              <span>{invitedEmail}</span>
            </div>
          </div>

          <FormInputField
            label="Full name"
            placeholder="Your full name"
            autoComplete="name"
            disabled={isSubmitting}
            error={errors.fullname?.message}
            {...register("fullname")}
          />
          <FormInputField
            label="Phone"
            type="tel"
            placeholder="+1 212 555 1234"
            autoComplete="tel"
            disabled={isSubmitting}
            error={errors.phone?.message}
            {...register("phone")}
          />

          <div className="flex flex-col gap-2">
            <FormPasswordField
              label="Password"
              placeholder="Enter a strong password"
              autoComplete="new-password"
              disabled={isSubmitting}
              error={errors.password?.message}
              required
              {...register("password")}
            />
            {passwordTyped && <PasswordRequirements password={passwordValue} config={passwordConfig} />}
          </div>
          <FormPasswordField
            label="Confirm password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            disabled={isSubmitting}
            error={errors.confirmPassword?.message}
            required
            {...register("confirmPassword")}
          />
          <FormSubmitButton
            isSubmitting={isSubmitting}
            submitText="Create account"
            submittingText="Creating account..."
            className="mt-1 w-full"
          />
        </FieldGroup>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}

export default RegisterInviteForm
