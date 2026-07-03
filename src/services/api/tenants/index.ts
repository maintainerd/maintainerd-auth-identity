/**
 * Tenant Service
 * Handles the public tenant-lookup API calls used by the identity app.
 *
 * NOTE: administrative tenant CRUD (list/create/update/delete/status) lives on
 * the INTERNAL API (:8080) and is exposed through the admin console, not this
 * public app — so only the read-only tenant lookups below are defined here.
 */

import { get } from '../client'
import { API_ENDPOINTS } from '../config'
import type { TenantEntity, TenantResponse } from './types'

/**
 * Fetch default tenant
 * @returns Promise<TenantEntity>
 */
export async function fetchDefaultTenant(): Promise<TenantEntity> {
  const response = await get<TenantResponse>(API_ENDPOINTS.TENANT)

  if (response.success && response.data) {
    return response.data
  }

  throw new Error('Failed to fetch default tenant')
}

/**
 * Fetch tenant by identifier
 * @param identifier - Tenant identifier
 * @returns Promise<TenantEntity>
 */
export async function fetchTenantByIdentifier(identifier: string): Promise<TenantEntity> {
  const response = await get<TenantResponse>(`${API_ENDPOINTS.TENANT}/${identifier}`)

  if (response.success && response.data) {
    return response.data
  }

  throw new Error(`Failed to fetch tenant with identifier: ${identifier}`)
}

/**
 * Fetch tenant based on identifier (or default if no identifier)
 * @param identifier - Optional tenant identifier
 * @returns Promise<TenantEntity>
 */
export async function fetchTenant(identifier?: string): Promise<TenantEntity> {
  if (identifier) {
    return await fetchTenantByIdentifier(identifier)
  } else {
    return await fetchDefaultTenant()
  }
}
