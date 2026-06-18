const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export async function apiRequest<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("planify:session-expired"))
    }
    let message = "Request failed"
    try {
      const body = (await response.json()) as { message?: string; error?: string }
      message = body.message || body.error || message
    } catch {
      // Keep fallback message for empty error responses.
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
