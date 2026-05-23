"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, TextField, Button, Typography, Box, IconButton, InputAdornment, Alert } from "@mui/material"
import { Visibility, VisibilityOff, GridView, Warning } from "@mui/icons-material"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await login(usernameOrEmail, password)

    if (result.success) {
      router.push("/home")
    } else {
      setError(result.error || "Invalid credentials")
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 1,
              bgcolor: "primary.main",
            }}
          >
            <GridView sx={{ color: "white" }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
            Planify
          </Typography>
        </Box>

        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 1 }}>
              Welcome back
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              Enter your credentials to access your account
            </Typography>

            {error && (
              <Alert severity="error" icon={<Warning />} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Username or email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <Box sx={{ mb: 1, display: "flex", justifyContent: "flex-end" }}>
                <Link href="/forgot-password" style={{ textDecoration: "none" }}>
                  <Typography variant="caption" color="primary">
                    Forgot password?
                  </Typography>
                </Link>
              </Box>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <Typography variant="body2" align="center" sx={{ mt: 3 }}>
              Don't have an account?{" "}
              <Link href="/register" style={{ color: "#002366", fontWeight: 500 }}>
                Sign up
              </Link>
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="caption" align="center" display="block" color="text.secondary" sx={{ mt: 3 }}>
          By signing in, you agree to our{" "}
          <Link href="/terms" style={{ textDecoration: "underline" }}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" style={{ textDecoration: "underline" }}>
            Privacy Policy
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
