import { Redirect } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import { colors } from "@/constants/theme"
import { useAuth } from "@/hooks/useAuth"

type Mode = "login" | "register"

export default function LoginScreen() {
  const { token, loading, login, register } = useAuth()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("pepe@example.com")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </View>
    )
  }

  if (token) {
    return <Redirect href="/(tabs)/notes" />
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError("")
    try {
      if (mode === "login") {
        await login(email, password)
      } else {
        await register(email, password)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login")
    setError("")
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={24}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      >
        <View style={styles.card}>
          <Text style={styles.title}>
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "login" ? "Ingresar" : "Registrarse"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMode} style={styles.toggle}>
            <Text style={styles.toggleText}>
              {mode === "login"
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  card: { width: "100%", alignItems: "center", backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24, color: colors.text },
  input: {
    width: "80%",
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.tint,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "80%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  toggle: { marginTop: 16 },
  toggleText: { color: colors.tint, fontSize: 14 },
  errorText: { color: colors.danger, marginTop: 10 },
})
