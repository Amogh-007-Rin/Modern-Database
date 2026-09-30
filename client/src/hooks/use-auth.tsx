/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  forgotPasswordApi,
  loginApi,
  logoutApi,
  meApi,
  resetPasswordApi,
  signupApi,
} from "@/features/auth/api"
import type { User } from "@/types/auth"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  signup: (name: string, email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  forgotPassword: (email: string) => Promise<string | undefined>
  resetPassword: (token: string, password: string) => Promise<User>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const response = await meApi()
      setUser(response.success && response.user ? response.user : null)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial session restore must run once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginApi({ email, password })
    if (!response.success || !response.user) {
      throw new Error(response.error ?? "Unable to sign in.")
    }
    setUser(response.user)
    return response.user
  }, [])

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await signupApi({ name, email, password })
      if (!response.success || !response.user) {
        throw new Error(response.error ?? "Unable to create account.")
      }
      setUser(response.user)
      return response.user
    },
    [],
  )

  const logout = useCallback(async () => {
    await logoutApi().catch(() => ({ success: false }))
    setUser(null)
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    const response = await forgotPasswordApi(email)
    if (!response.success) {
      throw new Error(response.error ?? "Unable to request password reset.")
    }
    return response.resetToken
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    const response = await resetPasswordApi({ token, password })
    if (!response.success || !response.user) {
      throw new Error(response.error ?? "Unable to reset password.")
    }
    setUser(response.user)
    return response.user
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      signup,
      logout,
      refresh,
      forgotPassword,
      resetPassword,
    }),
    [
      user,
      isLoading,
      login,
      signup,
      logout,
      refresh,
      forgotPassword,
      resetPassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
