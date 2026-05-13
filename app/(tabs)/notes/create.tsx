import { router } from "expo-router"
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

import { IconSymbol } from "@/components/ui/icon-symbol"
import { colors } from "@/constants/theme"
import { useImagePicker } from "@/hooks/useImagePicker"
import { useLocation } from "@/hooks/useLocation"
import { useNotaForm } from "@/hooks/useNotaForm"
import { useNotes } from "@/hooks/useNotes"

export default function CreateNoteScreen() {
  const { crearNota } = useNotes()
  const { imageUri, pickFromGallery, takePhoto, clearImage } = useImagePicker()
  const { location, loading: locLoading, getCurrentLocation, clearLocation } = useLocation()

  const form = useNotaForm({
    mode: "create",
    onSubmit: async (data) => {
      await crearNota({
        ...data,
        photoUri: imageUri ?? undefined,
        location: location ?? undefined,
      })
      router.back()
    },
  })

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Nueva nota</Text>

          <TextInput
            style={[styles.input, form.errores.titulo ? styles.inputError : null]}
            placeholder="Título"
            placeholderTextColor={colors.muted}
            value={form.titulo}
            onChangeText={form.setTitulo}
          />
          {form.errores.titulo ? <Text style={styles.errorLabel}>{form.errores.titulo}</Text> : null}

          <TextInput
            style={[styles.input, styles.inputMultiline, form.errores.contenido ? styles.inputError : null]}
            placeholder="Contenido"
            placeholderTextColor={colors.muted}
            value={form.contenido}
            onChangeText={form.setContenido}
            multiline
            numberOfLines={6}
          />
          {form.errores.contenido ? <Text style={styles.errorLabel}>{form.errores.contenido}</Text> : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Foto</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
                <IconSymbol name="camera.fill" size={18} color="#fff" />
                <Text style={styles.actionButtonText}> Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={pickFromGallery}>
                <IconSymbol name="folder.fill" size={18} color="#fff" />
                <Text style={styles.actionButtonText}> Galería</Text>
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
                  <Text style={styles.clearButtonText}>X</Text>
                </TouchableOpacity>
              )}
            </View>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={getCurrentLocation}
                disabled={locLoading}
              >
                <IconSymbol name="location.fill" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {locLoading ? " Obteniendo..." : " Obtener ubicación"}
                </Text>
              </TouchableOpacity>
              {location && (
                <TouchableOpacity style={styles.clearButton} onPress={clearLocation}>
                  <Text style={styles.clearButtonText}>X</Text>
                </TouchableOpacity>
              )}
            </View>
            {location && (
              <Text style={styles.locationText}>
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={form.handleSubmit} disabled={form.submitting} activeOpacity={0.8}>
            <Text style={styles.submitButtonText}>{form.submitting ? "Guardando..." : "Guardar"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, backgroundColor: colors.surface, marginBottom: 8 },
  inputMultiline: { minHeight: 120, textAlignVertical: "top" },
  inputError: { borderColor: colors.danger },
  errorLabel: { fontSize: 12, color: colors.danger, marginBottom: 8 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 8 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  actionButton: { backgroundColor: colors.tint, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  actionButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  clearButton: { backgroundColor: colors.danger, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  clearButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  imagePreview: { width: "100%", height: 200, borderRadius: 8, marginTop: 8 },
  locationText: { fontSize: 14, color: colors.muted, marginTop: 8 },
  submitButton: { backgroundColor: colors.tint, borderRadius: 8, padding: 14, alignItems: "center", marginTop: 24 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
})
