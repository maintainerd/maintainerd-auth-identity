/**
 * Reusable Form Select Field Component
 * A flexible select field with label, validation, and error handling
 */

import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FormSelectFieldProps {
  label: string
  placeholder?: string
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  error?: string
  description?: string
  required?: boolean
  disabled?: boolean
  containerClassName?: string
  labelClassName?: string
  errorClassName?: string
  descriptionClassName?: string
  className?: string
  id?: string
}

export function FormSelectField({
  label,
  placeholder = "Select an option",
  options,
  value,
  onValueChange,
  error,
  description,
  required = false,
  disabled = false,
  containerClassName,
  labelClassName,
  errorClassName,
  descriptionClassName,
  className,
  id,
}: FormSelectFieldProps) {
  // Generate ID if not provided
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <Field className={cn(containerClassName)}>
      <FieldLabel
        htmlFor={fieldId}
        className={cn(labelClassName)}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </FieldLabel>

      <Select
        key={value}
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={fieldId}
          className={cn(
            "w-full",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {description && (
        <FieldDescription className={cn(descriptionClassName)}>
          {description}
        </FieldDescription>
      )}

      {error && (
        <FieldError className={cn("text-red-600", errorClassName)}>
          {error}
        </FieldError>
      )}
    </Field>
  )
}

FormSelectField.displayName = "FormSelectField"
