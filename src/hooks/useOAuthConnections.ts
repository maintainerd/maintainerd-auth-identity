import { useQuery } from '@tanstack/react-query'
import { fetchOAuthConnections } from '@/services/api/oauth'
import { currentPublicAuthContext } from '@/utils/clientContext'

export function useOAuthConnections(enabled = true) {
  const clientId = currentPublicAuthContext().clientId
  return useQuery({
    queryKey: ['oauth-connections', clientId],
    queryFn: () => fetchOAuthConnections(clientId!),
    enabled: enabled && Boolean(clientId),
    staleTime: 30_000,
  })
}
