import type {
  AuthResponse,
  ForgotPasswordResponse,
  LoginPayload,
  ResetPasswordPayload,
  SignupPayload,
  User,
} from "@/types/auth"
import { apiRequest } from "@/lib/api"

export async function signupApi(payload: SignupPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function meApi(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/me")
}

export async function logoutApi(): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>("/auth/logout", { method: "POST" })
}

export async function forgotPasswordApi(
  email: string,
): Promise<ForgotPasswordResponse> {
  return apiRequest<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export async function resetPasswordApi(
  payload: ResetPasswordPayload,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export type { User }
