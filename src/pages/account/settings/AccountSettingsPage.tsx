import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AccountLayout from '@/components/layout/AccountLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { fetchUserSettings, updateUserSettings, type UserSettings } from '@/services/api/account'

const THEMES = ['light', 'dark', 'system'] as const

export default function AccountSettingsPage() {
  const qc = useQueryClient()
  const { showError, showSuccess } = useToast()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['account', 'settings'],
    queryFn: fetchUserSettings,
  })

  const form = useForm<UserSettings>({
    defaultValues: { language: 'en', theme: 'system', email_notifications: true, marketing_emails: false },
  })

  useEffect(() => {
    if (settings) form.reset(settings)
  }, [settings, form])

  const saveMutation = useMutation({
    mutationFn: (data: UserSettings) => updateUserSettings(data),
    onSuccess: () => {
      showSuccess('Preferences saved')
      qc.invalidateQueries({ queryKey: ['account', 'settings'] })
    },
    onError: (err) => showError(err, 'Could not save preferences'),
  })

  if (isLoading) {
    return (
      <AccountLayout title="Preferences">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AccountLayout>
    )
  }

  const selectedTheme = form.watch('theme')

  return (
    <AccountLayout title="Preferences">
      <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
        {/* Localisation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Localisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="language" className="text-sm">Language</Label>
              <Input
                id="language"
                placeholder="en"
                {...form.register('language')}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="timezone" className="text-sm">Timezone</Label>
              <Input
                id="timezone"
                placeholder="Europe/London"
                {...form.register('timezone')}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => form.setValue('theme', t)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    selectedTheme === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input bg-background text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_notifications" className="text-sm font-normal">
                Email notifications
              </Label>
              <input
                id="email_notifications"
                type="checkbox"
                {...form.register('email_notifications')}
                className="size-4 cursor-pointer rounded border-input accent-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing_emails" className="text-sm font-normal">
                Marketing emails
              </Label>
              <input
                id="marketing_emails"
                type="checkbox"
                {...form.register('marketing_emails')}
                className="size-4 cursor-pointer rounded border-input accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </form>
    </AccountLayout>
  )
}
