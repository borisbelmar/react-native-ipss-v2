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
