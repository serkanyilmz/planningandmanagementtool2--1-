import AsyncStorage from "@react-native-async-storage/async-storage"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { loginRequest, meRequest, registerRequest } from "@/api/auth"
import { AuthError } from "@/api/client"
import type { AuthResult, AuthResponse, MobileUser } from "@/types/auth"

const TOKEN_STORAGE_KEY = "planify_mobile_token"
const USER_STORAGE_KEY = "planify_mobile_user"

interface AuthContextValue {
  token: string | null
  currentUser: MobileUser | null
  isHydrated: boolean
  login: (usernameOrEmail: string, password: string) => Promise<AuthResult>
  register: (fullName: string, username: string, email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  refreshCurrentUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function toUser(response: AuthResponse): MobileUser {
  return {
    id: String(response.userId),
    username: response.username,
    email: response.email,
    fullName: response.fullName,
    profileImageFileId: response.profileImageFileId || "",
    profileImageUrl: response.profileImageUrl || "",
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<MobileUser | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  const persistSession = useCallback(async (nextToken: string, nextUser: MobileUser) => {
    setToken(nextToken)
    setCurrentUser(nextUser)
    await AsyncStorage.multiSet([
      [TOKEN_STORAGE_KEY, nextToken],
      [USER_STORAGE_KEY, JSON.stringify(nextUser)],
    ])
  }, [])

  const logout = useCallback(async () => {
    setToken(null)
    setCurrentUser(null)
    await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY])
  }, [])

  const refreshCurrentUser = useCallback(async () => {
    if (!token) return
    try {
      const response = await meRequest(token)
      const nextUser = toUser({ ...response, token })
      setCurrentUser(nextUser)
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
    } catch (error) {
      if (error instanceof AuthError) {
        await logout()
      }
    }
  }, [logout, token])

  useEffect(() => {
    const bootstrap = async () => {
      const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet([TOKEN_STORAGE_KEY, USER_STORAGE_KEY])

      if (storedToken) {
        setToken(storedToken)
      }

      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser) as MobileUser)
      }

      setIsHydrated(true)
    }

    void bootstrap()
  }, [])

  useEffect(() => {
    if (!isHydrated || !token) return
    void refreshCurrentUser()
  }, [isHydrated, refreshCurrentUser, token])

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      try {
        const response = await loginRequest(usernameOrEmail, password)
        await persistSession(response.token, toUser(response))
        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Login failed" }
      }
    },
    [persistSession],
  )

  const register = useCallback(async (fullName: string, username: string, email: string, password: string) => {
    try {
      await registerRequest(fullName, username, email, password)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Registration failed" }
    }
  }, [])

  const value = useMemo(
    () => ({
      token,
      currentUser,
      isHydrated,
      login,
      register,
      logout,
      refreshCurrentUser,
    }),
    [currentUser, isHydrated, login, logout, refreshCurrentUser, register, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
