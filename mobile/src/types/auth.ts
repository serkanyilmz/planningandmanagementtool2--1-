export interface MobileUser {
  id: string
  username: string
  email: string
  fullName: string
  profileImageFileId?: string
  profileImageUrl?: string
}

export interface AuthResponse {
  token: string
  tokenType: string
  expiresIn: number
  userId: number
  username: string
  email: string
  fullName: string
  profileImageFileId?: string
  profileImageUrl?: string
}

export interface AuthResult {
  success: boolean
  error?: string
}
