import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"

import { IconSymbol } from "@/components/ui/icon-symbol"
import { colors } from "@/constants/theme"
import { useNotes } from "@/hooks/useNotes"
import { useCallback } from "react"

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { notas, eliminarNota, recargar } = useNotes()

  useFocusEffect(
    useCallback(() => {
      void recargar()
    }, [recargar])
  )

  const nota = notas.find((n) => n.id === id)

  if (!nota) {
    return (
      <View style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Nota no encontrada</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const handleEliminar = () => {
    if (Platform.OS === "web") {
      if (window.confirm("¿Estás seguro?")) {
        eliminarNota(id!).then(() => router.back())
      }
    } else {
      Alert.alert("Eliminar nota", "¿Estás seguro?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await eliminarNota(id!)
            router.back()
          },
        },
      ])
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{nota.titulo}</Text>
        <Text style={styles.date}>{new Date(nota.creadaEn).toLocaleDateString()}</Text>
        <View style={styles.divider} />
        <Text style={styles.content}>{nota.contenido}</Text>

        {nota.photoUri && (
          <>
            <Text style={styles.sectionTitle}>Foto</Text>
            <Image source={{ uri: nota.photoUri }} style={styles.image} />
          </>
        )}

        {nota.location && (
          <>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <View style={styles.locationRow}>
              <IconSymbol name="location.fill" size={16} color={colors.muted} />
              <Text style={styles.locationText}>
                {nota.location.latitude.toFixed(4)}, {nota.location.longitude.toFixed(4)}
              </Text>
            </View>
          </>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push({ pathname: "/(tabs)/notes/[id]/edit", params: { id } })}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleEliminar}>
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.text, marginBottom: 4 },
  date: { fontSize: 14, color: colors.muted, marginBottom: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
  content: { fontSize: 16, color: colors.text, lineHeight: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: colors.text, marginTop: 20, marginBottom: 8 },
  image: { width: "100%", height: 250, borderRadius: 8, marginBottom: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  locationText: { fontSize: 14, color: colors.muted },
  actions: { flexDirection: "row", gap: 12, marginTop: 32 },
  editButton: { flex: 1, backgroundColor: colors.tint, borderRadius: 8, padding: 14, alignItems: "center" },
  editButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  deleteButton: { flex: 1, backgroundColor: colors.danger, borderRadius: 8, padding: 14, alignItems: "center" },
  deleteButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  errorText: { fontSize: 18, color: colors.danger, marginBottom: 12 },
  backLink: { fontSize: 16, color: colors.tint, fontWeight: "600" },
})
