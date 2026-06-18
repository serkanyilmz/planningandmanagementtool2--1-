const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

async function readError(response: Response) {
    if (response.status === 401 || response.status === 403) {
        return "Your session has expired or is no longer valid. Please sign in again."
    }

    let message = `Request failed with status ${response.status}`
    try {
        const body = (await response.json()) as { message?: string; error?: string }
        message = body.message || body.error || message
    } catch {
        // Keep fallback message for empty error responses.
    }
    return message
}

export async function apiRequest<T>(path: string, token?: string | null, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    })

    if (!response.ok) {
        throw new Error(await readError(response))
    }

    if (response.status === 204) {
        return undefined as T
    }

    return (await response.json()) as T
}
