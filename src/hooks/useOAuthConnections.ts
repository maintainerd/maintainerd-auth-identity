import { useQuery } from '@tanstack/react-query'
import { fetchOAuthConnections } from '@/services/api/oauth'
import { currentPublicAuthContext } from '@/utils/clientContext'

export function useOAuthConnections(enabled = true) {
  const clientId = currentPublicAuthContext().clientId
  const registrationFlow = new URLSearchParams(window.location.search).get('registration_flow') || undefined
  return useQuery({
    queryKey: ['oauth-connections', clientId, registrationFlow],
    queryFn: () => fetchOAuthConnections(clientId!, registrationFlow),
    enabled: enabled && Boolean(clientId),
    staleTime: 30_000,
  })
}
