import { Outlet } from "react-router"
import { AppHeader } from "@/components/layout/AppHeader"

export function AppLayout() {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background text-foreground">
      <AppHeader />
      <main className="flex w-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
