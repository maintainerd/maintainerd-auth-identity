/**
 * Tenant Slice
 * Redux slice for tenant state management
 */

import { createSlice } from '@reduxjs/toolkit'
import { tenantExtraReducers } from './extra-reducers'
import type { TenantState } from './types'

const initialState: TenantState = {
  currentTenant: null,
  isLoading: false,
  error: null
}

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    clearError: (state: TenantState) => {
      state.error = null
    },
    clearTenant: (state: TenantState) => {
      state.currentTenant = null
      state.error = null
    }
  },
  extraReducers: tenantExtraReducers
})

export const { clearError, clearTenant } = tenantSlice.actions
export default tenantSlice.reducer
