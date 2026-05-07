import * as z from "zod"

export const createNotaSchema = z.object({
  titulo: z.string().min(1, "El título no puede estar vacío").max(100, "Máximo 100 caracteres"),
  contenido: z.string().min(1, "El contenido no puede estar vacío"),
})

export const updateNotaSchema = z.object({
  titulo: z.string().min(1).max(100).optional(),
  contenido: z.string().min(1).optional(),
})

export type CreateNotaInput = z.infer<typeof createNotaSchema>
export type UpdateNotaInput = z.infer<typeof updateNotaSchema>
