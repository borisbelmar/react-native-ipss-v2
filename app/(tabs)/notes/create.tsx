import { router } from "expo-router"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

import { colors } from "@/constants/theme"
import { useNotaForm } from "@/hooks/useNotaForm"
import { useNotes } from "@/hooks/useNotes"

export default function CreateNoteScreen() {
  const { crearNota } = useNotes()

  const form = useNotaForm({
    mode: "create",
    onSubmit: async (data) => {
      await crearNota(data as { titulo: string; contenido: string })
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
  submitButton: { backgroundColor: colors.tint, borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
})
