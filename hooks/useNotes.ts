import { useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Nota, CreateNotaInput, UpdateNotaInput } from "../types/nota"

const STORAGE_KEY = "notas"

export const useNotes = () => {
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarNotas = useCallback(async () => {
    try {
      setLoading(true)
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      const data: Nota[] = raw ? JSON.parse(raw) : []
      setNotas(data)
    } catch {
      setError("No se pudieron cargar las notas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarNotas()
  }, [cargarNotas])

  const persistir = async (nuevasNotas: Nota[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevasNotas))
    setNotas(nuevasNotas)
  }

  const crearNota = async (input: CreateNotaInput): Promise<void> => {
    const nueva: Nota = {
      id: Date.now().toString(),
      ...input,
      creadaEn: new Date().toISOString(),
    }
    await persistir([...notas, nueva])
  }

  const editarNota = async (id: string, input: UpdateNotaInput): Promise<void> => {
    const actualizadas = notas.map((n) =>
      n.id === id ? { ...n, ...input } : n
    )
    await persistir(actualizadas)
  }

  const eliminarNota = async (id: string): Promise<void> => {
    await persistir(notas.filter((n) => n.id !== id))
  }

  return { notas, loading, error, crearNota, editarNota, eliminarNota, recargar: cargarNotas }
}
