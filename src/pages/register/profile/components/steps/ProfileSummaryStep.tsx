import { Edit2, User, Mail, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormSetupCard } from "@/components/form"
import type { CreateProfileRequest } from "@/services/api/auth/types"

interface ProfileSummaryStepProps {
  data: Partial<CreateProfileRequest>
  onEditStep: (stepIndex: number) => void
}

const ProfileSummaryStep = ({ data, onEditStep }: ProfileSummaryStepProps) => {
  // Generate display name for preview
  const displayName = data.first_name && data.last_name 
    ? `${data.first_name} ${data.last_name}` 
    : ''

  return (
    <FormSetupCard
      title="Review Your Profile"
      description="Please review your information before creating your profile"
    >
      <div className="space-y-6">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Personal Information</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(0)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">First Name</span>
                <p className="font-medium">{data.first_name || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Last Name</span>
                <p className="font-medium">{data.last_name || 'Not provided'}</p>
              </div>
            </div>

            {displayName && (
              <div>
                <span className="text-sm text-gray-600">Display Name</span>
                <p className="font-medium">{displayName}</p>
              </div>
            )}

            {data.birthdate && (
              <div>
                <span className="text-sm text-gray-600">Date of Birth</span>
                <p className="font-medium">{new Date(data.birthdate).toLocaleDateString()}</p>
              </div>
            )}

            {data.gender && (
              <div>
                <span className="text-sm text-gray-600">Gender</span>
                <p className="font-medium">{data.gender}</p>
              </div>
            )}

            {data.bio && (
              <div>
                <span className="text-sm text-gray-600">Bio</span>
                <p className="font-medium">{data.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Contact Information</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(1)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <span className="text-sm text-gray-600">Email</span>
              <p className="font-medium">{data.email || 'Not provided'}</p>
            </div>

            {data.phone && (
              <div>
                <span className="text-sm text-gray-600">Phone</span>
                <p className="font-medium">{data.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Location & Preferences Section */}
        {(data.address || data.city || data.country || data.timezone || data.language) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Location & Preferences</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(2)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {data.address && (
                <div>
                  <span className="text-sm text-gray-600">Address</span>
                  <p className="font-medium">{data.address}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.city && (
                  <div>
                    <span className="text-sm text-gray-600">City</span>
                    <p className="font-medium">{data.city}</p>
                  </div>
                )}

                {data.country && (
                  <div>
                    <span className="text-sm text-gray-600">Country</span>
                    <p className="font-medium">{data.country}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.timezone && (
                  <div>
                    <span className="text-sm text-gray-600">Timezone</span>
                    <p className="font-medium">{data.timezone}</p>
                  </div>
                )}

                {data.language && (
                  <div>
                    <span className="text-sm text-gray-600">Language</span>
                    <p className="font-medium">{data.language}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary Note */}
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Ready to create your profile?</strong> Review the information above and make any necessary changes by clicking the "Edit" buttons. Once you're satisfied, click "Create Profile" to complete the setup.
          </p>
        </div>
      </div>
    </FormSetupCard>
  )
}

export default ProfileSummaryStep
