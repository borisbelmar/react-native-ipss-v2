const BASE_URL = "https://hono-api-yt2r.onrender.com"

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
    throw new Error(`Upload falló: ${response.status}`)
  }

  const data = await response.json()
  return data.imageUrl
}
