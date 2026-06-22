import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import LoginLayout from "@/components/layout/LoginLayout"
import SetupTenantForm from "./components/SetupTenantForm"
import { useSetupStatus } from "@/hooks/useSetup"

const SetupTenantPage = () => {
  const navigate = useNavigate()
  const { status, checkStatus, isLoading } = useSetupStatus()

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  useEffect(() => {
    if (status?.is_tenant_setup) {
      navigate('/login', { replace: true })
    }
  }, [status, navigate])

  if (isLoading || !status) return null

  return (
    <LoginLayout>
      <SetupTenantForm />
    </LoginLayout>
  )
}

export default SetupTenantPage
