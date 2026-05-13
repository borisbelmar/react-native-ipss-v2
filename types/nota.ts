// ── Modelo API (lo que devuelve el servidor) ──────────────
export interface NotaAPI {
  id: number
  title: string
  content: string
  imageUrl: string | null
  latitude: number | null
  longitude: number | null
  createdAt: string
  updatedAt: string
  categoryId: number
  userId: number
}

// ── Modelo UI (lo que usan los componentes) ──────────────
export interface Nota {
  id: string
  titulo: string
  contenido: string
  creadaEn: string
  photoUri?: string
  location?: {
    latitude: number
    longitude: number
  }
}

export type CreateNotaInput = Pick<Nota, "titulo" | "contenido" | "photoUri" | "location">
export type UpdateNotaInput = Partial<CreateNotaInput>

// ── Inputs para la API ───────────────────────────────────
export interface CreateNotaAPIInput {
  title: string
  content: string
  categoryId: number
  imageUrl?: string
  latitude?: number
  longitude?: number
}

export type UpdateNotaAPIInput = Partial<Omit<CreateNotaAPIInput, "categoryId">>

// ── Funciones de mapeo API ↔ UI ──────────────────────────
export const mapNotaAPItoUI = (api: NotaAPI): Nota => ({
  id: api.id.toString(),
  titulo: api.title,
  contenido: api.content,
  creadaEn: api.createdAt,
  photoUri: api.imageUrl ?? undefined,
  location:
    api.latitude != null && api.longitude != null
      ? { latitude: api.latitude, longitude: api.longitude }
      : undefined,
})

export const mapCreateNotaInputToAPI = (
  input: CreateNotaInput
): CreateNotaAPIInput => ({
  title: input.titulo,
  content: input.contenido,
  categoryId: 1,
  imageUrl: input.photoUri,
  latitude: input.location?.latitude,
  longitude: input.location?.longitude,
})

export const mapUpdateNotaInputToAPI = (
  input: UpdateNotaInput
): UpdateNotaAPIInput => ({
  ...(input.titulo !== undefined && { title: input.titulo }),
  ...(input.contenido !== undefined && { content: input.contenido }),
  ...(input.photoUri !== undefined && { imageUrl: input.photoUri }),
  ...(input.location !== undefined && {
    latitude: input.location.latitude,
    longitude: input.location.longitude,
  }),
})
