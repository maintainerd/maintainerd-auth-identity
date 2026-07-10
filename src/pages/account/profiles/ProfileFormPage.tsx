import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import AccountLayout from '@/components/layout/AccountLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { fetchProfiles, createProfile, updateProfile, type UserProfile } from '@/services/api/account'

interface ProfileForm {
  display_name: string
  first_name: string
  last_name: string
  profile_url: string
}

export default function ProfileFormPage() {
  const { profileId } = useParams<{ profileId: string }>()
  const isEdit = Boolean(profileId)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { showError, showSuccess } = useToast()

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['account', 'profiles'],
    queryFn: fetchProfiles,
    enabled: isEdit,
  })
  const editing = isEdit ? profiles.find((p: UserProfile) => p.profile_id === profileId) : undefined

  const form = useForm<ProfileForm>({
    defaultValues: { display_name: '', first_name: '', last_name: '', profile_url: '' },
  })

  useEffect(() => {
    if (editing) {
      form.reset({
        display_name: editing.display_name ?? '',
        first_name: editing.first_name ?? '',
        last_name: editing.last_name ?? '',
        profile_url: editing.profile_url ?? '',
      })
    }
  }, [editing, form])

  const invalidate = () => qc.invalidateQueries({ queryKey: ['account', 'profiles'] })

  const createMutation = useMutation({
    mutationFn: (data: ProfileForm) => createProfile(data),
    onSuccess: () => { showSuccess('Profile created'); invalidate(); navigate('/account/profile') },
    onError: (err) => showError(err, 'Could not create profile'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => updateProfile(profileId!, data),
    onSuccess: () => { showSuccess('Profile updated'); invalidate(); navigate('/account/profile') },
    onError: (err) => showError(err, 'Could not update profile'),
  })

  const onSubmit = form.handleSubmit((data) => {
    if (isEdit) updateMutation.mutate(data)
    else createMutation.mutate(data)
  })

  const pending = createMutation.isPending || updateMutation.isPending

  return (
    <AccountLayout title="Profile">
      <Link
        to="/account/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to profiles
      </Link>

      {isEdit && !isLoading && !editing ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Profile not found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isEdit ? 'Edit profile' : 'New profile'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="display_name">Display name</Label>
                  <Input id="display_name" placeholder="Display name" {...form.register('display_name')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" placeholder="First name" {...form.register('first_name')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" placeholder="Last name" {...form.register('last_name')} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="profile_url">Avatar URL</Label>
                  <Input id="profile_url" placeholder="https://…" {...form.register('profile_url')} className="mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate('/account/profile')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </AccountLayout>
  )
}
