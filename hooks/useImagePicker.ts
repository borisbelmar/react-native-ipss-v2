import { useState } from "react"
import * as ImagePicker from "expo-image-picker"

export const useImagePicker = () => {
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError("Se necesita acceso a la galería")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    })
    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
      setError(null)
    }
  }

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      setError("Se necesita acceso a la cámara")
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    })
    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
      setError(null)
    }
  }

  const clearImage = () => setImageUri(null)

  return { imageUri, error, pickFromGallery, takePhoto, clearImage }
}
