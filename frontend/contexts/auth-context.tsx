"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export interface User {
  id: string
  name: string
  email: string
  password: string
}

interface AuthContextType {
  users: User[]
  currentUser: User | null
  register: (name: string, email: string, password: string) => { success: boolean; error?: string }
  login: (email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  getUserByEmail: (email: string) => User | undefined
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USERS_STORAGE_KEY = "planify_users"
const CURRENT_USER_STORAGE_KEY = "planify_current_user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY)
    const storedCurrentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY)

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers))
    }
    if (storedCurrentUser) {
      setCurrentUser(JSON.parse(storedCurrentUser))
    }
    setIsHydrated(true)
  }, [])

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

  const register = useCallback(
    (name: string, email: string, password: string) => {
      if (password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters" }
      }

      if (users.some((u) => u.email === email)) {
        return { success: false, error: "Email already registered" }
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        password,
      }

      setUsers((prev) => [...prev, newUser])
      return { success: true }
    },
    [users],
  )

  const login = useCallback(
    (email: string, password: string) => {
      const user = users.find((u) => u.email === email && u.password === password)

      if (!user) {
        return { success: false, error: "Invalid credentials" }
      }

      setCurrentUser(user)
      return { success: true }
    },
    [users],
  )

  const logout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  const getUserByEmail = useCallback(
    (email: string) => {
      return users.find((u) => u.email === email)
    },
    [users],
  )

  return (
    <AuthContext.Provider value={{ users, currentUser, register, login, logout, getUserByEmail }}>
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
