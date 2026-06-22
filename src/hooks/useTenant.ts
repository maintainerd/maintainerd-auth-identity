/**
 * Tenant Hook
 * Custom hook that uses Redux for tenant state management and initialization
 */

import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useToast } from '@/hooks/useToast'
import {
  fetchTenantAsync,
  fetchDefaultTenantAsync,
  fetchTenantByIdentifierAsync,
  initializeTenantAsync,
  clearTenant as clearTenantAction,
  clearError
} from '@/store/tenant/reducers'
import { determineTenantIdentifier } from '@/utils/tenant'

export function useTenant() {
  const dispatch = useAppDispatch()
  const { showError } = useToast()
  const { currentTenant, isLoading, error } = useAppSelector((state) => state.tenant)

  const initializeFromLocation = useCallback(async (pathname: string, search: string) => {
    try {
      const searchParams = new URLSearchParams(search)
      const tenantIdentifier = determineTenantIdentifier(pathname, searchParams)
      const result = await dispatch(initializeTenantAsync(tenantIdentifier || undefined)).unwrap()
      return result
    } catch (error) {
      showError('Failed to initialize tenant')
      throw error
    }
  }, [dispatch, showError])

  const getCurrentTenant = useCallback(() => {
    return currentTenant
  }, [currentTenant])

  const clearTenant = useCallback(() => {
    dispatch(clearTenantAction())
  }, [dispatch])

  const fetchTenant = useCallback(async (identifier?: string) => {
    const result = await dispatch(fetchTenantAsync(identifier)).unwrap()
    return result
  }, [dispatch])

  const fetchDefault = useCallback(async () => {
    const result = await dispatch(fetchDefaultTenantAsync()).unwrap()
    return result
  }, [dispatch])

  const fetchByIdentifier = useCallback(async (identifier: string) => {
    const result = await dispatch(fetchTenantByIdentifierAsync(identifier)).unwrap()
    return result
  }, [dispatch])

  const initializeTenant = useCallback(async (identifier?: string) => {
    const result = await dispatch(initializeTenantAsync(identifier)).unwrap()
    return result
  }, [dispatch])

  const clearTenantError = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  return {
    // State
    currentTenant,
    isLoading,
    error,
    // Actions
    getCurrentTenant,
    clearTenant,
    fetchTenant,
    fetchDefault,
    fetchByIdentifier,
    initializeTenant,
    initializeFromLocation,
    clearTenantError
  }
}
