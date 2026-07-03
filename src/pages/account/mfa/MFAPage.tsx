import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ShieldCheck, Trash2, RefreshCw, Plus, X, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { MFA_METHOD_META } from "@/lib/mfaMethods"
import { base64urlToBuffer, serializeCredential } from "@/lib/webauthn"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import {
  fetchMFAStatus,
  beginTOTPEnrollment,
  finishTOTPEnrollment,
  disableTOTP,
  beginSMSEnrollment,
  verifySMSEnrollment,
  disableSMS,
  beginEmailOtpEnrollment,
  verifyEmailOtpEnrollment,
  disableEmailOtp,
  beginWebAuthnRegistration,
  finishWebAuthnRegistration,
  deleteWebAuthnCredential,
  regenerateBackupCodes,
} from "@/services/api/mfa"
import type { MFAStatusResponse } from "@/services/api/mfa"

export default function MFAPage() {
  const queryClient = useQueryClient()
  const { account } = useAuth()
  const { showError, showSuccess } = useToast()
  const accountEmail = account?.email ?? ""

  const { data: status, isLoading } = useQuery({
    queryKey: ["mfa", "status"],
    queryFn: fetchMFAStatus,
  })

  const [activeEnroll, setActiveEnroll] = useState<string | null>(null)
  const [totpQr, setTotpQr] = useState("")
  const [totpSecret, setTotpSecret] = useState("")
  const [code, setCode] = useState("")
  const [phone, setPhone] = useState("")
  const [smsSent, setSmsSent] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["mfa", "status"] })
  }, [queryClient])

  // TOTP
  const totpBeginMut = useMutation({
    mutationFn: beginTOTPEnrollment,
    onSuccess: (data) => {
      setTotpQr(data.qr_code_url)
      setTotpSecret(data.secret)
      setCode("")
    },
    onError: (e) => showError(e),
  })

  const totpVerifyMut = useMutation({
    mutationFn: (c: string) => finishTOTPEnrollment({ code: c }),
    onSuccess: () => {
      showSuccess("TOTP enabled")
      setActiveEnroll(null)
      setTotpQr("")
      invalidate()
    },
    onError: (e) => showError(e),
  })

  // SMS
  const smsBeginMut = useMutation({
    mutationFn: (p: string) => beginSMSEnrollment(p),
    onSuccess: () => {
      setSmsSent(true)
      showSuccess("Verification code sent")
    },
    onError: (e) => showError(e),
  })

  const smsVerifyMut = useMutation({
    mutationFn: (c: string) => verifySMSEnrollment(phone, c),
    onSuccess: () => {
      showSuccess("SMS verification enabled")
      setActiveEnroll(null)
      setSmsSent(false)
      setPhone("")
      invalidate()
    },
    onError: (e) => showError(e),
  })

  // Email OTP
  const emailBeginMut = useMutation({
    mutationFn: () => beginEmailOtpEnrollment(accountEmail),
    onSuccess: () => {
      showSuccess("Verification code sent to your email")
      setCode("")
    },
    onError: (e) => showError(e),
  })

  const emailVerifyMut = useMutation({
    mutationFn: (c: string) => verifyEmailOtpEnrollment(accountEmail, c),
    onSuccess: () => {
      showSuccess("Email OTP verification enabled")
      setActiveEnroll(null)
      invalidate()
    },
    onError: (e) => showError(e),
  })

  // WebAuthn
  const webauthnBeginMut = useMutation({
    mutationFn: beginWebAuthnRegistration,
    onSuccess: async (data) => {
      try {
        const pk = data.publicKey
        const publicKey: PublicKeyCredentialCreationOptions = {
          rp: pk.rp,
          user: { id: base64urlToBuffer(pk.user.id), name: pk.user.name, displayName: pk.user.displayName },
          challenge: base64urlToBuffer(pk.challenge),
          pubKeyCredParams: pk.pubKeyCredParams,
          timeout: pk.timeout,
          attestation: pk.attestation,
          authenticatorSelection: pk.authenticatorSelection,
        }
        const credential = await navigator.credentials.create({ publicKey })
        if (!credential) {
          showError(new Error("Passkey registration was cancelled"))
          return
        }
        const serialized = serializeCredential(credential as PublicKeyCredential)
        const passkeyName = `Passkey · ${new Date().toLocaleDateString()}`
        await finishWebAuthnRegistration(passkeyName, serialized)
        showSuccess("Passkey registered")
        setActiveEnroll(null)
        invalidate()
      } catch (err: unknown) {
        if (err instanceof Error && err.message) showError(err)
        else showError(new Error("Passkey registration failed"))
      }
    },
    onError: (e) => showError(e),
  })

  // Disable mutations
  const disableTotpMut = useMutation({
    mutationFn: disableTOTP,
    onSuccess: () => { showSuccess("TOTP disabled"); invalidate() },
    onError: (e) => showError(e),
  })

  const disableSmsMut = useMutation({
    mutationFn: disableSMS,
    onSuccess: () => { showSuccess("SMS disabled"); invalidate() },
    onError: (e) => showError(e),
  })

  const disableEmailMut = useMutation({
    mutationFn: disableEmailOtp,
    onSuccess: () => { showSuccess("Email OTP disabled"); invalidate() },
    onError: (e) => showError(e),
  })

  const deleteWebAuthnMut = useMutation({
    mutationFn: (uuid: string) => deleteWebAuthnCredential(uuid),
    onSuccess: () => { showSuccess("Passkey removed"); invalidate() },
    onError: (e) => showError(e),
  })

  // Backup codes
  const backupCodesMut = useMutation({
    mutationFn: regenerateBackupCodes,
    onSuccess: (data) => {
      setBackupCodes(data.codes)
      invalidate()
    },
    onError: (e) => showError(e),
  })

  const copyCodes = useCallback(async () => {
    if (backupCodes.length === 0) return
    await navigator.clipboard.writeText(backupCodes.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [backupCodes])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading MFA settings...</p>
      </div>
    )
  }

  const s = status as MFAStatusResponse | undefined

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" /> Multi-Factor Authentication
        </h1>
        <p className="text-muted-foreground mt-1">Add extra security to your account</p>
      </div>

      <div className="space-y-4">
        {/* TOTP */}
        <FactorCard
          label="Authenticator App (TOTP)"
          icon={MFA_METHOD_META.totp.icon}
          enabled={s?.is_totp_enabled ?? false}
          enrolling={activeEnroll === "totp"}
          onEnroll={() => { setActiveEnroll("totp"); totpBeginMut.mutate() }}
          onDisable={() => disableTotpMut.mutate()}
          loading={disableTotpMut.isPending}
        >
          {activeEnroll === "totp" && totpQr && (
            <EnrollPanel onCancel={() => setActiveEnroll(null)}>
              <p className="text-sm mb-3">Scan this QR code with your authenticator app:</p>
              <img src={totpQr} alt="TOTP QR Code" className="mx-auto mb-3 w-48 h-48" />
              <p className="text-xs text-muted-foreground mb-4 break-all">Secret: {totpSecret}</p>
              <Label>Verification Code</Label>
              <div className="flex gap-2 mt-1">
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} />
                <Button onClick={() => totpVerifyMut.mutate(code)} disabled={totpVerifyMut.isPending || code.length < 6}>
                  Verify
                </Button>
              </div>
              <p className="text-xs text-red-500 mt-1">{totpVerifyMut.error ? (totpVerifyMut.error as Error)?.message ?? "Verification failed" : ""}</p>
            </EnrollPanel>
          )}
        </FactorCard>

        {/* WebAuthn */}
        <FactorCard
          label="Passkeys"
          icon={MFA_METHOD_META.webauthn.icon}
          enabled={s?.is_webauthn_enabled ?? false}
          enrolling={activeEnroll === "webauthn"}
          onEnroll={() => { setActiveEnroll("webauthn"); webauthnBeginMut.mutate() }}
          loading={webauthnBeginMut.isPending}
        >
          {activeEnroll === "webauthn" && (
            <EnrollPanel onCancel={() => setActiveEnroll(null)}>
              <p className="text-sm mb-3">Follow your browser prompts to register a passkey.</p>
            </EnrollPanel>
          )}
          {s?.webauthn_keys && s.webauthn_keys.length > 0 && (
            <div className="mt-2 space-y-1">
              {s.webauthn_keys.map((k) => (
                <div key={k.credential_uuid} className="flex items-center justify-between text-sm bg-muted/30 rounded p-2">
                  <span>{k.name ?? k.credential_uuid?.slice(0, 16) ?? "Passkey"}</span>
                  <Button variant="ghost" size="sm" onClick={() => deleteWebAuthnMut.mutate(k.credential_uuid)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </FactorCard>

        {/* SMS */}
        <FactorCard
          label="Text Message (SMS)"
          icon={MFA_METHOD_META.sms.icon}
          enabled={s?.is_sms_available ?? false}
          enrolling={activeEnroll === "sms"}
          onEnroll={() => setActiveEnroll("sms")}
          onDisable={() => disableSmsMut.mutate()}
          loading={disableSmsMut.isPending}
        >
          {activeEnroll === "sms" && (
            <EnrollPanel onCancel={() => { setActiveEnroll(null); setSmsSent(false); setPhone("") }}>
              <Label>Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                disabled={smsSent}
                className="mt-1"
              />
              {!smsSent ? (
                <Button className="mt-2" onClick={() => smsBeginMut.mutate(phone)} disabled={smsBeginMut.isPending || !phone}>
                  Send Code
                </Button>
              ) : (
                <>
                  <Label className="mt-2">Verification Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} />
                    <Button onClick={() => smsVerifyMut.mutate(code)} disabled={smsVerifyMut.isPending || code.length < 6}>
                      Verify
                    </Button>
                  </div>
                </>
              )}
            </EnrollPanel>
          )}
        </FactorCard>

        {/* Email OTP */}
        <FactorCard
          label="Email OTP"
          icon={MFA_METHOD_META.email_otp.icon}
          enabled={s?.is_email_otp_available ?? false}
          enrolling={activeEnroll === "email_otp"}
          onEnroll={() => { setActiveEnroll("email_otp"); emailBeginMut.mutate() }}
          onDisable={() => disableEmailMut.mutate()}
          loading={disableEmailMut.isPending || emailBeginMut.isPending}
        >
          {activeEnroll === "email_otp" && (
            <EnrollPanel onCancel={() => setActiveEnroll(null)}>
              <p className="text-sm mb-3">A verification code has been sent to your email.</p>
              <Label>Verification Code</Label>
              <div className="flex gap-2 mt-1">
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} />
                <Button onClick={() => emailVerifyMut.mutate(code)} disabled={emailVerifyMut.isPending || code.length < 6}>
                  Verify
                </Button>
              </div>
            </EnrollPanel>
          )}
        </FactorCard>

        {/* Backup Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MFA_METHOD_META.backup_code.icon className="h-4 w-4" /> Backup Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              {s?.backup_codes_count ?? 0} backup codes remaining
            </p>
            {backupCodes.length > 0 && (
              <div className="bg-muted rounded p-3 mb-3">
                <div className="grid grid-cols-2 gap-1">
                  {backupCodes.map((c, i) => (
                    <code key={i} className="text-sm font-mono">{c}</code>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={copyCodes}>
                    <Copy className="h-3 w-3 mr-1" /> {copied ? "Copied!" : "Copy All"}
                  </Button>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => backupCodesMut.mutate()}
              disabled={backupCodesMut.isPending}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate Backup Codes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FactorCard({
  label, icon: Icon, enabled, enrolling, onEnroll, onDisable, loading, children,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  enabled: boolean
  enrolling: boolean
  onEnroll?: () => void
  onDisable?: () => void
  loading?: boolean
  children?: React.ReactNode
}) {
  return (
    <Card className={cn(enabled && "border-primary/40")}>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4" /> {label}
          </span>
          <span className="flex items-center gap-2">
            {enabled && <span className="text-xs text-green-600 font-normal">Enabled</span>}
            {enabled && onDisable ? (
              <Button variant="ghost" size="sm" onClick={onDisable} disabled={loading}>
                <Trash2 className="h-3 w-3" />
              </Button>
            ) : onEnroll ? (
              <Button variant="outline" size="sm" onClick={onEnroll} disabled={enrolling || loading}>
                <Plus className="h-3 w-3 mr-1" /> Set up
              </Button>
            ) : null}
          </span>
        </CardTitle>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  )
}

function EnrollPanel({ children, onCancel }: { children: React.ReactNode; onCancel: () => void }) {
  return (
    <div className="rounded border p-4 mt-2 relative">
      <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={onCancel}>
        <X className="h-3 w-3" />
      </Button>
      {children}
    </div>
  )
}
