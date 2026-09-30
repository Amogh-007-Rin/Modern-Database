import { createBrowserRouter } from "react-router"
import { AppLayout } from "@/components/layout/AppLayout"
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage"
import { SignupPage } from "@/features/auth/pages/SignupPage"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { NotFoundPage } from "@/routes/NotFound"
import { RequireAuth, RequireGuest } from "@/routes/guards"

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        element: <RequireAuth />,
        children: [{ index: true, element: <DashboardPage /> }],
      },
      {
        element: <RequireGuest />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "signup", element: <SignupPage /> },
        ],
      },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
