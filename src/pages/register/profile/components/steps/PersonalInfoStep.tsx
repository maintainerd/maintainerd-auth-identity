import { useEffect, useRef, useMemo } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from 'yup'
import { FieldGroup } from "@/components/ui/field"
import { FormInputField } from "@/components/form"
import type { CreateProfileRequest } from "@/services/api/auth/types"

const nameSchema = yup.object({
  first_name: yup.string().required('First name is required').min(1).max(100),
  last_name: yup.string().optional(),
})

interface PersonalInfoStepProps {
  data: Partial<CreateProfileRequest>
  onDataChange: (data: Partial<CreateProfileRequest>) => void
  onValidationChange: (isValid: boolean) => void
}

const PersonalInfoStep = ({ data, onDataChange, onValidationChange }: PersonalInfoStepProps) => {
  const {
    register,
    watch,
    formState: { errors, isValid }
  } = useForm({
    resolver: yupResolver(nameSchema),
    mode: "onChange",
    defaultValues: {
      first_name: data.first_name || "",
      last_name: data.last_name || "",
    }
  })

  const watchedValues = watch()

  const formData = useMemo(() => {
    const firstName = watchedValues.first_name?.trim()
    const lastName = watchedValues.last_name?.trim()
    const displayName = firstName ? [firstName, lastName].filter(Boolean).join(' ') : undefined

    return {
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      display_name: displayName,
    }
  }, [watchedValues.first_name, watchedValues.last_name])

  useEffect(() => {
    onDataChange(formData)
  }, [formData, onDataChange])

  const prevIsValidRef = useRef(isValid)

  useEffect(() => {
    if (prevIsValidRef.current !== isValid) {
      prevIsValidRef.current = isValid
      onValidationChange(isValid)
    }
  }, [isValid, onValidationChange])

  return (
    <FieldGroup>
      <FormInputField
        label="First Name"
        placeholder="John"
        error={errors.first_name?.message}
        required
        {...register("first_name")}
      />
      <FormInputField
        label="Last Name"
        placeholder="Doe"
        error={errors.last_name?.message}
        {...register("last_name")}
      />
    </FieldGroup>
  )
}

export default PersonalInfoStep
