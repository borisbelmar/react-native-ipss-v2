import { colors } from "@/constants/theme"
import { useAuth } from "@/hooks/useAuth"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const decodeEmail = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.email ?? null
  } catch {
    return null
  }
}

export default function ProfileScreen() {
  const { token, logout } = useAuth()
  const userEmail = token ? decodeEmail(token) : null

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>?</Text>
        </View>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.email}>{userEmail ?? "Usuario Desconocido"}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={{ color: colors.tint, marginTop: 16 }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 4 },
  email: { fontSize: 16, color: colors.muted },
})
