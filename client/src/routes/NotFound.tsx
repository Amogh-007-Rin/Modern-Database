import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function NotFoundPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Page not found</CardTitle>
        <CardDescription>
          The page you are looking for does not exist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button render={<Link to="/" />}>Go home</Button>
      </CardContent>
    </Card>
  )
}
