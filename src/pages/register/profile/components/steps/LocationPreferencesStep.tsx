import { useEffect, useRef, useMemo } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { FieldGroup } from "@/components/ui/field"
import { FormInputField, FormSelectField, FormSetupCard } from "@/components/form"
import { setupProfileLocationSchema } from "@/lib/validations"
import { countryOptions, timezoneOptions, languageOptions } from "@/lib/constants"
import type { CreateProfileRequest } from "@/services/api/auth/types"

interface LocationPreferencesStepProps {
  data: Partial<CreateProfileRequest>
  onDataChange: (data: Partial<CreateProfileRequest>) => void
  onValidationChange: (isValid: boolean) => void
}

const LocationPreferencesStep = ({ data, onDataChange, onValidationChange }: LocationPreferencesStepProps) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(setupProfileLocationSchema),
    mode: "onChange",
    defaultValues: {
      address: data.address || "",
      city: data.city || "",
      country: data.country || "",
      timezone: data.timezone || "",
      language: data.language || ""
    }
  })

  // Watch all form values
  const watchedValues = watch()

  // Memoize form data to prevent unnecessary updates
  const formData = useMemo(() => ({
    address: watchedValues.address || undefined,
    city: watchedValues.city || undefined,
    country: watchedValues.country || undefined,
    timezone: watchedValues.timezone || undefined,
    language: watchedValues.language || undefined
  }), [
    watchedValues.address,
    watchedValues.city,
    watchedValues.country,
    watchedValues.timezone,
    watchedValues.language
  ])

  // Update parent component when form data changes
  useEffect(() => {
    onDataChange(formData)
  }, [formData, onDataChange])

  // Track validation state to prevent unnecessary calls
  const prevValidationRef = useRef(true)

  // Update validation state - this step is optional, so always valid
  useEffect(() => {
    if (prevValidationRef.current !== true) {
      prevValidationRef.current = true
      onValidationChange(true)
    }
  }, [onValidationChange])

  const handleCountryChange = (value: string) => {
    setValue("country", value, { shouldValidate: true })
  }

  const handleTimezoneChange = (value: string) => {
    setValue("timezone", value, { shouldValidate: true })
  }

  const handleLanguageChange = (value: string) => {
    setValue("language", value, { shouldValidate: true })
  }

  return (
    <FormSetupCard
      title="Location & Preferences"
      description="Help us customize your experience with location and language preferences"
    >
      <div className="space-y-6">
        <FieldGroup>
          <FormInputField
            label="Address"
            placeholder="123 Main Street, Apt 4B"
            description="Your physical address (optional)"
            error={errors.address?.message}
            {...register("address")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInputField
              label="City"
              placeholder="New York"
              error={errors.city?.message}
              {...register("city")}
            />
            <FormSelectField
              label="Country"
              placeholder="Select country (optional)"
              options={countryOptions}
              value={watchedValues.country || ""}
              onValueChange={handleCountryChange}
              error={errors.country?.message}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelectField
              label="Timezone"
              placeholder="Select timezone (optional)"
              options={timezoneOptions}
              value={watchedValues.timezone || ""}
              onValueChange={handleTimezoneChange}
              error={errors.timezone?.message}
              description="Used for scheduling and notifications"
            />
            <FormSelectField
              label="Language"
              placeholder="Select language (optional)"
              options={languageOptions}
              value={watchedValues.language || ""}
              onValueChange={handleLanguageChange}
              error={errors.language?.message}
              description="Preferred language for the interface"
            />
          </div>
        </FieldGroup>

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <p className="font-medium text-blue-900 mb-1">Optional Information</p>
          <p>These preferences help us provide a better experience. You can update them anytime in your settings.</p>
        </div>
      </div>
    </FormSetupCard>
  )
}

export default LocationPreferencesStep
