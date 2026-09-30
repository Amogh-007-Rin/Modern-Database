import { Link } from "react-router"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Welcome{user ? `, ${user.name}` : ""}</CardTitle>
        <CardDescription>
          You are signed in{user ? ` as ${user.email}` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" render={<Link to="/forgot-password" />}>
          Reset password
        </Button>
      </CardContent>
    </Card>
  )
}
