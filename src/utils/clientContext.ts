const STORAGE_KEY = 'maintainerd_auth_client_id'

export function rememberClientId(search: string): string | null {
  const clientId = new URLSearchParams(search).get('client_id')?.trim() || null
  if (clientId) sessionStorage.setItem(STORAGE_KEY, clientId)
  return clientId ?? sessionStorage.getItem(STORAGE_KEY)
}

export function requireClientId(): string {
  const clientId = rememberClientId(window.location.search)
  if (!clientId) throw new Error('client_id is required')
  return clientId
}
