import { useState } from "react"
import * as Location from "expo-location"

export interface LocationData {
  latitude: number
  longitude: number
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCurrentLocation = async () => {
    setLoading(true)
    setError(null)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setError("Se necesita permiso para acceder a la ubicación")
        return
      }

      const loc = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = loc.coords
      setLocation({ latitude, longitude })
    } catch {
      setError("No se pudo obtener la ubicación")
    } finally {
      setLoading(false)
    }
  }

  const clearLocation = () => setLocation(null)

  return { location, loading, error, getCurrentLocation, clearLocation }
}
