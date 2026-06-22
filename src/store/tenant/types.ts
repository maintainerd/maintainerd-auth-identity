/**
 * Tenant Store Types
 * Redux-specific types for tenant state management
 */

import type { TenantEntity } from '@/services/api/tenants/types'

export interface TenantState {
  currentTenant: TenantEntity | null
  isLoading: boolean
  error: string | null
}
