export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://hono-api-yt2r.onrender.com"

const request = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const serverMsg =
      body?.message ??
      body?.error ??
      (Array.isArray(body?.errors)
        ? body.errors.map((e: { message: string }) => e.message).join(". ")
        : null) ??
      `Error ${response.status}`
    throw new Error(serverMsg)
  }

  if (response.status === 204) return undefined as T

  return response.json()
}

export const apiService = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: "GET" }, token),

  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, token),

  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, token),

  delete: <T>(path: string, token?: string) =>
    request<T>(path, { method: "DELETE" }, token),
}
