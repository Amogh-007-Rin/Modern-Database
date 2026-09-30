export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"

interface RequestOptions extends RequestInit {
  authToken?: string | null
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { authToken, headers, ...init } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    ...init,
  })

  const body = (await response.json().catch(() => null)) as T | null

  if (!body || typeof body !== "object") {
    throw new Error("Unexpected response from the server.")
  }

  return body
}
