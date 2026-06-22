/**
 * API Client
 * Base HTTP client with common functionality like error handling, timeouts, etc.
 */

import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { API_CONFIG, API_ENDPOINTS, TOKEN_DELIVERY_HEADER } from './config'
import { requestStepUp } from './stepUp'
import './debug' // Import debug utilities in development

// Custom error class
export class ApiError extends Error {
  public status: number
  public code?: string
  public responseData?: {
    error: string | object
    details?: string | object
    success?: boolean
  }

  constructor({ message, status, code }: { message: string; status: number; code?: string }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
  withCredentials: true, // Include cookies for authentication
})

// Endpoints where a 401 means a genuine credential failure (not an expired
// session), so we must NOT attempt a token refresh — including the refresh
// endpoint itself, to avoid an infinite loop.
const NO_REFRESH_ENDPOINTS = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REGISTER,
  API_ENDPOINTS.AUTH.LOGOUT,
  API_ENDPOINTS.AUTH.REFRESH,
  API_ENDPOINTS.AUTH.MAGIC_LINK_SEND,
  API_ENDPOINTS.AUTH.MAGIC_LINK_VERIFY,
  API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
  API_ENDPOINTS.AUTH.RESET_PASSWORD,
]

// Single-flight refresh: concurrent 401s share one refresh request instead of
// stampeding the refresh endpoint.
let refreshPromise: Promise<void> | null = null

function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    // withCredentials sends the httpOnly refresh-token cookie; the
    // `X-Token-Delivery: cookie` header tells the backend to rotate and
    // Set-Cookie the new access/refresh tokens (cookie-based session).
    // `/refresh-token` is NOT in the middleware's form-encoded exempt list, so
    // it requires `Content-Type: application/json`. Send `{}` (not null) so axios
    // keeps that header — the actual refresh token rides in the httpOnly cookie.
    refreshPromise = axiosInstance
      .post(API_ENDPOINTS.AUTH.REFRESH, {}, {
        headers: { ...TOKEN_DELIVERY_HEADER },
      })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean; _stepUpRetry?: boolean }

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // On an expired access token (401), transparently refresh once and retry the
    // original request. Skipped for auth endpoints and already-retried requests.
    const original = error.config as RetriableRequestConfig | undefined
    const requestUrl = original?.url || ''
    const isAuthEndpoint = NO_REFRESH_ENDPOINTS.some((endpoint) => requestUrl.includes(endpoint))

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true
      try {
        await refreshSession()
        return axiosInstance(original)
      } catch {
        // Refresh failed — fall through to normal error handling below.
      }
    }

    // Step-up elevation. Sensitive actions (assign role, delete user, revoke
    // sessions, admin MFA reset, …) require an acr=2 token. When the backend
    // signals `step_up_required`, prompt for a second factor once, then retry
    // the original request with the elevated Bearer token. The ceremony is
    // single-flighted in requestStepUp(), so concurrent gated calls share it.
    const stepUpCode = (error.response?.data as { code?: string } | undefined)?.code
    if (error.response?.status === 403 && stepUpCode === 'step_up_required' && original && !original._stepUpRetry) {
      original._stepUpRetry = true
      try {
        const elevatedToken = await requestStepUp()
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${elevatedToken}`
        return axiosInstance(original)
      } catch {
        // User cancelled or step-up unavailable — fall through to error handling.
      }
    }

    if (error.response) {
      // Server responded with error status
      const data = error.response.data as {
        error?: string
        details?: string | object
        success?: boolean
        code?: string
      } | undefined
      const errorMessage = data?.error || `HTTP ${error.response.status}: ${error.response.statusText}`
      const errorDetails = data?.details || undefined

      const apiError = new ApiError({
        message: errorMessage,
        status: error.response.status,
        code: data?.code,
      })

      // Attach the original response data for more detailed error handling
      apiError.responseData = {
        error: errorMessage,
        details: errorDetails,
        success: data?.success
      }

      throw apiError
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      throw new ApiError({
        message: 'Request timeout',
        status: 408,
        code: 'TIMEOUT',
      })
    } else if (error.request) {
      // Request was made but no response received
      throw new ApiError({
        message: error.message || 'Network error',
        status: 0,
        code: 'NETWORK_ERROR',
      })
    } else {
      // Something else happened
      throw new ApiError({
        message: error.message || 'Unknown error occurred',
        status: 0,
        code: 'UNKNOWN_ERROR',
      })
    }
  }
)

/**
 * HTTP GET request
 */
export async function get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.get<T>(endpoint, config)
  return response.data || ({ success: true, message: 'Request completed successfully' } as T)
}

/**
 * HTTP POST request
 *
 * Defaults the body to `{}` so axios keeps the `Content-Type: application/json`
 * header (axios strips it when there is no body). The backend middleware
 * requires that header on every POST/PUT/PATCH, so bodyless admin actions still
 * send a truthful JSON content type. Callers passing form data (URLSearchParams)
 * are unaffected — their body is already defined.
 */
export async function post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.post<T>(endpoint, data ?? {}, config)
  return response.data || ({ success: true, message: 'Request completed successfully' } as T)
}

/**
 * HTTP PUT request
 *
 * Defaults the body to `{}` — see `post` for why (Content-Type compliance).
 */
export async function put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.put<T>(endpoint, data ?? {}, config)
  return response.data || ({ success: true, message: 'Request completed successfully' } as T)
}

/**
 * HTTP DELETE request
 */
export async function deleteRequest<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.delete<T>(endpoint, config)
  return response.data || ({ success: true, message: 'Request completed successfully' } as T)
}

/**
 * HTTP PATCH request
 *
 * Defaults the body to `{}` — see `post` for why (Content-Type compliance).
 * This covers the bodyless admin actions (verify-email / verify-phone /
 * complete-account) without each call site needing to pass `{}`.
 */
export async function patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.patch<T>(endpoint, data ?? {}, config)
  return response.data || ({ success: true, message: 'Request completed successfully' } as T)
}



// Export API functions as a convenient object (for backward compatibility)
export const apiClient = {
  get,
  post,
  put,
  delete: deleteRequest,
  patch,
}
