export interface Nota {
  id: string
  titulo: string
  contenido: string
  creadaEn: string
}

export type CreateNotaInput = Pick<Nota, "titulo" | "contenido">
export type UpdateNotaInput = Partial<CreateNotaInput>
