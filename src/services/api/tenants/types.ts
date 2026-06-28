/**
 * Tenant API Types
 * Type definitions for tenant API operations
 */

import type { ApiResponse, PaginatedResponse } from '../types'

/**
 * Tenant status type
 */
export type TenantStatus = 'active' | 'inactive' | 'suspended'

export interface RegistrationConfigPublic {
  self_registration_enabled: boolean
  require_email_verification: boolean
  captcha_on_signup: boolean
}

export interface PasswordConfigPublic {
  min_length: number
  max_length: number
  require_uppercase: boolean
  require_lowercase: boolean
  require_number: boolean
  require_symbol: boolean
}

export interface BrandingColors {
  primary?: string
  secondary?: string
  accent?: string
  appBackground?: string
  topPanelBackground?: string
  sidePanelBackground?: string
  cardBackground?: string
  textPrimary?: string
  textMuted?: string
  border?: string
}

export interface BrandingFont {
  family?: string
}

export interface BrandingMetadata {
  colors?: BrandingColors
  font?: BrandingFont
  /** Optional future override; appBackground remains the current console token. */
  background?: string
  /** Optional CSS gradient used ahead of background/appBackground when present. */
  gradient?: string
  [key: string]: unknown
}

export type BrandingLayout = 'centered' | 'full_page' | 'split'

export interface BrandingPublic {
  layout: BrandingLayout
  company_name: string
  logo_url: string
  favicon_url: string
  support_url: string
  privacy_policy_url: string
  terms_of_service_url: string
  metadata: BrandingMetadata | null
}

/**
 * Tenant entity from API
 */
export interface TenantEntity {
  tenant_id: string
  name: string
  display_name: string
  description: string
  identifier: string
  status: TenantStatus
  is_default: boolean
  is_system: boolean
  created_at: string
  updated_at: string
  password_config?: PasswordConfigPublic
  registration_config?: RegistrationConfigPublic
  branding?: BrandingPublic
}

/**
 * Tenant list query parameters
 */
export interface TenantListParams {
  name?: string
  display_name?: string
  description?: string
  identifier?: string
  status?: TenantStatus
  is_default?: boolean
  is_system?: boolean
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/**
 * Create tenant request
 */
export interface CreateTenantRequest {
  name: string
  display_name: string
  description: string
  status: TenantStatus
}

/**
 * Update tenant request
 */
export interface UpdateTenantRequest {
  name: string
  display_name: string
  description: string
  status: TenantStatus
}

/**
 * Tenant API response
 */
export type TenantResponse = ApiResponse<TenantEntity>

/**
 * Tenant list API response
 */
export type TenantListResponse = ApiResponse<PaginatedResponse<TenantEntity>>
