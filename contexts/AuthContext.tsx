import { createContext, useCallback, useEffect, useState } from "react"
import { useRouter } from "expo-router"
import * as SecureStore from "expo-secure-store"

import { apiService } from "../services/api"

const TOKEN_KEY = "jwt_token"

export interface AuthContextType {
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((saved) => {
        if (saved) setToken(saved)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: newToken } = await apiService.post<{ token: string }>(
        "/auth/login",
        { email, password },
      )
      await SecureStore.setItemAsync(TOKEN_KEY, newToken)
      setToken(newToken)
      router.replace("/(tabs)/notes")
    },
    [router],
  )

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    setToken(null)
    router.replace("/")
  }, [router])

  return (
    <AuthContext.Provider value={{ token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
