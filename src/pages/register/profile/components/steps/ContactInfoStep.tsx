import { useEffect, useRef, useMemo } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { FormInputField, FormSetupCard } from "@/components/form"
import { setupProfileContactSchema } from "@/lib/validations"
import type { CreateProfileRequest } from "@/services/api/auth/types"

interface ContactInfoStepProps {
  data: Partial<CreateProfileRequest>
  onDataChange: (data: Partial<CreateProfileRequest>) => void
  onValidationChange: (isValid: boolean) => void
}

const ContactInfoStep = ({ data, onDataChange, onValidationChange }: ContactInfoStepProps) => {
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(setupProfileContactSchema),
    mode: "onChange",
    defaultValues: {
      email: data.email || "",
      phone: data.phone || ""
    }
  })

  // Watch all form values
  const watchedValues = watch()

  // Memoize form data to prevent unnecessary updates
  const formData = useMemo(() => ({
    email: watchedValues.email || undefined,
    phone: watchedValues.phone || undefined
  }), [
    watchedValues.email,
    watchedValues.phone
  ])

  // Update parent component when form data changes
  useEffect(() => {
    onDataChange(formData)
  }, [formData, onDataChange])

  // Track previous validation state to prevent unnecessary calls
  const prevIsValidRef = useRef(isValid)

  // Update validation state when form validity changes
  useEffect(() => {
    if (prevIsValidRef.current !== isValid) {
      prevIsValidRef.current = isValid
      onValidationChange(isValid)
    }
  }, [isValid, onValidationChange])

  return (
    <div className="flex flex-col gap-6">
      <FormSetupCard
        title="Contact Information"
        description="How can we reach you? This information helps us keep you updated."
      >
        <div className="space-y-6">
          <FormInputField
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            error={errors.email?.message}
            required
            {...register("email")}
          />

          <FormInputField
            label="Phone Number"
            type="tel"
            placeholder="Enter your phone number (optional)"
            error={errors.phone?.message}
            {...register("phone")}
          />

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-900 mb-1">Privacy Note</p>
            <p>Your contact information is kept secure and will only be used for account-related communications.</p>
          </div>
        </div>
      </FormSetupCard>
    </div>
  )
}

export default ContactInfoStep
