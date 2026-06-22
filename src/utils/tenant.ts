/**
 * Tenant Utilities
 * Helper functions for tenant-related operations
 */

/**
 * Extract tenant identifier from the current URL path
 * @param pathname - Current URL pathname (e.g., "/abc123/dashboard" for admin, "/abc123/login" for identity)
 * @returns Tenant identifier or null if not found
 */
export function getTenantIdentifierFromPath(pathname: string): string | null {
  // Skip public/auth routes that don't require tenant context
  if (pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/setup') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/email-verification') ||
      pathname.startsWith('/magic-link') ||
      pathname.startsWith('/service-unavailable')) {
    return null
  }

  // Extract tenant identifier from path like "/{tenantId}/dashboard" or "/{tenantId}/login"
  const pathSegments = pathname.split('/').filter(Boolean)

  // First segment should be the tenant identifier
  if (pathSegments.length > 0) {
    return pathSegments[0]
  }

  return null
}

/**
 * Get tenant identifier from URL query parameter 't'
 * @param searchParams - URLSearchParams object
 * @returns Tenant identifier or null if not found
 */
export function getTenantIdentifierFromQuery(searchParams: URLSearchParams): string | null {
  return searchParams.get('t')
}

/**
 * Determine tenant identifier from current location
 * Priority: URL path > query parameter > null
 * @param pathname - Current URL pathname
 * @param searchParams - URLSearchParams object
 * @returns Tenant identifier or null
 */
export function determineTenantIdentifier(pathname: string, searchParams: URLSearchParams): string | null {
  // First try to get from URL path (for authenticated routes)
  const pathTenant = getTenantIdentifierFromPath(pathname)
  if (pathTenant) {
    return pathTenant
  }

  // Then try to get from query parameter (for login page)
  const queryTenant = getTenantIdentifierFromQuery(searchParams)
  if (queryTenant) {
    return queryTenant
  }

  return null
}
