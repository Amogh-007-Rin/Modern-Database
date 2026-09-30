export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  providers: string[]
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
  message?: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
  resetToken?: string
  error?: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}
