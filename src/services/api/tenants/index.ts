/**
 * Tenant Service
 * Handles tenant API calls and storage operations
 */

import { get, post, put, patch, deleteRequest } from '../client'
import { API_ENDPOINTS } from '../config'
import type { TenantEntity, TenantResponse, TenantListResponse, TenantListParams, CreateTenantRequest, UpdateTenantRequest } from './types'

/**
 * Fetch list of tenants
 * @param params - Query parameters
 * @returns Promise<TenantListResponse>
 */
export async function fetchTenantList(params?: TenantListParams): Promise<TenantListResponse> {
  // Always include all expected params, even if empty, and use correct defaults
  const qp: Record<string, string> = {
    name: params?.name ?? '',
    description: params?.description ?? '',
    identifier: params?.identifier ?? '',
    status: params?.status ?? '',
    is_default: params?.is_default !== undefined ? String(params.is_default) : '',
    is_system: params?.is_system !== undefined ? String(params.is_system) : '',
    page: params?.page !== undefined ? String(params.page) : '1',
    limit: params?.limit !== undefined ? String(params.limit) : '10',
    sort_by: params?.sort_by ?? 'created_at',
    sort_order: params?.sort_order ?? 'desc',
  }
  const queryParams = new URLSearchParams(qp)
  const url = `${API_ENDPOINTS.TENANT}s?${queryParams.toString()}`
  const response = await get<TenantListResponse>(url)
  return response
}

/**
 * Fetch tenant by ID
 * @param tenantId - Tenant ID
 * @returns Promise<TenantEntity>
 */
export async function fetchTenantById(tenantId: string): Promise<TenantEntity> {
  const response = await get<TenantResponse>(`${API_ENDPOINTS.TENANT}s/${tenantId}`)

  if (response.success && response.data) {
    return response.data
  }

  throw new Error(`Failed to fetch tenant with ID: ${tenantId}`)
}

/**
 * Create a new tenant
 * @param data - Tenant creation data
 * @returns Promise<TenantEntity>
 */
export async function createTenant(data: CreateTenantRequest): Promise<TenantEntity> {
  const response = await post<TenantResponse>(`${API_ENDPOINTS.TENANT}s`, data)

  if (response.success && response.data) {
    return response.data
  }

  throw new Error('Failed to create tenant')
}

/**
 * Update tenant
 * @param tenantId - Tenant ID
 * @param data - Tenant update data
 * @returns Promise<TenantEntity>
 */
export async function updateTenant(tenantId: string, data: UpdateTenantRequest): Promise<TenantEntity> {
  const response = await put<TenantResponse>(`${API_ENDPOINTS.TENANT}s/${tenantId}`, data)

  if (response.success && response.data) {
    return response.data
  }

  throw new Error('Failed to update tenant')
}

/**
 * Delete tenant
 * @param tenantId - Tenant ID
 * @returns Promise<void>
 */
export async function updateTenantStatus(
  tenantId: string,
  status: string,
): Promise<void> {
  await patch(`${API_ENDPOINTS.TENANT}s/${tenantId}/status`, { status })
}

export async function deleteTenant(tenantId: string): Promise<void> {
  await deleteRequest(`${API_ENDPOINTS.TENANT}s/${tenantId}`)
}

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

// Export functions as an object
export const tenantService = {
  fetchTenantList,
  fetchTenantById,
  createTenant,
  updateTenant,
  updateTenantStatus,
  deleteTenant,
  fetchDefaultTenant,
  fetchTenantByIdentifier,
  fetchTenant
}
