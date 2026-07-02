import { Link } from "react-router-dom"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import LoginLayout from "@/components/layout/LoginLayout"

export default function TooManyRequestsPage() {
  return (
    <LoginLayout>
      <div className="flex flex-col items-center gap-6 text-center w-full max-w-sm">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="size-8 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Too Many Requests</h1>
          <p className="text-muted-foreground">
            You&apos;ve made too many attempts in a short period.
            Please wait a moment before trying again.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/login">Back to Login</Link>
        </Button>
      </div>
    </LoginLayout>
  )
}
