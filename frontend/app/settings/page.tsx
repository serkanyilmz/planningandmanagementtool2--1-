"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { useProtectedImage } from "@/hooks/use-protected-image"
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Slider,
  TextField,
  Typography,
} from "@mui/material"

export default function SettingsPage() {
  const router = useRouter()
  const { currentUser, token, updateAvatar, updateEmail, updatePassword } = useAuth()
  const avatarPreview = useProtectedImage(currentUser?.profileImageUrl, token)
  const [email, setEmail] = useState(currentUser?.email || "")
  const [emailPassword, setEmailPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [cropOpen, setCropOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState("")
  const [cropFileName, setCropFileName] = useState("profile.jpg")
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const cropImageRef = useRef<HTMLImageElement | null>(null)
  const previewSize = 280
  const previewBaseScale =
    naturalSize.width && naturalSize.height ? Math.max(previewSize / naturalSize.width, previewSize / naturalSize.height) : 1
  const previewScale = previewBaseScale * zoom
  const previewImageWidth = naturalSize.width * previewScale
  const previewImageHeight = naturalSize.height * previewScale
  const previewImageLeft = (previewSize - previewImageWidth) / 2 + offset.x
  const previewImageTop = (previewSize - previewImageHeight) / 2 + offset.y

  useEffect(() => {
    if (!currentUser) {
      router.push("/login")
      return
    }
    setEmail(currentUser.email)
  }, [currentUser, router])

  useEffect(() => {
    return () => {
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc)
    }
  }, [cropImageSrc])

  const showResult = (result: { success: boolean; error?: string }, successMessage: string) => {
    setError(result.error || "")
    setMessage(result.success ? successMessage : "")
  }

  const handleAvatarChange = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file")
      return
    }
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc)
    setCropImageSrc(URL.createObjectURL(file))
    setCropFileName(file.name || "profile.jpg")
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setNaturalSize({ width: 0, height: 0 })
    setError("")
    setCropOpen(true)
  }

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart) return
    setOffset({
      x: dragStart.offsetX + event.clientX - dragStart.x,
      y: dragStart.offsetY + event.clientY - dragStart.y,
    })
  }

  const handleSaveCroppedAvatar = async () => {
    const image = cropImageRef.current
    if (!image || !image.naturalWidth || !image.naturalHeight) return

    const outputSize = 512
    const baseScale = Math.max(previewSize / image.naturalWidth, previewSize / image.naturalHeight)
    const scale = baseScale * zoom
    const displayedWidth = image.naturalWidth * scale
    const displayedHeight = image.naturalHeight * scale
    const left = (previewSize - displayedWidth) / 2 + offset.x
    const top = (previewSize - displayedHeight) / 2 + offset.y
    const outputScale = outputSize / previewSize

    const canvas = document.createElement("canvas")
    canvas.width = outputSize
    canvas.height = outputSize
    const context = canvas.getContext("2d")
    if (!context) return
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, outputSize, outputSize)
    context.drawImage(image, left * outputScale, top * outputScale, displayedWidth * outputScale, displayedHeight * outputScale)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92))
    if (!blob) {
      setError("Unable to crop image")
      return
    }
    const croppedFile = new File([blob], cropFileName.replace(/\.[^.]+$/, "") + "-cropped.jpg", { type: "image/jpeg" })
    showResult(await updateAvatar(croppedFile), "Profile picture updated")
    setCropOpen(false)
  }

  const handleEmailSave = async () => {
    showResult(await updateEmail(emailPassword, email), "Email updated")
    setEmailPassword("")
  }

  const handlePasswordSave = async () => {
    showResult(await updatePassword(currentPassword, newPassword), "Password updated")
    setCurrentPassword("")
    setNewPassword("")
  }

  if (!currentUser) return null

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />
        <Box component="main" sx={{ flex: 1, bgcolor: "background.default", p: { xs: 2, lg: 3 } }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Profile Settings
          </Typography>

          <Card sx={{ maxWidth: 720 }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {message && <Alert severity="success">{message}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar src={avatarPreview} sx={{ width: 72, height: 72, bgcolor: "primary.main" }}>
                  {currentUser.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {currentUser.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {currentUser.username}
                  </Typography>
                  <Button component="label" variant="outlined" size="small">
                    Change Picture
                    <input
                      hidden
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(event) => {
                        handleAvatarChange(event.target.files?.[0])
                        event.target.value = ""
                      }}
                    />
                  </Button>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Email Address
                </Typography>
                <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                <TextField
                  label="Current Password"
                  type="password"
                  value={emailPassword}
                  onChange={(event) => setEmailPassword(event.target.value)}
                />
                <Button variant="contained" onClick={handleEmailSave} disabled={!email.trim() || !emailPassword}>
                  Save Email
                </Button>
              </Box>

              <Divider />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Password
                </Typography>
                <TextField
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
                <TextField
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  helperText="Use at least 8 characters"
                />
                <Button
                  variant="contained"
                  onClick={handlePasswordSave}
                  disabled={!currentPassword || newPassword.length < 8}
                >
                  Save Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Dialog open={cropOpen} onClose={() => setCropOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Crop Profile Picture</DialogTitle>
        <DialogContent>
          <Box
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              setDragStart({ x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y })
            }}
            onPointerMove={handleCropPointerMove}
            onPointerUp={() => setDragStart(null)}
            sx={{
              width: 280,
              height: 280,
              mx: "auto",
              mt: 1,
              borderRadius: "50%",
              overflow: "hidden",
              position: "relative",
              bgcolor: "action.hover",
              cursor: dragStart ? "grabbing" : "grab",
              touchAction: "none",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {cropImageSrc && (
              <Box
                component="img"
                ref={cropImageRef}
                src={cropImageSrc}
                alt="Crop preview"
                onLoad={(event) =>
                  setNaturalSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  })
                }
                draggable={false}
                sx={{
                  position: "absolute",
                  left: previewImageLeft,
                  top: previewImageTop,
                  width: previewImageWidth || "100%",
                  height: previewImageHeight || "100%",
                  maxWidth: "none",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            Zoom
          </Typography>
          <Slider value={zoom} min={1} max={3} step={0.05} onChange={(_, value) => setZoom(value as number)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCropOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCroppedAvatar}>
            Save Picture
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
