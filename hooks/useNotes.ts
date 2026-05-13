import { useCallback, useEffect, useState } from "react"
import { apiService } from "../services/api"
import { useAuth } from "./useAuth"
import type {
  CreateNotaInput,
  Nota,
  NotaAPI,
  UpdateNotaInput,
} from "../types/nota"
import { mapCreateNotaInputToAPI, mapNotaAPItoUI, mapUpdateNotaInputToAPI } from "../types/nota"

export const useNotes = () => {
  const { token } = useAuth()
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarNotas = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.get<NotaAPI[]>("/notes", token)
      setNotas(data.map(mapNotaAPItoUI))
    } catch {
      setError("No se pudieron cargar las notas")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    cargarNotas()
  }, [cargarNotas])

  const crearNota = async (input: CreateNotaInput): Promise<void> => {
    if (!token) return
    const nueva = await apiService.post<NotaAPI>(
      "/notes",
      mapCreateNotaInputToAPI(input),
      token,
    )
    setNotas((prev) => [...prev, mapNotaAPItoUI(nueva)])
  }

  const editarNota = async (id: string, input: UpdateNotaInput): Promise<void> => {
    if (!token) return
    const actualizada = await apiService.patch<NotaAPI>(
      `/notes/${Number(id)}`,
      mapUpdateNotaInputToAPI(input),
      token,
    )
    setNotas((prev) =>
      prev.map((n) => (n.id === id ? mapNotaAPItoUI(actualizada) : n)),
    )
  }

  const eliminarNota = async (id: string): Promise<void> => {
    if (!token) return
    await apiService.delete(`/notes/${Number(id)}`, token)
    setNotas((prev) => prev.filter((n) => n.id !== id))
  }

  return { notas, loading, error, crearNota, editarNota, eliminarNota, recargar: cargarNotas }
}
