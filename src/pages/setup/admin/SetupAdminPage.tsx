import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import LoginLayout from "@/components/layout/LoginLayout"
import SetupAdminForm from "./components/SetupAdminForm"
import { useSetupStatus } from "@/hooks/useSetup"

const SetupAdminPage = () => {
  const navigate = useNavigate()
  const { status, checkStatus, isLoading } = useSetupStatus()

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  useEffect(() => {
    if (!status) return
    if (status.is_admin_setup || !status.is_tenant_setup) {
      navigate('/login', { replace: true })
    }
  }, [status, navigate])

  if (isLoading || !status) return null

  return (
    <LoginLayout>
      <SetupAdminForm />
    </LoginLayout>
  )
}

export default SetupAdminPage
