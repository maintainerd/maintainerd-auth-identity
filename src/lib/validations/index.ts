/**
 * Validation Schemas Index
 * Central export point for all validation schemas
 */

// Setup schemas
export {
  setupTenantSchema,
  setupAdminSchema,
  setupProfileContactSchema,
  setupProfileLocationSchema,
  type SetupTenantFormData,
  type SetupAdminFormData,
  type SetupProfileContactFormData,
  type SetupProfileLocationFormData,
} from './setupSchema'

// Auth schemas
export {
  buildLoginSchema,
  buildRegisterSchema,
  buildResetPasswordSchema,
  forgotPasswordSchema,
  type LoginFormData,
  type RegisterFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData
} from './authSchema'
