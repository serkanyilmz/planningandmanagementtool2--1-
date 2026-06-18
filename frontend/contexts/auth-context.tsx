"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export interface User {
  id: string
  username: string
  name: string
  email: string
  fullName: string
  profileImageFileId?: string
  profileImageUrl?: string
}

interface AuthContextType {
  users: User[]
  currentUser: User | null
  token: string | null
  isHydrated: boolean
  register: (fullName: string, username: string, email: string, password: string) => Promise<AuthResult>
  login: (usernameOrEmail: string, password: string) => Promise<AuthResult>
  logout: () => void
  refreshCurrentUser: () => Promise<void>
  updateEmail: (currentPassword: string, email: string) => Promise<AuthResult>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>
  updateAvatar: (file: File) => Promise<AuthResult>
  getUserByEmail: (email: string) => User | undefined
}

interface AuthResult {
  success: boolean
  error?: string
}

interface AuthResponse {
  token: string
  userId: number
  username: string
  email: string
  fullName: string
  profileImageFileId?: string
  profileImageUrl?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USERS_STORAGE_KEY = "planify_users"
const CURRENT_USER_STORAGE_KEY = "planify_current_user"
const AUTH_TOKEN_STORAGE_KEY = "planify_auth_token"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

function toUser(response: AuthResponse): User {
  return {
    id: String(response.userId),
    username: response.username,
    name: response.fullName,
    fullName: response.fullName,
    email: response.email,
    profileImageFileId: response.profileImageFileId || "",
    profileImageUrl: response.profileImageUrl || "",
  }
}

function upsertUser(users: User[], user: User) {
  const existingIndex = users.findIndex((storedUser) => storedUser.id === user.id || storedUser.email === user.email)

  if (existingIndex === -1) {
    return [...users, user]
  }

  return users.map((storedUser, index) => (index === existingIndex ? user : storedUser))
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; error?: string }
    return body.message || body.error || fallback
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY)
    const storedCurrentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY)
    const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers))
    }
    if (storedCurrentUser && storedToken) {
      setCurrentUser(JSON.parse(storedCurrentUser))
    }
    if (storedToken) {
      setToken(storedToken)
    }
    setIsHydrated(true)
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    setToken(null)
  }, [])

  useEffect(() => {
    const handleSessionExpired = () => logout()
    window.addEventListener("planify:session-expired", handleSessionExpired)
    return () => window.removeEventListener("planify:session-expired", handleSessionExpired)
  }, [logout])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    }
  }, [users, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser))
      } else {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
      }
    }
  }, [currentUser, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
      } else {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
      }
    }
  }, [token, isHydrated])

  const register = useCallback(
    async (fullName: string, username: string, email: string, password: string) => {
      if (password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters" }
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, username, email, password }),
        })

        if (!response.ok) {
          return { success: false, error: await readError(response, "Registration failed") }
        }

        const authResponse = (await response.json()) as AuthResponse
        const user = toUser(authResponse)

        setUsers((prev) => upsertUser(prev, user))
        setCurrentUser(user)
        setToken(authResponse.token)
        return { success: true }
      } catch {
        return { success: false, error: "Unable to connect to the authentication server" }
      }
    },
    [],
  )

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernameOrEmail, password }),
        })

        if (!response.ok) {
          return { success: false, error: await readError(response, "Invalid credentials") }
        }

        const authResponse = (await response.json()) as AuthResponse
        const user = toUser(authResponse)

        setUsers((prev) => upsertUser(prev, user))
        setCurrentUser(user)
        setToken(authResponse.token)
        return { success: true }
      } catch {
        return { success: false, error: "Unable to connect to the authentication server" }
      }
    },
    [],
  )

  const applyAuthResponseUser = useCallback((authResponse: AuthResponse) => {
    const user = toUser(authResponse)
    setUsers((prev) => upsertUser(prev, user))
    setCurrentUser(user)
    return user
  }, [])

  const refreshCurrentUser = useCallback(async () => {
    if (!token) return
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      logout()
      return
    }
    applyAuthResponseUser((await response.json()) as AuthResponse)
  }, [token, applyAuthResponseUser, logout])

  useEffect(() => {
    if (!isHydrated || !token) return
    void refreshCurrentUser()
  }, [isHydrated, token, refreshCurrentUser])

  useEffect(() => {
    if (!isHydrated || !token) return

    const validate = () => {
      void refreshCurrentUser()
    }
    const interval = window.setInterval(validate, 60_000)
    window.addEventListener("focus", validate)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", validate)
    }
  }, [isHydrated, refreshCurrentUser, token])

  const updateEmail = useCallback(
    async (currentPassword: string, email: string) => {
      if (!token) return { success: false, error: "Not signed in" }
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me/email`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ currentPassword, email }),
        })
        if (!response.ok) return { success: false, error: await readError(response, "Email update failed") }
        applyAuthResponseUser((await response.json()) as AuthResponse)
        return { success: true }
      } catch {
        return { success: false, error: "Unable to update email" }
      }
    },
    [token, applyAuthResponseUser],
  )

  const updatePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!token) return { success: false, error: "Not signed in" }
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me/password`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ currentPassword, newPassword }),
        })
        if (!response.ok) return { success: false, error: await readError(response, "Password update failed") }
        applyAuthResponseUser((await response.json()) as AuthResponse)
        return { success: true }
      } catch {
        return { success: false, error: "Unable to update password" }
      }
    },
    [token, applyAuthResponseUser],
  )

  const updateAvatar = useCallback(
    async (file: File) => {
      if (!token) return { success: false, error: "Not signed in" }
      if (!file.type.startsWith("image/")) return { success: false, error: "Please choose an image file" }
      const formData = new FormData()
      formData.append("file", file)
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me/avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (!response.ok) return { success: false, error: await readError(response, "Avatar update failed") }
        applyAuthResponseUser((await response.json()) as AuthResponse)
        return { success: true }
      } catch {
        return { success: false, error: "Unable to update profile picture" }
      }
    },
    [token, applyAuthResponseUser],
  )

  const getUserByEmail = useCallback(
    (email: string) => {
      return users.find((u) => u.email === email)
    },
    [users],
  )

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        token,
        isHydrated,
        register,
        login,
        logout,
        refreshCurrentUser,
        updateEmail,
        updatePassword,
        updateAvatar,
        getUserByEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
