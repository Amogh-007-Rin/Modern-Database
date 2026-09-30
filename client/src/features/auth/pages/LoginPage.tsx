import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/features/auth/components/AuthLayout"
import { OAuthButtons } from "@/features/auth/components/OAuthButtons"
import { getApiErrorMessage, isValidEmail } from "@/utils/validation"

const oauthErrorMessages: Record<string, string> = {
  oauth_cancelled: "OAuth sign-in was cancelled. Please try again.",
  oauth_invalid: "OAuth session expired. Please try again.",
  oauth_failed: "Unable to sign in with that provider. Please try again.",
  google_not_configured: "Google sign-in isn't set up yet.",
  github_not_configured: "GitHub sign-in isn't set up yet.",
  discord_not_configured: "Discord sign-in isn't set up yet.",
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(
    oauthErrorMessages[searchParams.get("error") ?? ""] ?? null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSearchParams(
      (previous) => {
        previous.delete("error")
        return previous
      },
      { replace: true },
    )

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.")
      return
    }
    if (!password) {
      setError("Password is required.")
      return
    }

    setIsSubmitting(true)
    try {
      await login(email.trim(), password)
      await navigate("/")
    } catch (unknown) {
      setError(getApiErrorMessage(unknown, "Unable to sign in."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      description="Welcome back. Sign in to your account."
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
        <OAuthButtons />
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="text-foreground underline underline-offset-4"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
