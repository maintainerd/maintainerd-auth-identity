import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const RegisterProfileSuccess = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login-success")
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

  const handleContinue = () => {
    navigate("/login-success")
  }

  return (
    <div className="flex flex-col gap-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="size-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">All set!</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your profile has been created. You can now access the app.
        </p>
      </div>

        <Button onClick={handleContinue} className="w-full">
          Continue
        <ArrowRight className="ml-2 size-4" />
      </Button>

      <p className="text-xs text-muted-foreground">
        Redirecting automatically in a few seconds...
      </p>
    </div>
  )
}

export default RegisterProfileSuccess
