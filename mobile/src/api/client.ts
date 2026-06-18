const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080"

export class AuthError extends Error {
  constructor(message = "Session expired") {
    super(message)
    this.name = "AuthError"
  }
}

async function readError(response: Response) {
  if (response.status === 401 || response.status === 403) {
    return "Your session has expired. Please sign in again."
  }

  try {
    const body = (await response.json()) as { message?: string; error?: string }
    return body.message || body.error || `Request failed with status ${response.status}`
  } catch {
    return `Request failed with status ${response.status}`
  }
}

export async function apiRequest<T>(path: string, token?: string | null, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const message = await readError(response)
    if (response.status === 401 || response.status === 403) {
      throw new AuthError(message)
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function getApiUrl() {
  return API_URL
}

export function protectedImageSource(url?: string, token?: string | null) {
  if (!url) {
    return undefined
  }

  const uri = url.startsWith("http") ? url : `${API_URL}${url}`
  return token
    ? {
        uri,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : { uri }
}
