export interface OAuthAuthorizeResult {
  redirect_uri?: string
  consent_challenge?: string
}

export interface OAuthConnection {
  identifier: string
  display_name: string
  provider: string
  provider_type: string
  is_default: boolean
  display_order: number
}

export interface OAuthConnections {
  password_enabled: boolean
  connections: OAuthConnection[]
}

export interface OAuthConsentChallenge {
  challenge_id: string
  client_name: string
  client_uuid: string
  scopes: string[]
  redirect_uri: string
  expires_at: number
}

export interface OAuthConsentDecisionResult {
  redirect_uri: string
}

export interface OAuthConsentGrant {
  consent_grant_id: string
  client_name: string
  client_uuid: string
  scopes: string[]
  granted_at: string
  updated_at: string
}
