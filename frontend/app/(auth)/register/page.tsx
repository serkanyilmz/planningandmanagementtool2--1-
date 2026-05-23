"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Alert,
} from "@mui/material"
import { Visibility, VisibilityOff, GridView, Warning } from "@mui/icons-material"
import { useAuth } from "@/contexts/auth-context"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [kvkkConsent, setKvkkConsent] = useState(false)
  const [termsConsent, setTermsConsent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!kvkkConsent) {
      setError("You must accept the KVKK consent to register")
      return
    }

    if (!termsConsent) {
      setError("You must accept the Terms of Service to register")
      return
    }

    setLoading(true)

    const result = register(formData.fullName, formData.email, formData.password)

    if (result.success) {
      router.push("/login")
    } else {
      setError(result.error || "Registration failed")
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
              Create an account
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              Get started with your free account today
            </Typography>

            {error && (
              <Alert severity="error" icon={<Warning />} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                required
                helperText="Must be at least 8 characters"
                error={formData.password.length > 0 && formData.password.length < 8}
                sx={{ mb: 2 }}
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
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />

              {/* Consent Checkboxes */}
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: "warning.light",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "warning.main",
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={kvkkConsent} onChange={(e) => setKvkkConsent(e.target.checked)} />}
                  label={
                    <Typography variant="body2">
                      <span style={{ color: "red" }}>*</span>{" "}
                      <Link href="/kvkk" style={{ color: "#002366" }}>
                        Kisisel Verilerin Korunmasi Kanunu (KVKK)
                      </Link>{" "}
                      metnini okudum ve onayliyorum.
                    </Typography>
                  }
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                  Required for compliance with Turkish data protection law
                </Typography>
              </Box>

              <FormControlLabel
                control={<Checkbox checked={termsConsent} onChange={(e) => setTermsConsent(e.target.checked)} />}
                label={
                  <Typography variant="body2">
                    <span style={{ color: "red" }}>*</span> I agree to the{" "}
                    <Link href="/terms" style={{ color: "#002366" }}>
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" style={{ color: "#002366" }}>
                      Privacy Policy
                    </Link>
                  </Typography>
                }
                sx={{ mb: 2 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={!kvkkConsent || !termsConsent || loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <Typography variant="body2" align="center" sx={{ mt: 3 }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#002366", fontWeight: 500 }}>
                Sign in
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
