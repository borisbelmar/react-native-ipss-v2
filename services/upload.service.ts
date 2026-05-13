import { BASE_URL } from "./api"

export const uploadImage = async (uri: string, token: string): Promise<string> => {
  const filename = uri.split("/").pop() ?? "photo.jpg"
  const match = /\.(\w+)$/.exec(filename)
  const type = match ? `image/${match[1]}` : "image/jpeg"

  const formData = new FormData()
  formData.append("image", { uri, name: filename, type } as unknown as Blob)

  const response = await fetch(`${BASE_URL}/notes/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? body?.message ?? `Error al subir imagen (${response.status})`)
  }

  const data = await response.json()
  return data.imageUrl
}
