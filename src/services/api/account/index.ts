import { get, post, put, deleteRequest } from '@/services/api/client'
import { unwrap, assertSuccess } from '@/services/api/_lib/unwrap'
import type { ApiResponse } from '@/services/api/types'

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export interface UserProfile {
  profile_id: string
  display_name?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  birthdate?: string
  gender?: string
  email?: string
  timezone?: string
  language?: string
  profile_url?: string
  is_default: boolean
  created_at: string
}

export interface CreateProfileRequest {
  display_name?: string
  first_name?: string
  last_name?: string
  profile_url?: string
}

export const fetchProfiles = (): Promise<UserProfile[]> =>
  get<ApiResponse<UserProfile[]>>('/profiles').then(r => unwrap(r, 'fetch profiles') as UserProfile[])

export const createProfile = (data: CreateProfileRequest): Promise<UserProfile> =>
  post<ApiResponse<UserProfile>>('/profiles', data).then(r => unwrap(r, 'create profile') as UserProfile)

export const updateProfile = (uuid: string, data: Partial<CreateProfileRequest>): Promise<UserProfile> =>
  put<ApiResponse<UserProfile>>(`/profiles/${uuid}`, data).then(r => unwrap(r, 'update profile') as UserProfile)

export const deleteProfile = (uuid: string): Promise<void> =>
  deleteRequest<ApiResponse<void>>(`/profiles/${uuid}`).then(r => assertSuccess(r, 'delete profile'))

export const setDefaultProfile = (uuid: string): Promise<UserProfile> =>
  put<ApiResponse<UserProfile>>(`/profiles/${uuid}/set-default`, {}).then(r => unwrap(r, 'set default profile') as UserProfile)

// ---------------------------------------------------------------------------
// Account info
// ---------------------------------------------------------------------------

export interface AccountInfo {
  user_uuid: string
  email: string
  username: string
  phone?: string
  is_email_verified: boolean
  is_phone_verified: boolean
  status: string
  created_at: string
}

export const fetchAccountInfo = (): Promise<AccountInfo | null> =>
  get<ApiResponse<AccountInfo>>('/account').then(r => (r.data ?? null) as AccountInfo | null).catch(() => null)

// ---------------------------------------------------------------------------
// Username change
// ---------------------------------------------------------------------------

export const changeUsername = (username: string): Promise<void> =>
  put<ApiResponse<void>>('/account/username', { username }).then(r => assertSuccess(r, 'change username'))

// ---------------------------------------------------------------------------
// Email change
// ---------------------------------------------------------------------------

export const initiateEmailChange = (new_email: string): Promise<void> =>
  post<ApiResponse<void>>('/account/email/change', { new_email }).then(r => assertSuccess(r, 'initiate email change'))

export const verifyEmailChange = (token: string): Promise<void> =>
  post<ApiResponse<void>>('/account/email/verify', { token }).then(r => assertSuccess(r, 'verify email change'))

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface UserSession {
  session_uuid: string
  ip_address?: string
  user_agent?: string
  created_at: string
  last_active_at?: string
  is_current?: boolean
}

export const fetchSessions = (): Promise<UserSession[]> =>
  get<ApiResponse<UserSession[]>>('/account/sessions').then(r => (r.data ?? []) as UserSession[])

export const revokeSession = (uuid: string): Promise<void> =>
  deleteRequest<ApiResponse<void>>(`/account/sessions/${uuid}`).then(r => assertSuccess(r, 'revoke session'))

export const revokeAllSessions = (): Promise<void> =>
  deleteRequest<ApiResponse<void>>('/account/sessions').then(r => assertSuccess(r, 'revoke all sessions'))

// ---------------------------------------------------------------------------
// Trusted devices
// ---------------------------------------------------------------------------

export interface TrustedDevice {
  device_uuid: string
  device_name?: string
  user_agent?: string
  ip_address?: string
  trusted_at: string
  last_used_at?: string
}

export const fetchTrustedDevices = (): Promise<TrustedDevice[]> =>
  get<ApiResponse<TrustedDevice[]>>('/me/devices').then(r => (r.data ?? []) as TrustedDevice[])

export const revokeTrustedDevice = (uuid: string): Promise<void> =>
  deleteRequest<ApiResponse<void>>(`/me/devices/${uuid}`).then(r => assertSuccess(r, 'revoke device'))

// ---------------------------------------------------------------------------
// User settings
// ---------------------------------------------------------------------------

export interface UserSettings {
  language?: string
  timezone?: string
  theme?: string
  email_notifications?: boolean
  marketing_emails?: boolean
}

export const fetchUserSettings = (): Promise<UserSettings> =>
  get<ApiResponse<UserSettings>>('/user-settings').then(r => (r.data ?? {}) as UserSettings)

export const updateUserSettings = (data: UserSettings): Promise<void> =>
  post<ApiResponse<void>>('/user-settings', data).then(r => assertSuccess(r, 'update settings'))

// ---------------------------------------------------------------------------
// Data export
// ---------------------------------------------------------------------------

export const requestDataExport = (): Promise<{ download_url?: string; message?: string }> =>
  get<ApiResponse<{ download_url?: string; message?: string }>>('/account/export').then(
    r => (r.data ?? {}) as { download_url?: string; message?: string },
  )
