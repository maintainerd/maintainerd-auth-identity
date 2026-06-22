import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchTenant,
  fetchDefaultTenant,
  fetchTenantByIdentifier
} from '@/services'

export const fetchTenantAsync = createAsyncThunk(
  'tenant/fetch',
  async (identifier?: string) => {
    return await fetchTenant(identifier)
  }
)

export const fetchDefaultTenantAsync = createAsyncThunk(
  'tenant/fetchDefault',
  async () => {
    return await fetchDefaultTenant()
  }
)

export const fetchTenantByIdentifierAsync = createAsyncThunk(
  'tenant/fetchByIdentifier',
  async (identifier: string) => {
    return await fetchTenantByIdentifier(identifier)
  }
)

export const initializeTenantAsync = createAsyncThunk(
  'tenant/initialize',
  async (identifier?: string) => {
    return await fetchTenant(identifier)
  }
)
