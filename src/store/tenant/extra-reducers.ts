/**
 * Tenant Extra Reducers
 * Async thunk reducers for tenant slice
 */

import type { ActionReducerMapBuilder } from '@reduxjs/toolkit'
import { 
  fetchTenantAsync, 
  fetchDefaultTenantAsync, 
  fetchTenantByIdentifierAsync, 
  initializeTenantAsync 
} from './actions'
import type { TenantState } from './types'

export const tenantExtraReducers = (builder: ActionReducerMapBuilder<TenantState>) => {
  builder
    // Fetch tenant
    .addCase(fetchTenantAsync.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    .addCase(fetchTenantAsync.fulfilled, (state, action) => {
      state.isLoading = false
      state.currentTenant = action.payload
      state.error = null
    })
    .addCase(fetchTenantAsync.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.error.message || 'Failed to fetch tenant'
    })
    // Fetch default tenant
    .addCase(fetchDefaultTenantAsync.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    .addCase(fetchDefaultTenantAsync.fulfilled, (state, action) => {
      state.isLoading = false
      state.currentTenant = action.payload
      state.error = null
    })
    .addCase(fetchDefaultTenantAsync.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.error.message || 'Failed to fetch default tenant'
    })
    // Fetch tenant by identifier
    .addCase(fetchTenantByIdentifierAsync.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    .addCase(fetchTenantByIdentifierAsync.fulfilled, (state, action) => {
      state.isLoading = false
      state.currentTenant = action.payload
      state.error = null
    })
    .addCase(fetchTenantByIdentifierAsync.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.error.message || 'Failed to fetch tenant by identifier'
    })
    // Initialize tenant
    .addCase(initializeTenantAsync.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    .addCase(initializeTenantAsync.fulfilled, (state, action) => {
      state.isLoading = false
      state.currentTenant = action.payload
      state.error = null
    })
    .addCase(initializeTenantAsync.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.error.message || 'Failed to initialize tenant'
    })
}
