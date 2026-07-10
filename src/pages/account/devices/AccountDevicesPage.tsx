import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Smartphone, Trash2 } from 'lucide-react'
import AccountLayout from '@/components/layout/AccountLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import {
  fetchTrustedDevices,
  revokeTrustedDevice,
  type TrustedDevice,
} from '@/services/api/account'

function DeviceRow({
  device,
  onRevoke,
  revoking,
}: {
  device: TrustedDevice
  onRevoke: (uuid: string) => void
  revoking: boolean
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Smartphone className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {device.device_name ?? (device.user_agent ? device.user_agent.slice(0, 60) : 'Unknown device')}
          </p>
          <p className="text-xs text-muted-foreground">
            Trusted {new Date(device.trusted_at).toLocaleDateString()}
            {device.last_used_at && (
              <> &middot; last used {new Date(device.last_used_at).toLocaleDateString()}</>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {confirming ? (
          <>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              disabled={revoking}
              onClick={() => { onRevoke(device.device_uuid); setConfirming(false) }}
            >
              Confirm revoke
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
            disabled={revoking}
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="size-3" />
            Revoke
          </Button>
        )}
      </div>
    </li>
  )
}

export default function AccountDevicesPage() {
  const qc = useQueryClient()
  const { showError, showSuccess } = useToast()

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['account', 'devices'],
    queryFn: fetchTrustedDevices,
  })

  const revokeMutation = useMutation({
    mutationFn: (uuid: string) => revokeTrustedDevice(uuid),
    onSuccess: () => {
      showSuccess('Device trust revoked')
      qc.invalidateQueries({ queryKey: ['account', 'devices'] })
    },
    onError: (err) => showError(err, 'Could not revoke device'),
  })

  return (
    <AccountLayout title="Trusted Devices">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Devices that skip MFA</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading devices…</p>
            )}
            {!isLoading && devices.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Smartphone className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No trusted devices</p>
                <p className="text-xs text-muted-foreground">
                  Devices are added when you choose &ldquo;Trust this device&rdquo; during MFA.
                </p>
              </div>
            )}
            <ul className="divide-y">
              {devices.map((device: TrustedDevice) => (
                <DeviceRow
                  key={device.device_uuid}
                  device={device}
                  onRevoke={(uuid) => revokeMutation.mutate(uuid)}
                  revoking={revokeMutation.isPending}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  )
}
