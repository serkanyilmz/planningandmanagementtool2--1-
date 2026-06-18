"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Box, CircularProgress } from "@mui/material"
import { useAuth } from "@/contexts/auth-context"

const PUBLIC_PATHS = new Set(["/login", "/register"])

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, isHydrated, token } = useAuth()
  const isPublicPath = PUBLIC_PATHS.has(pathname)

  useEffect(() => {
    if (!isHydrated) return
    if (isPublicPath && token && currentUser) {
      router.replace("/home")
      return
    }
    if (isPublicPath) return
    if (!token || !currentUser) {
      router.replace("/login")
    }
  }, [currentUser, isHydrated, isPublicPath, router, token])

  if (!isHydrated) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (!isPublicPath && (!token || !currentUser)) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  return <>{children}</>
}
