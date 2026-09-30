import { Link, useNavigate } from "react-router"
import { LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

export function AppHeader() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    await navigate("/login")
  }

  return (
    <header className="flex h-14 w-full items-center justify-between border-b px-4 sm:px-6">
      <Link to="/" className="text-sm font-semibold tracking-widest uppercase">
        Modern Databases
      </Link>
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" render={<Link to="/login" />}>
              Sign in
            </Button>
            <Button variant="default" size="sm" render={<Link to="/signup" />}>
              Sign up
            </Button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
