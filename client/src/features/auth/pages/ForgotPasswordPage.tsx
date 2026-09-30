import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/features/auth/components/AuthLayout"
import { getApiErrorMessage, isValidEmail } from "@/utils/validation"

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [devToken, setDevToken] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setDevToken(null)

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.")
      return
    }

    setIsSubmitting(true)
    try {
      const resetToken = await forgotPassword(email.trim())
      setIsSent(true)
      setDevToken(resetToken ?? null)
    } catch (unknown) {
      setError(getApiErrorMessage(unknown, "Unable to request password reset."))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSent) {
    return (
      <AuthLayout
        title="Check your email"
        description="If an account exists, a reset link has been sent."
      >
        <div className="flex flex-col gap-4">
          {devToken ? (
            <p className="text-sm text-muted-foreground">
              Development reset link:{" "}
              <Link
                to={`/reset-password?token=${devToken}`}
                className="text-foreground underline underline-offset-4"
              >
                Continue to reset password
              </Link>
            </p>
          ) : null}
          <Button variant="outline" render={<Link to="/login" />}>
            Back to sign in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset password"
      description="Enter your email to receive a reset link."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Sending link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link
            to="/login"
            className="text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
