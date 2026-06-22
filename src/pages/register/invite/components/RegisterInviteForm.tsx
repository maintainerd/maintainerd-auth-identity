import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { AlertCircle, Mail } from "lucide-react"
import { FormSubmitButton, FormPasswordField, PasswordRequirements } from "@/components/form"
import { FieldGroup } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useTenant } from "@/hooks/useTenant"
import { useToast } from "@/hooks/useToast"
import { resolvePostAuthRoute } from "@/utils/postAuthRoute"
import * as yup from "yup"
import type { PasswordConfigPublic } from "@/services/api/tenants/types"

interface InviteFormData {
  password: string
  confirmPassword: string
}

function buildInviteSchema(cfg?: PasswordConfigPublic) {
  return yup.object({
    password: buildRegisterPassword(cfg),
    confirmPassword: yup
      .string()
      .required('Please confirm your password')
      .oneOf([yup.ref('password')], 'Passwords must match'),
  })
}

function buildRegisterPassword(cfg?: PasswordConfigPublic) {
  let schema = yup.string().required('Password is required')
  const minLen = cfg?.min_length ?? 12
  const maxLen = cfg?.max_length ?? 128
  schema = schema.min(minLen, `Password must be at least ${minLen} characters`)
  if (maxLen > 0) {
    schema = schema.max(maxLen, `Password must not exceed ${maxLen} characters`)
  }
  if (cfg?.require_uppercase) {
    schema = schema.matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
  }
  if (cfg?.require_lowercase) {
    schema = schema.matches(/[a-z]/, 'Password must contain at least one lowercase letter')
  }
  if (cfg?.require_number) {
    schema = schema.matches(/[0-9]/, 'Password must contain at least one digit')
  }
  if (cfg?.require_symbol) {
    schema = schema.matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character')
  }
  return schema
}

const RegisterInviteForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { registerInvite, refreshAccount } = useAuth()
  const { getCurrentTenant } = useTenant()
  const { showSuccess } = useToast()
  const [registerError, setRegisterError] = useState<string | null>(null)

  const invitedEmail = searchParams.get('email') || ''

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
      await registerInvite(invitedEmail, data.password)

      if (invitedEmail) {
        localStorage.setItem('register_email', invitedEmail)
      }
      showSuccess('Account created successfully!')

      const account = await refreshAccount()
      navigate(resolvePostAuthRoute(account, getCurrentTenant()), { replace: true })
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
