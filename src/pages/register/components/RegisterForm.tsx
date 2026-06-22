import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useNavigate, Link } from "react-router-dom"
import { AlertCircle } from "lucide-react"
import { FormSubmitButton, FormInputField, FormPasswordField, PasswordRequirements } from "@/components/form"
import { FieldGroup } from "@/components/ui/field"
import { buildRegisterSchema, type RegisterFormData } from "@/lib/validations"
import { useAuth } from "@/hooks/useAuth"
import { useTenant } from "@/hooks/useTenant"
import { useToast } from "@/hooks/useToast"
import { resolvePostAuthRoute } from "@/utils/postAuthRoute"

const RegisterForm = () => {
  const navigate = useNavigate()
  const { register: registerUser, refreshAccount } = useAuth()
  const { getCurrentTenant } = useTenant()
  const { showSuccess } = useToast()
  const [registerError, setRegisterError] = useState<string | null>(null)

  // Password rules follow the tenant policy, so build the schema from the
  // tenant's password_config (same source the live checklist below reads).
  const passwordConfig = getCurrentTenant()?.password_config
  const registerSchema = useMemo(() => buildRegisterSchema(passwordConfig), [passwordConfig])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit'
  })

  const passwordValue = watch("password") || ""

  // Reveal the requirements checklist once the user starts typing a password,
  // then keep it visible even if they clear the field.
  const [passwordTyped, setPasswordTyped] = useState(false)
  useEffect(() => {
    if (passwordValue.length > 0) setPasswordTyped(true)
  }, [passwordValue])

  const onSubmit = async (data: RegisterFormData) => {
    setRegisterError(null)
    try {
      const fallbackName = data.email.split('@')[0] || 'User'
      await registerUser(fallbackName, data.email, data.password)

      localStorage.setItem('register_email', data.email)
      showSuccess('Account created successfully!')

      // Registration issues an httpOnly session cookie, so sync the auth state
      // and route based on the live account (email verification → profile →
      // login-success). This keeps the user in a single authenticated session
      // through the rest of the sign-up flow.
      const account = await refreshAccount()
      navigate(resolvePostAuthRoute(account, getCurrentTenant()), { replace: true })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again."
      setRegisterError(errorMessage)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up to get started.
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

export default RegisterForm;
