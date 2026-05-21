import { Platform } from "react-native"

const isWeb = Platform.OS === "web"

const webStore = {
  getItemAsync: async (key: string) => localStorage.getItem(key),
  setItemAsync: async (key: string, value: string) => {
    localStorage.setItem(key, value)
  },
  deleteItemAsync: async (key: string) => {
    localStorage.removeItem(key)
  },
}

const nativeStore = async () => {
  const { getItemAsync, setItemAsync, deleteItemAsync } = await import(
    "expo-secure-store"
  )
  return { getItemAsync, setItemAsync, deleteItemAsync }
}

let nativePromise: ReturnType<typeof nativeStore> | null = null

export const getItemAsync = async (key: string) => {
  if (isWeb) return webStore.getItemAsync(key)
  if (!nativePromise) nativePromise = nativeStore()
  const store = await nativePromise
  return store.getItemAsync(key)
}

export const setItemAsync = async (key: string, value: string) => {
  if (isWeb) return webStore.setItemAsync(key, value)
  if (!nativePromise) nativePromise = nativeStore()
  const store = await nativePromise
  return store.setItemAsync(key, value)
}

export const deleteItemAsync = async (key: string) => {
  if (isWeb) return webStore.deleteItemAsync(key)
  if (!nativePromise) nativePromise = nativeStore()
  const store = await nativePromise
  return store.deleteItemAsync(key)
}
