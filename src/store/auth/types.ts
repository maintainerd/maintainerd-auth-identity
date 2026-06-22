/**
 * Auth Store Types
 * Redux-specific types for auth state management
 */

import type { ProfileEntity, AccountEntity } from '@/services/api/auth/types'

export interface AuthState {
  account: AccountEntity | null
  profile: ProfileEntity | null
  roles: string[]
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}
