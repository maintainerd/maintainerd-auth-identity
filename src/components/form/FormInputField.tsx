/**
 * Reusable Form Input Field Component
 * A flexible input field with label, validation, and error handling
 */

import { forwardRef } from "react"
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface FormInputFieldProps extends React.ComponentProps<typeof Input> {
  label: string
  error?: string
  description?: string
  required?: boolean
  containerClassName?: string
  labelClassName?: string
  errorClassName?: string
  descriptionClassName?: string
}

export const FormInputField = forwardRef<HTMLInputElement, FormInputFieldProps>(
  (
    {
      label,
      error,
      description,
      required = false,
      containerClassName,
      labelClassName,
      errorClassName,
      descriptionClassName,
      className,
      id,
      ...props
    },
    ref
  ) => {
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

        <Input
          ref={ref}
          id={fieldId}
          className={cn(
            error && "border-red-500 focus-visible:ring-red-500/20",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${fieldId}-error` : 
            description ? `${fieldId}-description` : 
            undefined
          }
          {...props}
        />
        
        {description && !error && (
          <FieldDescription 
            id={`${fieldId}-description`}
            className={cn("text-muted-foreground", descriptionClassName)}
          >
            {description}
          </FieldDescription>
        )}
        
        {error && (
          <FieldError
            id={`${fieldId}-error`}
            className={cn(errorClassName)}
          >
            {error}
          </FieldError>
        )}
      </Field>
    )
  }
)

FormInputField.displayName = "FormInputField"
