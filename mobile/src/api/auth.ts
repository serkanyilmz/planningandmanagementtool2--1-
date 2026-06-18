import { apiRequest } from "@/api/client"
import type { AuthResponse } from "@/types/auth"

export function loginRequest(usernameOrEmail: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", null, {
    method: "POST",
    body: JSON.stringify({ usernameOrEmail, password }),
  })
}

export function registerRequest(fullName: string, username: string, email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/register", null, {
    method: "POST",
    body: JSON.stringify({ fullName, username, email, password }),
  })
}

export function meRequest(token: string) {
  return apiRequest<AuthResponse>("/api/auth/me", token)
}
